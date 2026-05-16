# I am Done

I am Done is a personal project built to help me keep track of daily memorization and devotional routines in a simple, consistent way.

The idea came from a very practical need: I wanted a small tool where I could set targets, mark a day as completed, record rest days, and look back at my progress without relying on scattered notes or memory.

At its core, the app is meant to answer one simple question:

> "Did I complete it today?"

## Why I Built This

This project is mainly for personal use. It helps me stay aware of my own progress, especially for routines that are easy to postpone when they are not tracked clearly.

I also wanted the app to feel lightweight and calm. Nothing too complicated, no unnecessary dashboards for the sake of dashboards. Just the information I need, presented in a way that makes it easier to keep going.

## Features

- User authentication with Supabase Auth.
- Daily progress dashboard.
- Surah or memorization target management.
- Daily status tracking with `Selesai` and `Libur`.
- Progress summaries and simple statistics.
- Community page to view other users' progress.
- User detail view with recent activity.
- Dark mode and light mode.
- PWA support through a web manifest and service worker.
- Separate visual backgrounds for dark and light mode.
- Supabase scheduler support to automatically mark a day as `Libur` when no progress is submitted within the day.

## Tech Stack

- Vanilla HTML, CSS, and JavaScript.
- Supabase for authentication and database.
- Supabase Row Level Security for data permissions.
- Supabase RPC and `pg_cron` for server-based time and scheduled automation.
- PWA manifest and service worker for installability and app-shell caching.

## Project Notes

This is a personal project first, but the codebase is structured in a modular way so it can grow over time. Future improvements could include more flexible routine types, better statistics, reminders, or a more detailed history view.

The current version is intentionally focused: track the routine, keep the flow clear, and make the daily check-in easy.

## Quick Setup

1. Create a Supabase project.
2. Make sure the required tables exist, including `surahs`, `user_surahs`, `daily_progress`, and `user_profiles`.
3. Configure RLS policies so users can manage their own data and read the community data required by the app.
4. Run `supabase-server-time-and-scheduler.sql` in the Supabase SQL Editor to enable server-based day tracking and the automatic scheduler.
5. Update the Supabase configuration in `public/js/supabase.js`.
6. Serve the app through a static server or deploy it to your preferred hosting platform.

## PWA Support

The app includes basic PWA support through:

- `public/assets/manifest.json`
- `public/sw.js`

The service worker caches the app shell and key assets so the app loads faster and feels closer to a native app experience.
