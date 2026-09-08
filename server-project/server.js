/* ============================================================
   CYBER MONOPOLY — REAL-TIME SERVER
   Run with: node server.js
   Then open http://<this-machine's-LAN-IP>:3000 on any device
   on the same WiFi. No internet or Claude dependency required.
   ============================================================ */

const path = require('path');
const fs = require('fs');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const GE = require('./gameEngine');

const PORT = process.env.PORT || 3000;
const STATE_FILE = path.join(__dirname, 'gamestate.json');
const SAVE_DEBOUNCE_MS = 400;

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

/* ---------------- state load / persist ---------------- */

let state = loadState();

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.config) {
        console.log('[state] loaded from disk \u2014', Object.keys(parsed.boards || {}).length, 'boards');
        return parsed;
      }
    }
  } catch (e) {
    console.error('[state] failed to load, starting fresh:', e.message);
  }
  return { config: GE.defaultConfig(), boards: {} };
}

let saveTimer = null;
function saveState() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(state), 'utf8');
    } catch (e) {
      console.error('[state] SAVE FAILED:', e.message);
    }
  }, SAVE_DEBOUNCE_MS);
}

// crash safety: never let one bad request kill the process
process.on('uncaughtException', (err) => console.error('[uncaughtException]', err));
process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));

/* ---------------- helpers ---------------- */

function board(n) { return state.boards[n]; }

function boardSummary(n) {
  const b = board(n);
  if (!b) return null;
  return b;
}

function sanitizeBoardForBroadcast(b) {
  if (!b) return b;
  const safe = {};
  for (const k of Object.keys(b)) {
    if (!k.startsWith('__')) safe[k] = b[k];
  }
  // team.pin must never reach a client that has only verified the BOARD pin —
  // team access is gated separately, so it can't ride along on the board broadcast.
  safe.teams = safe.teams.map(t => { const { pin, ...rest } = t; return rest; });
  return safe;
}

function broadcastBoard(n) {
  const b = board(n);
  if (b) io.to(`board-${n}`).emit('board:update', sanitizeBoardForBroadcast(b));
  broadcastLeaderboard();
}

function broadcastConfig() {
  io.emit('config:update', state.config);
}

function broadcastLeaderboard() {
  const teams = [];
  Object.values(state.boards).forEach(b => {
    b.teams.forEach(t => teams.push({ ...t, boardNum: b.boardNum, cv: GE.companyValue(t) }));
  });
  teams.sort((a, c) => c.cv - a.cv);
  io.to('leaderboard').emit('leaderboard:update', { teams, config: state.config });
  io.to('admin').emit('admin:overview', { config: state.config, boards: state.boards });
}

function pushGlobalFeed(boardNum, msg) {
  state.globalFeed = state.globalFeed || [];
  state.globalFeed.unshift({ boardNum, msg, t: Date.now() });
  state.globalFeed = state.globalFeed.slice(0, 25);
  io.to('leaderboard').emit('feed:update', state.globalFeed);
}

function scheduleDuelExpiry(n, duelRef, delayMs) {
  setTimeout(() => {
    const b = board(n);
    if (!b || b.activeDuel !== duelRef) return; // already resolved, board reset, or turn moved on
    const res = GE.expireDuel(b);
    if (res && res.ok) {
      saveState();
      if (b.log && b.log[0]) pushGlobalFeed(n, b.log[0].msg);
      broadcastBoard(n);
    }
  }, delayMs);
}

function requireInit(socket) {
  if (!state.config.initialized) {
    socket.emit('error:msg', 'Event has not been initialized yet.');
    return false;
  }
  return true;
}

/* ---------------- socket handling ---------------- */

