-- Display fields only. Never change existing roles, access, or account ownership.
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists username text;
