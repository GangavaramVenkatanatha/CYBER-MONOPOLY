const { getSupabaseAdmin } = require('../_lib/supabaseAdmin');
const { getBoardRow } = require('../_lib/store');
const { ok, fail, readJsonBody } = require('../_lib/respond');

/* The one deliberate exception to "every response strips hidden answers" —
   this is the dedicated, explicit request a verified GM makes to reveal
   judging notes. Still requires the board PIN and still refuses if there's
   no active challenge, exactly like the original gm:getChallengeAnswer. */
module.exports = async (req, res) => {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');
  try {
    const body = await readJsonBody(req);
    const boardNum = Number(body.boardNum);
    const supabase = getSupabaseAdmin();
    const boardRow = await getBoardRow(supabase, boardNum);
    if (!boardRow) return fail(res, 404, `Board ${boardNum} not found.`);
    if (String(body.boardPin || '').trim() !== String(boardRow.pin)) return fail(res, 403, 'Enter the board PIN first.');
    if (!boardRow.active_challenge) return fail(res, 404, 'No active challenge on this board.');

    const { data: secrets, error } = await supabase
      .from('board_secrets')
      .select('active_challenge_answer')
      .eq('board_num', boardNum)
      .maybeSingle();
    if (error) throw error;
    if (!secrets || secrets.active_challenge_answer == null) return fail(res, 404, 'No active challenge on this board.');
    return ok(res, { answer: secrets.active_challenge_answer });
  } catch (e) {
    console.error(e);
    return fail(res, 500, e.message);
  }
};
