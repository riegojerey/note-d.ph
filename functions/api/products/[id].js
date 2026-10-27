import { json, readJson, str } from '../../_lib.js';

export async function onRequestPut({ request, env, params }) {
  const body = await readJson(request);
  const name = str(body.name, 'Name', { required: true, max: 80 });
  const inspired = str(body.inspired, 'Inspired by', { max: 120 });
  const active = body.active ? 1 : 0;
  const r = await env.DB.prepare('UPDATE products SET name = ?, inspired = ?, active = ? WHERE id = ?').bind(name, inspired, active, params.id).run();
  if (!r.meta.changes) return json({ error: 'That scent no longer exists.' }, 404);
  return json({ ok: true });
}
