-- Preserve approved evidence and submission ownership. Safe to apply repeatedly.
create or replace function public.guard_submission() returns trigger language plpgsql set search_path=public as $$
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
