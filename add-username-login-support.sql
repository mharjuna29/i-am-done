-- Add username-based login support.
-- Run this in Supabase SQL Editor before using username login in the app.
--
-- Supabase Auth still signs users in with email + password internally.
-- This app resolves a username to its email through public.resolve_login_email().

alter table public.user_profiles
add column if not exists username text;

alter table public.user_profiles
add column if not exists email text;

-- Optional backfill from auth.users.
-- Useful for existing accounts created before username support.
insert into public.user_profiles (id, full_name, username, email)
select
  id,
  coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'Pengguna') as full_name,
  lower(regexp_replace(coalesce(raw_user_meta_data->>'username', split_part(email, '@', 1)), '[^a-zA-Z0-9_]', '_', 'g')) as username,
  email
from auth.users
on conflict (id) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  username = coalesce(public.user_profiles.username, excluded.username);

update public.user_profiles
set username = lower(regexp_replace(coalesce(username, id::text), '[^a-zA-Z0-9_]', '_', 'g'))
where username is null;

create unique index if not exists user_profiles_username_key
on public.user_profiles (lower(username))
where username is not null;

create unique index if not exists user_profiles_email_key
on public.user_profiles (lower(email))
where email is not null;

create or replace function public.resolve_login_email(login_identifier text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email
  from public.user_profiles
  where lower(username) = lower(trim(login_identifier))
  limit 1;
$$;

grant execute on function public.resolve_login_email(text) to anon, authenticated;
