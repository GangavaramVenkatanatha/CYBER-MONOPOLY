const { getSupabaseAdmin } = require('../_lib/supabaseAdmin');
const { getConfigRow, configRowToObject, saveConfig } = require('../_lib/store');
const { requireAdminPassword } = require('../_lib/actionHandler');
const { broadcast } = require('../_lib/broadcast');
const { CONFIG_CHANNEL } = require('../_lib/auth');
const { ok, fail, readJsonBody } = require('../_lib/respond');

const VALID = ['lobby', 'live', 'final_crisis', 'ended'];

module.exports = async (req, res) => {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');
  try {
    const body = await readJsonBody(req);
    const supabase = getSupabaseAdmin();
    if (!(await requireAdminPassword(supabase, body.password))) return fail(res, 403, 'Admin login required.');
    if (!VALID.includes(body.status)) return fail(res, 400, 'Unknown status.');

    const cfg = configRowToObject(await getConfigRow(supabase));
    const updated = { ...cfg, status: body.status };
    await saveConfig(supabase, updated);
    const publicCfg = { ...updated };
    delete publicCfg.adminPassword;
    await broadcast(CONFIG_CHANNEL, 'config:update', publicCfg);
    return ok(res, { config: updated });
  } catch (e) {
    console.error(e);
    return fail(res, 500, e.message);
  }
};
