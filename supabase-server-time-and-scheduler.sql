create or replace function public.app_day_info()
returns table (
  server_now timestamptz,
  app_date date,
  next_day_at timestamptz,
  timezone text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    now() as server_now,
    (now() at time zone 'Asia/Jakarta')::date as app_date,
    (((now() at time zone 'Asia/Jakarta')::date + 1)::timestamp at time zone 'Asia/Jakarta') as next_day_at,
    'Asia/Jakarta'::text as timezone;
$$;

grant execute on function public.app_day_info() to authenticated;

create or replace function public.mark_missing_daily_progress_as_holiday()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  target_date date := ((now() at time zone 'Asia/Jakarta')::date - 1);
  inserted_count integer := 0;
begin
  insert into public.daily_progress (user_id, surah_id, progress_date, status)
  select
    us.user_id,
    us.surah_id,
    target_date,
    'Libur'
  from public.user_surahs us
  where not exists (
    select 1
    from public.daily_progress dp
    where dp.user_id = us.user_id
      and dp.surah_id = us.surah_id
      and dp.progress_date = target_date
  );

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function public.mark_missing_daily_progress_as_holiday() from public;

create extension if not exists pg_cron with schema extensions;

select cron.unschedule('mark-missing-daily-progress-as-holiday')
where exists (
  select 1
  from cron.job
  where jobname = 'mark-missing-daily-progress-as-holiday'
);

select cron.schedule(
  'mark-missing-daily-progress-as-holiday',
  '5 * * * *',
  $$select public.mark_missing_daily_progress_as_holiday();$$
);
