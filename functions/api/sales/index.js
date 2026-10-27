import { json, readJson, str, int, date, getSettings, HttpError } from '../../_lib.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from') || '0000-00-00';
  const to = url.searchParams.get('to') || '9999-12-31';
  const sales = await env.DB.prepare('SELECT * FROM sales WHERE date BETWEEN ? AND ? ORDER BY date DESC, id DESC LIMIT 500').bind(from, to).all();
  if (!sales.results.length) return json({ sales: [] });
  const ids = sales.results.map((s) => s.id);
  const items = await env.DB.prepare(
    `SELECT i.*, p.name FROM sale_items i LEFT JOIN products p ON p.id = i.product_id WHERE i.sale_id IN (${ids.map(() => '?').join(',')})`
  ).bind(...ids).all();
  const bySale = {};
  for (const it of items.results) (bySale[it.sale_id] ||= []).push(it);
  return json({ sales: sales.results.map((s) => ({ ...s, items: bySale[s.id] || [] })) });
}

// Body: { date, customer, discount, notes, deduct_stock, items: [{ product_id, size, qty, unit_price? }] }
export async function onRequestPost({ request, env, data }) {
  const body = await readJson(request);
  const saleDate = date(body.date);
  const customer = str(body.customer, 'Customer', { max: 100 });
  const notes = str(body.notes, 'Notes', { max: 500 });
  const discount = int(body.discount || 0, 'Discount', { min: 0, max: 1000000 });
  const deduct = body.deduct_stock !== false;
  if (!Array.isArray(body.items) || !body.items.length) throw new HttpError('Add at least one item.');
  if (body.items.length > 50) throw new HttpError('A sale can have up to 50 items.');

  const { sizes } = await getSettings(env.DB);
  const { results: products } = await env.DB.prepare('SELECT id FROM products').all();
  const known = new Set(products.map((p) => p.id));

  const items = body.items.map((it, i) => {
    const product_id = str(it.product_id, `Item ${i + 1} scent`, { required: true, max: 80 });
    if (!known.has(product_id)) throw new HttpError(`Item ${i + 1}: pick a scent from the list.`);
    const size = str(it.size, `Item ${i + 1} size`, { required: true, max: 10 });
    if (!sizes[size]) throw new HttpError(`Item ${i + 1}: size must be ${Object.keys(sizes).join(' or ')}.`);
    return {
      product_id,
      size,
      qty: int(it.qty, `Item ${i + 1} quantity`, { min: 1, max: 1000 }),
      unit_price: it.unit_price == null || it.unit_price === '' ? sizes[size].price : int(it.unit_price, `Item ${i + 1} price`, { min: 0, max: 100000 }),
      unit_cost: sizes[size].cost,
    };
  });

  const now = Date.now();
  const user = data.user.username;
  const stmts = [
    env.DB.prepare('INSERT INTO sales (date, customer, discount, notes, deducted_stock, username, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(saleDate, customer, discount, notes, deduct ? 1 : 0, user, now),
  ];
  // batch runs as one transaction, so MAX(id) is the sale inserted above
  for (const it of items) {
    stmts.push(
      env.DB.prepare('INSERT INTO sale_items (sale_id, product_id, size, qty, unit_price, unit_cost) VALUES ((SELECT MAX(id) FROM sales), ?, ?, ?, ?, ?)')
        .bind(it.product_id, it.size, it.qty, it.unit_price, it.unit_cost)
    );
    if (deduct) {
      stmts.push(
        env.DB.prepare('UPDATE stock SET qty = qty - ? WHERE product_id = ? AND size = ?').bind(it.qty, it.product_id, it.size),
        env.DB.prepare("INSERT INTO movements (product_id, size, delta, reason, sale_id, username, created_at) VALUES (?, ?, ?, 'sale', (SELECT MAX(id) FROM sales), ?, ?)")
          .bind(it.product_id, it.size, -it.qty, user, now)
      );
    }
  }
  await env.DB.batch(stmts);
  const sale = await env.DB.prepare('SELECT id FROM sales WHERE created_at = ? AND username = ? ORDER BY id DESC').bind(now, user).first();
  return json({ id: sale?.id }, 201);
}
