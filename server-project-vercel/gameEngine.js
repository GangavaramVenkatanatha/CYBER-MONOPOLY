/* ============================================================
   CYBER MONOPOLY — GAME ENGINE (server-authoritative)
   Pure functions that mutate a board object. The server is the
   only writer of truth; clients only send intents and render
   whatever the server pushes back.
   ============================================================ */

const { pickChallenge } = require('./challengeLibrary');
const { pickQuiz } = require('./quizBank');

const NUM_TILES = 24;
const START_CREDITS = 3000;
const START_SECURITY = 50;
const START_REPUTATION = 10;
const PASS_START_BONUS = 2000;
const QUIZ_TIME_LIMIT_MS = 20000;
const DUEL_TIME_LIMIT_MS = 20000;

const ZONE = { CORNER: 'corner', ASSET: 'asset', EVENT: 'event' };

const TILES = [
  { id: 0,  zone: ZONE.CORNER, name: 'HQ / START',              icon: '\ud83c\udfe0', tag: 'start' },
  { id: 1,  zone: ZONE.ASSET,  name: 'Cloud Infrastructure',    icon: '\u2601\ufe0f', cost: 400, fee: 50, revenue: 100 },
  { id: 2,  zone: ZONE.EVENT,  name: 'Community Chest',         icon: '\ud83d\udce6', tag: 'chest' },
  { id: 3,  zone: ZONE.ASSET,  name: 'Data Centre',             icon: '\ud83d\udcbe', cost: 450, fee: 55, revenue: 110 },
  { id: 4,  zone: ZONE.ASSET,  name: 'AI Research Lab',         icon: '\ud83e\udde0', cost: 500, fee: 60, revenue: 120 },
  { id: 5,  zone: ZONE.ASSET,  name: 'Government Portal',       icon: '\ud83c\udfdb\ufe0f', cost: 520, fee: 62, revenue: 122 },
  { id: 6,  zone: ZONE.CORNER, name: 'Security Checkpoint',     icon: '\ud83d\udd10', tag: 'checkpoint' },
  { id: 7,  zone: ZONE.ASSET,  name: 'Telecom Network',         icon: '\ud83d\udce1', cost: 480, fee: 58, revenue: 115 },
  { id: 8,  zone: ZONE.ASSET,  name: 'Smart City Grid',         icon: '\ud83c\udf03', cost: 650, fee: 80, revenue: 150 },
  { id: 9,  zone: ZONE.EVENT,  name: 'Chance',                  icon: '\u2753', tag: 'chance' },
  { id: 10, zone: ZONE.ASSET,  name: 'Critical Infrastructure', icon: '\u26a1', cost: 750, fee: 95, revenue: 170 },
  { id: 11, zone: ZONE.ASSET,  name: 'National Bank',           icon: '\ud83c\udfe6', cost: 700, fee: 90, revenue: 160 },
  { id: 12, zone: ZONE.CORNER, name: 'Challenge Hub',           icon: '\ud83d\udee1\ufe0f', tag: 'challenge' },
  { id: 13, zone: ZONE.ASSET,  name: 'Healthcare System',       icon: '\ud83c\udfe5', cost: 450, fee: 55, revenue: 110 },
  { id: 14, zone: ZONE.ASSET,  name: 'Biotech Labs',            icon: '\ud83e\uddec', cost: 560, fee: 68, revenue: 128 },
  { id: 15, zone: ZONE.EVENT,  name: 'Community Chest',         icon: '\ud83d\udce6', tag: 'chest' },
  { id: 16, zone: ZONE.ASSET,  name: 'Energy Grid',             icon: '\ud83d\udd0c', cost: 600, fee: 72, revenue: 135 },
  { id: 17, zone: ZONE.ASSET,  name: 'University Network',      icon: '\ud83c\udf93', cost: 430, fee: 52, revenue: 105 },
  { id: 18, zone: ZONE.CORNER, name: 'Incident Zone',           icon: '\u26a0\ufe0f', tag: 'incident' },
  { id: 19, zone: ZONE.ASSET,  name: 'Insurance Firm',          icon: '\ud83d\udcbc', cost: 620, fee: 75, revenue: 140 },
  { id: 20, zone: ZONE.ASSET,  name: 'Retail & Commerce Platform', icon: '\ud83d\uded2', cost: 540, fee: 64, revenue: 125 },
  { id: 21, zone: ZONE.EVENT,  name: 'Chance',                  icon: '\u2753', tag: 'chance' },
  { id: 22, zone: ZONE.ASSET,  name: 'Cybersecurity Startup Hub', icon: '\ud83d\ude80', cost: 580, fee: 70, revenue: 132 },
  { id: 23, zone: ZONE.ASSET,  name: 'Space & Satellite Ops',   icon: '\ud83d\udef0\ufe0f', cost: 800, fee: 100, revenue: 180 },
];

