# Cyber Monopoly — ACN 2026 (Real-Time Server)

A real multiplayer game server. No internet, no Claude, no cloud account
needed — everyone on the same WiFi network plays live through their
browser, exactly like a Ludo/UNO web clone.

## 1. One-time setup (do this before the event)

You need **Node.js** installed on whichever laptop will run the server
during the event (this can be any normal laptop — it doesn't need to stay
plugged into anything special).

- Download Node.js (LTS version) from https://nodejs.org if it isn't
  already installed. Any version 18 or newer works.

Then, in a terminal, inside this folder:

```
npm install
```

This downloads the two small libraries the server needs (Express and
Socket.io). You only have to do this once.

## 2. Run it on event day

```
node server.js
```

You'll see something like:

```
Cyber Monopoly server running.
  Local:   http://localhost:3000
  Network: http://<this-machine-IP>:3000
```

- **On the laptop itself**, open `http://localhost:3000` in a browser.
- **On every other device** (Game Master phones/laptops, team tablets,
  the main-screen display) — connect that device to the **same WiFi**
  as the server laptop, then open `http://<the-server-laptop's-IP>:3000`.

### Finding the server laptop's IP address

- **Windows:** open Command Prompt, run `ipconfig`, look for "IPv4
  Address" (something like `192.168.1.42`).
- **Mac:** System Settings → Wi-Fi → Details, or run `ifconfig | grep
  inet` in Terminal.
- **Linux:** run `ip addr` or `hostname -I`.

Write that IP address on a whiteboard for your Game Masters — that's
the address every device types into their browser, followed by `:3000`.
E.g. `http://192.168.1.42:3000`.

**Tip:** shorten it for people by using a QR code generator (search
"QR code generator" online) pointed at that exact URL — put one QR
code on each board's table.

### If a device can't connect

- Double-check it's on the *same* WiFi network as the server laptop
  (not mobile data, not a different WiFi band).
- The server laptop's firewall may prompt "Allow Node.js to accept
  connections" the first time you run it — click **Allow**. On Windows,
  make sure this is allowed for both Private and Public networks if
  your venue WiFi is set to Public.
- Some campus/college WiFi networks block device-to-device traffic
  ("client isolation" / "AP isolation") for security. If devices still
  can't reach the server after allowing the firewall, ask your IT/network
  team to disable client isolation for your SSID for the event, or use
  a separate mobile hotspot/router you control instead of campus WiFi.

## 3. Running the event

1. Open the site on the admin laptop → **Admin Control** → password
   `acn2026` (change this on the Event Setup panel — do this *before*
   sharing the link with anyone).
2. Set number of boards, teams per board, rounds per match, and
   **Tournament Stage** (Preliminary / Semifinal / Final — this picks
   which Challenge Hub / Security Checkpoint difficulty pool the whole
   event draws from; it's separate from "Rounds," which just controls
   how many turn-cycles one match lasts) → **Initialize Event** →
   **Start / Resume Event**. Run the three stages as three separate
   Initialize Events over the course of your day — e.g. Preliminary in
   the morning, Re-initialize with Stage = Semifinal for that round,
   then again for the Final.
3. After initializing, the Admin panel shows a **Board Access PINs**
   section — a random 4-digit PIN per board. Write each board's PIN on
   its table card (or bake it into a QR code alongside the server URL).
   A device can't view or act on a board at all — not even see the team
   list — until it enters that exact board's PIN. Being verified for
   Board 3 gives zero access to Board 5; each board is its own gate.
4. **Each team also has its own separate PIN**, shown in the **Team
   Names & PINs** panel. After a player picks their board and taps
   their team name, they're asked for that team's PIN before they see
   any of that team's data or get any controls. Team 1's PIN only
   works for Team 1 — Team 2's device entering it will be rejected,
   even on the same board. Hand each team only their own PIN.
5. Each team opens the same URL on **their own phone or laptop** →
   **Player** → picks their board number → enters the board PIN →
   picks their team → enters their team PIN. On their turn they get
   real controls: Roll & Move, Buy/Skip, Pay Fee or start a Cyber
   Duel, install Security Upgrades — with the live board shown right
   there so they can see where every team's token is. Off their turn,
   it's a live read-only view of their own stats and the board —
   **except during a Cyber Duel**, when it interrupts even an
   off-turn team, because both sides need to answer.
   - **Community Chest / Chance / Incident Zone** now trigger a real
     multiple-choice quiz with a 20-second timer, answered solo on the
     landing team's own screen. Correct answers earn **+100 Cyber
     Credits**; the server grades it and reveals the correct answer
     either way, and auto-resolves it if time runs out with no answer.
   - **Cyber Duel** is a live, timed quiz race between the visiting
     team and the team that owns the property — both get the exact
     same question and a 20-second countdown on their own devices at
     the same time. Fastest correct answer wins the property dispute;
     if both get it wrong (or time runs out on both), the defending
     team keeps the property. This all resolves automatically —
     no Game Master needed for Duels anymore.
