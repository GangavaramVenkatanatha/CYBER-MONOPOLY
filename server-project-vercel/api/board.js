/* Dispatcher — see api/admin.js for why this exists. */
const state = require('./_board/state');
const verifyPin = require('./_board/verify-pin');
const verifyTeamPin = require('./_board/verify-team-pin');

const handlers = {
  state,
  'verify-pin': verifyPin,
  'verify-team-pin': verifyTeamPin,
};

module.exports = (req, res) => {
  const handler = handlers[req.query.action];
  if (!handler) return res.status(404).json({ ok: false, error: 'Unknown board action.' });
  return handler(req, res);
};