const TILE_GRID = [
  [1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],
  [7,2],[7,3],[7,4],[7,5],[7,6],
  [7,7],[6,7],[5,7],[4,7],[3,7],[2,7],
  [1,7],[1,6],[1,5],[1,4],[1,3],[1,2],
];

const TEAM_COLORS = ['#E15554', '#4FD1E8', '#4CD787', '#C9A24B'];

const UPGRADES = [
  { key: 'strongpw', name: 'Strong Password', cost: 80,  boost: 5 },
  { key: 'mfa',       name: 'MFA',             cost: 150, boost: 10 },
  { key: 'firewall',  name: 'Firewall',        cost: 220, boost: 12 },
  { key: 'backup',    name: 'Backup System',   cost: 200, boost: 10 },
  { key: 'ids',       name: 'IDS',             cost: 300, boost: 15 },
  { key: 'soc',       name: 'SOC',             cost: 420, boost: 20 },
];

/* Community Chest / Chance "move card" deck — instant redirect/flavor cards,
   resolved immediately with no timer. dest is one of:
   'challenge' | 'incident' | 'start' | 'none' | 'nearestAsset' */
const MOVE_CARDS = [
  { id: 'mv01', text: 'Emergency drill — report to the Challenge Hub!', dest: 'challenge' },
  { id: 'mv02', text: 'Suspicious activity — redirected to the Incident Zone.', dest: 'incident' },
  { id: 'mv03', text: 'Advance directly to HQ! Collect 200 Cyber Credits.', dest: 'start' },
  { id: 'mv04', text: 'Quiet day — no cost this round, continue as normal.', dest: 'none' },
  { id: 'mv05', text: 'New contract signed — advance to the nearest available asset.', dest: 'nearestAsset' },
  { id: 'mv06', text: 'Fresh investment opportunity — advance to the nearest available asset.', dest: 'nearestAsset' },
];

function tileById(id) { return TILES.find(t => t.id === id); }

function defaultConfig() {
  return {
    eventName: 'Cyber Monopoly \u2014 Amrita Cyber Nation',
    numBoards: 8,
    teamsPerBoard: 4,
    numRounds: 8,
    stage: 1, // 1 = Preliminary, 2 = Semifinal, 3 = Final \u2014 baked into every board on Initialize
    status: 'lobby', // lobby | live | final_crisis | ended
    initialized: false,
    adminPassword: 'acn2026',
    updatedAt: Date.now(),
  };
}

function defaultTeam(idx, boardNum) {
  return {
    id: idx,
    name: `TEAM ${String((boardNum - 1) * 4 + idx + 1).padStart(2, '0')}`,
    color: TEAM_COLORS[idx % TEAM_COLORS.length],
    pin: randomPin(),
    position: 0,
    cyberCredits: START_CREDITS,
    securityScore: START_SECURITY,
    reputation: START_REPUTATION,
    assets: [],
    upgrades: {},
  };
}

function randomPin() {
  return String(1000 + Math.floor(Math.random() * 9000));
}

