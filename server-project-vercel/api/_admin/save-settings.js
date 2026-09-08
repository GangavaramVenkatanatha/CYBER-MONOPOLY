const { getSupabaseAdmin } = require('../_lib/supabaseAdmin');
const { getConfigRow, configRowToObject, saveConfig } = require('../_lib/store');
const { requireAdminPassword } = require('../_lib/actionHandler');
const { broadcast } = require('../_lib/broadcast');
const { CONFIG_CHANNEL } = require('../_lib/auth');
const { ok, fail, readJsonBody } = require('../_lib/respond');

function clamp(n, lo, hi) { n = Number(n); return Math.max(lo, Math.min(hi, isNaN(n) ? lo : n)); }

module.exports = async (req, res) => {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');
  try {
    const body = await readJsonBody(req);
    const supabase = getSupabaseAdmin();
    if (!(await requireAdminPassword(supabase, body.password))) return fail(res, 403, 'Admin login required.');

    const cfg = configRowToObject(await getConfigRow(supabase));
    const updated = {
      ...cfg,
      eventName: body.eventName || cfg.eventName,
      numBoards: clamp(body.numBoards, 1, 8),
      teamsPerBoard: clamp(body.teamsPerBoard, 2, 4),
      numRounds: clamp(body.numRounds, 3, 15),
      stage: clamp(body.stage, 1, 3),
      adminPassword: body.adminPassword || cfg.adminPassword,
    };
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
