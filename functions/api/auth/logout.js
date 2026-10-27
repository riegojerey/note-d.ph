import { json, destroySession } from '../../_lib.js';

export async function onRequestPost({ request, env }) {
  const cookie = await destroySession(env.DB, request);
  return json({ ok: true }, 200, { 'set-cookie': cookie });
}
