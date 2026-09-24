import unittest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from pydantic import ValidationError
from backend.main import app, ApplicationInput, ProfileInput


class ProfileTests(unittest.TestCase):
    def test_conditional_fields_and_hidden_values(self):
        for occupation, field in [('student', 'college'), ('employee', 'company')]:
            with self.assertRaises(ValidationError):
                ProfileInput(name='Alex Morgan', occupation=occupation)
            profile = ProfileInput.model_validate({'name':' Alex Morgan ', 'occupation':occupation, field:' Example '})
            self.assertEqual(getattr(profile, field), 'Example')
        profile = ProfileInput(name='Alex Morgan', occupation='other', college='Old college', company='Old company')
        self.assertEqual((profile.college, profile.company), ('', ''))
        with self.assertRaises(ValidationError):
            ProfileInput(name='Alex Morgan', occupation='admin')

    def test_motivation_maximum_15_words(self):
        body = dict(name='Alex Morgan', occupation='other', track_slug='python', start_date='2099-01-01')
        for reason in ['Learn', ' '.join(['learn'] * 15), '\n'.join(['learn'] * 15)]:
            ApplicationInput(**body, motivation=reason)
        for reason in ['', '   ', ' '.join(['learn'] * 16)]:
            with self.assertRaises(ValidationError):
                ApplicationInput(**body, motivation=reason)

    @patch('backend.main.database', new_callable=AsyncMock)
    @patch('backend.main.identity', new_callable=AsyncMock)
    def test_profile_update_only_mutates_authenticated_profile(self, identity, database):
        identity.return_value = ({'id':'own-id'}, False)
        response = TestClient(app).post('/api/platform', json={
            'action':'update_profile', 'id':'someone-else', 'name':'New Name',
            'occupation':'employee', 'company':'Example', 'college':'Stale College',
            'role':'admin', 'disabled':False, 'email':'unverified@example.com'})
        self.assertEqual(response.status_code, 200, response.text)
        database.assert_awaited_once_with('profiles', 'PATCH', params={'id':'eq.own-id'}, body={
            'display_name':'New Name', 'display_name_custom':True,
            'occupation':'employee', 'college':'', 'company':'Example'})

    @patch('backend.main.database', new_callable=AsyncMock)
    @patch('backend.main.identity', new_callable=AsyncMock)
    def test_enrollment_records_employee_and_other(self, identity, database):
        identity.return_value = ({'id':'own-id'}, False)
        for occupation in ['employee', 'other']:
            database.reset_mock()
            response = TestClient(app).post('/api/platform', json={
                'action':'apply', 'name':'New Name', 'occupation':occupation,
                'company':'Example', 'college':'Old College', 'motivation':'Build practical skills',
                'track_slug':'python', 'start_date':'2099-01-01'})
            self.assertEqual(response.status_code, 200, response.text)
            body = database.call_args.kwargs['body']
            self.assertEqual(body['occupation'], occupation)
            self.assertEqual(body['college'], '')
            self.assertEqual(body['company'], 'Example' if occupation=='employee' else '')

    @patch('backend.main.identity', new_callable=AsyncMock)
    def test_profile_requires_authentication(self, identity):
        from fastapi import HTTPException
        identity.side_effect = HTTPException(401, 'Sign in first.')
        self.assertEqual(TestClient(app).post('/api/platform', json={'action':'update_profile'}).status_code, 401)
