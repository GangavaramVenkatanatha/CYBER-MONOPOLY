const { handleGmAction } = require('../_lib/actionHandler');
const GE = require('../../gameEngine');

module.exports = (req, res) => handleGmAction(req, res, (b, p) => GE.adjustStat(b, p.key, Number(p.delta)));
