import { json, error, readJson, str, verifyPassword, createSession } from '../../_lib.js';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const username = str(body.username, 'Username', { required: true, max: 50 }).toLowerCase();
  const password = str(body.password, 'Password', { required: true, max: 200 });

  const ip = request.headers.get('cf-connecting-ip') || 'local';
  const keys = [`ip:${ip}`, `user:${username}`];
  const since = Date.now() - WINDOW_MS;
  await env.DB.prepare('DELETE FROM login_attempts WHERE ts < ?').bind(since).run();
  for (const key of keys) {
    const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM login_attempts WHERE key = ? AND ts >= ?').bind(key, since).first();
    if (n >= MAX_FAILS) return error('Too many wrong attempts. Wait 15 minutes, then try again.', 429);
  }

  const user = await env.DB.prepare('SELECT id, username, pass_hash FROM users WHERE username = ?').bind(username).first();
  const ok = user ? await verifyPassword(password, user.pass_hash) : false;
  if (!ok) {
    await env.DB.batch(keys.map((key) => env.DB.prepare('INSERT INTO login_attempts (key, ts) VALUES (?, ?)').bind(key, Date.now())));
    return error('Wrong username or password.', 401);
  }

  await env.DB.prepare('DELETE FROM login_attempts WHERE key = ?').bind(`user:${username}`).run();
  const cookie = await createSession(env.DB, user.id);
  return json({ user: { username: user.username } }, 200, { 'set-cookie': cookie });
}
