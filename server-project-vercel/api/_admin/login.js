const { getSupabaseAdmin } = require('../_lib/supabaseAdmin');
const { requireAdminPassword } = require('../_lib/actionHandler');
const { fail, readJsonBody } = require('../_lib/respond');

/* Just a "does this password work" check for the gate screen — every
   admin-mutating route below re-checks the password itself on every call,
   there is no session/cookie carrying authorization between requests. */
module.exports = async (req, res) => {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed.');
  try {
    const body = await readJsonBody(req);
    const supabase = getSupabaseAdmin();
    const good = await requireAdminPassword(supabase, body.password);
    return res.status(200).json({ ok: good });
  } catch (e) {
    console.error(e);
    return fail(res, 500, e.message);
  }
};
