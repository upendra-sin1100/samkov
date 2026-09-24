"""SamkovAI FastAPI backend. Business logic lives here, never in Next.js routes."""
import asyncio
import io
import logging
import os
import re
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from uuid import UUID
import httpx
import qrcode
import qrcode.image.svg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, FileResponse
from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator, field_validator
from .security import level_unlocked, secure_url, project_url

load_dotenv(Path(__file__).resolve().parent / '.env')
load_dotenv(Path(__file__).resolve().parents[1] / '.env.local')
app = FastAPI(title='SamkovAI API', version='1.0.0')
SITE_URL = os.getenv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000').rstrip('/')
VERIFICATION_SITE_URL = (os.getenv('VERIFICATION_SITE_URL') or SITE_URL).rstrip('/')
app.add_middleware(CORSMiddleware, allow_origins=[SITE_URL], allow_methods=['GET','POST'], allow_headers=['Authorization','Content-Type'])

from .db import database, record_visit, touch_user, analytics_snapshot
from .auth import identity
from .directory import sync_directory
from . import files

@app.exception_handler(HTTPException)
async def http_error(request, exc): return JSONResponse({'error':exc.detail},status_code=exc.status_code)
@app.exception_handler(Exception)
async def unexpected_error(request, exc):
    logging.exception('Unexpected API error')
    return JSONResponse({'error':'The service could not complete this request. Please try again.'},status_code=500)
@app.exception_handler(ValueError)
async def value_error(request, exc): return JSONResponse({'error':str(exc) if not isinstance(exc,ValidationError) else 'Please check the required fields and URLs.'},status_code=422)

class ProfileInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name:str=Field(min_length=2,max_length=100)
    occupation:str=Field(pattern=r'^(student|employee|other)$')
    college:str=Field(default='',max_length=200)
    company:str=Field(default='',max_length=200)

    @model_validator(mode='after')
    def organization(self):
        if self.occupation=='student' and len(self.college)<2:
            raise ValueError('Enter your college or institution.')
        if self.occupation=='employee' and len(self.company)<2:
            raise ValueError('Enter your company name.')
        if self.occupation!='student': self.college=''
        if self.occupation!='employee': self.company=''
        return self

class ApplicationInput(ProfileInput):
    track_slug:str=Field(min_length=2,max_length=80,pattern=r'^[a-z0-9-]+$')
    motivation:str=Field(min_length=1,max_length=1500)
    start_date:date

    @field_validator('motivation')
    @classmethod
    def word_limit(cls, value):
        if len(value.split())>15:
            raise ValueError('Use 15 words or fewer for your reason for joining.')
        return value
class SubmissionInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    application_id:UUID
    project_index:int=Field(ge=0,le=100)
    github_url:str=Field(max_length=1000)
    live_url:str|None=Field(default=None,max_length=2000)
    linkedin_url:str|None=Field(default=None,max_length=2000)
    notes:str=Field(min_length=30,max_length=5000)
    attachment:str|None=Field(default=None,max_length=500)
class ReviewInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    id:UUID
    status:str=Field(pattern=r'^(approved|rejected)$')
    feedback:str=Field(min_length=10,max_length=3000)
class ResourceInput(BaseModel):
    track_slug:str=Field(min_length=2,max_length=80,pattern=r'^[a-z0-9-]+$')
    title:str=Field(min_length=3,max_length=200)
    url:str=Field(min_length=8,max_length=2000)

def valid_uuid(value):
    if not isinstance(value, str):
        raise HTTPException(422, 'Provide a valid record ID.')
    try:
        return str(UUID(value))
    except ValueError as exc:
        raise HTTPException(422, 'Provide a valid record ID.') from exc

@app.get('/api/health')
async def health(): return {'status':'ok','backend':'Python / FastAPI','configured':bool(os.getenv('DATABASE_URL') and os.getenv('CLERK_ISSUER_URL'))}

@app.get('/api/verify')
async def verify(id:str):
    document=await public_document(id.strip().upper())
    return JSONResponse({'document':document,'certificate':document if document and document['type']=='certificate' else None},status_code=200 if document else 404,headers={'Cache-Control':'no-store'})

