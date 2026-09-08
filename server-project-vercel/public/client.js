/* ============================================================
   CYBER MONOPOLY — VERCEL + SUPABASE CLIENT
   Thin renderer, same shape as the original Socket.io client: never
   mutates game state itself, sends intents to /api/* routes, re-renders
   whenever a Supabase Realtime Broadcast message pushes a fresh board.
   ============================================================ */

(function () {
  const root = document.getElementById('app');

  const META = { TILES: [], TILE_GRID: [], UPGRADES: [], TEAM_COLORS: [], NUM_TILES: 24 };
  let config = null;
  let connected = false;
  let supa = null;

  const view = {
    screen: 'boot', boardNum: null, teamIdx: null,
    boardPin: null, teamPin: null, boardChannelName: null,
    adminPassword: null,
    gmBoard: null, teamBoard: null, teamPickerBoard: null,
    lbData: null, adminData: null,
    prevIsTurn: null, feed: [], diceAnimating: false,
  };

  /* ---------------- tiny fetch helpers ---------------- */

  async function apiGet(path) {
    try {
      const r = await fetch(path);
      return await r.json();
    } catch (e) { return { ok: false, error: 'Network error.' }; }
  }
  async function api(path, body) {
    try {
      const r = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
      });
      return await r.json();
    } catch (e) { return { ok: false, error: 'Network error.' }; }
  }

  /* ---------------- Supabase Realtime channels ---------------- */

  const channels = {}; // name -> { ch, dispatch }

  function ensureChannel(name, onMessage) {
    if (channels[name]) { channels[name].dispatch = onMessage; return channels[name].ch; }
    const ch = supa.channel(name);
    const state = { ch, dispatch: onMessage };
    channels[name] = state;
    ch.on('broadcast', { event: '*' }, (msg) => {
      if (state.dispatch) state.dispatch(msg.event, msg.payload);
    });
    ch.subscribe((status) => {
      const wasConnected = connected;
      connected = status === 'SUBSCRIBED';
      if (connected !== wasConnected) rerenderConnBadge();
    });
    return ch;
  }

  function rerenderConnBadge() {
    const el = root.querySelector('.conn');
    if (el) el.outerHTML = connBadge();
  }

  /* ---------------- utils ---------------- */

  const STAGE_LABELS = { 1: 'Preliminary', 2: 'Semifinal', 3: 'Final' };

  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function fmt(n) { return Number(n).toLocaleString('en-IN'); }
  function tileById(id) { return META.TILES.find(t => t.id === id); }
  function companyValue(team) {
    const assetRevenue = team.assets.reduce((sum, tid) => { const t = tileById(tid); return sum + (t ? t.revenue : 0); }, 0);
    return Math.round(team.cyberCredits + team.securityScore * 10 + team.reputation * 20 + assetRevenue * 5);
  }

  function connBadge() {
    return `<span class="conn ${connected ? 'ok' : 'bad'}">${connected ? '● LIVE' : '● RECONNECTING…'}</span>`;
  }

  function topControls() {
    return `${connBadge()}<button class="sound-toggle" data-action="toggle-sound" title="Toggle sound" type="button">${SFX.isMuted() ? '🔇' : '🔊'}</button>`;
  }

  /* ---------------- sound engine (synthesized, no audio files) ---------------- */

  const SFX = (function () {
    let ctx = null;
    let muted = false;
    try { muted = localStorage.getItem('cm_muted') === '1'; } catch (e) {}

    function getCtx() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      }
      if (ctx && ctx.state === 'suspended') ctx.resume();
      return ctx;
    }

    function tone(freq, dur, type, gainPeak, delay) {
      if (muted) return;
      const c = getCtx();
      if (!c) return;
      const t0 = c.currentTime + (delay || 0);
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(gainPeak || 0.18, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    }

    return {
      isMuted: () => muted,
      toggle() {
        muted = !muted;
        try { localStorage.setItem('cm_muted', muted ? '1' : '0'); } catch (e) {}
        if (!muted) getCtx();
        return muted;
      },
      diceTick() { tone(520 + Math.random() * 180, 0.05, 'square', 0.08); },
      diceLand() { tone(220, 0.18, 'triangle', 0.22); tone(440, 0.14, 'triangle', 0.14, 0.03); },
      coin() { tone(1046, 0.09, 'square', 0.15); tone(1568, 0.12, 'square', 0.13, 0.07); },
      success() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'triangle', 0.16, i * 0.06)); },
      fail() { tone(220, 0.22, 'sawtooth', 0.14); tone(160, 0.28, 'sawtooth', 0.12, 0.08); },
      whoosh() { tone(200, 0.22, 'sine', 0.08); tone(700, 0.18, 'sine', 0.06, 0.05); },
      turnPop() { [392, 523, 659].forEach((f, i) => tone(f, 0.2, 'triangle', 0.15, i * 0.07)); },
      duel() { tone(150, 0.3, 'sawtooth', 0.16); tone(110, 0.35, 'sawtooth', 0.14, 0.1); },
    };
  })();

  /* ---------------- confetti / particle bursts ---------------- */

  function burst(originEl, opts) {
    if (!originEl) return;
    const rect = originEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const count = (opts && opts.count) || 18;
    const colors = (opts && opts.colors) || ['#a8752c', '#0d7d90', '#b23b3a', '#187a42', '#e6c878'];
    const layer = document.createElement('div');
    layer.className = 'fx-layer';
    document.body.appendChild(layer);
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'fx-particle';
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const dist = 60 + Math.random() * 90;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 30;
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', dx + 'px');
      p.style.setProperty('--dy', dy + 'px');
      p.style.animationDelay = (Math.random() * 0.08) + 's';
      layer.appendChild(p);
    }
    setTimeout(() => layer.remove(), 1000);
  }

  function emojiPop(originEl, emoji) {
    if (!originEl) return;
    const rect = originEl.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'fx-emoji';
    el.textContent = emoji;
    el.style.left = (rect.left + rect.width / 2) + 'px';
    el.style.top = rect.top + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  function toast(msg) {
    if (!msg) return;
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 3200);
  }

  function toastIfError(res) { if (res && res.ok === false) toast(res.error || 'Action failed.'); return res; }

  function rerender() {
    if (view.screen === 'roleSelect') showRoleSelect();
    else if (view.screen === 'admin') renderAdmin();
    else if (view.screen === 'gm') renderGM();
    else if (view.screen === 'team') renderTeam();
    else if (view.screen === 'display') renderLeaderboard();
    else rerenderConnBadge();
  }

  /* ---------------- boot ---------------- */

  root.innerHTML = `<div class="wrap center"><div class="loading">Connecting to server…</div></div>`;

  async function boot() {
    const cfgRes = await apiGet('/api/config');
    if (!cfgRes.ok) { root.innerHTML = `<div class="wrap center"><div class="empty">Could not reach the server. Refresh to retry.</div></div>`; return; }
    config = cfgRes.config;
    supa = window.supabase.createClient(cfgRes.supabaseUrl, cfgRes.supabaseAnonKey);
    ensureChannel(cfgRes.channel, (event, payload) => {
      if (event === 'config:update') {
        config = payload;
        if (view.screen === 'admin' || view.screen === 'roleSelect') rerender();
      }
    });

    const metaRes = await apiGet('/api/meta');
    if (metaRes.ok) Object.assign(META, metaRes);
    showRoleSelect();
  }
  boot();

  /* ---------------- role select ---------------- */

  function showRoleSelect() {
    view.screen = 'roleSelect';
    root.innerHTML = `
      <div class="wrap center">
        <div class="brand">
          <div class="brand-eyebrow">AMRITA CYBER NATION — ACN 2026</div>
          <h1 class="brand-title">CYBER<span class="accent-gold">MONOPOLY</span></h1>
          <div class="brand-sub">BUILD. DEFEND. CONQUER.</div>
          <div style="margin-top:14px">${topControls()}</div>
        </div>
        <div class="role-grid">
          <button class="role-card" data-role="admin">
            <div class="role-icon">⚙️</div>
            <div class="role-name">Admin Control</div>
            <div class="role-desc">Set up boards, teams &amp; run the event</div>
          </button>
          <button class="role-card" data-role="gm">
            <div class="role-icon">🎙️</div>
            <div class="role-name">Game Master</div>
            <div class="role-desc">Judge Duels &amp; Challenges, fix mistakes</div>
          </button>
          <button class="role-card" data-role="team">
            <div class="role-icon">🎮</div>
            <div class="role-name">Player</div>
            <div class="role-desc">Roll dice, buy assets, play your turn</div>
          </button>
          <button class="role-card" data-role="display">
            <div class="role-icon">🏆</div>
            <div class="role-name">Main Leaderboard</div>
            <div class="role-desc">Big-screen live ranking, all boards</div>
          </button>
        </div>
      </div>`;
    root.querySelectorAll('[data-role]').forEach(btn => {
      btn.addEventListener('click', () => {
        const role = btn.getAttribute('data-role');
        if (role === 'admin') renderAdminGate();
        else if (role === 'gm') renderBoardPicker('gm');
        else if (role === 'team') renderBoardPicker('team');
        else if (role === 'display') openLeaderboard();
      });
    });
  }

  function renderAdminGate() {
    view.screen = 'adminGate';
    root.innerHTML = `
      <div class="wrap center">
        <button class="back-btn" data-action="back">← Back</button>
        <h2 class="section-title">Admin access</h2>
        <form id="gateForm" class="gate-form">
          <input type="password" id="gatePw" placeholder="Admin password" autocomplete="off" />
          <button class="btn primary" type="submit">Enter</button>
        </form>
        <div id="gateErr" class="gate-err"></div>
      </div>`;
    root.querySelector('[data-action="back"]').addEventListener('click', showRoleSelect);
    root.querySelector('#gateForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pw = root.querySelector('#gatePw').value;
      const res = await api('/api/admin/login', { password: pw });
      if (res.ok) {
        view.adminPassword = pw;
        view.screen = 'admin';
        root.innerHTML = `<div class="wrap center"><div class="loading">Loading admin panel…</div></div>`;
        loadAdminOverview();
      } else {
        root.querySelector('#gateErr').textContent = 'Incorrect password. Try again.';
        root.querySelector('#gatePw').value = '';
        root.querySelector('#gatePw').focus();
      }
    });
    setTimeout(() => { const el = root.querySelector('#gatePw'); if (el) el.focus(); }, 50);
  }

  async function loadAdminOverview() {
    const res = await api('/api/admin/overview', { password: view.adminPassword });
    if (!res.ok) { toast(res.error); view.screen = 'roleSelect'; showRoleSelect(); return; }
    view.adminData = { config: res.config, boards: res.boards };
    if (view.screen === 'admin') renderAdmin();
  }

  function renderBoardPicker(nextRole) {
    view.screen = nextRole === 'gm' ? 'gmPicker' : 'teamBoardPicker';
    const n = (config && config.numBoards) || 8;
    let boardBtns = '';
    for (let i = 1; i <= n; i++) boardBtns += `<button class="pick-btn" data-board="${i}">Board ${i}</button>`;
    root.innerHTML = `
      <div class="wrap center">
        <button class="back-btn" data-action="back">← Back</button>
        <h2 class="section-title">${nextRole === 'gm' ? 'Select your board' : 'Select board to view'}</h2>
        <div class="pick-grid">${boardBtns}</div>
      </div>`;
    root.querySelector('[data-action="back"]').addEventListener('click', showRoleSelect);
    root.querySelectorAll('[data-board]').forEach(btn => {
      btn.addEventListener('click', () => {
        const b = Number(btn.getAttribute('data-board'));
        renderPinGate(b, nextRole);
      });
    });
  }

  function renderPinGate(boardNum, nextRole) {
    root.innerHTML = `
      <div class="wrap center">
        <button class="back-btn" data-action="back">← Back</button>
        <h2 class="section-title">Board ${boardNum} — enter PIN</h2>
        <div class="dim" style="margin-bottom:14px;max-width:340px;">Ask your Game Master or check your table card for the 4-digit PIN for this board.</div>
        <form id="pinForm" class="gate-form">
          <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" id="pinInput" placeholder="1234" autocomplete="off" />
          <button class="btn primary" type="submit">Enter</button>
        </form>
        <div id="pinErr" class="gate-err"></div>
      </div>`;
    root.querySelector('[data-action="back"]').addEventListener('click', () => renderBoardPicker(nextRole));
    root.querySelector('#pinForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pin = root.querySelector('#pinInput').value;
      const res = await api('/api/board/verify-pin', { boardNum, pin });
      if (res.ok) {
        view.boardNum = boardNum;
        view.boardPin = pin;
        view.boardChannelName = res.channel;
        if (nextRole === 'gm') {
          view.screen = 'gm';
          root.innerHTML = `<div class="wrap center"><div class="loading">Loading board ${boardNum}…</div></div>`;
          joinBoardChannel();
          loadBoardState();
        } else {
          renderTeamPicker(boardNum);
        }
      } else {
        root.querySelector('#pinErr').textContent = 'Incorrect PIN. Try again.';
        root.querySelector('#pinInput').value = '';
        root.querySelector('#pinInput').focus();
      }
    });
    setTimeout(() => { const el = root.querySelector('#pinInput'); if (el) el.focus(); }, 50);
  }

  /* One channel per board PIN, one dispatcher that routes to whichever
     screen is currently showing — same pattern as the original app's
     single consolidated socket.on('board:update', ...) listener. */
  function joinBoardChannel() {
    ensureChannel(view.boardChannelName, (event, payload) => {
      if (event !== 'board:update') return;
      if (!payload || payload.boardNum !== view.boardNum) return;
      if (view.screen === 'gm') { view.gmBoard = payload; renderGM(); }
      else if (view.screen === 'team') {
        if (view.diceAnimating && payload.phase === 'landed' && payload.lastDice != null && view.teamBoard) {
          const teamId = view.teamIdx;
          const fromPos = view.teamBoard.teams[teamId].position;
          const dice = payload.lastDice;
          // Keep showing the OLD board (old token position) under the still-spinning
          // die — don't touch view.teamBoard yet. Only once the die settles on the
          // real number do we walk the token forward one tile per pip.
          settleDiceSpinOn(dice, () => { walkTokenThenReveal(payload, teamId, fromPos, dice); });
        } else {
          view.teamBoard = payload;
          renderTeam();
        }
      }
      else if (view.screen === 'teamPicker') { view.teamPickerBoard = payload; renderTeamPickerBody(payload, view.boardNum); }
    });
  }

  /* Steps the rolling team's token one tile at a time from fromPos to its real
     landed position (NUM_TILES-wrapped), then swaps in the real final board
     (with activeChallenge/lastMessage/etc.) so the landed modal appears exactly
     when the token visually arrives — never before. */
  async function walkTokenThenReveal(finalBoard, teamId, fromPos, steps) {
    const numTiles = META.NUM_TILES;
    const walkBoard = { ...finalBoard, lastTile: null, teams: finalBoard.teams.map((t, i) => i === teamId ? { ...t } : t) };
    view.teamBoard = walkBoard;
    for (let i = 1; i <= steps; i++) {
      walkBoard.teams[teamId] = { ...walkBoard.teams[teamId], position: (fromPos + i) % numTiles };
      if (view.screen === 'team') renderTeam();
      SFX.diceTick();
      await new Promise((r) => setTimeout(r, 220));
    }
    view.teamBoard = finalBoard;
    view.diceAnimating = false;
    if (view.screen === 'team') renderTeam();
  }

  async function loadBoardState() {
    const res = await api('/api/board/state', { boardNum: view.boardNum, pin: view.boardPin });
    if (!res.ok) { toast(res.error); return; }
    if (view.screen === 'gm') { view.gmBoard = res.board; renderGM(); }
    else if (view.screen === 'team') { view.teamBoard = res.board; renderTeam(); }
    else if (view.screen === 'teamPicker') { view.teamPickerBoard = res.board; renderTeamPickerBody(res.board, view.boardNum); }
  }

  function renderTeamPicker(boardNum) {
    view.screen = 'teamPicker';
    view.boardNum = boardNum;
    root.innerHTML = `<div class="wrap center"><div class="loading">Loading board ${boardNum}…</div></div>`;
    joinBoardChannel();
    loadBoardState();
  }

  function renderTeamPickerBody(b, boardNum) {
    if (!b) {
      root.innerHTML = `
        <div class="wrap center">
          <button class="back-btn" data-action="back">← Back</button>
          <div class="empty">Board ${boardNum} hasn't been initialized yet. Ask Admin to set up the event.</div>
        </div>`;
      root.querySelector('[data-action="back"]').addEventListener('click', () => renderBoardPicker('team'));
      return;
    }
    let teamBtns = b.teams.map(t => `<button class="pick-btn" data-team="${t.id}" style="border-color:${t.color}">${esc(t.name)}</button>`).join('');
    root.innerHTML = `
      <div class="wrap center">
        <button class="back-btn" data-action="back">← Back</button>
        <h2 class="section-title">Board ${boardNum} — select your team</h2>
        <div class="pick-grid">${teamBtns}</div>
      </div>`;
    root.querySelector('[data-action="back"]').addEventListener('click', () => renderBoardPicker('team'));
    root.querySelectorAll('[data-team]').forEach(btn => {
      btn.addEventListener('click', () => {
        const teamId = Number(btn.getAttribute('data-team'));
        const team = b.teams.find(t => t.id === teamId);
        renderTeamPinGate(b, boardNum, teamId, team);
      });
    });
  }

  function renderTeamPinGate(b, boardNum, teamId, team) {
    view.screen = 'teamPinGate';
    root.innerHTML = `
      <div class="wrap center">
        <button class="back-btn" data-action="back">← Back</button>
        <h2 class="section-title" style="color:${team.color}">${esc(team.name)} — enter your team PIN</h2>
        <div class="dim" style="margin-bottom:14px;max-width:340px;">Only your team should have this 4-digit PIN. Ask your Game Master if you don't have it.</div>
        <form id="teamPinForm" class="gate-form">
          <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" id="teamPinInput" placeholder="1234" autocomplete="off" />
          <button class="btn primary" type="submit">Enter</button>
        </form>
        <div id="teamPinErr" class="gate-err"></div>
      </div>`;
    root.querySelector('[data-action="back"]').addEventListener('click', () => renderTeamPickerBody(b, boardNum));
    root.querySelector('#teamPinForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pin = root.querySelector('#teamPinInput').value;
      const res = await api('/api/board/verify-team-pin', { boardNum, teamId, pin });
      if (res.ok) {
        view.teamIdx = teamId;
        view.teamPin = pin;
        view.teamBoard = b;
        view.screen = 'team';
        view.prevIsTurn = null;
        view.diceAnimating = false;
        renderTeam();
      } else {
        root.querySelector('#teamPinErr').textContent = 'Incorrect PIN. Try again.';
        root.querySelector('#teamPinInput').value = '';
        root.querySelector('#teamPinInput').focus();
      }
    });
    setTimeout(() => { const el = root.querySelector('#teamPinInput'); if (el) el.focus(); }, 50);
  }

  /* ---------------- ADMIN ---------------- */

  function renderAdmin() {
    // Prefer the freshly-fetched admin overview (re-fetched after every admin
    // action) over the public `config` var, which only updates when a
    // config:update Realtime broadcast happens to have already arrived —
    // otherwise a just-completed action (e.g. Initialize Event) could
    // render stale until the next broadcast lands.
    const data = view.adminData || { config: config || {}, boards: {} };
    const cfg = data.config || config || {};
    const boards = data.boards || {};
    const overviewRows = cfg.initialized ? Array.from({ length: cfg.numBoards }, (_, i) => {
      const b = boards[i + 1];
      if (!b) return `<tr><td>Board ${i + 1}</td><td colspan="4" class="dim">not started</td></tr>`;
      const cur = b.teams[b.currentTeamIndex];
      const top = [...b.teams].sort((a, c) => companyValue(c) - companyValue(a))[0];
      return `<tr>
        <td>Board ${b.boardNum}${b.finished ? ' ✅' : ''}</td>
        <td>Round ${b.round}/${b.numRounds}</td>
        <td>${esc(cur ? cur.name : '—')}</td>
        <td>${esc(top.name)} — ${fmt(companyValue(top))} CV</td>
        <td><button class="mini-btn danger" data-reset-board="${b.boardNum}">Reset</button></td>
      </tr>`;
    }).join('') : '';

    root.innerHTML = `
      <div class="wrap">
        <div class="topbar">
          <button class="back-btn" data-action="back">← Back</button>
          <div class="topbar-title">ADMIN CONTROL</div>
          <button class="mini-btn" data-action="lock">🔒 Lock</button>
          ${topControls()}
        </div>

        <div class="panel">
          <h3>Event Setup</h3>
          <div class="form-grid">
            <label>Event name<input type="text" id="cfgName" value="${esc(cfg.eventName || '')}" /></label>
            <label>Boards (1–8)<input type="number" id="cfgBoards" min="1" max="8" value="${cfg.numBoards || 8}" /></label>
            <label>Teams per board (2–4)<input type="number" id="cfgTeams" min="2" max="4" value="${cfg.teamsPerBoard || 4}" /></label>
            <label>Rounds per match<input type="number" id="cfgRounds" min="3" max="15" value="${cfg.numRounds || 8}" /></label>
            <label>Tournament stage
              <select id="cfgStage" class="select">
                <option value="1" ${(cfg.stage || 1) === 1 ? 'selected' : ''}>1 — Preliminary (easy)</option>
                <option value="2" ${cfg.stage === 2 ? 'selected' : ''}>2 — Semifinal (medium)</option>
                <option value="3" ${cfg.stage === 3 ? 'selected' : ''}>3 — Final (hard)</option>
              </select>
            </label>
            <label>Admin password<input type="text" id="cfgPassword" value="${esc(cfg.adminPassword || 'acn2026')}" /></label>
          </div>
          <div class="dim" style="margin:8px 0 0;">Tournament stage picks which Challenge Hub / Security Checkpoint difficulty pool every board draws from for its <b>whole match</b> — it is separate from "Rounds per match" above (that's just how many turn-cycles one match lasts). Changing the stage only takes effect on the next Initialize Event.</div>
          <div class="btn-row" style="margin-top:12px;">
            <button class="btn primary" data-action="init">${cfg.initialized ? 'Re-initialize (reset ALL boards)' : 'Initialize Event'}</button>
            <button class="btn" data-action="save-cfg">Save Settings</button>
          </div>
        </div>

        <div class="panel">
          <h3>Event Status: <span class="status-pill status-${cfg.status || 'lobby'}">${(cfg.status || 'lobby').replace('_',' ').toUpperCase()}</span> <span class="status-pill" style="margin-left:6px;">${STAGE_LABELS[cfg.stage || 1]}</span></h3>
          <div class="btn-row">
            <button class="btn" data-action="status-lobby">Lobby</button>
            <button class="btn primary" data-action="status-live">Start / Resume Event</button>
            <button class="btn warn" data-action="status-crisis">🔥 Trigger Final Cyber Crisis</button>
            <button class="btn" data-action="status-ended">End Event</button>
          </div>
        </div>

        ${cfg.initialized ? `
        <div class="panel">
          <h3>Board Access PINs</h3>
          <div class="dim" style="margin-bottom:12px;">Hand these out on table cards or QR codes — a device needs the matching PIN before it can join that board as Game Master or Player. Resetting a board generates a new PIN.</div>
          <div class="pin-grid">
            ${Array.from({ length: cfg.numBoards }, (_, i) => {
              const b = boards[i + 1];
              if (!b) return '';
              return `<div class="pin-chip">Board ${b.boardNum}<span class="pin-code">${esc(b.pin)}</span></div>`;
            }).join('')}
          </div>
        </div>
        <div class="panel">
          <h3>Boards Overview</h3>
          <table class="table"><thead><tr><th>Board</th><th>Progress</th><th>Current Team</th><th>Leader</th><th></th></tr></thead>
          <tbody>${overviewRows}</tbody></table>
        </div>
        <div class="panel">
          <h3>Team Names &amp; PINs</h3>
          <div class="dim" style="margin-bottom:12px;">Each team needs its own PIN, separate from the board PIN — hand it only to that team, not the whole table.</div>
          ${Array.from({ length: cfg.numBoards }, (_, i) => {
            const b = boards[i + 1];
            if (!b) return '';
            return `<details class="team-edit-group"><summary>Board ${i + 1}</summary>
              <div class="form-grid">${b.teams.map(t => `<label>${t.id + 1} · PIN ${esc(t.pin)}<input type="text" class="team-name-input" data-board="${b.boardNum}" data-team="${t.id}" value="${esc(t.name)}" /></label>`).join('')}</div>
              <button class="btn small" data-save-names="${b.boardNum}">Save names</button></details>`;
          }).join('')}
        </div>` : `<div class="empty">Set the numbers above and click <b>Initialize Event</b> to create all boards.</div>`}
      </div>`;

    root.querySelector('[data-action="back"]').addEventListener('click', showRoleSelect);
    root.querySelector('[data-action="lock"]').addEventListener('click', showRoleSelect);

    root.querySelector('[data-action="save-cfg"]').addEventListener('click', async () => {
      const res = await api('/api/admin/save-settings', {
        password: view.adminPassword,
        eventName: root.querySelector('#cfgName').value,
        numBoards: root.querySelector('#cfgBoards').value,
        teamsPerBoard: root.querySelector('#cfgTeams').value,
        numRounds: root.querySelector('#cfgRounds').value,
        stage: root.querySelector('#cfgStage').value,
        adminPassword: root.querySelector('#cfgPassword').value,
      });
      if (res.ok) { toast('Settings saved.'); loadAdminOverview(); } else toast(res.error);
    });

    root.querySelector('[data-action="init"]').addEventListener('click', async () => {
      if (cfg.initialized && !confirm('This resets ALL boards and scores. Continue?')) return;
      const stageVal = Number(root.querySelector('#cfgStage').value);
      const res = await api('/api/admin/initialize', {
        password: view.adminPassword,
        eventName: root.querySelector('#cfgName').value,
        numBoards: root.querySelector('#cfgBoards').value,
        teamsPerBoard: root.querySelector('#cfgTeams').value,
        numRounds: root.querySelector('#cfgRounds').value,
        stage: stageVal,
        adminPassword: root.querySelector('#cfgPassword').value,
      });
      if (res.ok) { toast(`Event initialized — ${STAGE_LABELS[stageVal]} stage content is live.`); loadAdminOverview(); } else toast(res.error);
    });

    root.querySelectorAll('[data-reset-board]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const n = Number(btn.getAttribute('data-reset-board'));
        if (!confirm(`Reset Board ${n}? This wipes its teams' progress.`)) return;
        const res = await api('/api/admin/reset-board', { password: view.adminPassword, boardNum: n });
        if (res.ok) loadAdminOverview(); else toast(res.error);
      });
    });

    root.querySelectorAll('[data-save-names]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const n = Number(btn.getAttribute('data-save-names'));
        const inputs = root.querySelectorAll(`.team-name-input[data-board="${n}"]`);
        for (const inp of inputs) {
          await api('/api/admin/rename-team', { password: view.adminPassword, boardNum: n, teamId: Number(inp.getAttribute('data-team')), name: inp.value });
        }
        toast('Team names saved.');
        loadAdminOverview();
      });
    });

    const statusMap = { 'status-lobby': 'lobby', 'status-live': 'live', 'status-crisis': 'final_crisis', 'status-ended': 'ended' };
    Object.keys(statusMap).forEach(action => {
      const elm = root.querySelector(`[data-action="${action}"]`);
      if (elm) elm.addEventListener('click', async () => {
        const res = await api('/api/admin/set-status', { password: view.adminPassword, status: statusMap[action] });
        if (res.ok) loadAdminOverview(); else toast(res.error);
      });
    });
  }

  /* ---------------- GAME MASTER ---------------- */

  function renderGM() {
    const b = view.gmBoard;
    if (!b) {
      root.innerHTML = `
        <div class="wrap center">
          <button class="back-btn" data-action="back">← Back</button>
          <div class="empty">Board ${view.boardNum} not initialized yet. Ask Admin to initialize the event.</div>
        </div>`;
      root.querySelector('[data-action="back"]').addEventListener('click', () => renderBoardPicker('gm'));
      return;
    }
    const cur = b.teams[b.currentTeamIndex];
    const crisisBanner = config && config.status === 'final_crisis'
      ? `<div class="crisis-banner">🔥 FINAL CYBER CRISIS IN PROGRESS — a nation-state attack is testing every team's defenses</div>` : '';

    root.innerHTML = `
      <div class="wrap">
        <div class="topbar">
          <button class="back-btn" data-action="back">← Back</button>
          <div class="topbar-title">GAME MASTER — BOARD ${b.boardNum}</div>
          ${topControls()}
        </div>
        ${crisisBanner}
        <div class="gm-layout">
          <div class="board-col"><div class="board-wrap static-large">${renderBoardGrid(b)}</div></div>
          <div class="side-col">
            <div class="panel current-team-panel" style="--tc:${cur.color}">
              <div class="ct-head">
                <span class="ct-dot" style="background:${cur.color}"></span>
                <span class="ct-name">${esc(cur.name)}'s turn</span>
                <span class="ct-round">Round ${b.round}/${b.numRounds}</span>
              </div>
              <div class="ct-stats">
                <div class="stat"><div class="stat-label">💰 Credits</div><div class="stat-val">${fmt(cur.cyberCredits)}</div></div>
                <div class="stat"><div class="stat-label">🛡️ Security</div><div class="stat-val">${cur.securityScore}</div></div>
                <div class="stat"><div class="stat-label">⭐ Reputation</div><div class="stat-val">${cur.reputation}</div></div>
                <div class="stat"><div class="stat-label">🏢 Company Value</div><div class="stat-val">${fmt(companyValue(cur))}</div></div>
              </div>
            </div>
            ${renderJudgePanel(b, cur)}
            ${renderAdjustPanel(cur, b)}
            ${renderLogPanel(b)}
          </div>
        </div>
      </div>`;

    root.querySelector('[data-action="back"]').addEventListener('click', () => { view.screen = 'roleSelect'; showRoleSelect(); });
    wireGmActions(b);
  }

  function renderChallengeContent(challenge) {
    if (!challenge) return '<div class="dim">No challenge configured for this round yet — use your own judgment or backup material.</div>';
    const tasksHtml = challenge.tasks && challenge.tasks.length
      ? `<ol class="challenge-tasks">${challenge.tasks.map(t => `<li>${esc(t)}</li>`).join('')}</ol>`
      : '';
    return `<div class="challenge-card">
      <div class="challenge-title">${esc(challenge.title)}</div>
      <div class="challenge-difficulty">Difficulty: ${esc(challenge.difficulty || 'Medium')}</div>
      <pre class="challenge-scenario">${esc(challenge.scenario || '')}</pre>
      ${tasksHtml}
    </div>`;
  }

  function moveCardBannerHtml(b) {
    return b.moveCardBanner ? `<div class="move-card-banner">${esc(b.moveCardBanner)}</div>` : '';
  }

  function renderJudgePanel(b, cur) {
    if (b.finished) return `<div class="panel"><h3>Board Finished</h3><div class="dim">All ${b.numRounds} rounds complete. Final standings are live on the leaderboard.</div></div>`;
    if (b.activeDuel) {
      const visitor = b.teams[b.activeDuel.visitorTeamId];
      const owner = b.teams[b.activeDuel.ownerTeamId];
      const vDone = !!b.activeDuel.submissions[b.activeDuel.visitorTeamId];
      const oDone = !!b.activeDuel.submissions[b.activeDuel.ownerTeamId];
      return `<div class="panel"><h3>⚔️ Cyber Duel — live quiz race</h3>
        <div class="msg">${esc(visitor.name)} vs ${esc(owner.name)} — both are racing the same quiz on their own screens. This resolves automatically, nothing to judge.</div>
        <div class="duel-status-row"><span>${esc(visitor.name)}</span><span class="${vDone ? 'duel-done' : 'duel-waiting'}">${vDone ? '✅ Answered' : '⏳ Answering…'}</span></div>
        <div class="duel-status-row"><span>${esc(owner.name)}</span><span class="${oDone ? 'duel-done' : 'duel-waiting'}">${oDone ? '✅ Answered' : '⏳ Answering…'}</span></div>
      </div>`;
    }
    if (b.phase !== 'landed') {
      return `<div class="panel"><h3>Waiting</h3><div class="dim">${esc(cur.name)} is taking their turn on their own device. Nothing to judge right now.</div></div>`;
    }
    const tile = tileById(b.lastTile);
    if (tile.tag === 'challenge' || tile.tag === 'checkpoint' || tile.tag === 'incident') {
      const isCheckpoint = tile.tag === 'checkpoint';
      const label = isCheckpoint ? '🔐 Security Checkpoint' : (tile.tag === 'incident' ? '⚠️ Incident Zone' : '🛡️ Challenge Hub');
      const passAction = isCheckpoint ? 'checkpoint-pass' : 'challenge-pass';
      const failAction = isCheckpoint ? 'checkpoint-fail' : 'challenge-fail';
      const passLabel = isCheckpoint ? '✅ Team Passed (+10 Security)' : '✅ Team Passed (+75 CC)';
      return `<div class="panel">${moveCardBannerHtml(b)}<h3>${label} — needs a verdict</h3>
        <div class="msg">${esc(cur.name)} arrived here. Run the puzzle below, then record the result.</div>
        ${renderChallengeContent(b.activeChallenge)}
        <div class="btn-row" style="margin-top:12px;">
          <button class="btn" data-action="show-answer">🔑 Show Answer Key</button>
        </div>
        <div class="answer-key-box" data-answer-box style="display:none;"></div>
        <div class="btn-row" style="margin-top:14px;">
          <button class="btn primary" data-action="${passAction}">${passLabel}</button>
          <button class="btn" data-action="${failAction}">❌ Team Failed</button>
        </div></div>`;
    }
    return `<div class="panel"><h3>Waiting</h3><div class="dim">${esc(cur.name)} is resolving their own turn (${esc(tile.name)}). Nothing to judge right now.</div></div>`;
  }

  const TILE_COLOR_PALETTE = ['#8E5FB0', '#C9772F', '#3E8E5C', '#2E6FA8', '#B24A6B', '#5A8A3C', '#B0862F', '#4A6FB0'];

  function ludoToken(color, name, delayIndex) {
    const delay = (delayIndex || 0) * 0.15;
    return `<span class="ludo-token" style="animation-delay:${delay}s" title="${esc(name)}">
      <svg viewBox="0 0 24 34" width="100%" height="100%">
        <ellipse class="lt-shadow" cx="12" cy="30.5" rx="8.5" ry="2.4"/>
        <rect class="lt-base" x="4.5" y="22" width="15" height="5" rx="2.5" fill="${color}"/>
        <path class="lt-body" d="M12 5 C7.5 5 6.3 12.5 8.3 20 L15.7 20 C17.7 12.5 16.5 5 12 5 Z" fill="${color}"/>
        <circle class="lt-head" cx="12" cy="6.5" r="5.2" fill="${color}"/>
        <ellipse class="lt-shine" cx="10.2" cy="4.8" rx="1.6" ry="1.1" fill="rgba(255,255,255,0.55)"/>
      </svg>
    </span>`;
  }

  function renderBoardGrid(b, centerHtml) {
    const tiles = META.TILES.map(t => {
      const [col, row] = META.TILE_GRID[t.id];
      const ownerIdx = b.tileOwners[t.id];
      const owner = ownerIdx != null ? b.teams[ownerIdx] : null;
      const tokens = b.teams.filter(tm => tm.position === t.id).map((tm, i) => ludoToken(tm.color, tm.name, i)).join('');
      const highlighted = b.lastTile === t.id ? 'landed' : '';
      const accent = t.zone === 'asset' ? TILE_COLOR_PALETTE[t.id % TILE_COLOR_PALETTE.length] : null;
      const styleParts = [`grid-column:${col}`, `grid-row:${row}`];
      if (owner) styleParts.push(`--owner:${owner.color}`);
      if (accent) styleParts.push(`--tile-accent:${accent}`);
      return `<div class="tile tile-${t.zone} ${highlighted}" style="${styleParts.join(';')}">
        <div class="tile-icon">${t.icon}</div>
        <div class="tile-name">${esc(t.name)}</div>
        ${t.zone === 'asset' ? `<div class="tile-cost">${owner ? esc(owner.name) : fmt(t.cost) + ' CC'}</div>` : ''}
        <div class="tile-tokens">${tokens}</div>
      </div>`;
    }).join('');
    return `<div class="board-grid">
      <div class="board-center">${centerHtml || `<div class="board-center-title">CYBER<br/>MONOPOLY</div><div class="board-center-sub">Board ${b.boardNum}</div>`}</div>
      ${tiles}
    </div>`;
  }

  /* Community Chest / Chance no longer carry a quiz — just a message pointing
     the team to a department for the real challenges/tasks. */
  function renderCardQuiz(tile, b) {
    return `<div class="quiz-result-msg">${esc(b.lastMessage)}</div><button class="btn primary" data-action="continue">Continue</button>`;
  }

  function renderDuelModal(b, myTeamId) {
    const duel = b.activeDuel;
    const visitor = b.teams[duel.visitorTeamId];
    const owner = b.teams[duel.ownerTeamId];
    const mySubmitted = !!duel.submissions[myTeamId];
    const opponentId = myTeamId === duel.visitorTeamId ? duel.ownerTeamId : duel.visitorTeamId;
    const opponent = b.teams[opponentId];
    const opponentSubmitted = !!duel.submissions[opponentId];

    let innerHtml;
    if (mySubmitted) {
      innerHtml = `<div class="msg">Answer locked in! ${opponentSubmitted ? `Both answered — resolving…` : `Waiting for ${esc(opponent.name)}…`}</div>`;
    } else {
      const optsHtml = duel.options.map((opt, i) => `<button class="quiz-option" data-action="duel-answer" data-index="${i}">${esc(opt)}</button>`).join('');
      innerHtml = `<div class="quiz-question">${esc(duel.question)}</div><div class="quiz-options">${optsHtml}</div>`;
    }

    return `<div class="modal-backdrop">
      <div class="modal-card duel-card">
        <h3 class="modal-title">⚔️ CYBER DUEL</h3>
        <div class="duel-vs">${esc(visitor.name)} <span class="dim">vs</span> ${esc(owner.name)}</div>
        <div class="quiz-timer duel-timer" id="quizCountdown" data-deadline="${duel.deadline}">20s</div>
        ${innerHtml}
      </div>
    </div>`;
  }

  function renderReadyPanel(b) {
    if (b.finished) return `<div class="panel"><h3>Board Finished</h3><div class="dim">All ${b.numRounds} rounds complete. Final standings are live on the leaderboard.</div></div>`;
    return `<div class="panel"><h3>Your Turn</h3><div class="dim">Tap the dice in the center of the board to roll!</div></div>`;
  }

  function renderLandedModalBody(b, cur) {
    const tile = tileById(b.lastTile);
    let body = `<div class="dice-result">Rolled ${b.lastDice} → landed on <b>${esc(tile.name)}</b></div>`;
    body += moveCardBannerHtml(b);
    if (tile.tag === 'start') {
      body += `<div class="msg">${esc(b.lastMessage)}</div><button class="btn primary" data-action="continue">Continue</button>`;
    } else if (tile.tag === 'challenge' || tile.tag === 'checkpoint' || tile.tag === 'incident') {
      const label = tile.tag === 'checkpoint' ? 'Security Checkpoint' : (tile.tag === 'incident' ? 'Incident Zone' : 'Challenge Hub');
      body += `<div class="msg">You've reached the ${label}! Work through the puzzle below with your team — your Game Master will record the result.</div>`;
      body += renderChallengeContent(b.activeChallenge);
    } else if (tile.tag === 'chest' || tile.tag === 'chance') {
      body += renderCardQuiz(tile, b);
    } else if (tile.zone === 'asset') {
      const ownerIdx = b.tileOwners[tile.id];
      if (ownerIdx == null) {
        body += `<div class="msg">Cost: <b>${fmt(tile.cost)} CC</b> · Fee: ${fmt(tile.fee)} CC · Revenue: +${fmt(tile.revenue)} CC/round</div>
          <div class="btn-row">
            <button class="btn primary" data-action="buy" ${cur.cyberCredits < tile.cost ? 'disabled' : ''}>Buy (${fmt(tile.cost)} CC)</button>
            <button class="btn" data-action="skip">Skip</button>
          </div>`;
      } else if (ownerIdx === cur.id) {
        body += `<div class="msg">This is your own asset.</div><button class="btn primary" data-action="continue">Continue</button>`;
      } else {
        const owner = b.teams[ownerIdx];
        body += `<div class="msg">Owned by <b style="color:${owner.color}">${esc(owner.name)}</b> · Fee: ${fmt(tile.fee)} CC</div>
          <div class="btn-row">
            <button class="btn primary" data-action="pay-fee">Pay ${fmt(tile.fee)} CC</button>
            <button class="btn warn" data-action="duel">⚔️ Cyber Duel</button>
          </div>`;
      }
    }
    return body;
  }

  /* Security upgrades are no longer purchased through an in-app quiz — teams
     install them by visiting the Security Checkpoint department in person.
     This panel just lists what's still available on their owned assets. */
  function renderUpgradePanel(b, cur) {
    if (b.finished || !cur.assets.length) return '';
    const opts = [];
    cur.assets.forEach(tid => {
      const owned = cur.upgrades[tid] || [];
      META.UPGRADES.forEach(u => { if (!owned.includes(u.key)) opts.push(`${tileById(tid).name} — ${u.name} (${u.cost} CC, +${u.boost} sec)`); });
    });
    if (!opts.length) return `<div class="panel"><h3>Security Upgrades</h3><div class="dim">All owned assets are fully upgraded.</div></div>`;
    return `<div class="panel"><h3>Security Upgrades</h3>
      <div class="dim">Visit the Security Checkpoint department in person to get a security upgrade installed on your assets!</div>
      <div class="upgrade-tags" style="margin-top:8px;">${opts.map(o => `<span class="tag">${esc(o)}</span>`).join('')}</div></div>`;
  }

  function renderAdjustPanel(cur, b) {
    return `<div class="panel adjust-panel">
      <h3>Manual Adjust — ${esc(cur.name)}</h3>
      <div class="adjust-row"><span>Credits</span><button class="mini-btn" data-adj="cc:-50">-50</button><button class="mini-btn" data-adj="cc:50">+50</button></div>
      <div class="adjust-row"><span>Security</span><button class="mini-btn" data-adj="sec:-5">-5</button><button class="mini-btn" data-adj="sec:5">+5</button></div>
      <div class="adjust-row"><span>Reputation</span><button class="mini-btn" data-adj="rep:-5">-5</button><button class="mini-btn" data-adj="rep:5">+5</button></div>
      ${!b.finished ? '<button class="btn danger small" data-action="end-turn">Force End Turn →</button>' : ''}</div>`;
  }

  function renderLogPanel(b) {
    const items = (b.log || []).map(l => `<div class="log-item"><span class="log-time">${new Date(l.t).toLocaleTimeString()}</span> ${esc(l.msg)}</div>`).join('');
    return `<div class="panel log-panel"><h3>Activity Log</h3>${items || '<div class="dim">No actions yet.</div>'}</div>`;
  }

  function wireGmActions(b) {
    const n = b.boardNum;
    const pin = view.boardPin;
    const on = (sel, fn) => { const e = root.querySelector(sel); if (e) e.addEventListener('click', fn); };
    on('[data-action="challenge-pass"]', async (e) => { SFX.success(); burst(e.currentTarget); emojiPop(e.currentTarget, '🎉'); toastIfError(await api('/api/gm/challenge-pass', { boardNum: n, boardPin: pin })); });
    on('[data-action="challenge-fail"]', async (e) => { SFX.fail(); emojiPop(e.currentTarget, '💀'); toastIfError(await api('/api/gm/challenge-fail', { boardNum: n, boardPin: pin })); });
    on('[data-action="checkpoint-pass"]', async (e) => { SFX.success(); burst(e.currentTarget); emojiPop(e.currentTarget, '🔐'); toastIfError(await api('/api/gm/checkpoint-pass', { boardNum: n, boardPin: pin })); });
    on('[data-action="checkpoint-fail"]', async (e) => { SFX.fail(); emojiPop(e.currentTarget, '💀'); toastIfError(await api('/api/gm/checkpoint-fail', { boardNum: n, boardPin: pin })); });
    on('[data-action="show-answer"]', async (e) => {
      const res = await api('/api/gm/get-challenge-answer', { boardNum: n, boardPin: pin });
      const box = root.querySelector('[data-answer-box]');
      if (!box) return;
      if (res.ok) { box.innerHTML = `<b>Answer key:</b> ${esc(res.answer)}`; box.style.display = 'block'; }
      else { box.innerHTML = esc(res.error || 'No answer key available.'); box.style.display = 'block'; }
      e.currentTarget.style.display = 'none';
    });
    on('[data-action="end-turn"]', async () => toastIfError(await api('/api/gm/end-turn', { boardNum: n, boardPin: pin })));
    root.querySelectorAll('[data-adj]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const [key, delta] = btn.getAttribute('data-adj').split(':');
        toastIfError(await api('/api/gm/adjust', { boardNum: n, boardPin: pin, key, delta: Number(delta) }));
      });
    });
  }

  /* ---------------- PLAYER ---------------- */

  function renderTeam() {
    const b = view.teamBoard;
    if (!b) { root.innerHTML = `<div class="wrap center"><div class="empty">Board not found.</div></div>`; return; }
    const team = b.teams[view.teamIdx];
    const isTurn = b.currentTeamIndex === view.teamIdx && !b.finished;
    const currentName = b.teams[b.currentTeamIndex].name;
    const justBecameMyTurn = isTurn && view.prevIsTurn !== true;
    view.prevIsTurn = isTurn;
    const boardWrapClass = `board-wrap ${isTurn ? 'active-turn' : ''} ${justBecameMyTurn ? 'pop' : ''}`;
    if (justBecameMyTurn) setTimeout(() => SFX.turnPop(), 80);

    const inDuel = !!(b.activeDuel && (b.activeDuel.visitorTeamId === view.teamIdx || b.activeDuel.ownerTeamId === view.teamIdx));
    const showModal = isTurn && !b.finished && b.phase === 'landed' && !view.diceAnimating && !inDuel;
    let countdownKind = null;
    const modalHtml = showModal ? `
      <div class="modal-backdrop">
        <div class="modal-card">
          <h3 class="modal-title">🎯 Your Turn</h3>
          ${renderLandedModalBody(b, team)}
        </div>
      </div>` : (inDuel ? (countdownKind = 'duel', renderDuelModal(b, view.teamIdx)) : '');

    const showRollButton = isTurn && !b.finished && b.phase === 'ready' && !view.diceAnimating;
    const rollButtonHtml = showRollButton
      ? `<button class="center-roll-btn" data-action="roll" title="Roll the dice"><span class="cr-emoji">🎲</span><span class="cr-label">ROLL</span></button>`
      : null;

    root.innerHTML = `
      <div class="wrap">
        <div class="topbar">
          <button class="back-btn" data-action="back">← Back</button>
          <div class="topbar-title">PLAYER — ${esc(team.name)}</div>
          ${topControls()}
        </div>
        <div class="gm-layout">
          <div class="board-col"><div class="${boardWrapClass}">${renderBoardGrid(b, rollButtonHtml)}</div></div>
          <div class="side-col">
            <div class="panel team-dash" style="--tc:${team.color}">
              <div class="td-head">
                <span class="ct-dot" style="background:${team.color}"></span>
                <h2>${esc(team.name)}</h2>
                ${isTurn ? '<span class="turn-pill">YOUR TURN</span>' : ''}
              </div>
              <div class="td-sub">Board ${b.boardNum} · Round ${b.round}/${b.numRounds}</div>
              <div class="ct-stats">
                <div class="stat"><div class="stat-label">💰 Cyber Credits</div><div class="stat-val">${fmt(team.cyberCredits)}</div></div>
                <div class="stat"><div class="stat-label">🛡️ Security Score</div><div class="stat-val">${team.securityScore}</div></div>
                <div class="stat"><div class="stat-label">⭐ Reputation</div><div class="stat-val">${team.reputation}</div></div>
                <div class="stat"><div class="stat-label">🏢 Company Value</div><div class="stat-val">${fmt(companyValue(team))}</div></div>
              </div>
              <div class="ct-assets">${team.assets.length ? team.assets.map(tid => `<span class="asset-chip">${tileById(tid).icon} ${esc(tileById(tid).name)}</span>`).join('') : '<span class="dim">No assets yet</span>'}</div>
            </div>

            ${b.finished
              ? `<div class="panel"><h3>Board Finished</h3><div class="dim">All ${b.numRounds} rounds complete. Check the Main Leaderboard for final standings.</div></div>`
              : isTurn
                ? `${b.phase === 'ready' ? renderReadyPanel(b) : ''}${renderUpgradePanel(b, team)}`
                : `<div class="panel"><h3>Waiting</h3><div class="dim">It's <b>${esc(currentName)}'s</b> turn right now. You'll get controls here the moment it's your turn.</div></div>`
            }

            <div class="panel">
              <h3>Assets</h3>
              <div class="asset-list">
                ${team.assets.length ? team.assets.map(tid => {
                  const t = tileById(tid);
                  const ups = (team.upgrades[tid] || []).map(k => { const u = META.UPGRADES.find(x => x.key === k); return u ? u.name : null; }).filter(Boolean);
                  return `<div class="asset-card"><div class="asset-card-head">${t.icon} ${esc(t.name)}</div><div class="dim">Revenue +${t.revenue} CC/round</div>${ups.length ? `<div class="upgrade-tags">${ups.map(u => `<span class="tag">${esc(u)}</span>`).join('')}</div>` : ''}</div>`;
                }).join('') : '<div class="dim">No assets yet.</div>'}
              </div>
            </div>
          </div>
        </div>
        ${modalHtml}
      </div>`;
    root.querySelector('[data-action="back"]').addEventListener('click', () => { view.diceAnimating = false; stopDiceSpin(); clearCountdown(); renderTeamPicker(b.boardNum); });
    if ((isTurn && !b.finished) || inDuel) wirePlayerActions(b, team);
    if (root.querySelector('#quizCountdown')) startCountdown(countdownKind || 'quiz');
    else clearCountdown();
  }

  let countdownInterval = null;
  let countdownFired = false;
  function clearCountdown() { if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; } countdownFired = false; }
  function startCountdown(kind) {
    clearCountdown();
    const tick = () => {
      const el = document.getElementById('quizCountdown');
      if (!el) { clearCountdown(); return; }
      const deadline = Number(el.getAttribute('data-deadline'));
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      el.textContent = remaining + 's';
      el.classList.toggle('countdown-urgent', remaining <= 5);
      if (remaining <= 0 && !countdownFired) {
        countdownFired = true;
        triggerExpiry(kind);
      }
    };
    tick();
    countdownInterval = setInterval(tick, 250);
  }

  /* Lazy expiry: the countdown reaching 0 on THIS client is what asks the
     server to check the real deadline and resolve it. Safe to call more
     than once / from more than one device — the server re-checks the DB's
     own deadline and no-ops if it's already resolved or not actually due. */
  async function triggerExpiry(kind) {
    const path = kind === 'duel' ? '/api/expire/duel' : kind === 'upgrade' ? '/api/expire/upgrade-quiz' : '/api/expire/quiz';
    await api(path, { boardNum: view.boardNum, boardPin: view.boardPin });
  }

  /* Real dice roll: the die spins with random faces for at least MIN_SPIN_MS
     so the rolling motion is always clearly visible, then settleDiceSpinOn()
     stops it on the ACTUAL value the server rolled (the board:update channel
     message below drives that call) — it never just flashes straight to a
     locally-guessed number. */
  const MIN_SPIN_MS = 900;
  let diceSpinInterval = null;
  let diceEl = null;
  let diceSpinStartedAt = 0;

  function diceSyncPosition(el) {
    const boardCenter = root.querySelector('.board-center');
    if (boardCenter) {
      const rect = boardCenter.getBoundingClientRect();
      el.style.left = (rect.left + rect.width / 2) + 'px';
      el.style.top = (rect.top + rect.height / 2) + 'px';
    } else {
      el.style.left = '50%';
      el.style.top = '30vh';
    }
  }

  function startDiceSpin() {
    stopDiceSpin();
    const die = document.createElement('div');
    die.className = 'fx-dice fx-dice-center';
    die.textContent = '1';
    diceSyncPosition(die);
    document.body.appendChild(die);
    diceEl = die;
    diceSpinStartedAt = Date.now();
    diceSpinInterval = setInterval(() => {
      diceSyncPosition(die);
      die.textContent = String(1 + Math.floor(Math.random() * 6));
      SFX.diceTick();
    }, 70);
  }

  function stopDiceSpin() {
    if (diceSpinInterval) { clearInterval(diceSpinInterval); diceSpinInterval = null; }
    if (diceEl) { diceEl.remove(); diceEl = null; }
  }

  function settleDiceSpinOn(value, onDone) {
    const die = diceEl;
    if (!die) { if (typeof onDone === 'function') onDone(); return; }
    const elapsed = Date.now() - diceSpinStartedAt;
    const wait = Math.max(0, MIN_SPIN_MS - elapsed);
    setTimeout(() => {
      if (diceSpinInterval) { clearInterval(diceSpinInterval); diceSpinInterval = null; }
      diceSyncPosition(die);
      die.textContent = String(value);
      SFX.diceLand();
      die.classList.add('settle');
      setTimeout(() => {
        die.remove();
        diceEl = null;
        if (typeof onDone === 'function') onDone();
      }, 1000);
    }, wait);
  }

  function wirePlayerActions(b, team) {
    const n = b.boardNum;
    const teamId = team.id;
    const boardPin = view.boardPin;
    const teamPin = view.teamPin;
    const on = (sel, fn) => { const e = root.querySelector(sel); if (e) e.addEventListener('click', fn); };
    on('[data-action="roll"]', () => {
      view.diceAnimating = true;
      startDiceSpin();
      renderTeam();
      api('/api/player/roll', { boardNum: n, teamId, boardPin, teamPin }).then((res) => {
        toastIfError(res);
        if (res && res.ok === false && view.diceAnimating) {
          view.diceAnimating = false;
          stopDiceSpin();
          if (view.screen === 'team') renderTeam();
        }
      });
    });
    on('[data-action="continue"]', async () => toastIfError(await api('/api/player/continue', { boardNum: n, teamId, boardPin, teamPin })));
    on('[data-action="skip"]', async () => toastIfError(await api('/api/player/skip', { boardNum: n, teamId, boardPin, teamPin })));
    on('[data-action="buy"]', async (e) => { SFX.coin(); burst(e.currentTarget); toastIfError(await api('/api/player/buy', { boardNum: n, teamId, boardPin, teamPin })); });
    on('[data-action="pay-fee"]', async () => { SFX.whoosh(); toastIfError(await api('/api/player/pay-fee', { boardNum: n, teamId, boardPin, teamPin })); });
    on('[data-action="duel"]', async (e) => { SFX.duel(); emojiPop(e.currentTarget, '⚔️'); toastIfError(await api('/api/player/start-duel', { boardNum: n, teamId, boardPin, teamPin })); });
    root.querySelectorAll('[data-action="duel-answer"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.getAttribute('data-index'));
        SFX.diceTick();
        root.querySelectorAll('[data-action="duel-answer"]').forEach(b2 => { b2.disabled = true; });
        toastIfError(await api('/api/player/duel-answer', { boardNum: n, teamId, boardPin, teamPin, answerIndex: idx }));
      });
    });
  }

  /* ---------------- MAIN LEADERBOARD ---------------- */

  let prevRanks = {};

  async function openLeaderboard() {
    view.screen = 'display';
    root.innerHTML = `<div class="wrap center"><div class="loading">Loading leaderboard…</div></div>`;
    const res = await apiGet('/api/leaderboard');
    if (res.ok) { view.lbData = { teams: res.teams }; view.feed = res.feed; renderLeaderboard(); ensureChannel(res.channel, onLeaderboardMessage); }
    else toast(res.error);
  }

  function onLeaderboardMessage(event, payload) {
    if (event === 'leaderboard:update') { view.lbData = payload; if (view.screen === 'display') renderLeaderboard(); }
    else if (event === 'feed:update') { view.feed = payload; if (view.screen === 'display') renderLeaderboard(); }
  }

  function renderLeaderboard() {
    const data = view.lbData || { teams: [] };
    const teams = data.teams || [];
    const boardsCount = (config && config.numBoards) || 0;
    const crisisBanner = config && config.status === 'final_crisis' ? `<div class="crisis-banner big">🔥 FINAL CYBER CRISIS IN PROGRESS</div>` : '';
    const nextRanks = {};
    const MEDALS = ['🥇', '🥈', '🥉'];
    const rows = teams.map((t, i) => {
      const key = `${t.boardNum}:${t.id}`;
      const rank = i + 1;
      nextRanks[key] = rank;
      const prev = prevRanks[key];
      let moveHtml = '';
      let flashClass = '';
      if (prev != null && prev !== rank) {
        if (rank < prev) { moveHtml = `<span class="rank-arrow up">▲${prev - rank}</span>`; flashClass = 'flash-up'; }
        else { moveHtml = `<span class="rank-arrow down">▼${rank - prev}</span>`; flashClass = 'flash-down'; }
      }
      const medal = MEDALS[i];
      return `
      <div class="lb-row ${i === 0 ? 'lb-first' : ''} ${flashClass}">
        <div class="lb-rank">${medal ? `<span class="lb-medal">${medal}</span>` : rank}${moveHtml}</div>
        <div class="lb-dot" style="background:${t.color}"></div>
        <div class="lb-name">${esc(t.name)} <span class="dim">Bd ${t.boardNum}</span></div>
        <div class="lb-val">${fmt(t.cv)}</div>
      </div>`;
    }).join('');
    prevRanks = nextRanks;
    const feedItems = (view.feed || []).slice(0, 12).map(f => `<span class="ticker-item">Bd ${f.boardNum} · ${esc(f.msg)}</span>`).join('<span class="ticker-sep">◆</span>');
    root.innerHTML = `
      <div class="wrap">
        <div class="topbar">
          <button class="back-btn" data-action="back">← Back</button>
          <div class="topbar-title">🏆 LIVE RANKING ${teams.length ? `<span class="dim" style="font-weight:400;">· ${teams.length} teams across ${boardsCount} boards</span>` : ''}</div>
          ${topControls()}
        </div>
        ${crisisBanner}
        <div class="panel lb-panel">${teams.length ? rows : '<div class="empty">Event not started yet.</div>'}</div>
        ${feedItems ? `<div class="ticker"><div class="ticker-track">${feedItems}${feedItems}</div></div>` : ''}
      </div>`;
    root.querySelector('[data-action="back"]').addEventListener('click', showRoleSelect);
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="toggle-sound"]');
    if (!btn) return;
    const muted = SFX.toggle();
    btn.textContent = muted ? '🔇' : '🔊';
  });
})();
