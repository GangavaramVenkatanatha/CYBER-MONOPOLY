const { handlePlayerAction } = require('../_lib/actionHandler');
const GE = require('../../gameEngine');

module.exports = (req, res) => handlePlayerAction(req, res, (b) => GE.resolveContinue(b));
