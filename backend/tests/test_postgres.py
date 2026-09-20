import os
import tempfile
import time
import unittest
from types import SimpleNamespace
from unittest.mock import patch, AsyncMock
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import HTTPException
from backend.db import build_query
from backend.auth import verify_token, identity
from backend import files

class QueryTests(unittest.TestCase):
    @patch('backend.db.pool')
    def test_profile_database_outage_returns_safe_retryable_error(self,pool):
        from psycopg import OperationalError
        from backend.db import profile_for_subject
        pool.return_value.connection.side_effect=OperationalError('private connection details')
        with self.assertRaises(HTTPException) as error:
            profile_for_subject('user_test')
        self.assertEqual(error.exception.status_code,503)
        self.assertNotIn('private',error.exception.detail)
    def test_user_values_never_become_sql(self):
        attack="x' OR true --"
        query,values=build_query('applications','GET',{'user_id':'eq.'+attack},None)
        self.assertNotIn(attack,query.as_string())
        self.assertEqual(values,[attack])
    def test_rejects_unapproved_identifiers_and_unfiltered_update(self):
        for table,method,params,body in [('auth.users','GET',{},None),('profiles','GET',{'select':'*;drop table profiles'},None),('profiles','PATCH',{}, {'disabled':True}),('tracks','POST',{'on_conflict':'title'},{'title':'hello'})]:
            with self.assertRaises(ValueError):build_query(table,method,params,body)
    def test_only_submission_and_track_upserts_are_allowed(self):
        query,_=build_query('submissions','POST',{'on_conflict':'application_id,project_index'},{'application_id':'x','project_index':0,'notes':'hello'})
        self.assertIn('ON CONFLICT',query.as_string())
        query,_=build_query('payments','POST',{}, {'id':'order_test'})
        self.assertNotIn('ON CONFLICT',query.as_string())

class TokenTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.key=rsa.generate_private_key(public_exponent=65537,key_size=2048)
    @patch.dict(os.environ,{'CLERK_ISSUER_URL':'https://auth.example.test','CLERK_AUTHORIZED_PARTIES':'http://localhost:3000'})
    @patch('backend.auth.jwks')
    def test_signature_expiry_issuer_and_origin(self,jwks):
        jwks.return_value.get_signing_key_from_jwt.return_value=SimpleNamespace(key=self.key.public_key())
        claims={'sub':'user_test','iss':'https://auth.example.test','azp':'http://localhost:3000','iat':int(time.time()),'nbf':int(time.time())-1,'exp':int(time.time())+60}
        self.assertEqual(verify_token(jwt.encode(claims,self.key,algorithm='RS256'))['sub'],'user_test')
        for overrides in [{'exp':int(time.time())-60},{'iss':'https://attacker.test'},{'azp':'https://attacker.test'},{'sub':'admin'},{'nbf':int(time.time())+60}]:
            with self.assertRaises(HTTPException) as error:verify_token(jwt.encode({**claims,**overrides},self.key,algorithm='RS256'))
            self.assertEqual(error.exception.status_code,401)
        forged=jwt.encode(claims,'attacker-secret-that-is-long-enough',algorithm='HS256')
        with self.assertRaises(HTTPException):verify_token(forged)

class FileTests(unittest.TestCase):
    def test_private_links_expire_and_cannot_be_retargeted(self):
        with tempfile.TemporaryDirectory(dir='.') as directory, patch.dict(os.environ,{'FILE_STORAGE':'local','UPLOAD_DIR':directory,'FILE_SIGNING_SECRET':'x'*40}):
            uid='11111111-1111-4111-8111-111111111111'
            key=files.save_sync(uid,'evidence.pdf',b'%PDF-1.4 test')
            from urllib.parse import urlparse,parse_qs
            params=parse_qs(urlparse(files.signed_url_sync(key)).query)
            expires=int(params['expires'][0]);signature=params['signature'][0]
            self.assertTrue(files.authorize_download(key,expires,signature).is_file())
            for bad_key,bad_exp,bad_sig in [(key,expires-300,signature),(key,expires,'x'*64),(key.replace('11111111','22222222'),expires,signature)]:
                with self.assertRaises(HTTPException):files.authorize_download(bad_key,bad_exp,bad_sig)
    def test_rejects_traversal_and_disguised_uploads(self):
        for key in ['../secret','11111111-1111-4111-8111-111111111111/../secret']:
            with self.assertRaises(HTTPException):files.local_path(key)
        for name,data in [('image.png',b'<script>'),('file.exe',b'MZ'),('file.pdf',b'%PDF-'+b'x'*files.MAX_BYTES)]:
            with self.assertRaises(HTTPException):files.validate_contents(name,data)

class IdentityTests(unittest.IsolatedAsyncioTestCase):
    @patch('backend.auth.profile_for_subject')
    @patch('backend.auth.verify_token')
    async def test_roles_come_from_database_and_users_keep_internal_ids(self,verify,profile):
        verify.return_value={'sub':'user_external','role':'admin'}
        profile.return_value={'id':'11111111-1111-4111-8111-111111111111','role':'student','disabled':False}
        request=SimpleNamespace(headers={'authorization':'Bearer valid-looking-token'})
        user,admin=await identity(request)
        self.assertFalse(admin)
        self.assertEqual(user['id'],profile.return_value['id'])
        profile.assert_called_once_with('user_external')
        profile.return_value['disabled']=True
        with self.assertRaises(HTTPException) as error:await identity(request)
        self.assertEqual(error.exception.status_code,403)
