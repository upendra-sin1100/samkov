import hashlib
import hmac
import unittest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from backend.main import app
from backend.security import valid_signature, captured_payment, level_unlocked, secure_url

class SecurityTests(unittest.TestCase):
    def test_signature_rejects_tampering_and_malformed_values(self):
        signature=hmac.new(b'secret',b'order_1|pay_1',hashlib.sha256).hexdigest()
        self.assertTrue(valid_signature(b'order_1|pay_1',signature,'secret'))
        self.assertFalse(valid_signature(b'order_2|pay_1',signature,'secret'))
        self.assertFalse(valid_signature(b'order_1|pay_1','x'*64,'secret'))
        self.assertFalse(valid_signature(b'order_1|pay_1',signature,''))
    def test_payment_requires_capture_amount_currency_and_order(self):
        payment={'order_id':'order_1','amount':4900,'currency':'INR','status':'captured'}
        self.assertTrue(captured_payment(payment,'order_1'))
        for field,value in [('amount',49),('currency','USD'),('status','authorized'),('order_id','order_2')]:
            self.assertFalse(captured_payment({**payment,field:value},'order_1'))
    def test_levels_require_every_prior_project(self):
        self.assertTrue(level_unlocked(0,8,[]))
        self.assertFalse(level_unlocked(2,8,[0]))
        self.assertTrue(level_unlocked(4,8,[0,1]))
        self.assertFalse(level_unlocked(6,8,[0,1,2,3,4]))
        self.assertTrue(level_unlocked(6,8,list(range(6))))
        self.assertFalse(level_unlocked(8,8,list(range(8))))
    def test_urls_reject_wrong_hosts_and_unsafe_schemes(self):
        self.assertEqual(secure_url('https://github.com/a/b',{'github.com'}),'https://github.com/a/b')
        for url in ['javascript:alert(1)','https://github.com.evil.test/a/b','https://github.com@evil.test/a/b','http://github.com/a/b']:
            with self.assertRaises(ValueError):secure_url(url,{'github.com'})

