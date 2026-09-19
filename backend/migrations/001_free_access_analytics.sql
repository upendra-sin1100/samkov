drop function if exists public.issue_certificate(uuid,text,text);
create or replace function public.issue_certificate(app_id uuid) returns public.certificates language plpgsql security definer set search_path=public as $$
declare a applications;t tracks;c certificates;begin
select * into a from applications where id=app_id for update;
if a.status is distinct from 'completed' then raise exception 'Completion not approved';end if;
select * into t from tracks where slug=a.track_slug;
if exists(select 1 from generate_series(0,t.project_count-1) i where not exists(select 1 from submissions s where s.application_id=a.id and s.project_index=i and s.status='approved')) then raise exception 'Projects incomplete';end if;
select * into c from certificates where application_id=a.id;if c.id is not null then return c;end if;
insert into certificates(application_id,user_id,student_name,track_title,domain,duration_weeks,start_date,end_date,completed_at,projects_completed,authorized_signatory) values(a.id,a.user_id,a.student_name,t.title,t.title,t.weeks,a.start_date,a.end_date,a.completed_at,t.project_count,a.authorized_signatory) returning * into c;return c;
end $$;

create table if not exists public.site_views(day date primary key default current_date, views bigint not null default 0);
create table if not exists public.view_receipts(id uuid primary key, seen_at timestamptz not null default now());
alter table public.profiles add column if not exists last_seen_at timestamptz;
create index if not exists profiles_last_seen on public.profiles(last_seen_at);
revoke all on public.site_views, public.view_receipts from public;

revoke all on function public.issue_certificate(uuid) from public;