/* `stage` is the tournament stage this board's whole match belongs to —
   1 = Preliminary, 2 = Semifinal, 3 = Final — set once when the event is
   initialized for that stage and never changed during the match. This is
   deliberately separate from `round` below: `round` is just the in-match
   turn-cycle counter (1..numRounds, climbing every time play comes back
   around to Team 1), which has nothing to do with question difficulty.
   Challenge Hub / Security Checkpoint content is picked by `stage`, not
   by `round` — see resolveLanding(). */
function defaultBoard(boardNum, numTeams, numRounds, stage) {
  return {
    boardNum,
    pin: randomPin(),
    stage: stage || 1,
    round: 1,
    numRounds: numRounds || 8,
    currentTeamIndex: 0,
    phase: 'ready', // ready | landed
    lastDice: null,
    lastTile: null,
    lastMessage: '',
    activeChallenge: null,
    activeQuiz: null,
    activeDuel: null,
    activeUpgradeQuiz: null,
    moveCardBanner: null,
    finished: false,
    teams: Array.from({ length: numTeams }, (_, i) => defaultTeam(i, boardNum)),
    tileOwners: {},
    log: [],
    updatedAt: Date.now(),
  };
}

function companyValue(team) {
  const assetRevenue = team.assets.reduce((sum, tid) => {
    const t = tileById(tid);
    return sum + (t ? t.revenue : 0);
  }, 0);
  return Math.round(team.cyberCredits + team.securityScore * 10 + team.reputation * 20 + assetRevenue * 5);
}

function pushLog(board, msg) {
  board.log = board.log || [];
  board.log.unshift({ msg, t: Date.now() });
  board.log = board.log.slice(0, 15);
}

function touch(board) { board.updatedAt = Date.now(); }

function currentTeam(board) { return board.teams[board.currentTeamIndex]; }

function advanceTurn(board) {
  board.currentTeamIndex = (board.currentTeamIndex + 1) % board.teams.length;
  if (board.currentTeamIndex === 0) {
    board.round += 1;
    if (board.round > board.numRounds) {
      board.finished = true;
      pushLog(board, `Board ${board.boardNum} complete \u2014 final standings locked in.`);
    }
  }
  board.phase = 'ready';
  board.lastDice = null;
  board.lastTile = null;
  board.lastMessage = '';
  board.activeChallenge = null;
  board.activeQuiz = null;
  board.activeDuel = null;
  board.activeUpgradeQuiz = null;
  delete board.__activeUpgradeQuizAnswer;
  board.moveCardBanner = null;
  touch(board);
}

/* ---------------- actions (each returns {ok, error?}) ---------------- */

/* Resolves whatever the team's current tile requires (challenge/checkpoint judging,
   a chest/chance draw, or nothing for start/asset tiles). Shared by a normal dice
   landing and by a move-card redirect, since a redirect always lands on a tile of
   this same kind (Challenge Hub, Incident Zone, START, or an asset \u2014 never back
   into a Chest/Chance tile, so this can never recurse into resolveChestChanceDraw). */
function resolveLanding(board, tile) {
  board.lastMessage = '';
  board.activeChallenge = null;
  board.activeQuiz = null;
  if (tile.tag === 'start') {
    board.lastMessage = 'Welcome back to HQ.';
  } else if (tile.tag === 'checkpoint' || tile.tag === 'challenge' || tile.tag === 'incident') {
    const poolType = tile.tag === 'checkpoint' ? 'checkpoint' : 'challenge';
    const picked = pickChallenge(poolType, board.stage);
    if (picked) {
      const { answer, ...safeFields } = picked;
      board.activeChallenge = { ...safeFields, tileTag: tile.tag };
      board.__activeChallengeAnswer = answer;
    } else {
      board.lastMessage = `${tile.name}: no challenge configured for this round yet.`;
    }
  } else if (tile.tag === 'chest' || tile.tag === 'chance') {
    resolveChestChanceDraw(board, tile);
  }
  // asset tiles: nothing to set here \u2014 the client derives buy/pay/duel from tileOwners.
}