class ApiTests(unittest.TestCase):
    def setUp(self): self.client=TestClient(app)
    @patch('backend.main.database',new_callable=AsyncMock)
    @patch('backend.main.identity',new_callable=AsyncMock)
    def test_reviews_reject_already_reviewed_and_concurrent_updates(self,identity,database):
        uid='11111111-1111-4111-8111-111111111111'
        identity.return_value=({'id':uid},True)
        body={'action':'review','id':uid,'status':'rejected','feedback':'Please add reproducible test evidence.'}
        database.return_value={'id':uid,'application_id':uid,'status':'approved'}
        self.assertEqual(self.client.post('/api/platform',json=body).status_code,409)
        self.assertEqual(database.call_count,1)
        database.reset_mock()
        database.side_effect=[{'id':uid,'application_id':uid,'status':'pending'},{'status':'approved'},[]]
        self.assertEqual(self.client.post('/api/platform',json=body).status_code,409)
        self.assertEqual(database.call_args.kwargs['params']['status'],'eq.pending')
    @patch('backend.main.database',new_callable=AsyncMock)
    @patch('backend.main.identity',new_callable=AsyncMock)
    def test_review_requires_meaningful_feedback(self,identity,database):
        uid='11111111-1111-4111-8111-111111111111'
        identity.return_value=({'id':uid},True)
        response=self.client.post('/api/platform',json={'action':'review','id':uid,'status':'rejected','feedback':' '*30})
        self.assertEqual(response.status_code,422)
        database.assert_not_called()
    @patch('backend.main.identity',new_callable=AsyncMock)
    def test_malformed_operations_return_validation_errors(self,identity):
        identity.return_value=({'id':'11111111-1111-4111-8111-111111111111'},True)
        for body in [[], {'action':[]}, {'action':'resource'}, {'action':'complete'}, {'action':'resource','track_slug':'python','title':'Course','url':42}]:
            self.assertEqual(self.client.post('/api/platform',json=body).status_code,422)
    @patch('backend.main.database',new_callable=AsyncMock)
    @patch('backend.main.identity',new_callable=AsyncMock)
    def test_record_ids_are_validated_before_database_access(self,identity,database):
        identity.return_value=({'id':'11111111-1111-4111-8111-111111111111'},True)
        for action,field in [('complete','id'),('approve_application','id'),('set_user_access','id'),('claim_certificate','application_id')]:
            for value in [123, [], {}, 'invalid']:
                response=self.client.post('/api/platform',json={'action':action,field:value,'disabled':True})
                self.assertEqual(response.status_code,422,(action,value))
        database.assert_not_called()
    @patch('backend.main.database',new_callable=AsyncMock)
    @patch('backend.main.identity',new_callable=AsyncMock)
    def test_repository_requires_owner_and_repository(self,identity,database):
        uid='11111111-1111-4111-8111-111111111111'
        identity.return_value=({'id':uid},False)
        for url in ['https://github.com/owner/', 'https://github.com//repo', 'https://github.com/owner/repo/issues']:
            response=self.client.post('/api/platform',json={'action':'submit','application_id':uid,'project_index':0,'github_url':url,'notes':'A detailed explanation of the completed project.'})
            self.assertEqual(response.status_code,422)
        database.assert_not_called()
    @patch('backend.main.database',new_callable=AsyncMock)
    @patch('backend.main.identity',new_callable=AsyncMock)
    def test_application_rejects_whitespace_only_fields(self,identity,database):
        identity.return_value=({'id':'11111111-1111-4111-8111-111111111111'},False)
        response=self.client.post('/api/platform',json={'action':'apply','track_slug':'python','name':'  ','college':'  ','motivation':' '*40,'start_date':'2099-01-01'})
        self.assertEqual(response.status_code,422)
        database.assert_not_called()
    @patch('backend.main.database',new_callable=AsyncMock)
    @patch('backend.main.identity',new_callable=AsyncMock)
    def test_claim_returns_a_single_certificate(self,identity,database):
        uid='11111111-1111-4111-8111-111111111111'
        identity.return_value=({'id':uid},False)
        certificate={'id':'SKAI-2026-'+'A'*32,'application_id':uid}
        database.side_effect=[{'id':uid,'user_id':uid,'status':'completed'},certificate]
        response=self.client.post('/api/platform',json={'action':'claim_certificate','application_id':uid})
        self.assertEqual(response.status_code,200)
        self.assertEqual(response.json()['certificate'],certificate)
        self.assertTrue(database.call_args.kwargs['one'])
    @patch.dict('os.environ',{'DATABASE_URL':'postgresql://test' })
    @patch('backend.main.database',new_callable=AsyncMock)
    def test_public_catalog_includes_only_active_track_resources(self,database):
        resource={'track_slug':'python','title':'Python course','url':'https://cs50.harvard.edu/python/'}
        database.side_effect=[[{'slug':'python'}],[resource,{**resource,'track_slug':'retired'}]]
        response=self.client.get('/api/catalog')
        self.assertEqual(response.status_code,200)
        self.assertEqual(response.json()['resources'],[resource])
        self.assertEqual(database.call_args_list[1].kwargs['params']['select'],'track_slug,title,url')
    def test_health_identifies_python_backend(self):
        self.assertEqual(self.client.get('/api/health').json()['backend'],'Python / FastAPI')
    def test_unauthenticated_write_is_rejected(self):
        self.assertEqual(self.client.post('/api/platform',json={'action':'complete','id':'anything'}).status_code,401)
    def test_invalid_certificate_is_not_verified(self):
        response=self.client.get('/api/verify?id=made-up')
        self.assertEqual(response.status_code,404)
        self.assertIsNone(response.json()['certificate'])
    def test_payment_webhook_is_removed(self):
        self.assertEqual(self.client.post('/api/payments/webhook',json={'event':'payment.captured'}).status_code,404)
    @patch('backend.main.identity',new_callable=AsyncMock)
    def test_student_cannot_use_admin_actions(self,identity):
        identity.return_value=({'id':'11111111-1111-4111-8111-111111111111'},False)
        for action in ['analytics','complete','review','revoke','resource','save_track','set_user_access','approve_application']:
            response=self.client.post('/api/platform',json={'action':action})
            self.assertEqual(response.status_code,403,action)
    @patch('backend.main.database',new_callable=AsyncMock)
    @patch('backend.main.identity',new_callable=AsyncMock)
    def test_free_certificate_locked_before_completion(self,identity,database):
        uid='11111111-1111-4111-8111-111111111111'
        identity.return_value=({'id':uid},False)
        database.return_value={'id':uid,'user_id':uid,'status':'approved'}
        response=self.client.post('/api/platform',json={'action':'claim_certificate','application_id':uid})
        self.assertEqual(response.status_code,409)
        self.assertIn('completion',response.json()['error'])
    @patch('backend.main.database',new_callable=AsyncMock)
    @patch('backend.main.identity',new_callable=AsyncMock)
    def test_student_cannot_claim_for_other_student(self,identity,database):
        uid='11111111-1111-4111-8111-111111111111'
        identity.return_value=({'id':uid},False)
        database.return_value={'id':uid,'user_id':'another-user','status':'completed'}
        response=self.client.post('/api/platform',json={'action':'claim_certificate','application_id':uid})
        self.assertEqual(response.status_code,403)

class AnalyticsTests(unittest.TestCase):
    def setUp(self): self.client=TestClient(app)
    @patch('backend.main.record_visit')
    def test_visit_requires_origin_and_valid_id(self,record):
        body={'event_id':'11111111-1111-4111-8111-111111111111'}
        self.assertEqual(self.client.post('/api/visit',json=body).status_code,403)
        self.assertEqual(self.client.post('/api/visit',json={'event_id':'bad'},headers={'origin':'http://localhost:3000'}).status_code,422)
        record.assert_not_called()
    @patch('backend.main.analytics_snapshot',return_value={'active_users':2,'total_views':5})
    @patch('backend.main.identity',new_callable=AsyncMock)
    def test_admin_reads_actual_statistics(self,identity,snapshot):
        identity.return_value=({'id':'11111111-1111-4111-8111-111111111111'},True)
        response=self.client.post('/api/platform',json={'action':'analytics'})
        self.assertEqual(response.json(),{'active_users':2,'total_views':5})

if __name__=='__main__':unittest.main()
