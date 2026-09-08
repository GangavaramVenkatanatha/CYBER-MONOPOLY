const { ok, fail } = require('./_lib/respond');
const GE = require('../gameEngine');

/* Static game data every screen needs before doing anything else — the
   equivalent of the original app's unauthenticated `socket.emit('meta', ...)`
   sent right on connect. */
module.exports = async (req, res) => {
  if (req.method !== 'GET') return fail(res, 405, 'Method not allowed.');
  return ok(res, {
    TILES: GE.TILES,
    TILE_GRID: GE.TILE_GRID,
    UPGRADES: GE.UPGRADES,
    TEAM_COLORS: GE.TEAM_COLORS,
    NUM_TILES: GE.NUM_TILES,
  });
};
