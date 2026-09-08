-- ============================================================
-- CYBER MONOPOLY — Supabase schema
--
-- Design notes (see DEPLOYMENT.md / README for the full writeup):
--
-- * `boards` holds one row per board with the game's transient/live state
--   (round, phase, active quiz/duel/challenge/upgrade-quiz — as JSONB,
--   mirroring the in-memory shape gameEngine.js already expects) so that a
--   single turn action is a small, bounded number of round trips, not a
--   cascade of joins.
-- * `teams` is a real table (not a JSON blob) keyed by (board_num, idx) so
--   Realtime can be told about a specific team's change if ever needed, and
--   so admin panels can query "all teams" cheaply. `assets` and `upgrades`
--   stay as an array/JSONB column on the team row rather than fully
--   normalized child tables — a buy/upgrade action is one UPDATE, not a
--   multi-table transaction.
-- * `board_secrets` holds ONLY the hidden answer for whatever is currently
--   active on a board (challenge answer text, quiz/duel/upgrade-quiz correct
--   index). It is a separate table specifically so Row Level Security can
--   deny it to anon/authenticated entirely — the service role (used only by
--   the /api serverless functions) bypasses RLS and is the only reader.
-- * `activity_feed` is the cross-board ticker for the public Main
--   Leaderboard screen (per-board log stays as a JSONB array on `boards`,
--   capped at 15, exactly like the original in-memory version).
--
-- Row Level Security: every table below has RLS enabled with NO policies
-- granted to anon/authenticated. That is deliberate, not an oversight — the
-- browser never talks to Postgres directly (no direct table reads either,
-- not just writes). All reads and writes go through the /api routes using
-- SUPABASE_SERVICE_ROLE_KEY, and live updates are delivered over Supabase
-- Realtime Broadcast (pub/sub messages the server pushes), not Postgres
-- Changes — so no table needs to be selectable by the anon key for the app
-- to work. This also closes an info-leak the original Socket.io version had
-- (team PINs riding along in the board broadcast to anyone with just the
-- board PIN) by construction: the DB row is never sent to a browser at all.
-- ============================================================

create table if not exists event_config (
  id smallint primary key default 1 check (id = 1),
  event_name text not null default 'Cyber Monopoly — Amrita Cyber Nation',
  num_boards int not null default 8,
  teams_per_board int not null default 4,
  num_rounds int not null default 8,
  status text not null default 'lobby', -- lobby | live | final_crisis | ended
  initialized boolean not null default false,
  admin_password text not null default 'acn2026',
  updated_at timestamptz not null default now()
);
insert into event_config (id) values (1) on conflict (id) do nothing;

create table if not exists boards (
  board_num int primary key,
  pin text not null,
  round int not null default 1,
  num_rounds int not null default 8,
  current_team_index int not null default 0,
  phase text not null default 'ready', -- ready | landed
  last_dice int,
  last_tile int,
  last_message text not null default '',
  finished boolean not null default false,
  tile_owners jsonb not null default '{}'::jsonb,   -- { [tileId]: teamIdx }
  active_challenge jsonb,                            -- sanitized (no answer)
  active_quiz jsonb,                                 -- sanitized (no correctIndex)
  active_duel jsonb,                                 -- sanitized (no correctIndex)
  active_upgrade_quiz jsonb,                          -- sanitized (no correctIndex)
  move_card_banner text,
  log jsonb not null default '[]'::jsonb,             -- [{msg, t}], capped at 15
  updated_at timestamptz not null default now()
);

-- Hidden answers. service_role only — never exposed to any client, ever.
create table if not exists board_secrets (
  board_num int primary key references boards(board_num) on delete cascade,
  active_challenge_answer text,
  active_quiz_answer int,
  active_duel_answer int,
  active_upgrade_quiz_answer int
);

create table if not exists teams (
  board_num int not null references boards(board_num) on delete cascade,
  idx int not null,
  name text not null,
  color text not null,
  pin text not null,
  position int not null default 0,
  cyber_credits int not null default 1500,
  security_score int not null default 50,
  reputation int not null default 10,
  assets int[] not null default '{}',
  upgrades jsonb not null default '{}'::jsonb,        -- { [tileId]: [upgradeKey, ...] }
  primary key (board_num, idx)
);

create table if not exists activity_feed (
  id bigserial primary key,
  board_num int not null,
  msg text not null,
  created_at timestamptz not null default now()
);
create index if not exists activity_feed_created_at_idx on activity_feed (created_at desc);

-- ---------------- Row Level Security ----------------
alter table event_config enable row level security;
alter table boards enable row level security;
alter table board_secrets enable row level security;
alter table teams enable row level security;
alter table activity_feed enable row level security;
-- No policies are created for anon/authenticated on any table above.
-- With RLS enabled and zero policies, PostgREST/the JS client using the
-- anon key gets zero rows and every write is rejected — by design. Only
-- SUPABASE_SERVICE_ROLE_KEY (used exclusively inside /api/*, never shipped
-- to the browser) can read or write, because the service role bypasses RLS.
