/* Dispatcher: Vercel Hobby caps a deployment at 12 Serverless Functions, and
   this project has far more individual actions than that. vercel.json rewrites
   /api/admin/:action to /api/admin?action=:action (URL the client sees never
   changes), and this one function fans out to the real handler — each of
   which still lives in its own file under _admin/, untouched. */
const initialize = require('./_admin/initialize');
const login = require('./_admin/login');
const overview = require('./_admin/overview');
const renameTeam = require('./_admin/rename-team');
const resetBoard = require('./_admin/reset-board');
const saveSettings = require('./_admin/save-settings');
const setStatus = require('./_admin/set-status');

const handlers = {
  initialize,
  login,
  overview,
  'rename-team': renameTeam,
  'reset-board': resetBoard,
  'save-settings': saveSettings,
  'set-status': setStatus,
};

module.exports = (req, res) => {
  const handler = handlers[req.query.action];
  if (!handler) return res.status(404).json({ ok: false, error: 'Unknown admin action.' });
  return handler(req, res);
};
