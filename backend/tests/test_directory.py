import unittest
from unittest.mock import patch, MagicMock
from backend.directory import display_fields, save_users

class DirectoryTests(unittest.TestCase):
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
