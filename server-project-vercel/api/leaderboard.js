const { getSupabaseAdmin } = require('./_lib/supabaseAdmin');
const { loadAllBoardsWithTeams, getRecentFeed } = require('./_lib/store');
const { LEADERBOARD_CHANNEL } = require('./_lib/auth');
const { ok, fail } = require('./_lib/respond');
const GE = require('../gameEngine');

/* Public, unauthenticated — the Main Leaderboard is intentionally open to
   everyone, exactly like the original app's join:leaderboard (no PIN). */
module.exports = async (req, res) => {
  if (req.method !== 'GET') return fail(res, 405, 'Method not allowed.');
  try {
    const supabase = getSupabaseAdmin();
    const boards = await loadAllBoardsWithTeams(supabase);
    const teams = [];
    boards.forEach((b) => b.teams.forEach((t) => teams.push({ ...t, boardNum: b.boardNum, cv: GE.companyValue(t) })));
    teams.sort((a, c) => c.cv - a.cv);
    const feed = await getRecentFeed(supabase, 25);
    return ok(res, { teams, feed, channel: LEADERBOARD_CHANNEL });
  } catch (e) {
    console.error(e);
    return fail(res, 500, e.message);
  }
};
