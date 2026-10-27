import { json, readJson, str, int, date } from '../../_lib.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from') || '0000-00-00';
  const to = url.searchParams.get('to') || '9999-12-31';
  const { results } = await env.DB.prepare('SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC, id DESC LIMIT 500').bind(from, to).all();
  return json({ expenses: results });
}

export async function onRequestPost({ request, env, data }) {
  const body = await readJson(request);
  const r = await env.DB.prepare('INSERT INTO expenses (date, category, description, amount, username, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(
      date(body.date),
      str(body.category, 'Category', { required: true, max: 40 }),
      str(body.description, 'Description', { max: 200 }),
      int(body.amount, 'Amount', { min: 1, max: 10000000 }),
      data.user.username,
      Date.now()
    )
    .run();
  return json({ id: r.meta.last_row_id }, 201);
}
