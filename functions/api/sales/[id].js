import { json, int } from '../../_lib.js';

// Delete a sale. If it took bottles out of stock, they go back in.
export async function onRequestDelete({ env, params, data }) {
  const id = int(params.id, 'Sale');
  const sale = await env.DB.prepare('SELECT * FROM sales WHERE id = ?').bind(id).first();
  if (!sale) return json({ error: 'That sale was already deleted.' }, 404);
  const { results: items } = await env.DB.prepare('SELECT * FROM sale_items WHERE sale_id = ?').bind(id).all();
  const now = Date.now();
  const stmts = [];
  if (sale.deducted_stock) {
    for (const it of items) {
      stmts.push(
        env.DB.prepare('UPDATE stock SET qty = qty + ? WHERE product_id = ? AND size = ?').bind(it.qty, it.product_id, it.size),
        env.DB.prepare("INSERT INTO movements (product_id, size, delta, reason, sale_id, username, created_at) VALUES (?, ?, ?, 'sale_deleted', ?, ?, ?)")
          .bind(it.product_id, it.size, it.qty, id, data.user.username, now)
      );
    }
  }
  stmts.push(env.DB.prepare('DELETE FROM sale_items WHERE sale_id = ?').bind(id), env.DB.prepare('DELETE FROM sales WHERE id = ?').bind(id));
  await env.DB.batch(stmts);
  return json({ ok: true });
}
