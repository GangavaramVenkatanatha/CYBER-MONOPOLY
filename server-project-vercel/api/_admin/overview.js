const { getSupabaseAdmin } = require('../_lib/supabaseAdmin');
const { getConfigRow, configRowToObject, loadAllBoardsWithTeams } = require('../_lib/store');
const { requireAdminPassword } = require('../_lib/actionHandler');
const { ok, fail, readJsonBody } = require('../_lib/respond');

/* Full config (including adminPassword — the Event Setup form shows/edits
   it) and every board+team including PINs, exactly like the original
   admin:overview payload. Requires the admin password on every call. */
module.exports = async (req, res) => {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');
  try {
    const body = await readJsonBody(req);
    const supabase = getSupabaseAdmin();
    if (!(await requireAdminPassword(supabase, body.password))) return fail(res, 403, 'Admin login required.');
    const config = configRowToObject(await getConfigRow(supabase));
    const boardsList = await loadAllBoardsWithTeams(supabase);
    const boards = {};
    boardsList.forEach((b) => { boards[b.boardNum] = b; });
    return ok(res, { config, boards });
  } catch (e) {
    console.error(e);
    return fail(res, 500, e.message);
  }
};
