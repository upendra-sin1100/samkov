"""Private PostgreSQL access, compatible with Neon and other PostgreSQL hosts.

The small query adapter preserves the platform's existing operations. Identifiers
are allowlisted and all values use bound parameters; no database API is public.
Sync psycopg runs in worker threads to also support Windows' default event loop.
"""
import asyncio
import os
from contextlib import contextmanager
from functools import lru_cache
from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from psycopg import sql, DatabaseError, OperationalError
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from psycopg_pool import ConnectionPool, PoolTimeout

TABLES = {
 'profiles': 'id auth_subject email display_name username role disabled display_name_custom occupation college company',
 'tracks': 'slug title weeks project_count content active',
 'applications': 'id user_id track_slug student_name college occupation company motivation start_date end_date status verification_id authorized_signatory completed_at created_at',
 'submissions': 'id application_id user_id project_index github_url live_url linkedin_url notes attachment status feedback reviewed_by updated_at',
 'resources': 'id track_slug project_index title url created_by',
 'payments': 'id application_id user_id amount currency status payment_id created_at',
 'certificates': 'id application_id user_id student_name track_title domain duration_weeks start_date end_date completed_at projects_completed authorized_signatory status issued_at',
}
FUNCTIONS = {'complete_application': ['app_id'], 'issue_certificate': ['app_id']}
CONFLICTS = {'tracks': 'slug', 'submissions': 'application_id,project_index'}

@lru_cache(maxsize=1)
def pool():
    url = os.getenv('DATABASE_URL')
    if not url:
        raise HTTPException(503, 'The PostgreSQL database has not been configured yet.')
    return ConnectionPool(url, min_size=0, max_size=4, timeout=15,
                          kwargs={'row_factory':dict_row, 'connect_timeout':10,
                                  'prepare_threshold':None}, open=True)

@contextmanager
def connection():
    """Give every database operation the same safe, retryable error contract."""
    try:
        with pool().connection() as conn:
            yield conn
    except (OperationalError, PoolTimeout) as exc:
        raise HTTPException(503, 'Database temporarily unavailable. Please retry.') from exc
    except DatabaseError as exc:
        raise HTTPException(409, 'Operation could not be completed. Check eligibility, duplicates, and required fields.') from exc

def column(table, name):
    if name not in TABLES[table].split():
        raise ValueError('Unsupported database field.')
    return sql.Identifier(name)

def build_query(table, method, params, body):
    params, body = params or {}, body or {}
    if table.startswith('rpc/'):
        name = table[4:]
        if name not in FUNCTIONS or method != 'POST':
            raise ValueError('Unsupported database function.')
        keys = FUNCTIONS[name]
        return sql.SQL('SELECT * FROM public.{}({})').format(sql.Identifier(name), sql.SQL(',').join(sql.Placeholder() for _ in keys)), [body[k] for k in keys]
    if table not in TABLES:
        raise ValueError('Unsupported database table.')
    fields = params.get('select', '*').split(',')
    selection = sql.SQL('*') if fields == ['*'] else sql.SQL(',').join(column(table,k) for k in fields)
    conditions, values = [], []
    for key, value in params.items():
        if key in ['select','limit','on_conflict']: continue
        if not isinstance(value,str) or not value.startswith('eq.'):
            raise ValueError('Unsupported database filter.')
        conditions.append(sql.SQL('{} = %s').format(column(table,key)))
        values.append(value[3:])
    where = sql.SQL(' WHERE ') + sql.SQL(' AND ').join(conditions) if conditions else sql.SQL('')
    target = sql.Identifier('public',table)
    if method == 'GET':
        query = sql.SQL('SELECT {} FROM {}').format(selection,target) + where
        if 'limit' in params:
            limit = int(params['limit'])
            if not 1 <= limit <= 1000: raise ValueError('Invalid row limit.')
            query += sql.SQL(' LIMIT %s'); values.append(limit)
        return query, values
    if not body or method not in ['POST','PATCH']:
        raise ValueError('Unsupported database mutation.')
    keys = list(body)
    cols = [column(table,key) for key in keys]
    data = [Jsonb(body[k]) if isinstance(body[k],(dict,list)) else body[k] for k in keys]
    if method == 'PATCH':
        if not conditions: raise ValueError('A mutation must have a filter.')
        return sql.SQL('UPDATE {} SET {}').format(target,sql.SQL(',').join(sql.SQL('{} = %s').format(c) for c in cols)) + where + sql.SQL(' RETURNING *'), data + values
    query = sql.SQL('INSERT INTO {} ({}) VALUES ({})').format(target,sql.SQL(',').join(cols),sql.SQL(',').join(sql.Placeholder() for _ in keys))
    if 'on_conflict' in params:
        conflict = params['on_conflict']
        if CONFLICTS.get(table) != conflict: raise ValueError('Unsupported conflict target.')
        conflict_cols = conflict.split(',')
        updates = [k for k in keys if k not in conflict_cols]
        query += sql.SQL(' ON CONFLICT ({}) DO UPDATE SET {}').format(
            sql.SQL(',').join(column(table,k) for k in conflict_cols),
            sql.SQL(',').join(sql.SQL('{} = EXCLUDED.{}').format(column(table,k),column(table,k)) for k in updates))
    return query + sql.SQL(' RETURNING *'), data

def query_sync(table, method='GET', params=None, body=None, one=False):
    query, values = build_query(table,method,params,body)
    with connection() as conn:
        rows = conn.execute(query,values).fetchall()
    if one and not rows: raise HTTPException(404,'Record not found.')
    return jsonable_encoder(rows[0] if one else rows)

async def database(table, method='GET', params=None, body=None, one=False):
    return await asyncio.to_thread(query_sync,table,method,params,body,one)

def profile_for_subject(subject):
    with connection() as conn:
        # Imported accounts must be linked explicitly; never link by an unverified email claim.
        return conn.execute('INSERT INTO public.profiles(auth_subject) VALUES (%s) ON CONFLICT(auth_subject) DO UPDATE SET auth_subject=EXCLUDED.auth_subject RETURNING id,role,disabled', (subject,)).fetchone()


def record_visit(event_id):
    with connection() as conn:
        inserted = conn.execute("INSERT INTO public.view_receipts(id) VALUES (%s) ON CONFLICT DO NOTHING RETURNING id", (event_id,)).fetchone()
        if inserted:
            conn.execute("INSERT INTO public.site_views(day,views) VALUES(current_date,1) ON CONFLICT(day) DO UPDATE SET views=site_views.views+1")
        conn.execute("DELETE FROM public.view_receipts WHERE seen_at < now() - interval '1 day'")

def touch_user(user_id):
    with connection() as conn:
        conn.execute("UPDATE public.profiles SET last_seen_at=now() WHERE id=%s", (user_id,))

def analytics_snapshot():
    with connection() as conn:
        row = conn.execute("SELECT (SELECT coalesce(sum(views),0) FROM public.site_views) AS total_views, (SELECT coalesce(sum(views),0) FROM public.site_views WHERE day=current_date) AS views_today, count(*) FILTER (WHERE NOT disabled) AS total_users, count(*) FILTER (WHERE NOT disabled AND last_seen_at > now()-interval '5 minutes') AS active_users, now() AS updated_at FROM public.profiles").fetchone()
        return jsonable_encoder(row)
