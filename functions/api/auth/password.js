import { json, error, readJson, str, verifyPassword, hashPassword } from '../../_lib.js';

export async function onRequestPost({ request, env, data }) {
  const body = await readJson(request);
  const current = str(body.current, 'Current password', { required: true, max: 200 });
  const next = str(body.next, 'New password', { required: true, max: 200 });
  if (next.length < 10) return error('New password must be at least 10 characters.');
  const user = await env.DB.prepare('SELECT pass_hash FROM users WHERE id = ?').bind(data.user.id).first();
  if (!(await verifyPassword(current, user.pass_hash))) return error('Current password is wrong.', 403);
  await env.DB.prepare('UPDATE users SET pass_hash = ? WHERE id = ?').bind(await hashPassword(next), data.user.id).run();
  return json({ ok: true });
}
