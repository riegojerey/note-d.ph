import { json, readJson, str, int, HttpError } from '../_lib.js';

// Restock or correct a count. Body: { product_id, size, delta, reason: 'restock' | 'adjust', note }
export async function onRequestPost({ request, env, data }) {
  const body = await readJson(request);
  const product = str(body.product_id, 'Scent', { required: true, max: 80 });
  const size = str(body.size, 'Size', { required: true, max: 10 });
  const delta = int(body.delta, 'Quantity', { min: -10000, max: 10000 });
  if (delta === 0) throw new HttpError('Quantity can’t be 0.');
  const reason = body.reason === 'restock' ? 'restock' : 'adjust';
  if (reason === 'restock' && delta < 0) throw new HttpError('Restock quantity must be more than 0.');
  const note = str(body.note, 'Note', { max: 200 });

  const row = await env.DB.prepare('SELECT qty FROM stock WHERE product_id = ? AND size = ?').bind(product, size).first();
  if (!row) throw new HttpError('That scent or size doesn’t exist.', 404);
  await env.DB.batch([
    env.DB.prepare('UPDATE stock SET qty = qty + ? WHERE product_id = ? AND size = ?').bind(delta, product, size),
    env.DB.prepare('INSERT INTO movements (product_id, size, delta, reason, note, username, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(product, size, delta, reason, note, data.user.username, Date.now()),
  ]);
  return json({ qty: row.qty + delta });
}

// Recent stock history
export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    'SELECT m.*, p.name FROM movements m LEFT JOIN products p ON p.id = m.product_id ORDER BY m.created_at DESC LIMIT 100'
  ).all();
  return json({ movements: results });
}
