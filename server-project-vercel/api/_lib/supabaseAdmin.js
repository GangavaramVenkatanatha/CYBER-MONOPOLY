const { createClient } = require('@supabase/supabase-js');

let client = null;

/* Service-role Supabase client — bypasses Row Level Security. Used ONLY
   inside these serverless functions, never sent to a browser. */
function getSupabaseAdmin() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set.');
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

module.exports = { getSupabaseAdmin };
