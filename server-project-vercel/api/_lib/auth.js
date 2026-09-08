const crypto = require('crypto');

/* Derives a Realtime Broadcast channel name from a board's PIN, so a client
   can only subscribe to (and therefore only view) a board's live state once
   it already knows that board's PIN — matching the original app's behavior
   of gating even read access behind the PIN, not just gating actions.
   Deterministic + server-side-only salt means we never need to store the
   channel name anywhere; every route just recomputes it from the board row
   it already loaded. */
function channelForBoard(boardNum, pin) {
  const salt = process.env.CHANNEL_SALT || 'insecure-default-change-me';
  return 'board-' + boardNum + '-' + crypto
    .createHmac('sha256', salt)
    .update(`board:${boardNum}:${pin}`)
    .digest('hex')
    .slice(0, 20);
}

/* Public, PIN-free — the Main Leaderboard is intentionally open to anyone. */
const LEADERBOARD_CHANNEL = 'cyber-monopoly-leaderboard';

/* Public, PIN-free — every screen needs numBoards/status before any PIN is
   entered (e.g. to render the board-picker), exactly like the original app
   sending config:update to every socket on connect with no gate. */
const CONFIG_CHANNEL = 'cyber-monopoly-config';

module.exports = { channelForBoard, LEADERBOARD_CHANNEL, CONFIG_CHANNEL };