io.on('connection', (socket) => {
  socket.verifiedBoards = new Set();
  socket.verifiedTeams = new Set(); // keys like "1:0" = boardNum:teamId
  socket.isAdmin = false;
  socket.emit('meta', { TILES: GE.TILES, TILE_GRID: GE.TILE_GRID, UPGRADES: GE.UPGRADES, TEAM_COLORS: GE.TEAM_COLORS, NUM_TILES: GE.NUM_TILES });
  socket.emit('config:update', state.config);

  socket.on('board:verifyPin', ({ boardNum, pin }, cb) => {
    const b = board(boardNum);
    if (!b) { if (typeof cb === 'function') cb({ ok: false, reason: 'not_found' }); return; }
    const ok = String(pin || '').trim() === String(b.pin);
    if (ok) socket.verifiedBoards.add(Number(boardNum));
    if (typeof cb === 'function') cb({ ok });
  });

  socket.on('team:verifyPin', ({ boardNum, teamId, pin }, cb) => {
    const b = board(boardNum);
    if (!b) { if (typeof cb === 'function') cb({ ok: false, reason: 'not_found' }); return; }
    const team = b.teams.find(t => t.id === Number(teamId));
    if (!team) { if (typeof cb === 'function') cb({ ok: false, reason: 'not_found' }); return; }
    const ok = String(pin || '').trim() === String(team.pin);
    if (ok) socket.verifiedTeams.add(`${Number(boardNum)}:${Number(teamId)}`);
    if (typeof cb === 'function') cb({ ok });
  });

  socket.on('join:admin', () => {
    if (!socket.isAdmin) { socket.emit('error:msg', 'Admin login required.'); return; }
    socket.join('admin');
    socket.emit('admin:overview', { config: state.config, boards: state.boards });
  });

  socket.on('join:leaderboard', () => {
    socket.join('leaderboard');
    broadcastLeaderboard();
    socket.emit('feed:update', state.globalFeed || []);
  });

  socket.on('join:board', (n) => {
    n = Number(n);
    if (!socket.verifiedBoards.has(n)) { socket.emit('error:msg', 'Enter the board PIN first.'); return; }
    socket.join(`board-${n}`);
    const b = board(n);
    socket.emit('board:update', b ? sanitizeBoardForBroadcast(b) : null);
  });

  socket.on('admin:login', (password, cb) => {
    const ok = password === (state.config.adminPassword || 'acn2026');
    if (ok) socket.isAdmin = true;
    if (typeof cb === 'function') cb({ ok });
  });

  function requireAdmin(socket) {
    if (!socket.isAdmin) { socket.emit('error:msg', 'Admin login required.'); return false; }
    return true;
  }

  socket.on('admin:saveSettings', (payload) => {
    if (!requireAdmin(socket)) return;
    state.config = {
      ...state.config,
      eventName: payload.eventName || state.config.eventName,
      numBoards: clamp(payload.numBoards, 1, 8),
      teamsPerBoard: clamp(payload.teamsPerBoard, 2, 4),
      numRounds: clamp(payload.numRounds, 3, 15),
      stage: clamp(payload.stage, 1, 3),
      adminPassword: payload.adminPassword || state.config.adminPassword,
      updatedAt: Date.now(),
    };
    saveState();
    broadcastConfig();
  });

  socket.on('admin:initialize', (payload) => {
    if (!requireAdmin(socket)) return;
    state.config = {
      ...state.config,
      eventName: payload.eventName || state.config.eventName,
      numBoards: clamp(payload.numBoards, 1, 8),
      teamsPerBoard: clamp(payload.teamsPerBoard, 2, 4),
      numRounds: clamp(payload.numRounds, 3, 15),
      stage: clamp(payload.stage, 1, 3),
      adminPassword: payload.adminPassword || state.config.adminPassword,
      status: 'live',
      initialized: true,
      updatedAt: Date.now(),
    };
    state.boards = {};
    for (let i = 1; i <= state.config.numBoards; i++) {
      state.boards[i] = GE.defaultBoard(i, state.config.teamsPerBoard, state.config.numRounds, state.config.stage);
    }
    saveState();
    broadcastConfig();
    for (let i = 1; i <= state.config.numBoards; i++) broadcastBoard(i);
    console.log(`[admin] event initialized: ${state.config.numBoards} boards x ${state.config.teamsPerBoard} teams`);
  });

  socket.on('admin:setStatus', (status) => {
    if (!requireAdmin(socket)) return;
    if (!['lobby', 'live', 'final_crisis', 'ended'].includes(status)) return;
    state.config.status = status;
    state.config.updatedAt = Date.now();
    saveState();
    broadcastConfig();
    console.log(`[admin] status -> ${status}`);
  });

  socket.on('admin:resetBoard', (n) => {
    if (!requireAdmin(socket)) return;
    if (!requireInit(socket)) return;
    state.boards[n] = GE.defaultBoard(n, state.config.teamsPerBoard, state.config.numRounds, state.config.stage);
    saveState();
    broadcastBoard(n);
  });

  socket.on('admin:renameTeam', ({ boardNum, teamId, name }) => {
    if (!requireAdmin(socket)) return;
    const b = board(boardNum);
    if (!b) return;
    const res = GE.renameTeam(b, teamId, name);
    if (res.ok) { saveState(); broadcastBoard(boardNum); }
  });

  /* ---- player actions (must be that team's turn) ---- */

  const playerAction = (event, fn, afterFn) => {
    socket.on(event, (payload) => {
      const n = Number(payload && payload.boardNum);
      const teamId = Number(payload && payload.teamId);
      if (!socket.verifiedBoards.has(n)) { socket.emit('error:msg', 'Enter the board PIN first.'); return; }
      if (!socket.verifiedTeams.has(`${n}:${teamId}`)) { socket.emit('error:msg', "Enter your team's PIN first."); return; }
      const b = board(n);
      if (!b) { socket.emit('error:msg', `Board ${n} not found.`); return; }
      if (b.finished) { socket.emit('error:msg', 'This board has finished.'); return; }
      if (payload.teamId !== b.currentTeamIndex) {
        socket.emit('error:msg', `It's not your team's turn yet.`);
        return;
      }
      const res = fn(b, payload);
      if (!res || res.ok === false) { socket.emit('error:msg', (res && res.error) || 'Action failed.'); return; }
      saveState();
      if (b.log && b.log[0] && b.log[0].t >= Date.now() - 200) pushGlobalFeed(n, b.log[0].msg);
      broadcastBoard(n);
      if (typeof afterFn === 'function') afterFn(b, n);
    });
  };

  playerAction('player:roll', (b) => GE.rollAndMove(b));
  playerAction('player:continue', (b) => GE.resolveContinue(b));
  playerAction('player:skip', (b) => GE.skipAsset(b));
  playerAction('player:buy', (b) => GE.buyAsset(b));
  playerAction('player:payFee', (b) => GE.payFee(b));
  playerAction('player:startDuel', (b) => GE.startDuel(b), (b, n) => {
    if (b.activeDuel) scheduleDuelExpiry(n, b.activeDuel, GE.DUEL_TIME_LIMIT_MS + 800);
  });
  playerAction('player:endTurn', (b) => GE.endTurnManual(b));

  /* ---- duel answers: BOTH the visitor and the defending owner may answer,
     even though only the visitor "owns" the current global turn ---- */
  socket.on('player:duelAnswer', (payload) => {
    const n = Number(payload && payload.boardNum);
    const teamId = Number(payload && payload.teamId);
    if (!socket.verifiedBoards.has(n)) { socket.emit('error:msg', 'Enter the board PIN first.'); return; }
    if (!socket.verifiedTeams.has(`${n}:${teamId}`)) { socket.emit('error:msg', "Enter your team's PIN first."); return; }
    const b = board(n);
    if (!b) { socket.emit('error:msg', `Board ${n} not found.`); return; }
    const res = GE.submitDuelAnswer(b, teamId, payload.answerIndex);
    if (!res || res.ok === false) { socket.emit('error:msg', (res && res.error) || 'Action failed.'); return; }
    saveState();
    if (b.log && b.log[0] && b.log[0].t >= Date.now() - 200) pushGlobalFeed(n, b.log[0].msg);
    broadcastBoard(n);
  });

  /* ---- game master actions: judgment + corrections only ---- */

  const gmAction = (event, fn) => {
    socket.on(event, (payload) => {
      const n = Number(payload && payload.boardNum);
      if (!socket.verifiedBoards.has(n)) { socket.emit('error:msg', 'Enter the board PIN first.'); return; }
      const b = board(n);
      if (!b) { socket.emit('error:msg', `Board ${n} not found.`); return; }
      const res = fn(b, payload);
      if (!res || res.ok === false) {
        socket.emit('error:msg', (res && res.error) || 'Action failed.');
        return;
      }
      saveState();
      if (b.log && b.log[0] && b.log[0].t >= Date.now() - 200) pushGlobalFeed(n, b.log[0].msg);
      broadcastBoard(n);
    });
  };

  gmAction('gm:challengePass', (b) => GE.challengeResult(b, true));
  gmAction('gm:challengeFail', (b) => GE.challengeResult(b, false));
  gmAction('gm:checkpointPass', (b) => GE.checkpointResult(b, true));
  gmAction('gm:checkpointFail', (b) => GE.checkpointResult(b, false));
  gmAction('gm:adjust', (b, p) => GE.adjustStat(b, p.key, p.delta));
  gmAction('gm:endTurn', (b) => GE.endTurnManual(b));

  socket.on('gm:getChallengeAnswer', (payload, cb) => {
    const n = Number(payload && payload.boardNum);
    if (!socket.verifiedBoards.has(n)) { if (typeof cb === 'function') cb({ ok: false, error: 'Enter the board PIN first.' }); return; }
    const b = board(n);
    if (!b || !b.activeChallenge || !b.__activeChallengeAnswer) {
      if (typeof cb === 'function') cb({ ok: false, error: 'No active challenge on this board.' });
      return;
    }
    if (typeof cb === 'function') cb({ ok: true, answer: b.__activeChallengeAnswer });
  });

  socket.on('disconnect', () => {});
});

function clamp(n, lo, hi) { n = Number(n); return Math.max(lo, Math.min(hi, isNaN(n) ? lo : n)); }

/* ---------------- boot ---------------- */

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\nCyber Monopoly server running.`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://<this-machine-IP>:${PORT}  (find IP with 'ipconfig' / 'ifconfig')\n`);
});
