const { handlePlayerAction } = require('../_lib/actionHandler');
const GE = require('../../gameEngine');

/* A duel interrupts even the off-turn team, so unlike every other player
   action this one does NOT require it to be teamId's global turn — only
   that teamId is one of the two participants (gameEngine.submitDuelAnswer
   itself enforces that). allowOffTurn mirrors the original app's separate,
   un-turn-gated `player:duelAnswer` socket handler. */
module.exports = (req, res) => handlePlayerAction(
  req, res,
  (b, p) => GE.submitDuelAnswer(b, Number(p.teamId), Number(p.answerIndex)),
  { allowOffTurn: true }
);
