const { getSupabaseAdmin } = require('../_lib/supabaseAdmin');
const { loadBoard } = require('../_lib/store');
const { requireAdminPassword, pushBoardUpdate } = require('../_lib/actionHandler');
const { ok, fail, readJsonBody } = require('../_lib/respond');
const GE = require('../../gameEngine');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');
  try {
    const body = await readJsonBody(req);
    const boardNum = Number(body.boardNum);
    const supabase = getSupabaseAdmin();
    if (!(await requireAdminPassword(supabase, body.password))) return fail(res, 403, 'Admin login required.');

    const board = await loadBoard(supabase, boardNum);
    if (!board) return fail(res, 404, `Board ${boardNum} not found.`);
    const result = GE.renameTeam(board, Number(body.teamId), body.name);
    if (!result.ok) return fail(res, 400, result.error);
    await pushBoardUpdate(supabase, board);
    return ok(res, {});
  } catch (e) {
    console.error(e);
    return fail(res, 500, e.message);
  }
};