async def public_document(document_id):
    if re.fullmatch(r'SKAI-\d{4}-[A-F0-9]{32}',document_id):
        records=await database('certificates',params={'id':'eq.'+document_id,'select':'id,student_name,track_title,domain,duration_weeks,start_date,end_date,completed_at,issued_at,status,projects_completed'})
        return {**records[0],'type':'certificate'} if records else None
    if re.fullmatch(r'SKAI-OL-[A-F0-9]{32}',document_id):
        records=await database('applications',params={'verification_id':'eq.'+str(UUID(document_id[8:])),'select':'student_name,track_slug,start_date,end_date,status'})
        if not records or records[0]['status'] not in ['approved','completed']: return None
        offer=records[0]
        track=await database('tracks',params={'slug':'eq.'+offer['track_slug'],'select':'title,weeks'},one=True)
        return {'id':document_id,'type':'offer','student_name':offer['student_name'],'track_title':track['title'],'duration_weeks':track['weeks'],'start_date':offer['start_date'],'end_date':offer['end_date'],'status':'issued'}
    return None

@app.get('/api/qr')
async def qr(id:str):
    id=id.strip().upper()
    if not re.fullmatch(r'SKAI-(?:\d{4}-|OL-)[A-F0-9]{32}',id): raise HTTPException(400,'Invalid document ID.')
    if not await public_document(id): raise HTTPException(404,'Document not found.')
    buffer=io.BytesIO()
    qrcode.make(VERIFICATION_SITE_URL+'/verify/'+id,image_factory=qrcode.image.svg.SvgPathImage).save(buffer)
    return Response(buffer.getvalue(),media_type='image/svg+xml',headers={'Cache-Control':'no-store'})

