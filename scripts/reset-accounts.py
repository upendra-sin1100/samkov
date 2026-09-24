"""Explicit operator reset of the configured Clerk directory and learner records.

Dry run by default. Curriculum and resource URLs are preserved.
"""
import argparse
import os
from pathlib import Path
import httpx
import psycopg
from psycopg import sql
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / 'backend' / '.env')
parser = argparse.ArgumentParser()
parser.add_argument('--delete-all-accounts', action='store_true')
args = parser.parse_args()
tables = ['submissions', 'certificates', 'payments', 'applications', 'profiles', 'audit_log']
with psycopg.connect(os.environ['DATABASE_URL'], connect_timeout=15) as conn:
    with httpx.Client(base_url='https://api.clerk.com/v1', headers={
        'Authorization': 'Bearer ' + os.environ['CLERK_SECRET_KEY']
    }, timeout=30) as client:
        users = []
        while True:
            response = client.get('/users', params={'limit': 100, 'offset': len(users)})
            response.raise_for_status()
            page = response.json()
            users.extend(page)
            if len(page) < 100:
                break
        print('Clerk accounts:', len(users))
        for table in tables:
            count = conn.execute(sql.SQL('SELECT count(*) FROM public.{}').format(sql.Identifier(table))).fetchone()[0]
            print(table + ':', count)
        attachments = conn.execute('SELECT count(*) FROM submissions WHERE attachment IS NOT NULL').fetchone()[0]
        print('Submission attachments:', attachments)
        if args.delete_all_accounts:
            if attachments:
                raise SystemExit('Reset stopped: inspect upload storage before deleting attachment records.')
            for user in users:
                response = client.delete('/users/' + user['id'])
                response.raise_for_status()
            response = client.get('/users/count')
            response.raise_for_status()
            if response.json()['total_count'] != 0:
                raise SystemExit('Directory is not empty; database reset stopped.')
            conn.execute('UPDATE resources SET created_by=NULL WHERE created_by IS NOT NULL')
            for table in tables:
                conn.execute(sql.SQL('DELETE FROM public.{}').format(sql.Identifier(table)))
            conn.commit()
            print('Deleted all Clerk accounts and learner records. Curriculum and resources preserved.')
            for table in tables:
                assert conn.execute(sql.SQL('SELECT count(*) FROM public.{}').format(sql.Identifier(table))).fetchone()[0] == 0
            print('Verified: all account and learner tables are empty.')