6. Each board also needs one **Game Master** (organizer/volunteer) —
   same flow: open the URL → **Game Master** → pick board number →
   enter that board's PIN (no team PIN needed for this role). Their
   job is to judge whether a team passed the **Challenge Hub** or
   **Security Checkpoint** puzzle — both show the real puzzle text
   (scenario + numbered tasks) right on the team's screen and the
   Game Master's screen, so nothing needs to be printed out. The GM
   also has a **🔑 Show Answer Key** button to reveal the judging
   notes/expected answer, and a **Manual Adjust** panel plus a
   **Force End Turn** button as a safety valve if a team gets stuck.
   Cyber Duels no longer need the GM at all — the GM screen just
   shows a live "who's answered" status while it resolves on its own.
7. Put the **Main Leaderboard** view up on the projector/big screen —
   this one's intentionally public and needs no PIN, since it's meant
   for everyone to watch. It shows every team across every board (all
   32 for an 8-board/4-team event), scrollable if the list runs long,
   with a live scrolling ticker underneath showing what's happening
   across every board in real time, and rank-change arrows whenever a
   team moves up or down.
8. When ready, Admin can hit **🔥 Trigger Final Cyber Crisis** to flash
   a banner across every connected screen at once.

Every screen has a 🔊 sound toggle in the top bar — dice rolls, purchases,
duel/challenge outcomes, and turn changes all have short synthesized sound
effects and confetti/animation moments (no audio files needed, generated
in-browser). Each device remembers its own mute preference. Worth muting
the shared display device if the room already has enough noise, while
letting individual team devices keep sound on for the reactions.

Everything updates in real time (Socket.io push, not polling) — a dice
roll on Board 3 shows up on the leaderboard within a fraction of a
second, on any device.

**Note on trust:** board and team PINs stop a device from wandering
into another board or another team on the same board — both are
enforced on the server, not just hidden in the UI, and verified
independently of each other. What they don't stop is people *within*
the same team sharing their own PIN with each other, since there's no
individual login per team member — that's fine, since a team's members
are supposed to share control of their own team anyway. Just keep each
team's PIN off any shared public channel and hand it only to that
team.

**Resetting a board issues brand-new PINs for that board and all its
teams** — if you use Admin → Reset Board mid-event, update that
table's cards before play resumes there.

## 4. Challenge Hub & Security Checkpoint content

Both tiles pick a random puzzle from `challengeLibrary.js` when a team
lands on them — a scenario plus numbered tasks, shown live on both the
team's screen and the Game Master's screen. Nothing needs to be
printed out.

- **Content is organized by round.** Right now only round 1 has a
  pool (25 Challenge Hub puzzles, 10 Security Checkpoint puzzles). If
  a board reaches a round with no dedicated pool yet, it automatically
  reuses the nearest earlier round's pool instead of breaking — so the
  game keeps working even before round 2/3/etc. content is added. To
  add more rounds, open `challengeLibrary.js` and add a new numbered
  key (e.g. `2: [...]`) to `challenge` and/or `checkpoint` — no other
  code needs to change.
- **The answer key is judge-only, and this is enforced by the server,
  not just hidden in the interface.** The expected answer/judging
  notes for the puzzle currently active on a board are never included
  in the data sent to players — verified directly by inspecting the
  network traffic a player's browser receives. A Game Master gets it
  only by tapping **🔑 Show Answer Key**, which makes a dedicated
  request that still requires that board's PIN.
- Passing a **Challenge Hub** puzzle awards +75 Cyber Credits. Passing
  a **Security Checkpoint** puzzle awards +10 Security Score. Failing
  either gives no reward, same as before.

## 5. Reliability notes

- The server saves game state to `gamestate.json` in this folder after
  every action. If the laptop crashes or you need to restart the
  server, just run `node server.js` again — it picks up exactly where
  the game left off. Nothing is lost.
- If you want a clean slate for a rehearsal vs. the real event, just
  delete `gamestate.json` before you start (or use Admin → Initialize
  Event, which resets everything anyway).
- Back up `gamestate.json` occasionally during the event (copy it
  somewhere) if you want extra peace of mind — it's a plain text file.

## 6. Wanting internet-wide access instead of local WiFi?

This setup deliberately avoids needing internet/cloud hosting, which is
the fastest and most reliable option for a live in-person event — no
dependency on venue internet quality. If you *also* want people to be
able to join from outside the venue, this same code can be deployed to
a free-tier host like Render or Railway with minor changes — ask if you
want that built out separately, but for an in-room event, local WiFi is
the more robust choice.
