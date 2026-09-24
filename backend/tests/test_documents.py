import unittest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from backend.main import app

CERT_ID = 'SKAI-2026-' + 'A' * 32
OFFER_ID = 'SKAI-OL-' + 'B' * 32

class DocumentVerificationTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch('backend.main.database', new_callable=AsyncMock)
    def test_public_certificate_uses_record_and_preserves_revocation(self, database):
        for status in ['active', 'revoked']:
            database.return_value = [{'id':CERT_ID, 'student_name':'Test Learner', 'status':status}]
            response = self.client.get('/api/verify', params={'id':CERT_ID.lower()})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()['document']['status'], status)
            self.assertEqual(response.json()['document']['type'], 'certificate')
            self.assertEqual(response.headers['cache-control'], 'no-store')
            fields = database.call_args.kwargs['params']['select'].split(',')
            for private in ['email','user_id','college','company','auth_subject']:
                self.assertNotIn(private, fields)

    @patch('backend.main.database', new_callable=AsyncMock)
    def test_missing_or_malformed_document_cannot_verify(self, database):
        database.return_value = []
        for identifier in ['invalid', CERT_ID, OFFER_ID]:
            response = self.client.get('/api/verify', params={'id':identifier})
            self.assertEqual(response.status_code, 404)
            self.assertIsNone(response.json()['document'])
            self.assertEqual(response.headers['cache-control'], 'no-store')

    @patch('backend.main.database', new_callable=AsyncMock)
    def test_offer_only_verifies_after_approval_and_is_not_completion(self, database):
        for status in ['pending','rejected','approved','completed']:
            offer = {'student_name':'Test Learner','track_slug':'python','start_date':'2026-09-24','end_date':'2026-11-05','status':status}
            database.side_effect = [[offer], {'title':'Python Programming','weeks':6}]
            response = self.client.get('/api/verify', params={'id':OFFER_ID})
            if status in ['approved','completed']:
                self.assertEqual(response.status_code, 200)
                record = response.json()['document']
                self.assertEqual(record['type'], 'offer')
                self.assertEqual(record['status'], 'issued')
                self.assertIsNone(response.json()['certificate'])
            else:
                self.assertEqual(response.status_code, 404)
            first_call = database.call_args_list[-2] if status in ['approved','completed'] else database.call_args
            self.assertEqual(first_call.kwargs['params']['verification_id'], 'eq.bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
            database.reset_mock()

    @patch('backend.main.database', new_callable=AsyncMock)
    @patch('backend.main.VERIFICATION_SITE_URL', 'https://samkovai.tech')
    @patch('backend.main.qrcode.make')
    def test_qr_targets_canonical_site_and_exact_record(self, make_qr, database):
        def write_svg(buffer): buffer.write(b'<svg/>')
        make_qr.return_value.save.side_effect = write_svg
        database.return_value = [{'id':CERT_ID,'status':'active'}]
        response = self.client.get('/api/qr', params={'id':CERT_ID})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(make_qr.call_args.args[0], 'https://samkovai.tech/verify/' + CERT_ID)
        database.return_value = []
        make_qr.reset_mock()
        self.assertEqual(self.client.get('/api/qr', params={'id':CERT_ID}).status_code, 404)
        make_qr.assert_not_called()
