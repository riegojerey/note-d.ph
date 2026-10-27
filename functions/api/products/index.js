import { json, readJson, str, getSettings, HttpError } from '../../_lib.js';

// Products with stock per size and units sold in the last 30 days.
export async function onRequestGet({ env }) {
  const since = new Date(Date.now() - 30 * 864e5 + 8 * 36e5).toISOString().slice(0, 10);
  const [products, stock, sold] = await Promise.all([
    env.DB.prepare('SELECT id, name, inspired, active, sort FROM products ORDER BY sort, name').all(),
    env.DB.prepare('SELECT product_id, size, qty FROM stock').all(),
    env.DB.prepare(
      'SELECT i.product_id, i.size, SUM(i.qty) AS units FROM sale_items i JOIN sales s ON s.id = i.sale_id WHERE s.date >= ? GROUP BY i.product_id, i.size'
    ).bind(since).all(),
  ]);
  const byId = Object.fromEntries(products.results.map((p) => [p.id, { ...p, stock: {}, sold30: {} }]));
  for (const r of stock.results) if (byId[r.product_id]) byId[r.product_id].stock[r.size] = r.qty;
  for (const r of sold.results) if (byId[r.product_id]) byId[r.product_id].sold30[r.size] = r.units;
  return json({ products: Object.values(byId) });
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const name = str(body.name, 'Name', { required: true, max: 80 });
  const inspired = str(body.inspired, 'Inspired by', { max: 120 });
  const id = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!id) throw new HttpError('Name needs at least one letter or number.');
  if (await env.DB.prepare('SELECT 1 FROM products WHERE id = ?').bind(id).first()) throw new HttpError(`A scent called ${name} already exists.`, 409);
  const { n } = await env.DB.prepare('SELECT COALESCE(MAX(sort), 0) + 1 AS n FROM products').first();
  const { sizes } = await getSettings(env.DB);
  await env.DB.batch([
    env.DB.prepare('INSERT INTO products (id, name, inspired, sort) VALUES (?, ?, ?, ?)').bind(id, name, inspired, n),
    ...Object.keys(sizes).map((size) => env.DB.prepare('INSERT INTO stock (product_id, size, qty) VALUES (?, ?, 0)').bind(id, size)),
  ]);
  return json({ id }, 201);
}
