-- Apply once to a NEW PostgreSQL database. Only the Python server connects to this database.
create table public.profiles(id uuid primary key default gen_random_uuid(), auth_subject text unique, email text, role text not null default 'student' check(role in ('student','admin')), disabled boolean not null default false);
create table public.tracks(slug text primary key, title text not null, weeks integer not null check(weeks between 1 and 52), project_count integer not null check(project_count>=3), content jsonb not null default '{}', active boolean not null default true);
insert into public.tracks(slug,title,weeks,project_count) values ('data-science','Data Science',8,6),('machine-learning','Machine Learning',8,8),('web-development','Web Development',6,6),('python','Python Programming',6,6),('artificial-intelligence','Artificial Intelligence',8,6),('data-analytics','Data Analytics',6,6),('generative-ai','AI / Generative AI',8,6),('cybersecurity','Cybersecurity',8,6);
create table public.applications(id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id),track_slug text not null references tracks(slug),student_name text not null,college text not null,motivation text not null,start_date date not null,end_date date,status text not null default 'pending' check(status in ('pending','approved','rejected','completed')), verification_id uuid not null default gen_random_uuid() unique,authorized_signatory text,completed_at timestamptz,created_at timestamptz not null default now(),unique(user_id,track_slug));
create table public.submissions(id uuid primary key default gen_random_uuid(),application_id uuid not null references applications(id),user_id uuid not null references profiles(id),project_index integer not null check(project_index>=0),github_url text not null,live_url text,linkedin_url text,notes text not null,attachment text,status text not null default 'pending' check(status in ('pending','approved','rejected')),feedback text,reviewed_by uuid references profiles(id),updated_at timestamptz not null default now(),unique(application_id,project_index));
create table public.resources(id uuid primary key default gen_random_uuid(),track_slug text not null references tracks(slug),project_index integer,title text not null,url text not null check(url ~ '^https://'),created_by uuid references profiles(id));
create table public.payments(id text primary key,application_id uuid not null unique references applications(id),user_id uuid not null references profiles(id),amount integer not null check(amount=4900),currency text not null check(currency='INR'),status text not null default 'created' check(status in ('created','captured')),payment_id text unique,created_at timestamptz not null default now());
create table public.certificates(id text primary key default ('SKAI-'||extract(year from now())::text||'-'||upper(replace(gen_random_uuid()::text,'-',''))),application_id uuid not null unique references applications(id),user_id uuid not null references profiles(id),student_name text not null,track_title text not null,domain text not null,duration_weeks integer not null,start_date date not null,end_date date not null,completed_at timestamptz not null,projects_completed integer not null,authorized_signatory text not null,status text not null default 'active' check(status in ('active','revoked')),issued_at timestamptz not null default now());
create table public.audit_log(id bigint generated always as identity primary key,entity text not null,entity_id text not null,operation text not null,old_record jsonb,new_record jsonb,occurred_at timestamptz not null default now());
create function public.audit_change() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into audit_log(entity,entity_id,operation,old_record,new_record) values(TG_TABLE_NAME,coalesce(to_jsonb(new)->>'id',to_jsonb(old)->>'id'),TG_OP,to_jsonb(old),to_jsonb(new));return new;end $$;
create trigger audit_submissions after insert or update on submissions for each row execute function audit_change();
create trigger audit_certificates after insert or update on certificates for each row execute function audit_change();
create trigger audit_applications after insert or update on applications for each row execute function audit_change();
create trigger audit_payments after insert or update on payments for each row execute function audit_change();
-- No client write policies: a student cannot change status, roles, payments, or certificates.
create function public.complete_application(app_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare a applications;t tracks;begin select * into a from applications where id=app_id for update;if a.id is null or a.status <> 'approved' then raise exception 'Application is not approved';end if;select * into t from tracks where slug=a.track_slug;if exists(select 1 from generate_series(0,t.project_count-1) i where not exists(select 1 from submissions s where s.application_id=a.id and s.project_index=i and s.status='approved')) then raise exception 'Every required project must be approved';end if;update applications set status='completed',completed_at=now() where id=a.id;end $$;
create or replace function public.issue_certificate(app_id uuid) returns public.certificates language plpgsql security definer set search_path=public as $$
declare a applications;t tracks;c certificates;begin
select * into a from applications where id=app_id for update;
if a.status is distinct from 'completed' then raise exception 'Completion not approved';end if;
select * into t from tracks where slug=a.track_slug;
if exists(select 1 from generate_series(0,t.project_count-1) i where not exists(select 1 from submissions s where s.application_id=a.id and s.project_index=i and s.status='approved')) then raise exception 'Projects incomplete';end if;
select * into c from certificates where application_id=a.id;if c.id is not null then return c;end if;
insert into certificates(application_id,user_id,student_name,track_title,domain,duration_weeks,start_date,end_date,completed_at,projects_completed,authorized_signatory) values(a.id,a.user_id,a.student_name,t.title,t.title,t.weeks,a.start_date,a.end_date,a.completed_at,t.project_count,a.authorized_signatory) returning * into c;return c;
end $$;
-- Serialize submission mutations with completion and certificate issuance.
create function public.guard_submission() returns trigger language plpgsql set search_path=public as $$
declare a applications;t tracks;start_index integer;begin
select * into a from applications where id=new.application_id for update;
if a.status <> 'approved' or a.user_id<>new.user_id then raise exception 'Application not open for submissions';end if;
select * into t from tracks where slug=a.track_slug;
if new.project_index>=t.project_count then raise exception 'Invalid project';end if;
if TG_OP='UPDATE' and (new.application_id is distinct from old.application_id or new.user_id is distinct from old.user_id or new.project_index is distinct from old.project_index) then raise exception 'Submission identity is immutable';end if;
if TG_OP='UPDATE' and old.status='approved' and new is distinct from old then raise exception 'Approved evidence is immutable';end if;
start_index:=case when new.project_index<2 then 0 when new.project_index<t.project_count-2 then 2 else t.project_count-2 end;
if exists(select 1 from generate_series(0,start_index-1) i where not exists(select 1 from submissions s where s.application_id=a.id and s.project_index=i and s.status='approved')) then raise exception 'Previous level incomplete';end if;
return new;end $$;
create trigger protect_submission before insert or update on submissions for each row execute function guard_submission();
-- Prevent enrollment races from changing an existing curriculum after application.
create function public.guard_curriculum() returns trigger language plpgsql set search_path=public as $$ begin
if exists(select 1 from applications where track_slug=old.slug) and (new.content is distinct from old.content or new.project_count<>old.project_count or new.weeks<>old.weeks or new.title<>old.title) then raise exception 'Curriculum has enrolled students';end if;return new;end $$;
create trigger protect_curriculum before update on tracks for each row execute function guard_curriculum();

-- Application authorization is enforced by the Python API. No browser receives DB credentials.
revoke all on all tables in schema public from public;
revoke all on all functions in schema public from public;
create index applications_user on public.applications(user_id);
create index submissions_user on public.submissions(user_id);
create index submissions_application on public.submissions(application_id);
create index certificates_user on public.certificates(user_id);
create index payments_user on public.payments(user_id);
create index resources_track on public.resources(track_slug);

create table if not exists public.site_views(day date primary key default current_date, views bigint not null default 0);
create table if not exists public.view_receipts(id uuid primary key, seen_at timestamptz not null default now());
alter table public.profiles add column if not exists last_seen_at timestamptz;
create index if not exists profiles_last_seen on public.profiles(last_seen_at);
revoke all on public.site_views, public.view_receipts from public;
