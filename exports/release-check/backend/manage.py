"""Run from the repository root: python -m backend.manage init|check|link-account."""
import argparse
import os
from pathlib import Path
from uuid import UUID
import psycopg
from dotenv import load_dotenv

def main():
    load_dotenv(Path(__file__).parent / '.env')
    parser=argparse.ArgumentParser(description='Initialize PostgreSQL and link migrated accounts.')
    parser.add_argument('command',choices=['init','migrate','check','link-account','make-admin'])
    parser.add_argument('--user-id')
    parser.add_argument('--clerk-user-id')
    args=parser.parse_args()
    url=os.getenv('DATABASE_URL')
    if not url: parser.error('Set DATABASE_URL in backend/.env first.')
    with psycopg.connect(url,connect_timeout=15) as conn:
        if args.command=='init':
            if conn.execute("SELECT to_regclass('public.profiles')").fetchone()[0]:
                parser.error('The destination already has profiles. Initialization is only for a new database.')
            conn.execute(Path(__file__).with_name('schema.sql').read_text(encoding='utf-8'))
            print('Database initialized. Eight tracks are ready.')
        elif args.command=='migrate':
            for migration in sorted(Path(__file__).with_name('migrations').glob('*.sql')):
                conn.execute(migration.read_text(encoding='utf-8'))
            print('All database migrations applied.')
        elif args.command=='make-admin':
            if not args.clerk_user_id or not args.clerk_user_id.startswith('user_'): parser.error('Supply --clerk-user-id for the trusted administrator.')
            result=conn.execute("UPDATE public.profiles SET role='admin' WHERE auth_subject=%s RETURNING id",(args.clerk_user_id,)).fetchone()
            if not result: parser.error('Account not found. Ask the administrator to sign in first.')
            print('Administrator role assigned.')
        elif args.command=='check':
            count=conn.execute('SELECT count(*) FROM public.tracks').fetchone()[0]
            print(f'PostgreSQL connected. {count} tracks available.')
        else:
            if not args.user_id or not args.clerk_user_id or not args.clerk_user_id.startswith('user_'):
                parser.error('Supply the original --user-id UUID and verified --clerk-user-id.')
            result=conn.execute('UPDATE public.profiles SET auth_subject=%s WHERE id=%s AND auth_subject IS NULL RETURNING id',(args.clerk_user_id,UUID(args.user_id))).fetchone()
            if not result: parser.error('Unlinked account not found. No account was changed.')
            print('Existing student account linked. Its projects and certificates retain their IDs.')

if __name__=='__main__':
    try: main()
    except psycopg.Error:
        raise SystemExit('Database operation failed. Check the connection, schema, and account IDs; no partial changes were committed.')
