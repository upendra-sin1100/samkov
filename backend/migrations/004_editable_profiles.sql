-- Preserve existing application snapshots and user-selected display names.
alter table public.profiles add column if not exists display_name_custom boolean not null default false;
alter table public.profiles add column if not exists occupation text check (occupation in ('student','employee','other'));
alter table public.profiles add column if not exists college text not null default '';
alter table public.profiles add column if not exists company text not null default '';
alter table public.applications add column if not exists occupation text not null default 'student' check (occupation in ('student','employee','other'));
alter table public.applications add column if not exists company text not null default '';
