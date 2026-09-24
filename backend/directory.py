"""Sync display fields from Clerk. Database roles and access flags remain local."""
import os
import threading
import time
import httpx
from .db import connection

_lock = threading.Lock()
_last_sync = 0

def display_fields(user):
    subject = user.get('id', '')
    if not isinstance(subject, str) or not subject.startswith('user_'):
        raise ValueError('Invalid Clerk user.')
    primary = next((e for e in user.get('email_addresses', [])
                    if e.get('id') == user.get('primary_email_address_id')
                    and (e.get('verification') or {}).get('status') == 'verified'), {})
    username = user.get('username') or None
    name = ' '.join(str(user.get(k) or '').strip() for k in ('first_name', 'last_name')).strip()
    return subject, primary.get('email_address'), name or username or None, username

def save_users(users):
    values = [display_fields(user) for user in users]
    with connection() as conn:
        for fields in values:
            conn.execute('''INSERT INTO public.profiles(auth_subject,email,display_name,username)
                VALUES (%s,%s,%s,%s) ON CONFLICT(auth_subject) DO UPDATE SET
                email=EXCLUDED.email,
                display_name=CASE WHEN profiles.display_name_custom THEN profiles.display_name ELSE EXCLUDED.display_name END,
                username=EXCLUDED.username''', fields)
    return len(values)

def sync_directory(force=False):
    global _last_sync
    with _lock:
        if not force and time.monotonic() - _last_sync < 60:
            return
        secret = os.getenv('CLERK_SECRET_KEY')
        if not secret:
            raise ValueError('Account directory sync needs CLERK_SECRET_KEY on the backend.')
        users, offset = [], 0
        with httpx.Client(base_url='https://api.clerk.com/v1',
                          headers={'Authorization': 'Bearer ' + secret}, timeout=15) as client:
            while True:
                response = client.get('/users', params={'limit': 100, 'offset': offset, 'order_by': '+created_at'})
                response.raise_for_status()
                page = response.json()
                if not isinstance(page, list):
                    raise ValueError('Unexpected account directory response.')
                users.extend(page)
                if len(page) < 100:
                    break
                offset += len(page)
        count = save_users(users)
        _last_sync = time.monotonic()
        return count
