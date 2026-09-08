const { getSupabaseAdmin } = require('./_lib/supabaseAdmin');
const { getConfigRow, configRowToObject } = require('./_lib/store');
const { CONFIG_CHANNEL } = require('./_lib/auth');
const { ok, fail } = require('./_lib/respond');

/* Public, unauthenticated — every screen needs this before any PIN is
   entered. adminPassword is stripped; only /api/admin/overview (which
   requires the admin password) includes it. */
module.exports = async (req, res) => {
  if (req.method !== 'GET') return fail(res, 405, 'Method not allowed.');
  try {
    const supabase = getSupabaseAdmin();
    const row = await getConfigRow(supabase);
    const cfg = configRowToObject(row);
    delete cfg.adminPassword;
    return ok(res, {
      config: cfg,
      channel: CONFIG_CHANNEL,
      // Public by design — the anon key grants no table access (see
      // supabase/migrations/0001_init.sql), it only opens a Realtime
      // connection. The client needs these to subscribe to Broadcast
      // channels; there is no build step to bake them in statically.
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    });
  } catch (e) {
    console.error(e);
    return fail(res, 500, e.message);
  }
};
