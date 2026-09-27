import unittest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from backend.main import app
from backend.feedback import respectful_message

USER = '11111111-1111-4111-8111-111111111111'
APPLICATION = '22222222-2222-4222-8222-222222222222'

class FeedbackTests(unittest.TestCase):
    def test_language_screen_blocks_obfuscation_but_allows_criticism(self):
        for text in ['This is fucking bad', 'This is f.u.c.k.i.n.g bad', 'What bullsh1t is this', 'You are a chutiya', 'You should kill yourself', 'f\u200buck this program']:
            with self.assertRaises(ValueError, msg=text): respectful_message(text)
        for text in ['The lessons were disappointing and support was slow.', 'The assignment needs more examples.', 'Please improve the class assessment.']:
            self.assertEqual(respectful_message(text), text)

    @patch('backend.main.database', new_callable=AsyncMock)
    @patch('backend.main.identity', new_callable=AsyncMock)
    def test_student_feedback_is_owned_private_and_not_auto_approved(self, identity, database):
        identity.return_value=({'id':USER},False)
        database.side_effect=[{'id':APPLICATION,'user_id':USER,'status':'approved'},[],[]]
        r=TestClient(app).post('/api/platform',json={'action':'send_feedback','application_id':APPLICATION,'rating':1,'message':'The lessons need clearer examples.', 'status':'reviewed','user_id':'forged'})
        self.assertEqual(r.status_code,200)
        body=database.call_args.kwargs['body']
        self.assertEqual(body['user_id'],USER)
        self.assertEqual(body['status'],'pending')
        self.assertEqual(body['rating'],1)

    @patch('backend.main.database', new_callable=AsyncMock)
    @patch('backend.main.identity', new_callable=AsyncMock)
    def test_abuse_invalid_rating_and_foreign_application_never_write(self, identity, database):
        identity.return_value=({'id':USER},False)
        client=TestClient(app)
        payload={'action':'send_feedback','application_id':APPLICATION,'rating':5,'message':'This program was helpful.'}
        for values in [{'message':'You are a fucking idiot'},{'rating':6},{'rating':True},{'message':'x'*2001}]:
            self.assertEqual(client.post('/api/platform',json={**payload,**values}).status_code,422)
        database.assert_not_called()
        database.return_value={'id':APPLICATION,'user_id':'other','status':'completed'}
        self.assertEqual(client.post('/api/platform',json=payload).status_code,403)
        self.assertEqual(database.call_count,1)

    @patch('backend.main.database', new_callable=AsyncMock)
    @patch('backend.main.identity', new_callable=AsyncMock)
    def test_review_and_inbox_require_admin(self, identity, database):
        identity.return_value=({'id':USER},False)
        for action in ['list_feedback','review_feedback']:
            self.assertEqual(TestClient(app).post('/api/platform',json={'action':action}).status_code,403)
        database.assert_not_called()

    @patch('backend.main.database', new_callable=AsyncMock)
    @patch('backend.main.identity', new_callable=AsyncMock)
    def test_duplicate_feedback_is_rejected(self, identity, database):
        identity.return_value=({'id':USER},False)
        database.side_effect=[{'id':APPLICATION,'user_id':USER,'status':'completed'},[{'id':'existing'}]]
        r=TestClient(app).post('/api/platform',json={'action':'send_feedback','application_id':APPLICATION,'rating':4,'message':'The examples were helpful.'})
        self.assertEqual(r.status_code,409)
        self.assertEqual(database.call_count,2)