/* Community Chest / Chance: 50/50 between an instant move card (unchanged) and a
   static reminder to visit a department for the real challenges/tasks — no quiz
   is attached to these tiles any more. */
function resolveChestChanceDraw(board, originTile) {
  if (Math.random() < 0.5) {
    const originLabel = originTile.tag === 'chest' ? 'Community Chest' : 'Chance';
    board.lastMessage = `${originLabel}: No card this time — head to your nearest department (Challenge Hub, Security Checkpoint, or Incident Zone) to pick up challenges and tasks!`;
  } else {
    const card = MOVE_CARDS[Math.floor(Math.random() * MOVE_CARDS.length)];
    applyMoveCard(board, originTile, card);
  }
}

function applyMoveCard(board, originTile, card) {
  const cur = currentTeam(board);
  const originLabel = originTile.tag === 'chest' ? 'Community Chest' : 'Chance';
  board.moveCardBanner = `\ud83d\udd00 ${originLabel}: ${card.text}`;

  if (card.dest === 'none') {
    board.lastMessage = card.text;
  } else if (card.dest === 'start') {
    const startTile = TILES.find(t => t.tag === 'start');
    cur.position = startTile.id;
    board.lastTile = startTile.id;
    cur.cyberCredits += PASS_START_BONUS;
    board.lastMessage = `${card.text} (+${PASS_START_BONUS} CC)`;
  } else if (card.dest === 'challenge' || card.dest === 'incident') {
    const destTile = TILES.find(t => t.tag === card.dest);
    cur.position = destTile.id;
    board.lastTile = destTile.id;
    resolveLanding(board, destTile);
  } else if (card.dest === 'nearestAsset') {
    let pos = cur.position;
    for (let steps = 0; steps < NUM_TILES; steps++) {
      pos = (pos + 1) % NUM_TILES;
      if (tileById(pos).zone === 'asset') { cur.position = pos; board.lastTile = pos; break; }
    }
  }
  pushLog(board, `${cur.name} drew a ${originLabel} card: "${card.text}"`);
  touch(board);
}

function rollAndMove(board) {
  if (board.finished) return { ok: false, error: 'Board is finished.' };
  if (board.phase !== 'ready') return { ok: false, error: 'Already mid-turn.' };
  const cur = currentTeam(board);
  const dice = 1 + Math.floor(Math.random() * 6);
  const oldPos = cur.position;
  const wrapped = (oldPos + dice) >= NUM_TILES;
  const newPos = (oldPos + dice) % NUM_TILES;
  cur.position = newPos;
  if (wrapped) {
    cur.cyberCredits += PASS_START_BONUS;
    pushLog(board, `${cur.name} passed START (+${PASS_START_BONUS} CC)`);
  }
  board.lastDice = dice;
  board.lastTile = newPos;
  board.phase = 'landed';
  board.moveCardBanner = null;
  const tile = tileById(newPos);
  resolveLanding(board, tile);
  pushLog(board, `${cur.name} rolled ${dice} \u2192 ${tile.name}`);
  touch(board);
  return { ok: true };
}

function requireLanded(board) {
  if (board.phase !== 'landed') return false;
  return true;
}

function resolveContinue(board) {
  if (!requireLanded(board)) return { ok: false, error: 'No landing to resolve.' };
  advanceTurn(board);
  return { ok: true };
}

function skipAsset(board) {
  if (!requireLanded(board)) return { ok: false, error: 'No landing to resolve.' };
  const cur = currentTeam(board);
  pushLog(board, `${cur.name} skipped purchasing ${tileById(board.lastTile).name}`);
  advanceTurn(board);
  return { ok: true };
}

