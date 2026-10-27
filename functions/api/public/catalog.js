import { json, getSettings } from '../../_lib.js';

// Public: prices and which scents/sizes are in stock, for the storefront.
export async function onRequestGet({ env }) {
  const settings = await getSettings(env.DB);
  const { results } = await env.DB.prepare(
    'SELECT s.product_id, s.size, s.qty FROM stock s JOIN products p ON p.id = s.product_id WHERE p.active = 1'
  ).all();
  const stock = {};
  for (const r of results) (stock[r.product_id] ||= {})[r.size] = r.qty > 0;
  const prices = Object.fromEntries(Object.entries(settings.sizes).map(([size, v]) => [size, v.price]));
  return json({ prices, inStock: settings.show_stock ? stock : null }, 200, { 'cache-control': 'public, max-age=60' });
}
