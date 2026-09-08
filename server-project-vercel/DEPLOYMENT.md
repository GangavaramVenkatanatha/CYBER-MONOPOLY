# Deployment guide — Cyber Monopoly on Vercel + Supabase

Written for someone who has **never used Supabase or Vercel before**.
Follow the numbered steps in order. This takes about 15–20 minutes the
first time.

You'll need: a GitHub account (to hold the code Vercel deploys from), and
about 15 minutes where you can click through two web dashboards.

---

## 1. Put this code on GitHub

Vercel deploys from a Git repository, so this folder needs to live in one.

1. Go to [github.com/new](https://github.com/new) and create a new
   **private** repository (any name, e.g. `cyber-monopoly`).
2. On your computer, open a terminal in this folder
   (`server-project-vercel/`) and run:
   ```
   git init
   git add .
   git commit -m "Cyber Monopoly — Vercel + Supabase edition"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
   (GitHub's "new repository" page shows you these exact commands with
   your own URL filled in — you can copy them from there instead.)

---

## 2. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up / log in.
2. Click **New project**.
3. Pick any organization, name it (e.g. `cyber-monopoly`), set a database
   password (Supabase generates one for you — click the button to copy it
   and save it somewhere; you won't need to type it again, but keep it in
   case you ever need direct database access), and pick the region closest
   to where your event is happening.
4. Click **Create new project**. Wait ~2 minutes for it to finish setting
   up.

## 3. Run the database migrations

There are two migration files in `supabase/migrations/` — run BOTH, in
order (0001, then 0002). Both are safe to re-run if you're ever unsure
whether one already ran.

1. In your new Supabase project, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open `supabase/migrations/0001_init.sql` from this folder, select all
   of its text, and paste it into the SQL Editor.
4. Click **Run** (bottom right). You should see "Success. No rows
   returned." If you see an error, make sure you pasted the *entire* file
   and didn't accidentally run it twice against a project that already has
   these tables (re-running it is safe though — every statement uses
   `if not exists` / `on conflict do nothing`).
5. Click **New query** again, open `supabase/migrations/0002_add_stage.sql`,
   paste its full text, and click **Run**. This adds the tournament-stage
   column used by Section 4's "Tournament Stage" setting.
6. Optional sanity check: click **Table Editor** in the sidebar — you
   should see `event_config`, `boards`, `board_secrets`, `teams`, and
   `activity_feed` listed, `event_config` should have exactly one row, and
   both `event_config` and `boards` should have a `stage` column.

## 4. Copy your Supabase keys

1. Still in your Supabase project, click **Project Settings** (gear icon,
   bottom of the left sidebar) → **API**.
2. You'll need three values from this page — keep this tab open, you'll
   paste them into Vercel in a moment:
   - **Project URL** (looks like `https://xxxxxxxx.supabase.co`)
   - **anon / public** key (under "Project API keys")
   - **service_role** key (same section — click "Reveal" first; treat
     this one like a password, it bypasses all database security rules)

## 5. Create the Vercel project

1. Go to [vercel.com](https://vercel.com) and sign up / log in (you can
   sign in with your GitHub account, which makes the next step easier).
2. Click **Add New...** → **Project**.
3. Find the GitHub repository you pushed in Step 1 and click **Import**.
4. On the configuration screen:
   - **Root Directory**: if you pushed only this folder's contents to the
     repo root, leave this as `.`. If your repo has other stuff alongside
     it (e.g. you pushed the whole `cyber-monopoly-server` folder), click
     **Edit** next to Root Directory and set it to `server-project-vercel`.
   - **Framework Preset**: leave as "Other" — this isn't a framework app.
5. Before clicking Deploy, open the **Environment Variables** section on
   this same screen and add these four (copy the exact names):

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | the Project URL from Step 4 |
   | `SUPABASE_SERVICE_ROLE_KEY` | the service_role key from Step 4 |
   | `SUPABASE_ANON_KEY` | the anon/public key from Step 4 |
   | `CHANNEL_SALT` | any long random string (mash your keyboard, 30+ characters) |

   (`CRON_SECRET` is optional — see the note at the bottom about the
   background sweep job. Skip it for now, it's not required to launch.)

6. Click **Deploy**. Wait ~1 minute.

## 6. First login and event setup

1. Once deployed, Vercel shows you a URL like
   `https://cyber-monopoly-xxxx.vercel.app` — open it.
2. Click **Admin Control**. The default password is `acn2026`.
3. **Immediately** go to the **Admin password** field in Event Setup and
   change it to something only you know, then click **Save Settings** —
   do this *before* sharing the event URL with anyone, exactly like the
   original app's instructions.
4. Set your number of boards, teams per board, rounds per match, and
   **Tournament Stage** (Preliminary / Semifinal / Final — this picks
   which Challenge Hub / Security Checkpoint difficulty pool every board
   draws from for its whole match; it's separate from "Rounds per
   match," which just controls how many turn-cycles one match lasts),
   then click **Initialize Event**. This generates a random PIN for
   every board and every team — write them down / screenshot them from
   the **Board Access PINs** and **Team Names & PINs** panels, since
   that's the only place they're shown. Run your three tournament
   stages as three separate Initialize Events over the course of the
   event — e.g. Preliminary in the morning, then Re-initialize with
   Stage = Semifinal, then again for the Final.
5. Click **Start / Resume Event**.
6. Hand out the URL + each board's PIN to its Game Master, and each
   team's own PIN to that team only (not the whole table) — same trust
   model as the original app.
7. Put the **Main Leaderboard** screen (no PIN needed) up on the projector.

You're live. No laptop needs to stay on, no WiFi network needs to be
shared — anyone with internet access and the URL can play.

---

## Notes for later / if something's off

- **Changing event settings mid-event**: works the same as the original —
  Admin → Reset Board issues that board a brand-new PIN (update its table
  card), and Re-initialize wipes every board's progress, so only use it
  before the event starts or between rehearsals.
- **The optional background sweep (`CRON_SECRET`)**: quizzes and duels
  expire when a player's own countdown hits zero and their browser tells
  the server — this doesn't depend on the sweep job at all. The sweep
  (`api/cron/sweep.js`, wired up in `vercel.json`) is just a fallback for
  the rare case nobody's device happened to be open when a timer ran out.
  On Vercel's free (Hobby) plan, Cron Jobs are limited to once a day —
  the `vercel.json` in this repo is already set to run it daily
  (`0 0 * * *`), which is fine as a supplement. If you're on a paid Vercel
  plan and want tighter sweeping, you can lower that schedule (e.g. to
  every 5 minutes: `*/5 * * * *`) and it'll still work the same way. To
  protect the sweep endpoint from random internet traffic, generate
  another long random string and add it as the `CRON_SECRET` environment
  variable in Vercel — Vercel automatically sends it for you when it
  triggers the Cron job, no other setup needed.
- **Redeploying after a code change**: Vercel automatically redeploys
  every time you push to the `main` branch on GitHub. No env variables
  need to be touched for a normal code update.
- **Rotating a leaked key**: if you ever suspect `SUPABASE_SERVICE_ROLE_KEY`
  leaked, go to Supabase → Project Settings → API and regenerate it, then
  update the `SUPABASE_SERVICE_ROLE_KEY` environment variable in Vercel
  (Project Settings → Environment Variables) and redeploy.
- **If a screen shows "RECONNECTING…" permanently**: double check the
  three Supabase environment variables in Vercel are exactly right (no
  extra spaces, no quotes) and that you ran the SQL migration — a wrong
  `SUPABASE_URL`/`SUPABASE_ANON_KEY` pair is the most common cause.
- **Local WiFi fallback**: if your venue's internet is unreliable, the
  original Socket.io version in `../server-project/` still works as a
  fully offline, laptop-only fallback with no cloud dependency — see its
  own `README.md`.
