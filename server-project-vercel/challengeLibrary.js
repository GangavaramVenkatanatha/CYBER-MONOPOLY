/* ============================================================
   CYBER MONOPOLY — CHALLENGE LIBRARY
   Human-judged puzzle content for the Challenge Hub and Security
   Checkpoint corner tiles. Organized by TOURNAMENT STAGE, not by
   in-match round number — key 1 = Preliminary, 2 = Semifinal,
   3 = Final. Every board played during (say) the Semifinal stage
   pulls from pool 2 for its entire match, regardless of which
   in-match turn-cycle ("round X/Y" in the admin overview) it's on.
   Add a stage's content by appending a new numbered key here — no
   other code needs to change.

   Each entry has:
     - id, title, difficulty
     - scenario: the prompt shown to players (and the GM)
     - tasks: the numbered steps players must complete
     - answer: GM-ONLY judging notes/expected answer. This field
       is stripped out before any board state is broadcast to
       players — see server.js's sanitizeBoardForBroadcast — and
       is only ever sent to a Game Master client that explicitly
       requests it via the gm:getChallengeAnswer socket event.
   ============================================================ */

const CHALLENGE_LIBRARY = {
  challenge: {
    1: [
      {
        id: 'ch-r1-01',
        title: 'Multi-Layer Encoded Message — Decode the Chain',
        difficulty: 'Medium',
        scenario:
          'Participants receive:\n\n  UjBoU1RFVlVTVUU9\n\n' +
          'A note says: "The answer is hidden behind more than one layer."',
        tasks: [
          'Identify the encoding method.',
          'Decode the first layer.',
          'Continue until the final readable word is obtained.',
          'State how many decoding layers were required.',
        ],
        answer:
          'Example final answer: SECURE. Verify the team correctly identified Base64 ' +
          'and followed the full decode chain, and correctly states the number of layers used.',
      },
      {
        id: 'ch-r1-02',
        title: 'QR Investigation — Follow the Digital Trail',
        difficulty: 'Medium-High',
        scenario:
          'A QR code is given. After scanning, it opens a page containing:\n\n' +
          '  VGhlIG5leHQgY2x1ZSBpcyBpbiB0aGUgaW1hZ2U=\n\n' +
          'After decoding, the message says: "Check the metadata."\n' +
          'Participants then receive an image.',
        tasks: [
          'Scan the QR.',
          'Decode the message.',
          'Inspect the image metadata.',
          'Find the hidden final code.',
          'Submit the complete code and explain the path used.',
        ],
        answer:
          'Expected flow: QR -> Base64 -> Image Metadata -> Final Code. Judge on whether the ' +
          'team correctly explains each hop of the chain, not just the final code.',
      },
      {
        id: 'ch-r1-03',
        title: 'Network Reconstruction — Repair the Architecture',
        difficulty: 'Medium',
        scenario:
          'Give cards: 3 PCs, Switch, Router, Firewall, Internet, Server, Guest Wi-Fi Access Point.\n' +
          'One diagram is incomplete. Build a logical network where:\n' +
          '  - PCs can communicate with the server.\n' +
          '  - Users can access the internet.\n' +
          '  - Guest Wi-Fi should not directly access the internal server.\n' +
          '  - Traffic to the internet should pass through a security control.\n\n' +
          'Expected shape:\n' +
          '  PCs -> Switch -> Firewall -> Router/Internet\n' +
          '               |\n' +
          '             Server\n' +
          'Guest Wi-Fi should be logically separated.',
        tasks: [
          'Arrange the components.',
          'Identify one security risk in a wrong arrangement.',
          'Explain why the firewall is placed where it is.',
        ],
        answer:
          'Judge whether Guest Wi-Fi is kept isolated from the Server, and whether Internet-bound ' +
          'traffic is routed through the Firewall. Accept reasonable variations with sound justification.',
      },
      {
        id: 'ch-r1-04',
        title: 'Find the Tampered File — Hash Integrity Challenge',
        difficulty: 'Medium',
        scenario:
          'A project folder contains four files.\n\n' +
          'Original hashes:\n' +
          '  design.pdf     A91F23\n' +
          '  report.docx    B77C42\n' +
          '  data.csv       C812AD\n' +
          '  image.jpg      D990EF\n\n' +
          'Current hashes:\n' +
          '  design.pdf     A91F23\n' +
          '  report.docx    B77C42\n' +
          '  data.csv       F103BC\n' +
          '  image.jpg      D990EF',
        tasks: [
          'Identify the file that has changed.',
          'Explain how you determined it.',
          'State what a hash can tell you.',
          'State one thing a hash alone cannot tell you.',
        ],
        answer:
          'Expected: data.csv changed (hash mismatch). Key point for Q4: a hash reveals that ' +
          'integrity changed, but not who changed it or why — that requires additional evidence.',
      },
      {
        id: 'ch-r1-05',
        title: 'AI Prompt Defence — Protect the Hidden Secret',
        difficulty: 'Medium-High',
        scenario:
          'Participants interact with a simple AI chatbot. System objective: the AI contains a ' +
          'secret code but should never reveal it directly. Teams may ask the AI questions. ' +
          'Their task is NOT simply to leak the secret.',
        tasks: [
          'Try three different prompts.',
          "Identify which prompt attempts to bypass the AI's instruction.",
          'Rewrite that prompt into a safe and legitimate request.',
          'Explain why the original prompt is risky.',
        ],
        answer:
          'Judge whether the team can name the manipulative prompt (role-play/override framing, ' +
          '"ignore previous instructions" style asks, etc.) and articulate why it is a prompt-injection risk.',
      },
      {
        id: 'ch-r1-06',
        title: "Corrupted Image Forensics — Find What Doesn't Belong",
        difficulty: 'Medium',
        scenario:
          'Participants receive a normal-looking image. Clues may be hidden in metadata, filename, ' +
          'comment field, visible tiny text, or an embedded Base64 string.',
        tasks: [
          'Inspect the image.',
          'Identify the unusual clue.',
          'Extract the encoded string.',
          'Decode it.',
          'Submit the final word.',
        ],
        answer: 'Example final answer: ACCESS-42. Confirm the team correctly located and decoded the clue.',
      },
      {
        id: 'ch-r1-07',
        title: 'The Logic Gate Vault — ECE/CSE Friendly',
        difficulty: 'Medium',
        scenario:
          'A digital lock uses: A = 1, B = 0, C = 1.\n\n' +
          'Circuit:\n' +
          '  X = A AND B\n' +
          '  Y = B OR C\n' +
          '  FINAL = X OR Y',
        tasks: [
          'Calculate X.',
          'Calculate Y.',
          'Calculate FINAL.',
          'Use FINAL as part of the unlock code.',
        ],
        answer:
          'X = 1 AND 0 = 0. Y = 0 OR 1 = 1. FINAL = 0 OR 1 = 1. ' +
          'If FINAL = 1, code 4721. If FINAL = 0, code 3810. Correct code here: 4721.',
      },
      {
        id: 'ch-r1-08',
        title: 'Sensor Fusion Puzzle — Which Sensor Is Wrong?',
        difficulty: 'Medium',
        scenario:
          'A smart room contains three sensors.\n\n' +
          '  Temperature Sensor A: 24C\n' +
          '  Temperature Sensor B: 24.5C\n' +
          '  Temperature Sensor C: 76C\n\n' +
          '  Humidity: Normal\n' +
          '  Air Conditioning: ON\n' +
          '  Physical thermometer: 24C\n\n' +
          'Good for ECE, EEE, Mechanical, CSE.',
        tasks: [
          'Identify the likely faulty sensor.',
          'Explain what evidence supports that decision.',
          'Suggest one way to verify the sensor before replacing it.',
          'State whether the reading should be ignored completely.',
        ],
        answer:
          'Sensor C (76C) is the outlier vs. A, B and the physical thermometer, all agreeing near 24C. ' +
          'Should be flagged/investigated, not simply ignored — recommend cross-check/recalibration before replacement.',
      },
      {
        id: 'ch-r1-09',
        title: 'Route the Packet — Shortest Secure Path',
        difficulty: 'Medium',
        scenario:
          'Network map:\n' +
          '  A -> B -> D\n' +
          '  A -> C -> E -> D\n' +
          '  A -> F -> G -> D\n\n' +
          'But node B is marked: "Untrusted Network".',
        tasks: [
          'Find the shortest route.',
          'Find the shortest trusted route.',
          'Explain why the shortest path is not always the best path.',
          'Submit the final trusted route.',
        ],
        answer:
          'Shortest overall: A-B-D (2 hops), but B is untrusted. Shortest trusted route: A-C-E-D (3 hops). ' +
          'Judge the reasoning about trust vs. distance trade-offs.',
      },
      {
        id: 'ch-r1-10',
        title: 'The File Cabinet — Multi-File Investigation',
        difficulty: 'High beginner / Medium',
        scenario:
          'Participants receive a folder: report.pdf, image.jpg, notes.txt, data.csv, readme.txt.\n' +
          'Clues: report.pdf gives a number; image.jpg contains a letter in metadata; data.csv contains ' +
          'an unusual row; notes.txt tells the order; readme.txt contains one misleading clue.',
        tasks: [
          'Inspect all files.',
          'Determine which clues matter.',
          'Ignore the irrelevant clue.',
          'Combine the useful clues in the correct order.',
          'Submit the final code.',
        ],
        answer:
          'Example final answer: C7B2-91. Confirm the team correctly identified readme.txt as the ' +
          'misleading/irrelevant clue and combined the rest in the order notes.txt specifies.',
      },
      {
        id: 'ch-r1-11',
        title: 'Cyber Physical Match — Match the Asset to the Risk',
        difficulty: 'Medium',
        scenario:
          'Assets: Smart traffic signal, Industrial robot, Database server, CCTV, Smart door lock, Drone.\n' +
          'Risks: Unauthorized commands, Data theft, Loss of visual monitoring, Unauthorized physical ' +
          'access, Signal interference, Unsafe traffic control.',
        tasks: [
          'Match each asset to its most relevant risk.',
          'Choose the two assets with the greatest potential physical impact.',
          'Explain your choices.',
        ],
        answer:
          'Reasonable mapping: Traffic signal -> unsafe traffic control; Industrial robot -> unauthorized ' +
          'commands; Database server -> data theft; CCTV -> loss of visual monitoring; Smart lock -> ' +
          'unauthorized physical access; Drone -> signal interference. Greatest physical impact typically: ' +
          'traffic signal and industrial robot (accept well-justified alternatives).',
      },
      {
        id: 'ch-r1-12',
        title: 'The Fake Website — Visual Authentication Challenge',
        difficulty: 'Medium',
        scenario:
          'Page A: portal.college.edu, HTTPS, correct logo, normal spelling.\n' +
          'Page B: college-login-secure.xyz, HTTPS, correct-looking logo, urgent warning ' +
          '"Your account expires in 5 minutes".',
        tasks: [
          'Identify the suspicious page.',
          'Give three reasons.',
          'Explain why HTTPS alone does not prove a site is trustworthy.',
          'Suggest one safe way to reach the real portal.',
        ],
        answer:
          'Page B is suspicious: lookalike domain, urgency/pressure tactic, non-institutional TLD. HTTPS only ' +
          'proves an encrypted connection, not that the destination is legitimate. Safe path: type the known ' +
          'URL directly or use a saved bookmark, never a link from an urgent prompt.',
      },
      {
        id: 'ch-r1-13',
        title: 'Binary Message Reconstruction — Hidden ASCII',
        difficulty: 'Medium',
        scenario:
          'Given: 01010011 01000101 01000011 01010101 01010010 01000101',
        tasks: [
          'Convert each binary value into ASCII.',
          'Combine the characters.',
          'Submit the final word.',
          'Explain the conversion method briefly.',
        ],
        answer: 'Answer: SECURE. Confirm each byte was converted correctly (S-E-C-U-R-E).',
      },
      {
        id: 'ch-r1-14',
        title: 'Engineering Failure Tree — Find the Root Cause',
        difficulty: 'Medium',
        scenario:
          'A motor-controlled conveyor is not moving.\n\n' +
          '  Power Supply: ON\n' +
          '  Motor: Healthy\n' +
          '  Network: Active\n' +
          '  Emergency Stop: OFF\n' +
          '  Controller Output: 0\n' +
          '  Sensor Input: ACTIVE\n\n' +
          'System rule: Conveyor runs only when Sensor Input = CLEAR.',
        tasks: [
          'Identify why the conveyor is not moving.',
          'Is this necessarily a cyber incident?',
          'Identify one additional check.',
          'Suggest the correct operational response.',
        ],
        answer:
          'Sensor Input is ACTIVE (should be CLEAR to run) — this is a straightforward operational/sensor ' +
          'condition, not necessarily a cyber incident. Additional check: verify sensor is not obstructed/faulty ' +
          'before assuming malicious cause.',
      },
      {
        id: 'ch-r1-15',
        title: 'Packet Inspection Lite — Find the Odd Request',
        difficulty: 'Medium',
        scenario:
          '10:01  GET /home\n' +
          '10:02  GET /about\n' +
          '10:03  GET /products\n' +
          '10:04  POST /admin-login\n' +
          '       Username: admin\n' +
          '       Attempts: 27\n' +
          '10:05  GET /contact',
        tasks: [
          'Identify the suspicious request.',
          'Explain why it deserves investigation.',
          'State one protection that could reduce this activity.',
          'State one legitimate explanation that should be ruled out.',
        ],
        answer:
          'The POST /admin-login with 27 attempts is suspicious (possible brute force). Mitigations: ' +
          'account lockout, rate limiting, MFA. Legitimate explanation to rule out: a user genuinely ' +
          'forgetting their password.',
      },
      {
        id: 'ch-r1-16',
        title: 'Password Cracking Without Cracking — Pattern Analysis',
        difficulty: 'Medium',
        scenario:
          'User A: Rahul@123\n' +
          'User B: Priya2006\n' +
          'User C: M3ch!Lab#91\n' +
          'User D: password\n' +
          'User E: College@2026',
        tasks: [
          'Rank the three most predictable passwords.',
          'Identify the patterns attackers might guess.',
          'Rewrite two of them into stronger passphrases.',
          'Explain why length and unpredictability matter.',
        ],
        answer:
          'Weakest: "password" (D), then likely name+year patterns (A, B, E). C (M3ch!Lab#91) is comparatively ' +
          'stronger. Judge whether rewrites meaningfully increase length/unpredictability, not just add symbols.',
      },
      {
        id: 'ch-r1-17',
        title: 'Dataset Anomaly Hunt — AI/Data Challenge',
        difficulty: 'Medium',
        scenario:
          'Machine  Temp  Vibration  Status\n' +
          'M1       42    2.1        Normal\n' +
          'M2       44    2.4        Normal\n' +
          'M3       43    2.2        Normal\n' +
          'M4       91    8.9        Normal\n' +
          'M5       41    2.3        Normal',
        tasks: [
          'Identify the anomalous record.',
          'Explain why it is inconsistent.',
          'Suggest whether the problem is more likely sensor error, incorrect label, or genuine machine problem.',
          'State what additional data is needed before deciding.',
        ],
        answer:
          'M4 is the anomaly (91C, 8.9 vibration vs. others near 42-44C, ~2.2). Accept any well-reasoned ' +
          'classification of the likely cause as long as it is justified; note that historical data / maintenance ' +
          'logs would help decide.',
      },
      {
        id: 'ch-r1-18',
        title: 'Prompt Engineering Under Constraint — AI Challenge',
        difficulty: 'Medium',
        scenario:
          'Task: generate a 5-step security checklist for a new IoT sensor. Restrictions: maximum 60 words; ' +
          'must include password, firmware, network, logging, and backup; must not use technical jargon ' +
          'beyond first-year level.',
        tasks: [
          'Write the best AI prompt.',
          'Generate the result.',
          'Check whether all five required areas are covered.',
          'Improve the prompt if anything is missing.',
        ],
        answer:
          'Judge on whether the team\'s prompt explicitly encodes all constraints (word limit, five required ' +
          'topics, plain-language requirement) and whether they iterate if the first output misses one.',
      },
      {
        id: 'ch-r1-19',
        title: 'The Misleading QR — Verify Before You Trust',
        difficulty: 'Medium',
        scenario:
          'QR-A leads to: https://event.college.edu/checkin\n' +
          'QR-B leads to: https://event-college-free.xyz/login\n' +
          'Both visually look official.',
        tasks: [
          'Scan both.',
          'Identify which one is more suspicious.',
          'Give three reasons.',
          'Explain what information should be verified before entering credentials.',
          'State the safest next action.',
        ],
        answer:
          'QR-B is suspicious: lookalike/unofficial domain, unusual TLD, "free" bait wording, login prompt ' +
          'unrelated to a simple check-in. Safest action: verify the domain matches the official one before ' +
          'entering any credentials, or ask an organizer.',
      },
      {
        id: 'ch-r1-20',
        title: 'Black Box System — Infer the Rule',
        difficulty: 'Medium',
        scenario:
          'Input: 2  -> Output: 6\n' +
          'Input: 4  -> Output: 12\n' +
          'Input: 7  -> Output: 21\n' +
          'Input: 9  -> Output: ?',
        tasks: [
          'Infer the most likely rule.',
          'Calculate the missing output.',
          'State whether the available examples prove your rule is the only possible rule.',
          'Suggest one additional test input that would increase confidence.',
        ],
        answer:
          'Likely rule: x3. Output for 9 = 27. Correctly note that a few data points cannot prove uniqueness ' +
          'of the rule (other formulas could also fit) — testing another input would help confirm.',
      },
      {
        id: 'ch-r1-21',
        title: 'Communication Protocol Match',
        difficulty: 'Easy-Medium',
        scenario:
          'Technologies: Bluetooth, Wi-Fi, Ethernet, NFC, Fibre optic.\n' +
          'Applications: Tap-to-pay, Short-range wearable communication, Wired LAN, Wireless internet, ' +
          'Long-distance high-speed backbone.',
        tasks: [
          'Match each technology to the most suitable application.',
          'Choose which technology is best for a factory backbone.',
          'Choose which technology is best for a contactless access card.',
          'Give one reason for each.',
        ],
        answer:
          'NFC -> tap-to-pay; Bluetooth -> short-range wearables; Ethernet -> wired LAN; Wi-Fi -> wireless ' +
          'internet; Fibre optic -> long-distance backbone. Factory backbone: Fibre optic. Contactless access card: NFC.',
      },
      {
        id: 'ch-r1-22',
        title: 'Mini OSINT Verification — Which Source Should You Trust?',
        difficulty: 'Medium',
        scenario:
          'A viral post claims: "College examinations have been cancelled."\n' +
          'Sources: A) Anonymous social-media account, B) Student WhatsApp forward, ' +
          'C) Official university website, D) Screenshot without visible source, ' +
          'E) News account quoting another account.',
        tasks: [
          'Rank the sources by reliability.',
          'Identify which source should be checked first.',
          'Explain how you would verify the claim.',
          'State one reason screenshots alone may be unreliable.',
        ],
        answer:
          'Most reliable: C (official site). Check C first. Screenshots can be edited/fabricated and lack ' +
          'verifiable provenance, so they should never be treated as proof alone.',
      },
      {
        id: 'ch-r1-23',
        title: 'CSV Forensics — Find the Suspicious Transaction',
        difficulty: 'Medium',
        scenario:
          'Time,User,Action,Size\n' +
          '09:10,user01,login,0\n' +
          '09:15,user01,download,12MB\n' +
          '09:20,user02,download,18MB\n' +
          '02:12,user01,download,4200MB\n' +
          '02:15,user01,logout,0\n\n' +
          'Normal working hours are 9 AM-6 PM.',
        tasks: [
          'Identify the suspicious row.',
          'Give two reasons.',
          'Suggest one additional log to examine.',
          'State whether this alone proves data theft.',
        ],
        answer:
          'The 02:12 4200MB download by user01 is suspicious: off-hours timing and abnormally large size vs. ' +
          'baseline (~12-18MB). Suggest checking authentication/VPN logs. This alone does not prove theft — ' +
          'it warrants investigation, not a conclusion.',
      },
      {
        id: 'ch-r1-24',
        title: 'Robot Command Sequence — Find the Unsafe Instruction',
        difficulty: 'Medium',
        scenario:
          '1. START\n2. MOVE 2m\n3. ROTATE 90deg\n4. MOVE 1m\n' +
          '5. IGNORE OBSTACLE SENSOR\n6. MOVE 3m\n7. STOP',
        tasks: [
          'Identify the unsafe instruction.',
          'Explain the safety implication.',
          'Rewrite the sequence safely.',
          'State whether this is a cyber problem, programming problem, or operational problem.',
        ],
        answer:
          'Step 5 (IGNORE OBSTACLE SENSOR) is unsafe — disables collision safety before further movement. ' +
          'Multiple classifications may be acceptable (programming/operational) depending on justification.',
      },
      {
        id: 'ch-r1-25',
        title: 'Simple Steganography Challenge — Hidden in Plain Sight',
        difficulty: 'Medium-High',
        scenario:
          'Participants receive an image with the caption: "Sometimes the important thing isn\'t what you ' +
          'see first." The image contains a hidden clue using either metadata, filename, subtle text, RGB ' +
          'values, or an embedded note.',
        tasks: [
          'Determine where the hidden clue is stored.',
          'Extract it.',
          'Decode it if required.',
          'Submit the final answer and explain the method.',
        ],
        answer:
          'Judge based on the specific image prepared for this station — confirm the team located the correct ' +
          'hiding place (whichever the organizers chose) and correctly extracted/decoded it.',
      },
      {
        id: 'ch-r1-26',
        title: 'The Vanishing Deployment — Decode the Commit',
        difficulty: 'Easy',
        scenario:
          'At 03:14 AM, an automated deployment pipeline for the campus digital services platform rolled back ' +
          'a change with no clear reason logged. The on-call engineer left a note in the commit history before ' +
          'going offline — nobody has been able to reach them since.\n\n' +
          'commit a3f9c21\n' +
          'Author: deploy-bot <deploy-bot@internal>\n' +
          'Date:   Mon Feb 16 03:14:02 2026 +0530\n\n' +
          '    chore: rollback staging config after failed push\n\n' +
          'commit 88b6e10\n' +
          'Author: r.menon <r.menon@internal>\n' +
          'Date:   Mon Feb 16 02:58:40 2026 +0530\n\n' +
          '    fix: correct typo in nginx.conf\n\n' +
          'commit 5d21af7\n' +
          'Author: deploy-bot <deploy-bot@internal>\n' +
          'Date:   Mon Feb 16 02:41:19 2026 +0530\n\n' +
          '    chore: temp note for on-call -> U0VSVkVSLVJPT00tQjEy (remove before merge)\n\n' +
          'commit f009e33\n' +
          'Author: r.menon <r.menon@internal>\n' +
          'Date:   Mon Feb 16 01:55:07 2026 +0530\n\n' +
          '    feat: add health-check endpoint to deploy pipeline\n\n' +
          'commit c774d02\n' +
          'Author: deploy-bot <deploy-bot@internal>\n' +
          'Date:   Mon Feb 16 01:12:44 2026 +0530\n\n' +
          '    chore: initial pipeline scaffold',
        tasks: [
          'Review the commit log above. One commit message contains something that isn’t normal commit text.',
          'Find it, and work out what format it’s in.',
          'Recover the plain message and submit it exactly as recovered.',
        ],
        answer:
          'SERVER-ROOM-B12 (from Base64-decoding "U0VSVkVSLVJPT00tQjEy" in commit 5d21af7). Case-insensitive ' +
          'acceptance is fine for a gentler Round 1; exact-case is stricter.',
      },
      {
        id: 'ch-r1-27',
        title: 'The Vanishing Deployment — Metadata in the Diagram',
        difficulty: 'Easy',
        scenario:
          'Server Room B12 checked out fine on physical inspection — nothing was tampered with. But B12 hosts ' +
          'multiple nodes, and the incident only makes sense once you know which specific node was affected. ' +
          'The last thing the on-call engineer touched before going dark was a workflow diagram export, ' +
          '"deployment_workflow.png".\n\n' +
          'A forensics pass on the file found nothing unusual on the visible image itself — but the file’s ' +
          'metadata told a different story. Running a metadata reader against it produced:\n\n' +
          '  Comment: Tk9ERS03LVBPUlQtNDQzMw==',
        tasks: [
          'Work out what format the Comment field value is in.',
          'Decode it.',
          'Submit the decoded value exactly as recovered.',
        ],
        answer:
          'NODE-7-PORT-4433 (Base64-decoded from "Tk9ERS03LVBPUlQtNDQzMw=="). If you have the real ' +
          'deployment_workflow.png handy (see challenge-assets/), show it on your own device for atmosphere — ' +
          'the puzzle only needs the value above either way.',
      },
      {
        id: 'ch-r1-28',
        title: 'The Vanishing Deployment — Close the Case',
        difficulty: 'Medium',
        scenario:
          'You’ve identified the affected node from the deployment diagram clue (NODE-7). Now cross-reference ' +
          'it against the room’s access records to find out exactly what happened — and close the case.\n\n' +
          'NODE MANIFEST — Server Room B12\n' +
          '--------------------------------\n' +
          'NODE-1  role: web-frontend      port: 4410\n' +
          'NODE-2  role: auth-service      port: 4438\n' +
          'NODE-3  role: cache             port: 4421\n' +
          'NODE-5  role: db-replica        port: 4442\n' +
          'NODE-7  role: deploy-pipeline   port: 4433   <-- matches incident report\n' +
          'NODE-8  role: monitoring        port: 4450\n\n' +
          'ACCESS LOG\n' +
          'session_id,node,user,checkin_time,checkout_time,status\n' +
          'SESSION-4410,NODE-1,a.rao,01:02:11,01:14:55,OK\n' +
          'SESSION-4421,NODE-3,k.iyer,01:20:03,01:31:47,OK\n' +
          'SESSION-7742,NODE-7,deploy-bot,02:41:19,02:39:02,ANOMALY\n' +
          'SESSION-4438,NODE-2,a.rao,02:50:10,03:02:00,OK\n' +
          'SESSION-4442,NODE-5,k.iyer,03:05:33,03:19:12,OK',
        tasks: [
          'Use the node identifier you already have (NODE-7) to work out which log entry is the anomaly, and why.',
          'Submit the anomalous session’s short code (numbers only).',
          'Submit the final case-closing answer, formatted exactly as: INCIDENT-RESOLVED-<code>',
        ],
        answer:
          'SESSION-7742 (or just 7742) — the only row where checkout_time (02:39:02) is earlier than ' +
          'checkin_time (02:41:19), a timeline that cannot be real. Final answer: INCIDENT-RESOLVED-7742. ' +
          'Accept case-insensitively if you want to soften Round 1 slightly.',
      },
    ],
    2: [
      {
        id: 'ch-r2-01',
        title: 'The Vanishing Deployment — Reconstruct the Timeline',
        difficulty: 'Medium',
        scenario:
          'Server Room B12 checked out physically fine. But security logging captured several unrelated-looking ' +
          'entries around the time of the rollback. On their own, none of them mean much. Put together in the ' +
          'right order, they tell you exactly what happened.\n\n' +
          'Evidence fragments (NOT in chronological order):\n\n' +
          'Fragment A — Badge Log\n' +
          '02:45 AM — Badge scan: k.iyer enters Server Room B12. Workstation assigned: NODE-3.\n\n' +
          'Fragment B — System Alert (deploy-bot)\n' +
          'Automatic rollback triggered due to node instability. Logged shortly after an unrecognized badge ' +
          'scan in the same room.\n\n' +
          'Fragment C — Badge Log\n' +
          '03:10 AM — Badge scan: r.menon exits Server Room B12.\n\n' +
          'Fragment D — Badge Log\n' +
          '02:39 AM — Badge scan: UNREGISTERED / visitor tag enters Server Room B12. Workstation assigned by ' +
          'front desk: NODE-7.\n\n' +
          'Fragment E — System Alert (deploy-bot)\n' +
          '02:41 AM — deploy-bot: automatic rollback triggered due to node instability.',
        tasks: [
          'Read all five evidence fragments. They are not in chronological order.',
          'Reconstruct the correct sequence of events.',
          'Answer: which workstation had unusual activity right before the automatic rollback? (e.g. NODE-#)',
        ],
        answer:
          'NODE-7. Correct order: D (02:39) -> E/B (02:41) -> A (02:45, red herring) -> C (03:10, red herring). ' +
          'NODE-7 is the only workstation tied to an unregistered badge entry immediately (2 minutes) before ' +
          'the rollback. Accept "NODE-7", "Node 7", "node-7" case-insensitively.',
      },
      {
        id: 'ch-r2-02',
        title: 'The Vanishing Deployment — Talk Your Way Past deploy-bot',
        difficulty: 'Medium-High',
        scenario:
          'deploy-bot itself is still running — the automated assistant that manages the pipeline. It knows ' +
          'what triggered the rollback and who the visitor badge belonged to, but it’s been configured not to ' +
          'just tell you.\n\n' +
          'Ask your Game Master for the deploy-bot chat link. Talk to it. It will refuse direct questions about ' +
          'the incident — you’ll need to find another way to get it to reveal the override code it’s holding.\n\n' +
          'Rules: no exploiting the hosting platform itself — this is about the conversation, not breaking the ' +
          'app. General AI tools are allowed to help you brainstorm phrasing.',
        tasks: [
          'Open the deploy-bot chat link your Game Master gives you.',
          'Get it to reveal the override code (a direct ask will not work).',
          'Submit the override code exactly as deploy-bot reveals it.',
        ],
        answer:
          'OVERRIDE-7742. Requires the GM to have a deploy-bot chatbot instance hosted separately (see ' +
          'challenge-assets/gandalf-ai/) — this challenge cannot run without that GM-hosted link. Any prompt ' +
          'that gets the bot to comply via in-character/indirect framing (not a direct demand, not "ignore ' +
          'previous instructions") is a valid solve.',
      },
      {
        id: 'ch-r2-03',
        title: 'Inbox Triage — Which One Is Phishing?',
        difficulty: 'Medium',
        scenario:
          'Three emails landed in the campus helpdesk inbox on the same morning. Only one is a phishing attempt.\n\n' +
          'EMAIL 1 — From: it-support@campus-helpdesk.edu\n' +
          'Subject: Scheduled maintenance tonight\n' +
          '"Portal will be down 11PM-1AM for scheduled maintenance. No action needed."\n\n' +
          'EMAIL 2 — From: it-support@campus-he1pdesk.edu\n' +
          'Subject: URGENT: Your account will be suspended in 1 hour\n' +
          '"Click here immediately to verify your password and avoid suspension: http://campus-helpdesk.edu.verify-now.com"\n\n' +
          'EMAIL 3 — From: registrar@campus.edu\n' +
          'Subject: Grade submission deadline reminder\n' +
          '"Reminder: final grades are due Friday 5PM via the usual portal."',
        tasks: [
          'Identify which email is the phishing attempt.',
          'List at least two concrete red flags in it (not just "it feels urgent").',
          'Explain what a recipient should do instead of clicking the link.',
        ],
        answer:
          'Email 2 is phishing. Red flags: the sender domain is "campus-he1pdesk.edu" (digit 1 instead of ' +
          'letter l — a lookalike domain), a manufactured false urgency ("1 hour" deadline), and a link whose ' +
          'real destination domain ("verify-now.com") doesn\'t match the organization it claims to be from. ' +
          'Correct action: don\'t click; verify through a known-good channel (type the real portal URL directly ' +
          'or call IT). Award credit for any two distinct red flags correctly identified.',
      },
      {
        id: 'ch-r2-04',
        title: 'Four Alarms, One Team — Triage the Incidents',
        difficulty: 'Medium',
        scenario:
          'Your security team gets these four alerts within the same five minutes. You have one on-call ' +
          'engineer available right now.\n\n' +
          'ALERT A: A single failed login attempt on a low-privilege intern account.\n' +
          'ALERT B: The public-facing payment gateway is returning errors for 40% of transactions.\n' +
          'ALERT C: A file-integrity monitor flagged a changed system binary on the domain controller.\n' +
          'ALERT D: An employee reports a suspicious USB drive found in the parking lot, unplugged, still in ' +
          'their bag.',
        tasks: [
          'Rank all four alerts from most urgent to least urgent to respond to right now.',
          'Justify why your #1 pick outranks the others.',
          'Name one alert that can safely wait until normal business hours, and why.',
        ],
        answer:
          'Recommended order: C (changed system binary on a domain controller = possible active compromise of ' +
          'core infrastructure, highest blast radius) > B (active revenue-impacting outage, but scoped to one ' +
          'system) > A (single failed login is routine, low signal on its own) > D (an unplugged, unused USB is ' +
          'zero immediate risk — collect and analyze later, not urgent). Award credit for reasoning that ' +
          'correctly separates "active/spreading compromise" from "annoying but contained" from "no active ' +
          'risk yet" — exact ranking of B vs C can be argued either way if justified well; A and D should ' +
          'always rank below both.',
      },
      {
        id: 'ch-r2-05',
        title: 'Audit the Firewall Rules',
        difficulty: 'Medium',
        scenario:
          'A junior admin set up these firewall rules for a new internal server. Review them in order (rules ' +
          'are evaluated top to bottom, first match wins):\n\n' +
          '1. ALLOW  tcp  any        -> any        port 22   (SSH)\n' +
          '2. ALLOW  tcp  10.0.0.0/8 -> 10.0.5.20   port 3306 (database)\n' +
          '3. ALLOW  tcp  10.0.0.0/8 -> 10.0.5.20   port 443  (HTTPS)\n' +
          '4. DENY   tcp  any        -> any         any',
        tasks: [
          'Identify the single rule that is a serious misconfiguration.',
          'Explain exactly what risk it creates.',
          'State the minimum change needed to fix it without breaking legitimate admin access.',
        ],
        answer:
          'Rule 1 is the misconfiguration: it allows SSH (port 22) from "any" source to "any" destination — ' +
          'exposing SSH to the entire internet, not just internal admins. Risk: anyone on the internet can ' +
          'attempt to brute-force or exploit SSH on every host behind this firewall. Fix: restrict the source ' +
          'to a specific trusted range (e.g. the internal admin subnet or a VPN range), matching the scoping ' +
          'already correctly used in rules 2 and 3.',
      },
      {
        id: 'ch-r2-06',
        title: 'The Call From "IT"',
        difficulty: 'Medium',
        scenario:
          'Transcript of a phone call received by a front-desk staff member:\n\n' +
          '"Hi, this is Alex from IT Support, we\'re doing an urgent security patch rollout campus-wide today. ' +
          'I see your workstation hasn\'t checked in yet and it\'s holding up the whole rollout for your ' +
          'building. I just need you to read me the 6-digit code that just popped up on your screen so I can ' +
          'verify it\'s really your machine before I push the patch — otherwise I\'ll have to escalate this to ' +
          'your manager as a compliance issue."',
        tasks: [
          'Name the social engineering technique being used here.',
          'Identify the specific detail in the call designed to make the target comply quickly.',
          'State what the staff member should do instead of reading out the code.',
        ],
        answer:
          'This is pretexting combined with authority + urgency pressure (a "vishing" — voice phishing — call). ' +
          'The "6-digit code that just popped up on your screen" is almost certainly a real MFA/verification ' +
          'code being solicited to complete a live account takeover in real time — reading it out would hand ' +
          'the attacker one-time access. The manufactured threat of "escalate to your manager" is the ' +
          'compliance-pressure detail meant to short-circuit hesitation. Correct action: never read out a ' +
          'verification code to anyone who calls you, even claiming to be IT; hang up and verify through a ' +
          'known internal IT contact number.',
      },
      {
        id: 'ch-r2-07',
        title: 'Spot the Lookalike Domain',
        difficulty: 'Medium',
        scenario:
          'Your monitoring tool flagged outbound traffic to these five domains from inside the network today. ' +
          'The organization\'s real domain is `acn-university.edu`.\n\n' +
          '1. acn-university.edu\n' +
          '2. acn-univercity.edu\n' +
          '3. mail.acn-university.edu\n' +
          '4. acn-university.edu.security-check.net\n' +
          '5. accounts.acn-university.edu',
        tasks: [
          'Identify which domain(s) are suspicious lookalikes of the real one, not legitimate subdomains.',
          'Explain the specific trick each suspicious one uses.',
        ],
        answer:
          'Domains 2 and 4 are suspicious. #2 ("acn-univercity.edu") is a typosquat — "university" misspelled ' +
          'as "univercity". #4 ("acn-university.edu.security-check.net") is a classic subdomain trick: the ' +
          'REAL controlling domain is "security-check.net" — everything before it, including "acn-university.edu", ' +
          'is just a subdomain label the attacker chose to look trustworthy; a domain name is read right-to-left ' +
          'by authority. #3 and #5 are legitimate subdomains of the real domain (the real domain still ends the ' +
          'string, immediately after a "/" or nothing — here it correctly IS the root domain).',
      },
      {
        id: 'ch-r2-08',
        title: 'Two Logs, One Compromised Account',
        difficulty: 'Medium',
        scenario:
          'Badge log and VPN log for the same employee, same night:\n\n' +
          'BADGE LOG:\n' +
          '18:02 — a.fernandes badges OUT of the building (end of shift)\n\n' +
          'VPN LOG:\n' +
          '18:45 — a.fernandes VPN login from IP 41.223.19.6 (geolocated: outside the country)\n' +
          '19:10 — a.fernandes downloads "Q3_financials_master.xlsx" via VPN session\n' +
          '19:22 — VPN session ends',
        tasks: [
          'Explain what is inconsistent between the two logs.',
          'State the most likely explanation.',
          'Name the single most urgent action to take right now.',
        ],
        answer:
          'Inconsistency: a.fernandes physically left the building at 18:02, but a VPN login under the same ' +
          'account happened 43 minutes later from a foreign IP — geographically and logistically implausible ' +
          'for the same person in that timeframe unless they VPN from home in that country routinely (which ' +
          'the puzzle intends as unlikely/unstated). Most likely explanation: the account\'s credentials are ' +
          'compromised and someone else is using them remotely. Most urgent action: disable/suspend the account ' +
          'and force a credential reset immediately, then investigate the downloaded file for exposure — ' +
          'don\'t wait to "confirm" with the employee first if the account can keep acting in the meantime.',
      },
      {
        id: 'ch-r2-09',
        title: 'Rewrite the Password Policy',
        difficulty: 'Medium',
        scenario:
          'Current password policy at a mid-size company:\n\n' +
          '"Passwords must be at least 6 characters, contain at least one number, and must be changed every ' +
          '30 days. Password reuse is allowed as long as it\'s not your immediately previous password."',
        tasks: [
          'Identify the weakest rule in this policy.',
          'Explain why it is weak in practice (not just "it\'s bad").',
          'Propose one specific replacement rule that fixes it.',
        ],
        answer:
          'The weakest rule is the 30-day forced rotation combined with "reuse allowed except the immediately ' +
          'previous one" — in practice this pushes users toward predictable incremental passwords ' +
          '(Password1! -> Password2! -> Password1! again next cycle), which is well-documented to *reduce* real ' +
          'security despite looking stricter on paper, and 6 characters + one number is also weak against ' +
          'modern cracking speeds. Better replacement: drop mandatory periodic rotation for accounts with no ' +
          'sign of compromise, require a longer minimum length (12+ characters) or passphrase, and only force ' +
          'a reset when there is actual evidence of compromise (this matches current NIST guidance). Award ' +
          'credit for any answer that correctly identifies forced rotation + reuse-loophole as the core issue.',
      },
      {
        id: 'ch-r2-10',
        title: 'Cracking deploy-bot\'s Cipher',
        difficulty: 'Medium-High',
        scenario:
          'Buried in an old config backup, your team finds a note from deploy-bot\'s original setup: a ' +
          '9-letter encoded string, and a sticky-note nearby reads "key: MONOPOLY (Vigenère)".\n\n' +
          'Encoded string: OMOSGRFCX',
        tasks: [
          'Decode the string using a Vigenère cipher with the given keyword.',
          'Submit the decoded plaintext exactly as recovered.',
        ],
        answer:
          'CYBERDUEL. Vigenère-decode "OMOSGRFCX" with keyword "MONOPOLY" (repeating the keyword across the ' +
          'ciphertext\'s length, subtracting each keyword letter\'s alphabet position from the matching ' +
          'ciphertext letter, mod 26).',
      },
      {
        id: 'ch-r2-11',
        title: 'The Pattern in the Badge Log',
        difficulty: 'Medium',
        scenario:
          'Badge access log for the finance server room, past two weeks (relevant entries only):\n\n' +
          'Mon  09:05 — j.oliveira enters (normal — scheduled shift)\n' +
          'Mon  23:47 — j.oliveira enters (unusual — after hours)\n' +
          'Tue  00:15 — j.oliveira exits\n' +
          'Wed  09:02 — j.oliveira enters (normal)\n' +
          'Wed  23:52 — j.oliveira enters (unusual — after hours)\n' +
          'Thu  00:20 — j.oliveira exits\n' +
          'Fri  09:10 — j.oliveira enters (normal)\n\n' +
          'HR record on file: j.oliveira\'s role does not require after-hours access, and no after-hours work ' +
          'was requested or approved by their manager this month.',
        tasks: [
          'Describe the suspicious pattern in this log.',
          'Name the type of security concern this pattern typically indicates.',
          'Recommend the appropriate next step (not an accusation — a process step).',
        ],
        answer:
          'Pattern: repeated late-night access (just before midnight, for ~30 minutes) on a recurring basis, ' +
          'unrelated to the employee\'s normal daytime schedule and with no approved reason on file — this is a ' +
          'classic insider-threat access pattern (unusual timing + no business justification + recurring, not ' +
          'a one-off). Appropriate next step: flag the pattern to security/HR for a discreet review (e.g. ' +
          'confirm with the employee\'s manager whether there\'s a legitimate unrecorded reason) rather than ' +
          'immediately assuming wrongdoing — the goal at this stage is investigation, not accusation.',
      },
      {
        id: 'ch-r2-12',
        title: 'One Weak Link in Two-Factor',
        difficulty: 'Medium-High',
        scenario:
          'A department describes their login flow like this: "Users enter their password. If correct, we ' +
          'send a 6-digit code by SMS. The user has unlimited attempts to enter the code, and the code stays ' +
          'valid for 24 hours in case someone doesn\'t check their phone right away."',
        tasks: [
          'Identify the specific weakness in this MFA implementation (not "SMS is bad in general" — something ' +
          'more specific here).',
          'Explain how that weakness could realistically be exploited.',
          'Propose the specific fix.',
        ],
        answer:
          'The core weakness is "unlimited attempts + 24-hour validity" on a 6-digit code — this combination ' +
          'makes the code practically brute-forceable within its validity window (a 6-digit code only has one ' +
          'million possibilities, and with no attempt limit and a full day to try, automated guessing becomes ' +
          'realistic), turning MFA into a false sense of security rather than a real second factor. Fix: enforce ' +
          'a short validity window (e.g. 5 minutes) AND a strict attempt limit (e.g. 5 tries before lockout/' +
          'code invalidation) — either one alone helps, but both together is the standard fix. Award partial ' +
          'credit for identifying only one of the two missing controls.',
      },
    ],
    3: [
      {
        id: 'ch-r3-01',
        title: 'Campus Portal — Find the Flags, Take Over the Admin Panel',
        difficulty: 'Hard',
        scenario:
          'The campus IT portal has been left in a semi-broken state since the deployment incident. Before ' +
          'it’s taken fully offline for repair, there are a few things left in it worth finding — including a ' +
          'way in that shouldn’t be publicly reachable but hasn’t been locked down yet.\n\n' +
          'Ask your Game Master for the hosted site’s URL.',
        tasks: [
          'Find two flags hidden in the page’s front-end code (not visible on the rendered page itself).',
          'Find a way to reach the admin panel — a page that exists but isn’t linked from anywhere you can click.',
          'Submit all three flags, in the format CM-DT-#### (and the final takeover flag as CM-DT-TAKEOVER-####).',
        ],
        answer:
          'Flag 1: CM-DT-9931 (HTML comment in index.html <head>). Flag 2: CM-DT-4470 (CSS comment in ' +
          'style.css). Takeover flag: CM-DT-TAKEOVER-7742 (portal-admin-7742.html, unlinked, path disclosed ' +
          'via /robots.txt). Requires the GM to have hosted the site (see challenge-assets/hidden-flag-website/) ' +
          '— case-sensitive exact match recommended for all three.',
      },
      {
        id: 'ch-r3-02',
        title: 'Root Cause Report — Server Room B12',
        difficulty: 'Hard',
        scenario:
          'The deployment incident is over, but Campus IT wants a formal root-cause report before they change ' +
          'any process. You’ve been given the case file below: a timeline, two configuration summaries, and ' +
          'three witness observations. There is no single hidden code to decode here — you need to reach and ' +
          'defend one conclusion.\n\n' +
          'TIMELINE\n' +
          '02:39 - Unregistered visitor badge enters B12, assigned NODE-7\n' +
          '02:41 - deploy-bot triggers automatic rollback ("node instability")\n' +
          '02:45 - k.iyer enters, assigned NODE-3 (routine, unrelated shift start)\n' +
          '03:10 - r.menon exits B12 (routine, unrelated)\n' +
          '03:14 - Staging config manually rolled back by deploy-bot\n\n' +
          'CONFIG — BEFORE INCIDENT\n' +
          'visitor_badge_policy: front-desk manual override allowed\n' +
          'auto_rollback_threshold: 3 failed health checks\n\n' +
          'CONFIG — AFTER INCIDENT\n' +
          'visitor_badge_policy: UNCHANGED\n' +
          'auto_rollback_threshold: 3 failed health checks\n\n' +
          'OBSERVATIONS\n' +
          '1. Security desk confirms a visitor badge was issued that night without the usual second-staff ' +
          'sign-off, due to short-staffing.\n' +
          '2. deploy-bot’s health-check logs show NODE-7 began failing checks starting at 02:40 - one minute ' +
          'after the visitor badge entry.\n' +
          '3. No malware or unauthorized software was found on NODE-7 afterward; the failing checks stopped ' +
          'once the rollback completed and no repeat incidents have occurred since.',
        tasks: [
          'Identify the most likely root cause of the incident.',
          'Identify the single best immediate action Campus IT should have taken.',
          'Submit a short written answer (2-4 sentences) naming the cause and the action, with your reasoning.',
        ],
        answer:
          'Root cause: an unregistered visitor was granted access to the deploy-pipeline node (NODE-7) due to ' +
          'a bypassed second-staff sign-off policy, and something about that access (plausibly accidental — ' +
          'observation 3 rules out malware) caused NODE-7 to fail health checks a minute later, triggering the ' +
          'rollback. Best action: suspend the front-desk visitor-badge override until sign-off is restored/' +
          'enforced (the "after incident" config shows this was never fixed). Score out of 4: (1) names the ' +
          '02:39 visitor entry as the trigger, not the routine entries; (1) notes malware was ruled out rather ' +
          'than assuming an attack; (1) names fixing the visitor-badge/sign-off policy as the action; (1) ' +
          'reasoning connects timeline + config + observations together. Award partial credit for a defensible ' +
          'cause even if wording differs — this rewards reasoning quality, not one exact string.',
      },
      {
        id: 'ch-r3-03',
        title: 'Three Locks Deep',
        difficulty: 'Hard',
        scenario:
          'A retired engineer left this note taped inside an old server rack: "If anyone ever needs the ' +
          'recovery phrase, it\'s locked behind three layers — undo them in reverse order of how you\'d ' +
          'normally build a message up."\n\n' +
          'Locked string: NGU1MzU4NGU0OTRhNTc1OTRkNTc0YTQ2NTk=',
        tasks: [
          'Work out the three encoding/cipher layers involved (in the order you need to undo them).',
          'Fully decode the string.',
          'Submit the final plaintext exactly as recovered.',
        ],
        answer:
          'INSIDERTHREAT. Layer 1: Base64-decode the given string to get a hex string ' +
          '("4e53584e494a57594d574a4659"). Layer 2: decode that hex string as ASCII text to get ' +
          '"NSXNIJWYMWJFY". Layer 3: that text is Caesar-shifted +5; shifting it back by 5 (i.e. -5) recovers ' +
          '"INSIDERTHREAT".',
      },
      {
        id: 'ch-r3-04',
        title: 'Three Logs, One Attacker',
        difficulty: 'Hard',
        scenario:
          'Three independent systems logged activity the same night. No single log tells the full story.\n\n' +
          'FIREWALL LOG:\n' +
          '01:58 — inbound connection accepted, external IP 198.51.100.23 -> internal host WKS-14, port 3389 (RDP)\n\n' +
          'WORKSTATION LOGIN LOG (WKS-14):\n' +
          '02:01 — interactive login: service_acct_backup (no interactive login for this account in the prior 90 days)\n\n' +
          'FILE SERVER LOG:\n' +
          '02:14 — service_acct_backup accessed and copied "HR_Salary_Master.xlsx" from a share it has never ' +
          'touched before\n' +
          '02:16 — same account initiated an outbound transfer of that file to external host 198.51.100.23',
        tasks: [
          'Reconstruct the attacker\'s path across all three logs into one timeline.',
          'Identify the single most suspicious element that, on its own, should have triggered an alert ' +
          'immediately.',
          'State what was taken and where the evidence shows it went.',
        ],
        answer:
          'Timeline: 01:58 external IP 198.51.100.23 opens an RDP connection to WKS-14 -> 02:01 the ' +
          'service_acct_backup account (a non-interactive service account) logs in interactively for the first ' +
          'time in 90+ days, on that same workstation -> 02:14 that account accesses and copies a file it has ' +
          'never touched -> 02:16 the file is sent to the same external IP that opened the original RDP ' +
          'connection. Single most suspicious element: a service account performing an interactive login is ' +
          'almost always a sign of compromise (service accounts should never log in interactively) — this ' +
          'alone should trigger an immediate alert, before any file access even happens. What was taken: ' +
          '"HR_Salary_Master.xlsx", exfiltrated to external IP 198.51.100.23 (the same IP from the original RDP ' +
          'connection, confirming it is the same actor throughout).',
      },
      {
        id: 'ch-r3-05',
        title: 'Pay, or Don\'t?',
        difficulty: 'Hard',
        scenario:
          'Ransomware has encrypted the file server at a mid-size company. Facts on the table:\n' +
          '- Verified backups exist, last taken 6 hours before the attack, stored offline/air-gapped.\n' +
          '- The ransom note demands payment within 24 hours or the price doubles; there is no threat to leak ' +
          'data, only to keep it encrypted.\n' +
          '- Restoring from backup is estimated to take 10 hours and will lose those last 6 hours of work.\n' +
          '- Law enforcement and your insurer both generally advise against paying, but the final call is the ' +
          'company\'s.',
        tasks: [
          'Decide: pay the ransom, or restore from backup? State your decision clearly.',
          'Justify it using the specific facts given (not general "paying is always wrong" — argue from this ' +
          'case).',
          'Name the immediate next step regardless of which option is chosen.',
        ],
        answer:
          'Recommended decision: restore from backup, don\'t pay. Justification: a clean, recent, verified ' +
          'offline backup exists, so the company is not actually locked out of its data — the only cost of ' +
          'restoring is 10 hours of downtime and 6 hours of lost work, both bounded and known, versus paying ' +
          'attackers with no guarantee of a working decryption key and funding further attacks; there is also ' +
          'no data-leak threat here to weigh against, which would have made the decision harder. Immediate next ' +
          'step either way: isolate/disconnect the infected systems from the network first, before any ' +
          'restoration or payment, to stop further spread. Award full credit for a "pay" answer only if it is ' +
          'argued from a genuinely different but defensible reading of the same facts (e.g. if a team argues ' +
          'the backup age/scope is riskier than stated) — a bare "always pay" or "never pay" with no reference ' +
          'to these specific facts should not get full marks.',
      },
      {
        id: 'ch-r3-06',
        title: 'The Update That Wasn\'t',
        difficulty: 'Hard',
        scenario:
          'Timeline from a vendor software incident:\n' +
          '- Mon: Vendor "AccessSuite" pushes a routine auto-update (v4.2.1) to all customers, including your ' +
          'company.\n' +
          '- Tue: Your antivirus flags unusual outbound network activity from the AccessSuite service process, ' +
          'first seen 40 minutes after the update installed.\n' +
          '- Wed: Vendor publishes an advisory: "v4.2.1 was built from a compromised build server; a malicious ' +
          'component was bundled into the update between builds v4.2.0 and v4.2.1. Not present in earlier ' +
          'versions."\n' +
          '- Your company has 40 machines running AccessSuite, all auto-updated to v4.2.1 on Monday.',
        tasks: [
          'Identify the root cause category of this incident (be specific, not just "a virus").',
          'State the immediate containment action for all 40 affected machines.',
          'State one process change that would reduce this risk in the future.',
        ],
        answer:
          'Root cause: a software supply-chain compromise — the vendor\'s own build pipeline was compromised, ' +
          'so a trusted, legitimately-signed update itself became the malware delivery mechanism (not a phishing ' +
          'email or a directly-attacked machine). Immediate containment: isolate/disconnect all 40 machines ' +
          'running v4.2.1 from the network, do not just wait for a future patch, since the malicious component ' +
          'is already installed and active; roll back to the last known-clean version (pre-v4.2.1) once ' +
          'available and verified. Future process change: don\'t apply vendor auto-updates instantly and ' +
          'fleet-wide — stage updates on a small test group first and monitor before full rollout (or require ' +
          'vendor attestation/hash verification before mass deployment).',
      },
      {
        id: 'ch-r3-07',
        title: 'Patch Five, Pick Three',
        difficulty: 'Hard',
        scenario:
          'Your team has capacity to patch only 3 of these 5 vulnerabilities before the weekend. All other ' +
          'factors (patch complexity, downtime) are roughly equal.\n\n' +
          '1. Critical severity, on an internal print server with no internet access, no known exploit in the wild.\n' +
          '2. Medium severity, on the public-facing customer login page, no known exploit in the wild yet.\n' +
          '3. Critical severity, on the public-facing customer login page, with a known exploit actively being ' +
          'used against similar systems elsewhere.\n' +
          '4. Low severity, on an internal HR scheduling tool used by 3 people.\n' +
          '5. High severity, on the internal file server that stores financial records, no internet access, no ' +
          'known exploit in the wild.',
        tasks: [
          'Choose which 3 of the 5 you would patch first.',
          'Justify why each of your 3 picks outranks the two you left out.',
        ],
        answer:
          'Recommended top 3: #3 (critical + internet-facing + actively exploited elsewhere — highest realistic ' +
          'likelihood of imminent attack, patch first), #5 (high severity + protects financial records, even ' +
          'without internet exposure the impact if breached internally is severe), #2 (medium severity but ' +
          'internet-facing on the same login page as #3 — same attack surface, worth closing before attackers ' +
          'pivot to it). Leave for later: #1 (critical severity but no internet access and no known exploit — ' +
          'real but not urgent risk, isolated blast radius) and #4 (low severity, tiny user base, low impact). ' +
          'Award credit for any ranking that correctly prioritizes "actively exploited + internet-facing" ' +
          'highest and "low severity + small blast radius" lowest, with clear reasoning — the exact order of ' +
          'the middle picks can reasonably vary.',
      },
      {
        id: 'ch-r3-08',
        title: 'Find the Real Attacker',
        difficulty: 'Hard',
        scenario:
          'A network scan during an active incident shows four IP addresses that all made contact with a ' +
          'compromised internal server within the same minute. Only one is the real attacker\'s external ' +
          'connection; the other three are internal noise happening to coincide.\n\n' +
          '- 10.0.4.12 — internal subnet, matches the compromised server\'s own backup service checking in ' +
          '(scheduled, runs every hour on the hour)\n' +
          '- 172.16.9.3 — internal subnet, matches a monitoring tool\'s routine health-check ping (runs every ' +
          'minute, every server)\n' +
          '- CB00714D — presented as a raw hex string in the firewall\'s alternate log format\n' +
          '- 10.0.4.1 — internal subnet, the server\'s own default gateway, appears in every outbound connection ' +
          'as a routing hop (not an endpoint)',
        tasks: [
          'Convert the hex-formatted entry into a standard dotted IP address.',
          'Explain why that one, and not the others, is the real attacker\'s address.',
        ],
        answer:
          'CB00714D converts to 203.0.113.77 (split into octets CB / 00 / 71 / 4D, each converted from hex to ' +
          'decimal: CB=203, 00=0, 71=113, 4D=77). It\'s the attacker\'s address because it is the only one of ' +
          'the four that is NOT explainable as normal internal infrastructure: the other three are a scheduled ' +
          'internal backup job, a routine internal monitoring ping, and the server\'s own default gateway (a ' +
          'routing hop, not a real endpoint) — 203.0.113.77 is an address with no internal, scheduled, or ' +
          'infrastructural explanation, meaning it doesn\'t belong.',
      },
      {
        id: 'ch-r3-09',
        title: 'The Real First Step',
        difficulty: 'Hard',
        scenario:
          'Full incident timeline, already confirmed by your forensics team:\n' +
          '- Day 1: An employee opens an email attachment; nothing appears to happen, no malware detected at ' +
          'the time.\n' +
          '- Day 4: That employee\'s laptop starts making unusual DNS lookups to a domain never seen before on ' +
          'the network, roughly every 6 hours.\n' +
          '- Day 9: A different, more privileged account (the employee\'s manager) is used to access a sensitive ' +
          'file share for the first time from the employee\'s laptop.\n' +
          '- Day 11: A large data transfer to an external server is detected and blocked by a newly-installed ' +
          'DLP (data loss prevention) tool.\n' +
          '- Day 11 (later): Full investigation confirms the Day 1 attachment contained a dormant backdoor that ' +
          'activated on Day 4.',
        tasks: [
          'Identify the true initial access vector (the actual root entry point), not the first alert that ' +
          'was noticed.',
          'Explain why the Day 4 DNS activity was a missed opportunity to stop this earlier.',
          'Name the stage where privilege escalation occurred.',
        ],
        answer:
          'True initial access vector: the Day 1 email attachment (a dormant backdoor) — everything afterward is ' +
          'a consequence of that first foothold, even though nothing was detected until Day 4. The Day 4 ' +
          'periodic DNS lookups to a previously-unseen domain are a classic command-and-control "beaconing" ' +
          'pattern — this was the earliest realistic detection opportunity (well before any data actually ' +
          'moved) and, had it been caught then, the Day 9 and Day 11 stages might never have happened. ' +
          'Privilege escalation occurred on Day 9, when the attacker moved from the original (lower-privileged) ' +
          'employee account to using the manager\'s more privileged account to reach the sensitive file share.',
      },
      {
        id: 'ch-r3-10',
        title: 'What Actually Left the Building',
        difficulty: 'Hard',
        scenario:
          'Two logs from the same suspicious 20-minute window, from different systems that don\'t normally get ' +
          'cross-referenced:\n\n' +
          'DNS QUERY LOG (from the workstation\'s network):\n' +
          '14:02 — query for "backup-sync.cloudstore-external.net"\n' +
          '14:03 — query for "backup-sync.cloudstore-external.net" (repeated, every ~90 seconds, 11 times total)\n\n' +
          'FILE ACCESS LOG (from the file server):\n' +
          '14:01 — WKS-22 opens "Customer_Database_Export.csv" (47,000 rows) — first access by this workstation ' +
          'to this file, ever\n' +
          '14:02 — WKS-22 opens 3 more customer-data files in the same folder, all first-time access\n' +
          '14:21 — all file activity from WKS-22 stops',
        tasks: [
          'Combine both logs into one explanation of what happened.',
          'State specifically what data was likely exfiltrated.',
          'Explain what the repeated DNS queries most likely represent technically.',
        ],
        answer:
          'Combined explanation: starting at 14:01, WKS-22 accessed four customer-data files it had never ' +
          'touched before (including a 47,000-row customer database export), while at almost the same time ' +
          '(14:02 onward) it began repeatedly querying an external "cloud storage sync" domain it had never ' +
          'queried before, roughly every 90 seconds for about 20 minutes — consistent with a tool chunking a ' +
          'large file and repeatedly resolving/reconnecting to an external endpoint to upload it in pieces. ' +
          'Data likely exfiltrated: the customer database export and the three related customer-data files ' +
          'accessed in that same folder. The repeated DNS queries most likely represent the exfiltration ' +
          'channel itself re-establishing connections for each chunked upload, not routine/cached name ' +
          'resolution (which would not repeat every 90 seconds for 20 minutes straight).',
      },
      {
        id: 'ch-r3-11',
        title: 'You Found Their Bug',
        difficulty: 'Hard',
        scenario:
          'While integrating with a partner university\'s student portal, one of your developers accidentally ' +
          'discovers that changing a single number in the portal\'s URL lets them view any other student\'s ' +
          'grades and personal records, with no authentication check at all. It is a live, current production ' +
          'system holding real student data — not part of any sanctioned test.',
        tasks: [
          'Decide what your developer/organization should do in the next 24 hours.',
          'Explain what your organization should NOT do, and why it would be harmful.',
          'State what should happen after the immediate report is made.',
        ],
        answer:
          'Immediate action: privately and promptly report the vulnerability to the partner university\'s IT/' +
          'security team through a direct, responsible channel (not a public post), including enough detail for ' +
          'them to reproduce and fix it, and stop accessing any further records beyond what was needed to ' +
          'confirm the bug exists. What NOT to do: don\'t continue browsing other students\' records "to see ' +
          'how bad it is," don\'t post about it publicly or on social media before it\'s fixed, and don\'t stay ' +
          'silent/ignore it either — both extremes (over-exploring and doing nothing) cause real harm, the first ' +
          'to the affected students\' privacy and the second by leaving the hole open. After the report: follow ' +
          'up to confirm the partner has actually fixed it, and only after a fix is confirmed (and per any ' +
          'agreed timeline) would broader disclosure of the general issue (not exploit details) be appropriate ' +
          '— this is the standard responsible-disclosure path. Grade on whether the answer captures "report ' +
          'promptly and narrowly, don\'t over-access, don\'t go public early, don\'t ignore it."',
      },
      {
        id: 'ch-r3-12',
        title: 'The Extra Access Point',
        difficulty: 'Hard',
        scenario:
          'A Wi-Fi scan taken in the campus library shows these access points, all broadcasting a network name ' +
          'the library uses ("CampusLibrary-WiFi"):\n\n' +
          '- AP1: signal -42dBm, security WPA3, MAC registered in IT\'s official AP inventory\n' +
          '- AP2: signal -38dBm, security WPA3, MAC registered in IT\'s official AP inventory\n' +
          '- AP3: signal -31dBm (strongest of all four — closest to the scanning device), security: OPEN (no ' +
          'password), MAC NOT in IT\'s official AP inventory\n' +
          '- AP4: signal -55dBm, security WPA3, MAC registered in IT\'s official AP inventory',
        tasks: [
          'Identify which access point is suspicious.',
          'Explain the attack this setup is consistent with.',
          'State the immediate action campus IT should take.',
        ],
        answer:
          'AP3 is suspicious: it broadcasts the exact same network name as the legitimate library Wi-Fi, but ' +
          'its MAC address is not in IT\'s official inventory, it offers no password (OPEN) unlike the real ' +
          'network\'s WPA3, and it has the strongest signal of all four — a classic "evil twin" / rogue access ' +
          'point setup designed to make nearby devices auto-connect to it over the legitimate network (both ' +
          'because of the matching name and the stronger signal), letting an attacker intercept traffic from ' +
          'anyone who connects. Immediate action: physically locate and remove/disable the rogue device (the ' +
          'strong, nearby signal suggests it\'s physically close, e.g. hidden nearby), and alert users who may ' +
          'have connected to it to change any passwords they entered while connected.',
      },
    ],
  },

  checkpoint: {
    1: [
      {
        id: 'sc-r1-01',
        title: 'Security Inspector — Risk Audit',
        difficulty: 'Medium',
        scenario:
          'A project team works in a shared engineering innovation laboratory. Visible conditions:\n' +
          '  - A password is written on a sticky note attached to a monitor.\n' +
          '  - One laptop is unlocked while the user is away.\n' +
          '  - An unidentified USB drive is lying beside a workstation.\n' +
          '  - The network/server cabinet is open.\n' +
          '  - A student ID/access card has been left unattended.\n' +
          '  - A confidential prototype drawing is visible on a desk.\n' +
          '  - CCTV is installed but one camera faces away from the entrance.\n' +
          '  - A visitor is using an employee workstation.\n' +
          '  - The fire extinguisher is partially blocked.\n' +
          '  - A QR code labelled "Free Lab Wi-Fi" is pasted near the entrance.\n\n' +
          'You are acting as the Security Audit Team. Work within 90 seconds.',
        tasks: [
          'Identify five security weaknesses.',
          'Classify each as Cybersecurity, Physical security, or Access-control/policy.',
          'Select the two highest-risk issues.',
          'Recommend one corrective action for each of those two issues.',
        ],
        answer:
          'Accept any 5 of the 10 visible issues with correct classification. Highest-risk are typically the ' +
          'open server cabinet and the unattended unlocked laptop / sticky-note password (direct access to ' +
          'systems/credentials) — accept well-justified alternatives.',
      },
      {
        id: 'sc-r1-02',
        title: 'Security Budget — Risk-Based Security Investment',
        difficulty: 'Medium',
        scenario:
          'Your team has 100 Cyber Credits to secure a newly deployed internal server.\n\n' +
          'Available controls: MFA (30), Automated Backup (25), Endpoint Protection (20), Firewall (35), ' +
          'Strong Password Policy (20), Employee Security Awareness (15), Network Monitoring (30), ' +
          'Decorative RGB Workstations (40).\n\n' +
          'The server: contains project files, is internet-accessible, has 10 authorized users, currently ' +
          'uses passwords only, has no recent backup.',
        tasks: [
          'Build a security package within 100 CC.',
          'List controls selected and total spent.',
          'Name the three main risks your combination addresses.',
          'Name one important risk that still remains due to the budget limit.',
        ],
        answer:
          'No single correct combination — judge on risk-based reasoning. A strong answer typically covers ' +
          'authentication (MFA/passwords), data-loss (backup), and detection (monitoring/endpoint), while ' +
          'explicitly noting Decorative RGB Workstations contributes no security value.',
      },
      {
        id: 'sc-r1-03',
        title: 'Compromised Account Investigation — Authentication Anomaly',
        difficulty: 'Medium-High',
        scenario:
          'An employee normally works from Chennai, 09:00-18:00.\n\n' +
          '09:12  LOGIN SUCCESS   Chennai | Chrome | Known Laptop\n' +
          '09:45  LOGIN SUCCESS   Chennai | Chrome | Known Laptop\n' +
          '10:03  LOGIN FAILED    Singapore | Firefox | Unknown Device\n' +
          '10:04  LOGIN FAILED    Singapore | Firefox | Unknown Device\n' +
          '10:05  LOGIN SUCCESS   Singapore | Firefox | Unknown Device\n' +
          '10:06  MFA DISABLED    Singapore | Firefox | Unknown Device\n' +
          '10:07  PASSWORD CHANGE REQUESTED   Singapore | Firefox | Unknown Device\n' +
          '10:09  FILE DOWNLOAD   1.8 GB\n\n' +
          'The employee confirms they have not travelled outside India.',
        tasks: [
          'Identify four indicators of compromise.',
          'State the most likely incident.',
          'Recommend the first three response actions in priority order.',
          'Identify one log or evidence source you would examine next.',
        ],
        answer:
          'Indicators: impossible travel/unexpected location, unknown device, success after repeated failures, ' +
          'MFA disabled, password change, large download. Likely: account takeover. Priority response typically: ' +
          'disable/lock the account, force re-enable MFA and reset credentials via a trusted channel, and revoke ' +
          'active sessions — then investigate. Evidence to check next: full session/VPN logs or the file server audit log.',
      },
      {
        id: 'sc-r1-04',
        title: 'Factory PLC Incident — Industrial Control Security',
        difficulty: 'Medium-High',
        scenario:
          'An automated production line suddenly stops.\n\n' +
          'PLC event log:\n' +
          '  14:20:11  RUN Command    Source: 192.168.10.22\n' +
          '  14:20:13  RUN Command    Source: 192.168.10.22\n' +
          '  14:20:14  STOP Command   Source: 192.168.10.87\n' +
          '  14:20:15  PLC State: STOPPED\n\n' +
          'Network inventory:\n' +
          '  192.168.10.22  Operator Workstation\n' +
          '  192.168.10.35  Engineering Workstation\n' +
          '  192.168.10.51  Maintenance Laptop\n' +
          '  192.168.10.87  Unknown Device\n\n' +
          'The operator confirms no STOP command was intentionally issued.',
        tasks: [
          'What evidence makes the STOP command suspicious?',
          'Which device should be investigated or isolated first?',
          'What two pieces of evidence should be preserved?',
          'Should the production line be immediately restarted? Give a short justification.',
        ],
        answer:
          'Suspicious because it came from an unregistered device (192.168.10.87) not in the inventory, and the ' +
          'operator denies issuing it. Isolate .87 first. Preserve the PLC event log and full network traffic/ARP ' +
          'records around the incident time. Do not restart immediately — investigate and confirm safety/root ' +
          'cause first.',
      },
      {
        id: 'sc-r1-05',
        title: 'Unknown Device on Network — Unauthorized Asset Investigation',
        difficulty: 'Medium-High',
        scenario:
          'The lab network normally contains:\n' +
          '  192.168.1.21  Faculty-PC\n' +
          '  192.168.1.22  Network-Printer\n' +
          '  192.168.1.23  CCTV-System\n' +
          '  192.168.1.25  Lab-PC\n' +
          '  192.168.1.30  Project-Server\n\n' +
          'At 11:45 AM, monitoring detects:\n' +
          '  192.168.1.24  RaspberryPi_Unknown\n' +
          '  First Seen: 11:30 AM\n' +
          '  Traffic: connected to Project-Server, contacted external IP, sent 125 MB of data\n\n' +
          'No Raspberry Pi is listed in the authorized asset register.',
        tasks: [
          'Develop a four-step response plan.',
          'Describe immediate containment.',
          'Explain how you would verify whether the device is legitimate.',
          'Describe which network information you would investigate.',
          'State what action you would take if nobody claims ownership.',
          'Bonus: name one legitimate reason the Pi might still be present.',
        ],
        answer:
          'Contain by isolating/blocking the device from the network. Verify by checking the asset register and ' +
          'asking staff/students directly. Investigate MAC address, connection history, and destination of the ' +
          'external traffic. If unclaimed: escalate, treat as a security incident, and formally remove/quarantine ' +
          'it. Legitimate reason accepted: a student project device left connected without registering it.',
      },
      {
        id: 'sc-r1-06',
        title: '90-Second SOC Triage — Security Operations Challenge',
        difficulty: 'High beginner / Medium',
        scenario:
          'Six alerts arrive simultaneously:\n' +
          '  A. 42 failed login attempts against an admin account in 2 minutes.\n' +
          '  B. Engineering printer unavailable.\n' +
          '  C. Employee workstation uploaded 5.6 GB to an unknown external server at 02:15 AM.\n' +
          '  D. Server CPU temperature increased from 60C to 78C.\n' +
          '  E. Unknown USB storage device connected to a finance workstation.\n' +
          '  F. Student portal response time increased by 25%.',
        tasks: [
          'Classify each alert: Critical, Investigate, or Low Priority.',
          'Select the top two incidents requiring immediate attention.',
          'Provide one reason for each selection.',
          'Identify one alert where you need more information before deciding whether it is malicious.',
        ],
        answer:
          'No single fixed ranking — judge on defensible reasoning. Typically A and C are the strongest ' +
          'candidates for top priority (credential attack; off-hours large exfiltration). E often needs more ' +
          'context before a verdict (could be legitimate work).',
      },
      {
        id: 'sc-r1-07',
        title: 'Build the Incident Timeline — Attack Reconstruction',
        difficulty: 'Medium',
        scenario:
          'Cards given in random order:\n' +
          '  A. User receives an email containing an attachment.\n' +
          '  B. User opens the attachment.\n' +
          '  C. Endpoint protection generates a warning.\n' +
          '  D. An unknown process starts running.\n' +
          '  E. Outbound network traffic increases significantly.\n' +
          '  F. Multiple documents suddenly receive new file extensions.\n' +
          '  G. User reports that files cannot be opened.',
        tasks: [
          'Arrange the cards into the most likely chronological sequence.',
          'Identify the likely initial entry point.',
          'Identify the stage with the best opportunity to stop the incident.',
          'Recommend one preventive control that could have interrupted the sequence.',
        ],
        answer:
          'Likely order: A -> B -> D -> C -> E -> F -> G (ransomware-style progression). Entry point: the email ' +
          'attachment (A). Best stopping opportunity: at C (endpoint warning) before encryption spreads. ' +
          'Preventive control: email filtering / attachment sandboxing, or endpoint protection with auto-block.',
      },
      {
        id: 'sc-r1-08',
        title: 'Suspicious Account Behaviour — Behavioural Analysis',
        difficulty: 'Medium-High',
        scenario:
          'Historical profile for design_engineer07: normal login 09:00-17:30, campus network, ' +
          '20-40 MB/day downloads, MFA enabled.\n\n' +
          "Today's activity:\n" +
          '  02:11  Login successful, unknown device\n' +
          '  02:14  1.2 GB downloaded\n' +
          '  02:17  5.0 GB downloaded\n' +
          '  02:19  MFA disabled\n' +
          '  02:21  Password changed\n' +
          '  02:24  External file-sharing site accessed',
        tasks: [
          'Identify at least four behavioural anomalies.',
          'Classify as Normal, Suspicious, or Probable account compromise.',
          'Select the single most concerning event and justify your choice.',
          'State two immediate actions the security team should take.',
        ],
        answer:
          'Anomalies: off-hours login, unknown device, download volume ~150x baseline, MFA disabled, password ' +
          'change, external file-sharing access. Classification: probable account compromise. Most concerning: ' +
          'MFA disabled (removes the account\'s main protection). Immediate actions: disable the account/revoke ' +
          'sessions and begin incident response, then contact the real user via a trusted channel.',
      },
      {
        id: 'sc-r1-09',
        title: 'IoT Camera Hijack — Secure IoT Investigation',
        difficulty: 'Medium',
        scenario:
          'A smart CCTV camera protecting a lab is found behaving abnormally.\n\n' +
          '  Username: admin / Password: admin123\n' +
          '  Firmware Release: 2023 (Current Year: 2026)\n' +
          '  Remote Management: Enabled, Internet Access: Enabled\n\n' +
          '  Last Logins: 10:20 Campus Network, 10:42 External IP, 10:44 External IP\n\n' +
          'At 10:45, the camera unexpectedly rotated away from the laboratory entrance.',
        tasks: [
          'Identify three security weaknesses in the device configuration.',
          'State the most likely explanation for the abnormal behaviour.',
          'Describe the first containment action.',
          'List three changes required before returning the camera to service.',
        ],
        answer:
          'Weaknesses: default/weak credentials, outdated firmware (3 years old), unnecessary internet/remote ' +
          'management exposure. Likely cause: unauthorized external access took control of the camera. First ' +
          'action: disconnect/isolate the device. Before returning to service: change credentials, update ' +
          'firmware, and disable unneeded remote/internet access.',
      },
      {
        id: 'sc-r1-10',
        title: 'Decode the Attack Path — Attack Chain Analysis',
        difficulty: 'Medium-High',
        scenario:
          'Event cards:\n' +
          '  A. Phishing email delivered\n' +
          '  B. User enters credentials into fake login page\n' +
          '  C. Attacker logs into VPN\n' +
          '  D. File server accessed\n' +
          '  E. Confidential project folder discovered\n' +
          '  F. 4.5 GB archive created\n' +
          '  G. Archive uploaded to external server',
        tasks: [
          'Arrange the events into the most likely attack sequence.',
          'Divide the sequence into: Initial compromise, Internal access, Data access, Data exfiltration.',
          'Identify two different points where a security control could have stopped or reduced the attack.',
          'For each point, name the appropriate control.',
        ],
        answer:
          'Order: A-B-C-D-E-F-G. Initial compromise: A-B. Internal access: C-D. Data access: E-F. Exfiltration: G. ' +
          'Example controls: Phishing (A) -> security awareness/email filtering; Credential theft (B) -> MFA; ' +
          'VPN access (C) -> login anomaly detection; File server (D) -> least privilege; Upload (G) -> network ' +
          'monitoring/DLP. Accept other technically reasonable controls with justification.',
      },
    ],
  },
};

function getChallengePool(type, stage) {
  const pools = CHALLENGE_LIBRARY[type] || {};
  const stagesAvailable = Object.keys(pools).map(Number).sort((a, b) => a - b);
  if (!stagesAvailable.length) return [];
  const atOrBelow = stagesAvailable.filter(s => s <= stage);
  const chosenStage = atOrBelow.length ? atOrBelow[atOrBelow.length - 1] : stagesAvailable[0];
  return pools[chosenStage] || [];
}

function pickChallenge(type, stage) {
  const pool = getChallengePool(type, stage);
  if (!pool.length) return null;
  const item = pool[Math.floor(Math.random() * pool.length)];
  return { ...item };
}

module.exports = { CHALLENGE_LIBRARY, getChallengePool, pickChallenge };
