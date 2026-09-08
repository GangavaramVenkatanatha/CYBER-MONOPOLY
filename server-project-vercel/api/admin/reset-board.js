const { getSupabaseAdmin } = require('../_lib/supabaseAdmin');
const { getConfigRow, configRowToObject, getBoardRow, resetBoardRows } = require('../_lib/store');
const { requireAdminPassword, broadcastLeaderboardAndFeed } = require('../_lib/actionHandler');
const { ok, fail, readJsonBody } = require('../_lib/respond');

/* Issues a brand-new PIN for the board and all its teams — same as before,
   the organizer needs to hand out fresh table cards afterward. */
module.exports = async (req, res) => {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');
  try {
    const body = await readJsonBody(req);
    const boardNum = Number(body.boardNum);
    const supabase = getSupabaseAdmin();
    if (!(await requireAdminPassword(supabase, body.password))) return fail(res, 403, 'Admin login required.');

    const cfg = configRowToObject(await getConfigRow(supabase));
    if (!cfg.initialized) return fail(res, 409, 'Event has not been initialized yet.');
    const existing = await getBoardRow(supabase, boardNum);
    if (!existing) return fail(res, 404, `Board ${boardNum} not found.`);

    await resetBoardRows(supabase, boardNum, cfg.teamsPerBoard, cfg.numRounds, cfg.stage);
    await broadcastLeaderboardAndFeed(supabase);
    return ok(res, {});
  } catch (e) {
    console.error(e);
    return fail(res, 500, e.message);
  }
};
