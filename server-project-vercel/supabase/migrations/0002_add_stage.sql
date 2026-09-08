-- Adds the tournament-stage concept, separate from the in-match round
-- counter. `stage` (1 = Preliminary, 2 = Semifinal, 3 = Final) selects
-- which Challenge Hub / Security Checkpoint difficulty pool a board
-- draws from for its WHOLE match — `round` (already on `boards`) is just
-- the in-match turn-cycle counter (1..num_rounds) and has nothing to do
-- with question difficulty. See challengeLibrary.js's header comment.
--
-- Safe to run whether or not 0001_init.sql already ran on this database.

alter table event_config add column if not exists stage int not null default 1;
alter table boards add column if not exists stage int not null default 1;
