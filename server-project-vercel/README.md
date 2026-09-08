# Cyber Monopoly — ACN 2026 (Vercel + Supabase edition)

This is the cloud-hosted version of Cyber Monopoly: a Vercel-hosted static
frontend + serverless API routes, backed by a Supabase Postgres database
and Supabase Realtime for live updates. Anyone with the event URL can play
from a plain browser — no installs, same PIN-gated access model as the
original local-WiFi version in `../server-project/`.

**If you just want to get this live, skip straight to [DEPLOYMENT.md](./DEPLOYMENT.md)** —
it has exact, numbered, click-by-click steps for someone who has never used
Supabase or Vercel before.

## What's here

- `gameEngine.js`, `quizBank.js`, `challengeLibrary.js` — reused unchanged
  from the original app. All game rules live here; every API route just
  loads a board from the database, calls a function in this file, and
  saves the result back.
- `public/` — the static frontend (plain HTML/CSS/vanilla JS, same as the
  original, rewired to call `/api/*` instead of Socket.io and to receive
  live updates over Supabase Realtime Broadcast instead of a WebSocket
  room).
- `api/` — one Vercel serverless function per action (roll, buy, judge a
  challenge, etc.), plus `api/_lib/` for the shared marshalling/auth/
  broadcast code every route uses.
- `supabase/migrations/0001_init.sql` — the full database schema, with
  design notes in the file's header comment explaining each table and why
  Row Level Security is locked down to deny the browser's anon key
  entirely (every read and write goes through the API routes instead).
- `.env.example` — every environment variable this needs, with a note on
  where to find each value.
- `vercel.json` — routing/function config, plus an optional daily Cron
  job as a belt-and-suspenders sweep for expired quizzes/duels (the
  primary expiry mechanism is each player's own countdown timer calling
  `/api/expire/*` when it hits zero — see the code comments in
  `api/expire/*.js` and `api/cron/sweep.js`).

## Why this looks different from a typical Vercel app

Socket.io (what the original app used for real-time sync) needs a
long-running process to hold WebSocket connections open — Vercel functions
are stateless and short-lived, so that doesn't work here. Two things
replace it:

1. **Supabase Realtime Broadcast** instead of Socket.io rooms. Every
   mutating API route pushes a `board:update` message to a Broadcast
   channel after it saves; every screen subscribes to that channel with
   the `@supabase/supabase-js` browser client (loaded from a CDN in
   `index.html` — no build step, no bundler).
2. **Lazy expiry** instead of a server-side `setTimeout`. A quiz/duel's
   deadline is stored in the database; when a player's own 20-second
   countdown hits zero, their browser calls `/api/expire/quiz` (or
   `/duel`, `/upgrade-quiz`), and the server independently re-checks the
   *real* deadline in the database before resolving anything — it never
   trusts the caller's clock, and calling it early, late, or more than
   once is always safe.

Everything else — the PIN model, what each role can see/do, the hidden
answer key never reaching a player's browser — works exactly like the
original; see the security notes in `supabase/migrations/0001_init.sql`
and in each `api/_lib/*.js` file for how each property is enforced here.
