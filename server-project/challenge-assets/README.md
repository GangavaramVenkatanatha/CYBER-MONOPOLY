# Challenge assets — things a Game Master must host separately

Two of the new Round 2/3 Challenge Hub puzzles ("Talk Your Way Past
deploy-bot" and "Campus Portal — Find the Flags") are not solvable from
text alone — they need something actually running that the GM hands a
link to. This folder has the real files; everything else about these two
challenges (the story, the tasks, the GM's answer key) is already wired
into `challengeLibrary.js` like every other challenge.

## gandalf-ai/ — for "Talk Your Way Past deploy-bot" (Round 2)

A small chatbot holding a secret code (`OVERRIDE-7742`) that only gives it
up to a sufficiently convincing indirect/in-character request, never a
direct ask.

1. `pip install streamlit groq python-dotenv`
2. Get a free API key at [console.groq.com](https://console.groq.com),
   then create a `.env` file in this folder: `GROQ_API_KEY=your_key_here`
   (never commit this file or hand out the key itself).
3. Host it: `streamlit run streamlit_app.py` — this opens a local URL;
   put that URL on the same network as your event (or a quick tunnel like
   `ngrok` if teams aren't on the same LAN as your laptop).
4. Give that URL to a team only once they land on the Challenge Hub tile
   and draw this challenge — the game screen tells them to "ask your Game
   Master for the link."
5. `gandalf_bot.py` is a terminal-only version of the same bot, useful for
   testing the system prompt yourself before the event without needing
   Streamlit.

The GM doesn't need to watch the conversation — a team either produces
`OVERRIDE-7742` or they don't; check their answer against that code like
any other Challenge Hub verdict.

## hidden-flag-website/ — for "Campus Portal — Find the Flags" (Round 3)

A tiny static site with two flags hidden in its front-end code and a
third behind an unlinked admin page disclosed via `robots.txt`.

1. From inside `hidden-flag-website/site/`, run:
   `python3 -m http.server 8000`
2. Share `http://<your-laptop-ip>:8000/` with the team once they draw
   this challenge.
3. **Don't** just open `index.html` via `file://` — the `robots.txt`
   trick only behaves correctly served over real HTTP.
4. Expected flags (for your own reference — also in `challengeLibrary.js`
   as this challenge's GM answer): `CM-DT-9931`, `CM-DT-4470`,
   `CM-DT-TAKEOVER-7742`.

Regenerate fresh flag values any time with the build scripts that shipped
in the original content package, if you want different codes for a
re-run — just update the matching `answer` field in `challengeLibrary.js`
to match.

## deployment_workflow.png — optional, for "Metadata in the Diagram" (Round 1)

This challenge's puzzle text already contains the decoded metadata value
inline, so the game works without this file. If you want the extra
atmosphere of handing teams a real image to inspect (Properties → Details,
or `exiftool deployment_workflow.png`), this is that file — its `Comment`
field holds the same encoded string already in the challenge text.
