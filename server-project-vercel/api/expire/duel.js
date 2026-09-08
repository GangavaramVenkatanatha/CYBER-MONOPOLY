const { getSupabaseAdmin } = require('../_lib/supabaseAdmin');
const { loadBoard, appendFeed } = require('../_lib/store');
const { pushBoardUpdate } = require('../_lib/actionHandler');
const { ok, fail, readJsonBody } = require('../_lib/respond');
const GE = require('../../gameEngine');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');
  try {
    const body = await readJsonBody(req);
    const boardNum = Number(body.boardNum);
    const supabase = getSupabaseAdmin();
    const board = await loadBoard(supabase, boardNum);
    if (!board) return fail(res, 404, `Board ${boardNum} not found.`);
    if (String(body.boardPin || '').trim() !== String(board.pin)) return fail(res, 403, 'Enter the board PIN first.');

    if (!board.activeDuel || Date.now() < board.activeDuel.deadline) {
      return ok(res, { expired: false });
    }
    const result = GE.expireDuel(board);
    if (!result.ok) return ok(res, { expired: false });
    if (board.log && board.log[0]) await appendFeed(supabase, boardNum, board.log[0].msg);
    await pushBoardUpdate(supabase, board);
    return ok(res, { expired: true });
  } catch (e) {
    console.error(e);
    return fail(res, 500, e.message);
  }
};
