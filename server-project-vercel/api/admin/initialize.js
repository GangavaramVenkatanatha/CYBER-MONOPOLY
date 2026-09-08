const { getSupabaseAdmin } = require('../_lib/supabaseAdmin');
const { getConfigRow, configRowToObject, saveConfig, initializeEventRows } = require('../_lib/store');
const { requireAdminPassword, broadcastLeaderboardAndFeed } = require('../_lib/actionHandler');
const { broadcast } = require('../_lib/broadcast');
const { CONFIG_CHANNEL } = require('../_lib/auth');
const { ok, fail, readJsonBody } = require('../_lib/respond');

function clamp(n, lo, hi) { n = Number(n); return Math.max(lo, Math.min(hi, isNaN(n) ? lo : n)); }

/* Wipes and recreates every board + team with fresh random PINs — mirrors
   admin:initialize exactly, including that re-initializing an already-live
   event resets everyone's progress (the client confirms this with the
   organizer before calling it, same as before). */
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
      status: 'live',
      initialized: true,
    };
    await saveConfig(supabase, updated);
    await initializeEventRows(supabase, updated.numBoards, updated.teamsPerBoard, updated.numRounds, updated.stage);

    const publicCfg = { ...updated };
    delete publicCfg.adminPassword;
    await broadcast(CONFIG_CHANNEL, 'config:update', publicCfg);
    await broadcastLeaderboardAndFeed(supabase);
    return ok(res, { config: updated });
  } catch (e) {
    console.error(e);
    return fail(res, 500, e.message);
  }
};