@app.post('/api/platform')
async def platform(request:Request):
    origin=request.headers.get('origin')
    if origin and origin!=SITE_URL: raise HTTPException(403,'Untrusted request origin.')
    user,admin=await identity(request)
    b=await request.json()
    if not isinstance(b, dict): raise HTTPException(422, 'Request body must be a JSON object.')
    action=b.get('action')
    if not isinstance(action, str): raise HTTPException(422, 'Provide a valid action.')
    required = {'resource':['track_slug','title','url'], 'approve_application':['id'], 'complete':['id'], 'revoke':['id'], 'attachment':['path'], 'set_user_access':['id','disabled'], 'claim_certificate':['application_id']}
    def require_admin():
        if not admin: raise HTTPException(403,'Administrator access required.')
    async def own_application(value):
        app_id=valid_uuid(value)
        a=await database('applications',params={'id':'eq.'+app_id},one=True)
        if a['user_id']!=user['id']: raise HTTPException(403,'Application access denied.')
        return a
    # Keep authorization ahead of field validation for administrator operations.
    if action in ['resource','approve_application','complete','revoke','attachment','set_user_access','save_track','review']: require_admin()
    if any(b.get(key) is None for key in required.get(action, [])):
        raise HTTPException(422, 'Please provide all required fields.')
    if action=='heartbeat':
        await asyncio.to_thread(touch_user,user['id'])
        return {'ok':True}
    if action=='analytics':
        require_admin()
        return await asyncio.to_thread(analytics_snapshot)
    if action=='workspace':
        data={}
        if admin:
            try:
                await asyncio.to_thread(sync_directory)
            except Exception:
                # Keep local accounts usable during upstream outages. No secrets in logs or responses.
                data['account_sync_error']='Account sync unavailable. Showing saved accounts; retry shortly.'
        for table in ['applications','submissions','certificates']:
            data[table]=await database(table,params={} if admin else {'user_id':'eq.'+user['id']})
        data['resources']=await database('resources')
        data['profile']=await database('profiles',params={'id':'eq.'+user['id'],'select':'id,display_name,occupation,college,company'},one=True)
        data['uploads_enabled']=files.storage_mode() in ('local','s3')
        data['isAdmin']=admin
        if admin: data['users']=await database('profiles',params={'select':'id,email,display_name,username,role,disabled'})
        return data
    if action=='update_profile':
        p=ProfileInput.model_validate(b)
        await database('profiles','PATCH',params={'id':'eq.'+user['id']},body={'display_name':p.name,'display_name_custom':True,'occupation':p.occupation,'college':p.college,'company':p.company})
    elif action=='apply':
        p=ApplicationInput.model_validate(b)
        if p.start_date<date.today(): raise HTTPException(422,'Choose a valid future start date.')
        await database('tracks',params={'slug':'eq.'+p.track_slug,'active':'eq.true'},one=True)
        await database('applications','POST',body={'user_id':user['id'],'track_slug':p.track_slug,'student_name':p.name,'occupation':p.occupation,'college':p.college,'company':p.company,'motivation':p.motivation,'start_date':str(p.start_date)})
    elif action=='submit':
        p=SubmissionInput.model_validate(b)
        project_url(p.github_url)
        if p.live_url: project_url(p.live_url)
        if p.linkedin_url: project_url(p.linkedin_url)
        a=await own_application(str(p.application_id))
        if a['status']!='approved': raise HTTPException(409,'An approved, active internship is required.')
        t=await database('tracks',params={'slug':'eq.'+a['track_slug']},one=True)
        submissions=await database('submissions',params={'application_id':'eq.'+a['id']})
        if any(s['project_index']==p.project_index and s['status']=='pending' for s in submissions): raise HTTPException(409,'This project is under review. Resubmit only after changes are requested.')
        approved=[s['project_index'] for s in submissions if s['status']=='approved']
        if not level_unlocked(p.project_index,t['project_count'],approved): raise HTTPException(409,'Complete the previous level before submitting this project.')
        if p.project_index in approved: raise HTTPException(409,'An approved project cannot be overwritten.')
        if p.attachment and not p.attachment.startswith(user['id']+'/'): raise HTTPException(403,'File access denied.')
        await database('submissions','POST',params={'on_conflict':'application_id,project_index'},body={**p.model_dump(mode='json'),'user_id':user['id'],'status':'pending','feedback':None,'reviewed_by':None,'updated_at':datetime.now(timezone.utc).isoformat()})
    elif action=='approve_application':
        require_admin()
        a=await database('applications',params={'id':'eq.'+valid_uuid(b['id']),'status':'eq.pending'},one=True)
        t=await database('tracks',params={'slug':'eq.'+a['track_slug']},one=True)
        end=date.fromisoformat(a['start_date'])+timedelta(weeks=t['weeks'])
        await database('applications','PATCH',params={'id':'eq.'+a['id'],'status':'eq.pending'},body={'status':'approved','end_date':str(end),'authorized_signatory':os.getenv('AUTHORIZED_SIGNATORY','SamkovAI Program Office')})
    elif action=='review':
        require_admin()
        p=ReviewInput.model_validate(b)
        s=await database('submissions',params={'id':'eq.'+str(p.id)},one=True)
        if s['status']!='pending': raise HTTPException(409,'This submission has already been reviewed. Refresh to see its current status.')
        a=await database('applications',params={'id':'eq.'+s['application_id']},one=True)
        if a['status']!='approved': raise HTTPException(409,'This internship is no longer open for review.')
        changed=await database('submissions','PATCH',params={'id':'eq.'+str(p.id),'status':'eq.pending'},body={'status':p.status,'feedback':p.feedback,'reviewed_by':user['id'],'updated_at':datetime.now(timezone.utc).isoformat()})
        if not changed: raise HTTPException(409,'Another administrator already reviewed this submission. Refresh to see its current status.')
    elif action=='complete':
        require_admin()
        await database('rpc/complete_application','POST',body={'app_id':valid_uuid(b['id'])})
    elif action=='resource':
        require_admin()
        resource=ResourceInput.model_validate(b)
        secure_url(resource.url)
        title=resource.title.strip()
        if not 3<=len(title)<=200: raise HTTPException(422,'Resource title must be 3–200 characters.')
        await database('tracks',params={'slug':'eq.'+resource.track_slug,'active':'eq.true'},one=True)
        await database('resources','POST',body={'track_slug':resource.track_slug,'title':title,'url':resource.url,'created_by':user['id']})
    elif action=='revoke':
        require_admin()
        await database('certificates','PATCH',params={'id':'eq.'+str(b['id'])},body={'status':'revoked'})
    elif action=='attachment':
        require_admin()
        path=str(b['path'])
        await database('submissions',params={'attachment':'eq.'+path},one=True)
        return {'url':await asyncio.to_thread(files.signed_url_sync,path)}
    elif action=='save_track':
        require_admin()
        t=TrackInput.model_validate(b)
        existing=await database('applications',params={'track_slug':'eq.'+t.slug,'limit':'1'})
        if existing: raise HTTPException(409,'This curriculum is in use. Create a new track version to protect existing students.')
        await database('tracks','POST',params={'on_conflict':'slug'},body={'slug':t.slug,'title':t.title,'weeks':t.weeks,'project_count':len(t.projects),'content':{'category':t.category,'description':t.description,'skills':t.skills,'projects':t.projects}})
    elif action=='set_user_access':
        require_admin()
        target=await database('profiles',params={'id':'eq.'+valid_uuid(b['id'])},one=True)
        if target['role']=='admin': raise HTTPException(403,'Administrator access is managed outside this panel.')
        if not isinstance(b.get('disabled'),bool): raise HTTPException(422,'Invalid access status.')
        await database('profiles','PATCH',params={'id':'eq.'+target['id']},body={'disabled':b['disabled']})
    elif action=='claim_certificate':
        a=await own_application(b['application_id'])
        if a['status']!='completed': raise HTTPException(409,'Verified completion is required before issuing a free certificate.')
        certificate=await database('rpc/issue_certificate','POST',body={'app_id':a['id']},one=True)
        return {'certificate':certificate}
    else: raise HTTPException(400,'Unknown operation.')
    return {'ok':True}

