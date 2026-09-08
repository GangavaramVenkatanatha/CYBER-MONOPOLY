/* Dispatcher — see api/admin.js for why this exists. */
const adjust = require('./_gm/adjust');
const challengeFail = require('./_gm/challenge-fail');
const challengePass = require('./_gm/challenge-pass');
const checkpointFail = require('./_gm/checkpoint-fail');
const checkpointPass = require('./_gm/checkpoint-pass');
const endTurn = require('./_gm/end-turn');
const getChallengeAnswer = require('./_gm/get-challenge-answer');

const handlers = {
  adjust,
  'challenge-fail': challengeFail,
  'challenge-pass': challengePass,
  'checkpoint-fail': checkpointFail,
  'checkpoint-pass': checkpointPass,
  'end-turn': endTurn,
  'get-challenge-answer': getChallengeAnswer,
};

module.exports = (req, res) => {
  const handler = handlers[req.query.action];
  if (!handler) return res.status(404).json({ ok: false, error: 'Unknown GM action.' });
  return handler(req, res);
};
