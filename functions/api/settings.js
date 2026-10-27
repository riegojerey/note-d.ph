import { json, readJson, int, HttpError, getSettings } from '../_lib.js';

export async function onRequestGet({ env }) {
  return json(await getSettings(env.DB));
}

export async function onRequestPut({ request, env }) {
  const body = await readJson(request);
  const current = await getSettings(env.DB);
  const sizes = {};
  for (const size of Object.keys(current.sizes)) {
    const v = body.sizes?.[size];
    if (!v) throw new HttpError(`Price and cost for ${size} are required.`);
    sizes[size] = {
      price: int(v.price, `${size} price`, { min: 1, max: 100000 }),
      cost: int(v.cost, `${size} cost`, { min: 0, max: 100000 }),
    };
  }
  const low = int(body.low_stock, 'Low-stock alert', { min: 0, max: 1000 });
  const upsert = 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value';
  await env.DB.batch([
    env.DB.prepare(upsert).bind('sizes', JSON.stringify(sizes)),
    env.DB.prepare(upsert).bind('low_stock', String(low)),
    env.DB.prepare(upsert).bind('show_stock', body.show_stock ? '1' : '0'),
  ]);
  return json(await getSettings(env.DB));
}
