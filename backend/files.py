"""Private project uploads on persistent disk or an S3-compatible bucket."""
import asyncio
import hashlib
import hmac
import os
import re
import time
from pathlib import Path
from uuid import uuid4
from fastapi import HTTPException

MAX_BYTES = 5 * 1024 * 1024
TYPES = {'.pdf':'application/pdf','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.zip':'application/zip'}

def storage_mode():
    return os.getenv('FILE_STORAGE','disabled')

def valid_key(key):
    if not re.fullmatch(r'[a-f0-9-]{36}/[a-zA-Z0-9_.-]{1,240}',key) or '..' in key:
        raise HTTPException(400,'Invalid file reference.')
    return key

def local_path(key):
    root = Path(os.getenv('UPLOAD_DIR','backend/uploads')).resolve()
    path = (root / valid_key(key)).resolve()
    if not path.is_relative_to(root): raise HTTPException(400,'Invalid file reference.')
    return path

def signing_secret():
    secret = os.getenv('FILE_SIGNING_SECRET','')
    if len(secret)<32: raise HTTPException(503,'Private file access is not configured.')
    return secret.encode()

def s3():
    import boto3
    return boto3.client('s3',endpoint_url=os.getenv('S3_ENDPOINT_URL') or None,
                        aws_access_key_id=os.getenv('S3_ACCESS_KEY_ID'),
                        aws_secret_access_key=os.getenv('S3_SECRET_ACCESS_KEY'),
                        region_name=os.getenv('S3_REGION','auto'))

def validate_contents(filename, data):
    suffix = Path(filename).suffix.lower()
    if suffix not in TYPES or not data or len(data)>MAX_BYTES:
        raise HTTPException(422,'Use a PNG, JPEG, PDF, or ZIP file up to 5 MB.')
    valid = (suffix=='.pdf' and data.startswith(b'%PDF-') or suffix=='.png' and data.startswith(b'\x89PNG\r\n\x1a\n') or suffix in ['.jpg','.jpeg'] and data.startswith(b'\xff\xd8\xff') or suffix=='.zip' and data[:4] in [b'PK\x03\x04',b'PK\x05\x06'])
    if not valid: raise HTTPException(422,'The file contents do not match its extension.')
    return suffix

def save_sync(user_id, filename, data):
    suffix = validate_contents(filename,data)
    key = valid_key(f'{user_id}/{uuid4()}{suffix}')
    mode = storage_mode()
    if mode=='local':
        signing_secret()
        path=local_path(key); path.parent.mkdir(parents=True,exist_ok=True)
        with path.open('xb') as output: output.write(data)
    elif mode=='s3':
        s3().put_object(Bucket=os.environ['S3_BUCKET'],Key=key,Body=data,ContentType=TYPES[suffix],ContentDisposition='attachment')
    else: raise HTTPException(503,'File uploads are not configured. You can still submit your repository and notes.')
    return key

async def save(user_id,filename,data):
    return await asyncio.to_thread(save_sync,user_id,filename,data)

def signed_url_sync(key):
    valid_key(key)
    if storage_mode()=='s3':
        return s3().generate_presigned_url('get_object',Params={'Bucket':os.environ['S3_BUCKET'],'Key':key,'ResponseContentDisposition':'attachment'},ExpiresIn=120)
    if storage_mode()!='local': raise HTTPException(503,'File access is not configured.')
    if not local_path(key).is_file(): raise HTTPException(404,'File unavailable.')
    expires = int(time.time())+120
    signature = hmac.new(signing_secret(),f'{key}:{expires}'.encode(),hashlib.sha256).hexdigest()
    return f'/api/files/{key}?expires={expires}&signature={signature}'

def authorize_download(key,expires,signature):
    valid_key(key)
    expected=hmac.new(signing_secret(),f'{key}:{expires}'.encode(),hashlib.sha256).hexdigest()
    if expires<int(time.time()) or expires>int(time.time())+120 or not hmac.compare_digest(expected,signature):
        raise HTTPException(403,'This file link has expired or is invalid.')
    path=local_path(key)
    if not path.is_file(): raise HTTPException(404,'File unavailable.')
    return path
