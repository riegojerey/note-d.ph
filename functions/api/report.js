import { json } from '../_lib.js';

// Totals for a date range, plus month-by-month and per-scent breakdowns.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from') || '0000-00-00';
  const to = url.searchParams.get('to') || '9999-12-31';

  const [items, discounts, expenses, monthsItems, monthsDisc, monthsExp, byProduct] = await Promise.all([
    env.DB.prepare(
      `SELECT COUNT(DISTINCT s.id) AS orders, COALESCE(SUM(i.qty),0) AS units,
              COALESCE(SUM(i.qty*i.unit_price),0) AS sales, COALESCE(SUM(i.qty*i.unit_cost),0) AS cogs
       FROM sales s JOIN sale_items i ON i.sale_id = s.id WHERE s.date BETWEEN ? AND ?`
    ).bind(from, to).first(),
    env.DB.prepare('SELECT COALESCE(SUM(discount),0) AS d FROM sales WHERE date BETWEEN ? AND ?').bind(from, to).first(),
    env.DB.prepare('SELECT COALESCE(SUM(amount),0) AS e FROM expenses WHERE date BETWEEN ? AND ?').bind(from, to).first(),
    env.DB.prepare(
      `SELECT substr(s.date,1,7) AS month, SUM(i.qty*i.unit_price) AS sales, SUM(i.qty*i.unit_cost) AS cogs, SUM(i.qty) AS units
       FROM sales s JOIN sale_items i ON i.sale_id = s.id WHERE s.date BETWEEN ? AND ? GROUP BY month`
    ).bind(from, to).all(),
    env.DB.prepare('SELECT substr(date,1,7) AS month, SUM(discount) AS d FROM sales WHERE date BETWEEN ? AND ? GROUP BY month').bind(from, to).all(),
    env.DB.prepare('SELECT substr(date,1,7) AS month, SUM(amount) AS e FROM expenses WHERE date BETWEEN ? AND ? GROUP BY month').bind(from, to).all(),
    env.DB.prepare(
      `SELECT i.product_id, p.name, i.size, SUM(i.qty) AS units, SUM(i.qty*i.unit_price) AS sales, SUM(i.qty*(i.unit_price-i.unit_cost)) AS profit
       FROM sales s JOIN sale_items i ON i.sale_id = s.id LEFT JOIN products p ON p.id = i.product_id
       WHERE s.date BETWEEN ? AND ? GROUP BY i.product_id, i.size ORDER BY units DESC`
    ).bind(from, to).all(),
  ]);

  const revenue = items.sales - discounts.d;
  const gross = revenue - items.cogs;
  const totals = {
    orders: items.orders, units: items.units, revenue, cogs: items.cogs, discounts: discounts.d,
    gross_profit: gross, expenses: expenses.e, net_profit: gross - expenses.e,
  };

  const months = {};
  const m = (k) => (months[k] ||= { month: k, revenue: 0, cogs: 0, expenses: 0, units: 0 });
  for (const r of monthsItems.results) Object.assign(m(r.month), { revenue: m(r.month).revenue + r.sales, cogs: r.cogs, units: r.units });
  for (const r of monthsDisc.results) m(r.month).revenue -= r.d;
  for (const r of monthsExp.results) m(r.month).expenses = r.e;
  const byMonth = Object.values(months)
    .map((x) => ({ ...x, net_profit: x.revenue - x.cogs - x.expenses }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return json({ from, to, totals, byMonth, byProduct: byProduct.results });
}
