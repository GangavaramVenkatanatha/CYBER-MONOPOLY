const { getSupabaseAdmin } = require('../_lib/supabaseAdmin');
const { getBoardRow, loadBoard } = require('../_lib/store');
const { channelForBoard } = require('../_lib/auth');
const { sanitizeBoardForBroadcast } = require('../_lib/actionHandler');
const { ok, fail, readJsonBody } = require('../_lib/respond');

/* One-shot fetch used right after PIN verification (and on reload) so the
   screen has something to render before the first Realtime message
   arrives. Requires the board PIN again — every route re-validates,
   nothing is cached server-side between requests. */
module.exports = async (req, res) => {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');
  try {
    const body = await readJsonBody(req);
    const boardNum = Number(body.boardNum);
    const supabase = getSupabaseAdmin();
    const row = await getBoardRow(supabase, boardNum);
    if (!row) return fail(res, 404, `Board ${boardNum} not found.`);
    if (String(body.pin || '').trim() !== String(row.pin)) return fail(res, 403, 'Enter the board PIN first.');
    const board = await loadBoard(supabase, boardNum);
    return ok(res, { board: sanitizeBoardForBroadcast(board), channel: channelForBoard(boardNum, row.pin) });
  } catch (e) {
    console.error(e);
    return fail(res, 500, e.message);
  }
};
