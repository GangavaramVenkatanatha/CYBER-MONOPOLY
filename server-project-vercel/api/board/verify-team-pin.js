const { getSupabaseAdmin } = require('../_lib/supabaseAdmin');
const { getTeamRow } = require('../_lib/store');
const { fail, readJsonBody } = require('../_lib/respond');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');
  try {
    const body = await readJsonBody(req);
    const boardNum = Number(body.boardNum);
    const teamId = Number(body.teamId);
    const supabase = getSupabaseAdmin();
    const row = await getTeamRow(supabase, boardNum, teamId);
    if (!row) return res.status(200).json({ ok: false, reason: 'not_found' });
    const good = String(body.pin || '').trim() === String(row.pin);
    return res.status(200).json({ ok: good });
  } catch (e) {
    console.error(e);
    return fail(res, 500, e.message);
  }
};
