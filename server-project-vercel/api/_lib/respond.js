function ok(res, body) { res.status(200).json({ ok: true, ...body }); }
function fail(res, status, error) { res.status(status).json({ ok: false, error }); }

/* Vercel's Node runtime parses a JSON request body into req.body automatically
   when Content-Type is application/json. This is a defensive fallback for the
   rare case it arrives unparsed. */
async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return req.body ? JSON.parse(req.body) : {}; } catch (e) { return {}; }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

module.exports = { ok, fail, readJsonBody };
