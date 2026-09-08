/* ============================================================
   CYBER MONOPOLY — QUIZ BANK
   Multiple-choice questions used two ways:
   1. Landing on Community Chest / Chance / Incident Zone —
      answer solo for a reward.
   2. Cyber Duel — both teams race the same question; fastest
      correct answer wins.
   Extensible: just add more entries to QUIZ_BANK.
   ============================================================ */

const QUIZ_BANK = [
  {
    id: 'q01',
    question: 'What does "HTTPS" add on top of plain HTTP?',
    options: ['Faster page loads', 'Encryption of data in transit', 'Automatic backups', 'Ad blocking'],
    correctIndex: 1,
  },
  {
    id: 'q02',
    question: 'Which of these is the strongest password?',
    options: ['password123', 'Tr0ub4dor&3', 'correct-horse-battery-staple-42!', 'qwerty'],
    correctIndex: 2,
  },
  {
    id: 'q03',
    question: 'What is "phishing"?',
    options: [
      'A type of firewall',
      'Tricking someone into revealing sensitive information',
      'A method of data compression',
      'A network cable standard',
    ],
    correctIndex: 1,
  },
  {
    id: 'q04',
    question: 'What does MFA stand for?',
    options: ['Multi-Factor Authentication', 'Main File Access', 'Managed Firewall Application', 'Mandatory File Archiving'],
    correctIndex: 0,
  },
  {
    id: 'q05',
    question: 'A VPN primarily helps with which of these?',
    options: ['Increasing screen resolution', 'Encrypting and routing your network traffic', 'Speeding up your CPU', 'Compressing images'],
    correctIndex: 1,
  },
  {
    id: 'q06',
    question: 'What is the main purpose of a firewall?',
    options: [
      'Store passwords securely',
      'Filter and control incoming/outgoing network traffic',
      'Encrypt files on disk',
      'Back up data automatically',
    ],
    correctIndex: 1,
  },
  {
    id: 'q07',
    question: 'Which of these best describes "ransomware"?',
    options: [
      'Software that speeds up your computer',
      'Malware that encrypts files and demands payment',
      'A type of antivirus',
      'A network monitoring tool',
    ],
    correctIndex: 1,
  },
  {
    id: 'q08',
    question: 'What is a "zero-day" vulnerability?',
    options: [
      'A bug that takes zero days to fix',
      'A flaw unknown to the vendor with no patch yet available',
      'A virus that self-deletes after one day',
      'An expired SSL certificate',
    ],
    correctIndex: 1,
  },
  {
    id: 'q09',
    question: 'Which port is commonly associated with HTTPS traffic?',
    options: ['21', '80', '443', '3306'],
    correctIndex: 2,
  },
  {
    id: 'q10',
    question: 'What does "DDoS" stand for?',
    options: [
      'Direct Data over Socket',
      'Distributed Denial of Service',
      'Dual Domain Server',
      'Dynamic Disk over Storage',
    ],
    correctIndex: 1,
  },
  {
    id: 'q11',
    question: 'Two-factor authentication typically combines a password with what?',
    options: ['A second password', 'Something you have or are (e.g. a code or fingerprint)', 'A louder alarm', 'A longer username'],
    correctIndex: 1,
  },
  {
    id: 'q12',
    question: 'What is the safest way to handle a suspicious email attachment?',
    options: ['Open it to see what it is', 'Forward it to friends', "Don't open it and report/verify first", 'Rename the file extension'],
    correctIndex: 2,
  },
  {
    id: 'q13',
    question: 'What does "SOC" stand for in a security context?',
    options: ['Security Operations Center', 'System Output Controller', 'Server Optimization Cycle', 'Software Ownership Contract'],
    correctIndex: 0,
  },
  {
    id: 'q14',
    question: 'Which of these is an example of a "social engineering" attack?',
    options: [
      'A brute-force password cracker',
      'Someone impersonating IT support over the phone to get your password',
      'A malfunctioning router',
      'A slow internet connection',
    ],
    correctIndex: 1,
  },
  {
    id: 'q15',
    question: 'What is the main risk of reusing the same password across multiple sites?',
    options: [
      'It uses more memory',
      'One breached site can compromise all your other accounts',
      'It slows down login',
      'Browsers block it automatically',
    ],
    correctIndex: 1,
  },
  {
    id: 'q16',
    question: 'What does "encryption at rest" mean?',
    options: [
      'Encrypting data only while it travels over a network',
      'Encrypting data while it is stored on disk',
      'Turning off encryption to save power',
      'A type of screen lock',
    ],
    correctIndex: 1,
  },
  {
    id: 'q17',
    question: 'Which practice best follows the principle of "least privilege"?',
    options: [
      'Giving every employee admin access for convenience',
      'Giving users only the access they need for their role',
      'Sharing one admin account among the whole team',
      'Disabling all permissions for everyone',
    ],
    correctIndex: 1,
  },
  {
    id: 'q18',
    question: 'What is the purpose of regularly patching/updating software?',
    options: [
      'To change the app icon',
      'To fix known security vulnerabilities',
      'To increase file size',
      'To reset all user passwords',
    ],
    correctIndex: 1,
  },
  {
    id: 'q19',
    question: 'What best describes an "IoT" device?',
    options: [
      'A type of programming language',
      'A physical device connected to the internet (e.g. smart camera, sensor)',
      'A cloud storage plan',
      'An encryption algorithm',
    ],
    correctIndex: 1,
  },
  {
    id: 'q20',
    question: 'If your account shows a login from a country you have never visited, what should you do first?',
    options: [
      'Ignore it, it is probably nothing',
      'Change your password and enable MFA immediately',
      'Delete your account',
      'Wait a week to see if it happens again',
    ],
    correctIndex: 1,
  },
];

function pickQuiz(excludeId) {
  let pool = QUIZ_BANK;
  if (excludeId) {
    const filtered = QUIZ_BANK.filter(q => q.id !== excludeId);
    if (filtered.length) pool = filtered;
  }
  const item = pool[Math.floor(Math.random() * pool.length)];
  return { ...item, options: [...item.options] };
}

module.exports = { QUIZ_BANK, pickQuiz };
