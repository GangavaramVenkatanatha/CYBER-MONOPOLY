/* Pushes a Supabase Realtime Broadcast message over the REST Broadcast API
   (https://.../realtime/v1/api/broadcast) rather than opening a WebSocket
   from inside the function. A serverless invocation is short-lived and
   stateless, so a one-shot HTTP POST is the right fit — no socket lifecycle
   to manage, nothing left dangling after the response is sent. */
async function broadcast(topic, event, payload) {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set.');
  const res = await fetch(`${base}/realtime/v1/api/broadcast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ messages: [{ topic, event, payload, private: false }] }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[broadcast] failed', res.status, text);
  }
}

module.exports = { broadcast };
