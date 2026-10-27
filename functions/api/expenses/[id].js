import { json, int } from '../../_lib.js';

export async function onRequestDelete({ env, params }) {
  const r = await env.DB.prepare('DELETE FROM expenses WHERE id = ?').bind(int(params.id, 'Expense')).run();
  if (!r.meta.changes) return json({ error: 'That expense was already deleted.' }, 404);
  return json({ ok: true });
}
