-- Reset database data to the initial app state.
-- Run this in Supabase SQL Editor.
--
-- What this script resets:
-- - Removes all memorization progress.
-- - Removes all selected user surahs.
-- - Removes all public user profiles.
-- - Recreates the initial master surah list.
--
-- What this script does NOT reset:
-- - Supabase Auth users, by default.
-- - RLS policies.
-- - RPC functions.
-- - pg_cron scheduler jobs.
--
-- If you also want to delete all Auth users, see the optional block near the bottom.

begin;

truncate table public.daily_progress restart identity cascade;
truncate table public.user_surahs restart identity cascade;
truncate table public.user_profiles restart identity cascade;
truncate table public.surahs restart identity cascade;

insert into public.surahs (id, name, description)
values
  (
    'ar-rahman',
    'Ar-Rahman',
    'Surah Ar-Rahman memorization target.'
  ),
  (
    'rathib-al-haddad',
    'Rathib Al-Haddad',
    'Rathib Al-Haddad daily recitation target.'
  )
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description;

commit;

-- Optional: delete all Supabase Auth users as well.
-- Be careful: this removes login accounts and cannot be undone from this script.
-- Uncomment this block only if you want a fully clean auth state too.
--
-- delete from auth.users;

-- Optional: verify the reset result.
-- select 'surahs' as table_name, count(*) from public.surahs
-- union all select 'user_profiles', count(*) from public.user_profiles
-- union all select 'user_surahs', count(*) from public.user_surahs
-- union all select 'daily_progress', count(*) from public.daily_progress;
