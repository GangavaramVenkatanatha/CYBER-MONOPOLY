const { getSupabaseAdmin } = require('../_lib/supabaseAdmin');
const { getBoardRow } = require('../_lib/store');
const { channelForBoard } = require('../_lib/auth');
const { fail, readJsonBody } = require('../_lib/respond');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');
  try {
    const body = await readJsonBody(req);
    const boardNum = Number(body.boardNum);
    const supabase = getSupabaseAdmin();
    const row = await getBoardRow(supabase, boardNum);
    if (!row) return res.status(200).json({ ok: false, reason: 'not_found' });
    const good = String(body.pin || '').trim() === String(row.pin);
    if (!good) return res.status(200).json({ ok: false });
    // Only a correct PIN unlocks the channel name needed to view live state.
    return res.status(200).json({ ok: true, channel: channelForBoard(boardNum, row.pin) });
  } catch (e) {
    console.error(e);
    return fail(res, 500, e.message);
  }
};
