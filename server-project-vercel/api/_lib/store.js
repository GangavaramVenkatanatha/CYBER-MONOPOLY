const GE = require('../../gameEngine');

/* ============================================================
   Marshalling between Postgres rows and the plain in-memory `board`
   object shape gameEngine.js already expects (this is what lets
   gameEngine.js be reused completely unmodified — every route loads a
   board, calls a GE function on it exactly like the original server.js
   did, then saves it back). Hidden "__" fields live in a separate
   service-role-only table and are stitched back on load / peeled back
   off on save.
   ============================================================ */

async function getConfigRow(supabase) {
  const { data, error } = await supabase.from('event_config').select('*').eq('id', 1).single();
  if (error) throw error;
  return data;
}

function configRowToObject(row) {
  return {
    eventName: row.event_name,
    numBoards: row.num_boards,
    teamsPerBoard: row.teams_per_board,
    numRounds: row.num_rounds,
    stage: row.stage,
    status: row.status,
    initialized: row.initialized,
    adminPassword: row.admin_password,
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

async function saveConfig(supabase, cfg) {
  const { error } = await supabase.from('event_config').update({
    event_name: cfg.eventName,
    num_boards: cfg.numBoards,
    teams_per_board: cfg.teamsPerBoard,
    num_rounds: cfg.numRounds,
    stage: cfg.stage,
    status: cfg.status,
    initialized: cfg.initialized,
    admin_password: cfg.adminPassword,
    updated_at: new Date().toISOString(),
  }).eq('id', 1);
  if (error) throw error;
}

async function getBoardRow(supabase, boardNum) {
  const { data, error } = await supabase.from('boards').select('*').eq('board_num', boardNum).maybeSingle();
  if (error) throw error;
  return data;
}

async function getTeamRow(supabase, boardNum, idx) {
  const { data, error } = await supabase.from('teams').select('*').eq('board_num', boardNum).eq('idx', idx).maybeSingle();
  if (error) throw error;
  return data;
}

function teamRowToObject(row) {
  return {
    id: row.idx,
    name: row.name,
    color: row.color,
    pin: row.pin,
    position: row.position,
    cyberCredits: row.cyber_credits,
    securityScore: row.security_score,
    reputation: row.reputation,
    assets: row.assets || [],
    upgrades: row.upgrades || {},
  };
}

/* Reconstructs the exact board shape gameEngine.js's defaultBoard() produces,
   including the hidden __active*Answer fields (absent whenever the
   corresponding active_* column is null, exactly like the in-memory
   original, so `if (!board.activeQuiz) ...` guards still behave the same). */
async function loadBoard(supabase, boardNum) {
  const [{ data: boardRow, error: bErr }, { data: teamRows, error: tErr }, { data: secretsRow, error: sErr }] = await Promise.all([
    supabase.from('boards').select('*').eq('board_num', boardNum).maybeSingle(),
    supabase.from('teams').select('*').eq('board_num', boardNum).order('idx', { ascending: true }),
    supabase.from('board_secrets').select('*').eq('board_num', boardNum).maybeSingle(),
  ]);
  if (bErr) throw bErr;
  if (tErr) throw tErr;
  if (sErr) throw sErr;
  if (!boardRow) return null;

  const board = {
    boardNum: boardRow.board_num,
    pin: boardRow.pin,
    stage: boardRow.stage,
    round: boardRow.round,
    numRounds: boardRow.num_rounds,
    currentTeamIndex: boardRow.current_team_index,
    phase: boardRow.phase,
    lastDice: boardRow.last_dice,
    lastTile: boardRow.last_tile,
    lastMessage: boardRow.last_message || '',
    activeChallenge: boardRow.active_challenge,
    activeQuiz: boardRow.active_quiz,
    activeDuel: boardRow.active_duel,
    activeUpgradeQuiz: boardRow.active_upgrade_quiz,
    moveCardBanner: boardRow.move_card_banner,
    finished: boardRow.finished,
    teams: (teamRows || []).map(teamRowToObject),
    tileOwners: boardRow.tile_owners || {},
    log: boardRow.log || [],
    updatedAt: new Date(boardRow.updated_at).getTime(),
  };
  if (secretsRow) {
    if (secretsRow.active_challenge_answer != null) board.__activeChallengeAnswer = secretsRow.active_challenge_answer;
    if (secretsRow.active_quiz_answer != null) board.__activeQuizAnswer = secretsRow.active_quiz_answer;
    if (secretsRow.active_duel_answer != null) board.__activeDuelAnswer = secretsRow.active_duel_answer;
    if (secretsRow.active_upgrade_quiz_answer != null) board.__activeUpgradeQuizAnswer = secretsRow.active_upgrade_quiz_answer;
  }
  return board;
}

/* Persists a mutated board object back to boards + teams + board_secrets.
   A single game action touches at most a couple of teams (buyer/payer,
   duel visitor+owner) but there's no cheap way to know which ahead of
   time, and a board only ever has 2-4 teams, so we just upsert all of
   them — simpler than diffing, and still a single small batched call. */
async function saveBoard(supabase, board) {
  const boardUpdate = {
    stage: board.stage,
    round: board.round,
    num_rounds: board.numRounds,
    current_team_index: board.currentTeamIndex,
    phase: board.phase,
    last_dice: board.lastDice,
    last_tile: board.lastTile,
    last_message: board.lastMessage || '',
    active_challenge: board.activeChallenge || null,
    active_quiz: board.activeQuiz || null,
    active_duel: board.activeDuel || null,
    active_upgrade_quiz: board.activeUpgradeQuiz || null,
    move_card_banner: board.moveCardBanner || null,
    finished: !!board.finished,
    tile_owners: board.tileOwners || {},
    log: board.log || [],
    updated_at: new Date().toISOString(),
  };

  const teamRows = board.teams.map((t) => ({
    board_num: board.boardNum,
    idx: t.id,
    name: t.name,
    color: t.color,
    pin: t.pin,
    position: t.position,
    cyber_credits: t.cyberCredits,
    security_score: t.securityScore,
    reputation: t.reputation,
    assets: t.assets || [],
    upgrades: t.upgrades || {},
  }));

  const secretsRow = {
    board_num: board.boardNum,
    active_challenge_answer: board.__activeChallengeAnswer ?? null,
    active_quiz_answer: board.__activeQuizAnswer ?? null,
    active_duel_answer: board.__activeDuelAnswer ?? null,
    active_upgrade_quiz_answer: board.__activeUpgradeQuizAnswer ?? null,
  };

  const [{ error: e1 }, { error: e2 }, { error: e3 }] = await Promise.all([
    supabase.from('boards').update(boardUpdate).eq('board_num', board.boardNum),
    supabase.from('teams').upsert(teamRows, { onConflict: 'board_num,idx' }),
    supabase.from('board_secrets').upsert(secretsRow, { onConflict: 'board_num' }),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  if (e3) throw e3;
}

async function appendFeed(supabase, boardNum, msg) {
  const { error } = await supabase.from('activity_feed').insert({ board_num: boardNum, msg });
  if (error) throw error;
}

async function getRecentFeed(supabase, limit) {
  const { data, error } = await supabase
    .from('activity_feed')
    .select('board_num, msg, created_at')
    .order('created_at', { ascending: false })
    .limit(limit || 25);
  if (error) throw error;
  return (data || []).map((r) => ({ boardNum: r.board_num, msg: r.msg, t: new Date(r.created_at).getTime() }));
}

/* Wipes and recreates every board + team row for a fresh event, mirroring
   admin:initialize's `state.boards = {}; for (...) defaultBoard(...)`. */
async function initializeEventRows(supabase, numBoards, teamsPerBoard, numRounds, stage) {
  await supabase.from('boards').delete().neq('board_num', -1);

  const boardRows = [];
  const teamRows = [];
  const secretsRows = [];
  for (let n = 1; n <= numBoards; n++) {
    const b = GE.defaultBoard(n, teamsPerBoard, numRounds, stage);
    boardRows.push({
      board_num: b.boardNum,
      pin: b.pin,
      stage: b.stage,
      round: b.round,
      num_rounds: b.numRounds,
      current_team_index: b.currentTeamIndex,
      phase: b.phase,
      last_dice: b.lastDice,
      last_tile: b.lastTile,
      last_message: b.lastMessage,
      active_challenge: null,
      active_quiz: null,
      active_duel: null,
      active_upgrade_quiz: null,
      move_card_banner: null,
      finished: b.finished,
      tile_owners: {},
      log: [],
      updated_at: new Date().toISOString(),
    });
    secretsRows.push({ board_num: b.boardNum, active_challenge_answer: null, active_quiz_answer: null, active_duel_answer: null, active_upgrade_quiz_answer: null });
    b.teams.forEach((t) => {
      teamRows.push({
        board_num: n,
        idx: t.id,
        name: t.name,
        color: t.color,
        pin: t.pin,
        position: t.position,
        cyber_credits: t.cyberCredits,
        security_score: t.securityScore,
        reputation: t.reputation,
        assets: t.assets,
        upgrades: t.upgrades,
      });
    });
  }

  const { error: e1 } = await supabase.from('boards').insert(boardRows);
  if (e1) throw e1;
  const { error: e2 } = await supabase.from('teams').insert(teamRows);
  if (e2) throw e2;
  const { error: e3 } = await supabase.from('board_secrets').insert(secretsRows);
  if (e3) throw e3;
}

async function resetBoardRows(supabase, boardNum, teamsPerBoard, numRounds, stage) {
  const b = GE.defaultBoard(boardNum, teamsPerBoard, numRounds, stage);
  await supabase.from('boards').update({
    pin: b.pin,
    stage: b.stage,
    round: b.round,
    num_rounds: b.numRounds,
    current_team_index: b.currentTeamIndex,
    phase: b.phase,
    last_dice: null,
    last_tile: null,
    last_message: '',
    active_challenge: null,
    active_quiz: null,
    active_duel: null,
    active_upgrade_quiz: null,
    move_card_banner: null,
    finished: false,
    tile_owners: {},
    log: [],
    updated_at: new Date().toISOString(),
  }).eq('board_num', boardNum);
  await supabase.from('board_secrets').update({ active_challenge_answer: null, active_quiz_answer: null, active_duel_answer: null, active_upgrade_quiz_answer: null }).eq('board_num', boardNum);
  const teamRows = b.teams.map((t) => ({
    board_num: boardNum,
    idx: t.id,
    name: t.name,
    color: t.color,
    pin: t.pin,
    position: t.position,
    cyber_credits: t.cyberCredits,
    security_score: t.securityScore,
    reputation: t.reputation,
    assets: t.assets,
    upgrades: t.upgrades,
  }));
  const { error } = await supabase.from('teams').upsert(teamRows, { onConflict: 'board_num,idx' });
  if (error) throw error;
}

/* All teams across all boards, for the public leaderboard + admin overview. */
async function loadAllBoardsWithTeams(supabase) {
  const [{ data: boardRows, error: bErr }, { data: teamRows, error: tErr }] = await Promise.all([
    supabase.from('boards').select('*').order('board_num', { ascending: true }),
    supabase.from('teams').select('*').order('board_num', { ascending: true }).order('idx', { ascending: true }),
  ]);
  if (bErr) throw bErr;
  if (tErr) throw tErr;
  const teamsByBoard = {};
  (teamRows || []).forEach((r) => {
    teamsByBoard[r.board_num] = teamsByBoard[r.board_num] || [];
    teamsByBoard[r.board_num].push(teamRowToObject(r));
  });
  return (boardRows || []).map((row) => ({
    boardNum: row.board_num,
    pin: row.pin,
    round: row.round,
    numRounds: row.num_rounds,
    currentTeamIndex: row.current_team_index,
    finished: row.finished,
    teams: teamsByBoard[row.board_num] || [],
  }));
}

module.exports = {
  getConfigRow, configRowToObject, saveConfig,
  getBoardRow, getTeamRow, loadBoard, saveBoard,
  appendFeed, getRecentFeed,
  initializeEventRows, resetBoardRows,
  loadAllBoardsWithTeams,
};