class VisitInput(BaseModel):
    event_id:UUID

@app.post('/api/visit')
async def visit(payload:VisitInput, request:Request):
    if request.headers.get('origin') != SITE_URL: raise HTTPException(403,'Untrusted request origin.')
    await asyncio.to_thread(record_visit,str(payload.event_id))
    return {'ok':True}

from pydantic import field_validator
class TrackInput(BaseModel):
    slug:str=Field(min_length=2,max_length=80,pattern=r'^[a-z0-9-]+$')
    title:str=Field(min_length=2,max_length=100)
    weeks:int=Field(ge=1,le=52)
    category:str=Field(pattern=r'^(Data & AI|Development|Security)$')
    description:str=Field(min_length=20,max_length=1000)
    skills:list[str]=Field(min_length=1,max_length=12)
    projects:list[str]=Field(min_length=6,max_length=30)
    @field_validator('skills','projects')
    @classmethod
    def names_valid(cls,value):
        if any(not s.strip() or len(s)>200 for s in value) or len(set(value))!=len(value):
            raise ValueError('Use unique, non-empty titles up to 200 characters.')
        return value

@app.get('/api/catalog')
async def catalog():
    if not os.getenv('DATABASE_URL'): return {'tracks':[], 'resources':[]}
    tracks = await database('tracks',params={'active':'eq.true','select':'slug,title,weeks,project_count,content'})
    resources = await database('resources',params={'select':'track_slug,title,url'})
    active = {track['slug'] for track in tracks}
    return {'tracks':tracks, 'resources':[resource for resource in resources if resource['track_slug'] in active]}

@app.post('/api/files')
async def upload_file(request:Request, application_id:UUID, name:str):
    origin=request.headers.get('origin')
    if origin and origin!=SITE_URL: raise HTTPException(403,'Untrusted request origin.')
    user,_=await identity(request)
    application=await database('applications',params={'id':'eq.'+str(application_id),'user_id':'eq.'+user['id']},one=True)
    if application['status']!='approved': raise HTTPException(409,'An approved internship is required.')
    data=bytearray()
    async for chunk in request.stream():
        data.extend(chunk)
        if len(data)>files.MAX_BYTES: raise HTTPException(413,'Use a file up to 5 MB.')
    return {'path':await files.save(user['id'],name,bytes(data))}

@app.get('/api/files/{key:path}')
async def download_file(key:str,expires:int,signature:str):
    if files.storage_mode()!='local': raise HTTPException(404,'File unavailable.')
    path=await asyncio.to_thread(files.authorize_download,key,expires,signature)
    return FileResponse(path,media_type='application/octet-stream',filename=path.name,headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'})