function buyAsset(board) {
  if (!requireLanded(board)) return { ok: false, error: 'No landing to resolve.' };
  const cur = currentTeam(board);
  const tile = tileById(board.lastTile);
  if (tile.zone !== 'asset' || board.tileOwners[tile.id] != null) return { ok: false, error: 'Not purchasable.' };
  if (cur.cyberCredits < tile.cost) return { ok: false, error: 'Not enough credits.' };
  cur.cyberCredits -= tile.cost;
  cur.assets.push(tile.id);
  board.tileOwners[tile.id] = cur.id;
  pushLog(board, `${cur.name} bought ${tile.name} for ${tile.cost} CC`);
  advanceTurn(board);
  return { ok: true };
}

function payFee(board) {
  if (!requireLanded(board)) return { ok: false, error: 'No landing to resolve.' };
  const cur = currentTeam(board);
  const tile = tileById(board.lastTile);
  const ownerIdx = board.tileOwners[tile.id];
  if (ownerIdx == null) return { ok: false, error: 'Tile has no owner.' };
  const owner = board.teams[ownerIdx];
  cur.cyberCredits -= tile.fee;
  owner.cyberCredits += tile.fee;
  pushLog(board, `${cur.name} paid ${tile.fee} CC to ${owner.name} (${tile.name})`);
  advanceTurn(board);
  return { ok: true };
}

function startDuel(board) {
  if (!requireLanded(board)) return { ok: false, error: 'No landing to resolve.' };
  const cur = currentTeam(board);
  const tile = tileById(board.lastTile);
  const ownerIdx = board.tileOwners[tile.id];
  if (ownerIdx == null) return { ok: false, error: 'This tile has no owner to duel.' };
  const q = pickQuiz();
  const { correctIndex, ...safeQuiz } = q;
  board.activeDuel = {
    ...safeQuiz,
    visitorTeamId: cur.id,
    ownerTeamId: ownerIdx,
    deadline: Date.now() + DUEL_TIME_LIMIT_MS,
    submissions: {},
  };
  board.__activeDuelAnswer = correctIndex;
  touch(board);
  return { ok: true };
}

function resolveDuel(board, visitorWins) {
  if (!requireLanded(board)) return { ok: false, error: 'No landing to resolve.' };
  const cur = currentTeam(board);
  const tile = tileById(board.lastTile);
  const ownerIdx = board.tileOwners[tile.id];
  const owner = board.teams[ownerIdx];
  if (visitorWins) {
    owner.reputation = Math.max(0, owner.reputation - 5);
    pushLog(board, `${cur.name} won the Cyber Duel vs ${owner.name} \u2014 fee waived`);
  } else {
    const doubled = Math.round(tile.fee * 1.5);
    cur.cyberCredits -= doubled;
    owner.cyberCredits += doubled;
    pushLog(board, `${owner.name} won the Cyber Duel vs ${cur.name} \u2014 paid ${doubled} CC`);
  }
  board.lastMessage = '';
  advanceTurn(board);
  return { ok: true };
}

function resolveActiveDuelInternal(board) {
  const duel = board.activeDuel;
  if (!duel) return;
  const correctIndex = board.__activeDuelAnswer;
  const visitorSub = duel.submissions[duel.visitorTeamId];
  const ownerSub = duel.submissions[duel.ownerTeamId];
  const visitorCorrect = !!visitorSub && visitorSub.answerIndex === correctIndex && visitorSub.at <= duel.deadline;
  const ownerCorrect = !!ownerSub && ownerSub.answerIndex === correctIndex && ownerSub.at <= duel.deadline;
  let visitorWins;
  if (visitorCorrect && !ownerCorrect) visitorWins = true;
  else if (!visitorCorrect && ownerCorrect) visitorWins = false;
  else if (visitorCorrect && ownerCorrect) visitorWins = visitorSub.at <= ownerSub.at;
  else visitorWins = false; // both wrong or both missed -> defender keeps ground
  board.activeDuel = null;
  delete board.__activeDuelAnswer;
  resolveDuel(board, visitorWins);
}

