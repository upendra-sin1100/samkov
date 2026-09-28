import unittest
import threading
from unittest.mock import patch, MagicMock
from backend.directory import display_fields, save_users
from backend import directory

class DirectoryTests(unittest.TestCase):
    def test_background_sync_does_not_block_or_duplicate_and_retries_later(self):
        started, release = threading.Event(), threading.Event()
        def slow_sync():
            started.set()
            release.wait(2)
            raise RuntimeError('private upstream error')
        with patch.object(directory, '_refresh_thread', None), patch.object(directory, '_last_attempt', None), patch.object(directory, '_refresh_error', None), patch.object(directory, 'sync_directory', side_effect=slow_sync) as sync:
            try:
                self.assertIsNone(directory.request_directory_sync())
                self.assertTrue(started.wait(1))
                self.assertIsNone(directory.request_directory_sync())
                self.assertEqual(sync.call_count, 1)
            finally:
                release.set()
                directory._refresh_thread.join(2)
            self.assertIn('Showing saved accounts', directory.request_directory_sync())
            self.assertNotIn('private upstream error', directory._refresh_error)
            self.assertEqual(sync.call_count, 1)
            directory._last_attempt -= 61
            sync.side_effect = None
            directory.request_directory_sync()
            directory._refresh_thread.join(2)
            self.assertIsNone(directory._refresh_error)
            self.assertEqual(sync.call_count, 2)

    def test_display_fields_use_verified_primary_email(self):
        user={'id':'user_new','username':'newlearner','first_name':'New','last_name':'Learner',
              'primary_email_address_id':'primary','email_addresses':[
                  {'id':'other','email_address':'other@example.com','verification':{'status':'verified'}},
                  {'id':'primary','email_address':'new@example.com','verification':{'status':'verified'}}]}
        self.assertEqual(display_fields(user),('user_new','new@example.com','New Learner','newlearner'))
        user['email_addresses'][1]['verification']['status']='unverified'
        self.assertIsNone(display_fields(user)[1])

    @patch('backend.directory.connection')
    def test_sync_never_overwrites_roles_access_or_identity(self,connection):
        conn=MagicMock()
        connection.return_value.__enter__.return_value=conn
        self.assertEqual(save_users([{'id':'user_new','username':'learner'}]),1)
        query, values=conn.execute.call_args.args
        updates=query.split('DO UPDATE SET')[1]
        for field in ['role=', 'disabled=', 'auth_subject=']:
            self.assertNotIn(field,updates)
        self.assertEqual(values,('user_new',None,'learner','learner'))
