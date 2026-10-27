#!/usr/bin/env node
// Create (or reset the password of) an admin login.
//   node scripts/create-user.mjs <username> --remote   (live site)
//   node scripts/create-user.mjs <username> --local    (local testing)
// You'll be asked for the password; it is never stored in plain text.
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline';

const [username, target] = process.argv.slice(2);
if (!username || !['--remote', '--local'].includes(target)) {
  console.error('Usage: node scripts/create-user.mjs <username> --remote|--local');
  process.exit(1);
}
if (!/^[a-z0-9._-]{3,50}$/i.test(username)) {
  console.error('Username: 3–50 letters, numbers, dots, dashes or underscores.');
  process.exit(1);
}

function ask(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => rl.output.write(s.includes(question) ? s : '');
    rl.question(question, (a) => { rl.close(); process.stdout.write('\n'); resolve(a); });
  });
}

const password = process.env.NOTED_PASSWORD || (await ask('Password (min 10 characters): '));
if (password.length < 10) {
  console.error('Password must be at least 10 characters.');
  process.exit(1);
}
const iterations = 100000;
const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
const stored = `pbkdf2$${iterations}$${salt.toString('base64')}$${hash.toString('base64')}`;
const user = username.toLowerCase();
const sql = `INSERT INTO users (username, pass_hash, created_at) VALUES ('${user}', '${stored}', ${Date.now()}) ON CONFLICT(username) DO UPDATE SET pass_hash = excluded.pass_hash; DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE username = '${user}');`;

execFileSync('npx', ['wrangler', 'd1', 'execute', 'noted-db', target, '--command', sql], { stdio: 'inherit' });
console.log(`\nLogin ready for "${user}". Sign in at /admin.`);
