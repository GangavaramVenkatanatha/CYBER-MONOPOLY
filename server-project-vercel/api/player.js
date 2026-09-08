/* Dispatcher — see api/admin.js for why this exists. */
const buy = require('./_player/buy');
const continueAction = require('./_player/continue');
const duelAnswer = require('./_player/duel-answer');
const endTurn = require('./_player/end-turn');
const payFee = require('./_player/pay-fee');
const roll = require('./_player/roll');
const skip = require('./_player/skip');
const startDuel = require('./_player/start-duel');

const handlers = {
  buy,
  continue: continueAction,
  'duel-answer': duelAnswer,
  'end-turn': endTurn,
  'pay-fee': payFee,
  roll,
  skip,
  'start-duel': startDuel,
};

module.exports = (req, res) => {
  const handler = handlers[req.query.action];
  if (!handler) return res.status(404).json({ ok: false, error: 'Unknown player action.' });
  return handler(req, res);
};
