const { handleGmAction } = require('../_lib/actionHandler');
const GE = require('../../gameEngine');

module.exports = (req, res) => handleGmAction(req, res, (b) => GE.challengeResult(b, true));
