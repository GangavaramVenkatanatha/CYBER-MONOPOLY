const { getSupabaseAdmin } = require('../_lib/supabaseAdmin');
const { loadBoard, appendFeed, getConfigRow, configRowToObject } = require('../_lib/store');
const { pushBoardUpdate } = require('../_lib/actionHandler');
const { ok, fail } = require('../_lib/respond');
const GE = require('../../gameEngine');

/* Belt-and-suspenders background sweep — NOT the primary expiry mechanism
   (each client's own countdown calling /api/expire/* is), since Vercel Cron
   granularity is coarse (minimum once/day on the Hobby plan; see
   DEPLOYMENT.md). Catches a quiz/duel/upgrade-quiz that timed out while no
   client happened to be around to trigger the lazy-expiry call. */
module.exports = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers['authorization'] || '';
    if (auth !== `Bearer ${secret}`) return fail(res, 401, 'Unauthorized.');
  }
  try {
    const supabase = getSupabaseAdmin();
    const cfg = configRowToObject(await getConfigRow(supabase));
    if (!cfg.initialized) return ok(res, { swept: 0 });

    let swept = 0;
    for (let n = 1; n <= cfg.numBoards; n++) {
      const board = await loadBoard(supabase, n);
      if (!board) continue;
      let changed = false;
      const now = Date.now();

      if (board.activeDuel && now >= board.activeDuel.deadline) {
        if (GE.expireDuel(board).ok) changed = true;
      }

      if (changed) {
        if (board.log && board.log[0]) await appendFeed(supabase, n, board.log[0].msg);
        await pushBoardUpdate(supabase, board);
        swept++;
      }
    }
    return ok(res, { swept });
  } catch (e) {
    console.error(e);
    return fail(res, 500, e.message);
  }
};
