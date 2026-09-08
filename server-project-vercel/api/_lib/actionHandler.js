const { getSupabaseAdmin } = require('./supabaseAdmin');
const { loadBoard, saveBoard, appendFeed, loadAllBoardsWithTeams, getRecentFeed, getBoardRow, getTeamRow, getConfigRow } = require('./store');
const { broadcast } = require('./broadcast');
const { channelForBoard, LEADERBOARD_CHANNEL } = require('./auth');
const { ok, fail, readJsonBody } = require('./respond');
const GE = require('../../gameEngine');

/* Same rule as the original server.js: strip every hidden "__" field, and
   never let a team's PIN ride along on the board payload — team access is
   gated separately from board access. */
function sanitizeBoardForBroadcast(b) {
  if (!b) return b;
  const safe = {};
  for (const k of Object.keys(b)) {
    if (!k.startsWith('__')) safe[k] = b[k];
  }
  safe.teams = safe.teams.map((t) => { const { pin, ...rest } = t; return rest; });
  return safe;
}

async function broadcastLeaderboardAndFeed(supabase) {
  const boards = await loadAllBoardsWithTeams(supabase);
  const teams = [];
  boards.forEach((b) => {
    b.teams.forEach((t) => teams.push({ ...t, boardNum: b.boardNum, cv: GE.companyValue(t) }));
  });
  teams.sort((a, c) => c.cv - a.cv);
  const feed = await getRecentFeed(supabase, 25);
  await broadcast(LEADERBOARD_CHANNEL, 'leaderboard:update', { teams });
  await broadcast(LEADERBOARD_CHANNEL, 'feed:update', feed);
}

async function pushBoardUpdate(supabase, board) {
  await saveBoard(supabase, board);
  const safe = sanitizeBoardForBroadcast(board);
  await broadcast(channelForBoard(board.boardNum, board.pin), 'board:update', safe);
  await broadcastLeaderboardAndFeed(supabase);
  return safe;
}

/* Mirrors server.js's `playerAction` wrapper: verifies the board PIN AND
   that specific team's PIN, requires it to be that team's turn (unless
   opts.allowOffTurn — used only by the duel-answer route, exactly like the
   original's separate un-turn-gated `player:duelAnswer` handler), runs the
   gameEngine function, persists, and broadcasts. */
async function handlePlayerAction(req, res, geFn, opts) {
  try {
    if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');
    const body = await readJsonBody(req);
    const boardNum = Number(body.boardNum);
    const teamId = Number(body.teamId);
    const supabase = getSupabaseAdmin();

    const boardRow = await getBoardRow(supabase, boardNum);
    if (!boardRow) return fail(res, 404, `Board ${boardNum} not found.`);
    if (String(body.boardPin || '').trim() !== String(boardRow.pin)) return fail(res, 403, 'Enter the board PIN first.');

    const teamRow = await getTeamRow(supabase, boardNum, teamId);
    if (!teamRow) return fail(res, 404, 'Team not found.');
    if (String(body.teamPin || '').trim() !== String(teamRow.pin)) return fail(res, 403, "Enter your team's PIN first.");

    const board = await loadBoard(supabase, boardNum);
    if (board.finished) return fail(res, 409, 'This board has finished.');
    if (!opts || !opts.allowOffTurn) {
      if (teamId !== board.currentTeamIndex) return fail(res, 409, "It's not your team's turn yet.");
    }

    const result = geFn(board, body);
    if (!result || result.ok === false) return fail(res, 400, (result && result.error) || 'Action failed.');

    if (board.log && board.log[0]) await appendFeed(supabase, boardNum, board.log[0].msg);
    const safe = await pushBoardUpdate(supabase, board);
    return ok(res, { board: safe, result });
  } catch (e) {
    console.error(e);
    return fail(res, 500, e.message || 'Server error.');
  }
}

/* Mirrors server.js's `gmAction` wrapper: board PIN only, no team PIN, no
   turn requirement — a GM can judge/adjust regardless of whose turn it is. */
async function handleGmAction(req, res, geFn) {
  try {
    if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');
    const body = await readJsonBody(req);
    const boardNum = Number(body.boardNum);
    const supabase = getSupabaseAdmin();

    const boardRow = await getBoardRow(supabase, boardNum);
    if (!boardRow) return fail(res, 404, `Board ${boardNum} not found.`);
    if (String(body.boardPin || '').trim() !== String(boardRow.pin)) return fail(res, 403, 'Enter the board PIN first.');

    const board = await loadBoard(supabase, boardNum);
    const result = geFn(board, body);
    if (!result || result.ok === false) return fail(res, 400, (result && result.error) || 'Action failed.');

    if (board.log && board.log[0]) await appendFeed(supabase, boardNum, board.log[0].msg);
    const safe = await pushBoardUpdate(supabase, board);
    return ok(res, { board: safe, result });
  } catch (e) {
    console.error(e);
    return fail(res, 500, e.message || 'Server error.');
  }
}

/* Admin actions re-check the admin password on EVERY call (the original
   Socket.io app only checked it once at admin:login and never again on the
   mutating handlers themselves — a real bypass; fixed here and backported
   to server-project/server.js too). */
async function requireAdminPassword(supabase, password) {
  const row = await getConfigRow(supabase);
  return password === (row.admin_password || 'acn2026');
}

module.exports = {
  sanitizeBoardForBroadcast, pushBoardUpdate, broadcastLeaderboardAndFeed,
  handlePlayerAction, handleGmAction, requireAdminPassword,
};