function submitDuelAnswer(board, teamId, answerIndex) {
  if (!board.activeDuel) return { ok: false, error: 'No active duel on this board.' };
  const duel = board.activeDuel;
  if (teamId !== duel.visitorTeamId && teamId !== duel.ownerTeamId) {
    return { ok: false, error: 'Your team is not part of this duel.' };
  }
  if (duel.submissions[teamId]) return { ok: false, error: 'Your team already answered.' };
  duel.submissions[teamId] = { answerIndex, at: Date.now() };
  touch(board);
  if (duel.submissions[duel.visitorTeamId] && duel.submissions[duel.ownerTeamId]) {
    resolveActiveDuelInternal(board);
  }
  return { ok: true };
}

function expireDuel(board) {
  if (!board.activeDuel) return { ok: false, error: 'No active duel to expire.' };
  resolveActiveDuelInternal(board);
  return { ok: true };
}

function challengeResult(board, passed) {
  if (!requireLanded(board)) return { ok: false, error: 'No landing to resolve.' };
  const cur = currentTeam(board);
  if (passed) {
    cur.cyberCredits += 75;
    pushLog(board, `${cur.name} passed the Challenge Hub puzzle (+75 CC)`);
  } else {
    pushLog(board, `${cur.name} attempted the Challenge Hub puzzle \u2014 no reward this time`);
  }
  advanceTurn(board);
  return { ok: true };
}

function checkpointResult(board, passed) {
  if (!requireLanded(board)) return { ok: false, error: 'No landing to resolve.' };
  const cur = currentTeam(board);
  if (passed) {
    cur.securityScore += 10;
    pushLog(board, `${cur.name} passed the Security Checkpoint puzzle (+10 Security)`);
  } else {
    pushLog(board, `${cur.name} attempted the Security Checkpoint puzzle \u2014 no boost this time`);
  }
  advanceTurn(board);
  return { ok: true };
}

/* Security upgrades are no longer installed through an in-app quiz — teams
   install them by visiting the Security Checkpoint department in person.
   The UPGRADES catalog is still exported so the client can show what's
   available and what it costs/boosts. */

function adjustStat(board, key, delta) {
  const cur = currentTeam(board);
  if (key === 'cc') cur.cyberCredits = Math.max(0, cur.cyberCredits + delta);
  else if (key === 'sec') cur.securityScore = Math.max(0, cur.securityScore + delta);
  else if (key === 'rep') cur.reputation = Math.max(0, cur.reputation + delta);
  else return { ok: false, error: 'Unknown stat.' };
  pushLog(board, `GM adjusted ${cur.name}: ${key} ${delta > 0 ? '+' : ''}${delta}`);
  touch(board);
  return { ok: true };
}

function endTurnManual(board) {
  if (board.finished) return { ok: false, error: 'Board finished.' };
  advanceTurn(board);
  return { ok: true };
}

function renameTeam(board, teamId, name) {
  const team = board.teams.find(t => t.id === teamId);
  if (!team) return { ok: false, error: 'Unknown team.' };
  const trimmed = String(name || '').trim().slice(0, 40);
  if (!trimmed) return { ok: false, error: 'Empty name.' };
  team.name = trimmed;
  touch(board);
  return { ok: true };
}

module.exports = {
  NUM_TILES, TILES, TILE_GRID, TEAM_COLORS, UPGRADES, MOVE_CARDS,
  PASS_START_BONUS, START_CREDITS, START_SECURITY, START_REPUTATION,
  QUIZ_TIME_LIMIT_MS, DUEL_TIME_LIMIT_MS,
  tileById, defaultConfig, defaultTeam, defaultBoard, companyValue, pushLog,
  currentTeam, advanceTurn,
  rollAndMove, resolveContinue, skipAsset, buyAsset, payFee,
  startDuel, resolveDuel, submitDuelAnswer, expireDuel,
  challengeResult, checkpointResult,
  adjustStat, endTurnManual, renameTeam,
};
