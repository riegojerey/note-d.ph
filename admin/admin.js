// Note.d admin — single page, talks to /api (Cloudflare Pages Functions + D1).

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const peso = (n) => `${n < 0 ? '−' : ''}₱${Math.abs(Math.round(n)).toLocaleString('en-PH')}`;
const pct = (n) => `${Math.round(n * 100)}%`;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SIZES = ['10mL', '30mL'];
const EXPENSE_CATEGORIES = ['Ads', 'Delivery (paid by us)', 'Packaging extras', 'Equipment', 'Ingredients (not in bottle cost)', 'Other'];

// Manila dates as YYYY-MM-DD
const today = () => new Date(Date.now() + 8 * 36e5).toISOString().slice(0, 10);
const monthName = (ym) => new Date(`${ym}-01T00:00:00`).toLocaleString('en-PH', { month: 'short', year: 'numeric' });
const prettyDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

const state = { user: null, tab: 'dashboard', settings: null, products: [] };

// ---- API ------------------------------------------------------------------
async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/auth/login') {
    showLogin();
    throw new Error('Your session ended. Log in again.');
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
  return data;
}

let toastTimer;
function toast(msg, isError = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.toggle('error', isError);
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), isError ? 5000 : 2500);
}

async function guarded(fn, btn) {
  if (btn) btn.disabled = true;
  try { return await fn(); }
  catch (e) { toast(e.message, true); }
  finally { if (btn) btn.disabled = false; }
}

// ---- Period -----------------------------------------------------------------
function periodRange() {
  const t = today();
  const [y, m] = t.split('-').map(Number);
  const first = (yy, mm) => `${yy}-${String(mm).padStart(2, '0')}-01`;
  const last = (yy, mm) => new Date(Date.UTC(yy, mm, 0)).toISOString().slice(0, 10);
  switch ($('#period').value) {
    case 'this-month': return { from: first(y, m), to: t };
    case 'last-month': { const d = new Date(Date.UTC(y, m - 2, 1)); const yy = d.getUTCFullYear(), mm = d.getUTCMonth() + 1; return { from: first(yy, mm), to: last(yy, mm) }; }
    case 'last-3': { const d = new Date(Date.UTC(y, m - 3, 1)); return { from: first(d.getUTCFullYear(), d.getUTCMonth() + 1), to: t }; }
    case 'this-year': return { from: `${y}-01-01`, to: t };
    case 'custom': return { from: $('#fromDate').value || '0000-00-00', to: $('#toDate').value || t };
    default: return { from: '0000-00-00', to: '9999-12-31' };
  }
}
const rangeQuery = () => { const r = periodRange(); return `from=${r.from}&to=${r.to}`; };

$('#period').addEventListener('change', () => {
  $('#customRange').hidden = $('#period').value !== 'custom';
  if ($('#period').value === 'custom' && !$('#fromDate').value) {
    $('#fromDate').value = periodRange().to.slice(0, 8) + '01';
    $('#toDate').value = today();
  }
  render();
});
$('#fromDate').addEventListener('change', render);
$('#toDate').addEventListener('change', render);

// ---- Login ------------------------------------------------------------------
function showLogin() {
  $('#appView').hidden = true;
  $('#loginView').hidden = false;
  $('#loginForm input[name=username]').focus();
}

$('#loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  $('#loginError').textContent = '';
  guarded(async () => {
    try {
      const { user } = await api('/auth/login', { method: 'POST', body: { username: f.get('username'), password: f.get('password') } });
      e.target.reset();
      await startApp(user);
    } catch (err) {
      $('#loginError').textContent = err.message;
    }
  }, $('#loginForm button'));
});

$('#logoutBtn').addEventListener('click', async () => {
  await api('/auth/logout', { method: 'POST' }).catch(() => {});
  showLogin();
});

async function startApp(user) {
  state.user = user;
  $('#whoami').textContent = user.username;
  $('#loginView').hidden = true;
  $('#appView').hidden = false;
  await refreshBase();
  const fromHash = location.hash.slice(1);
  setTab($$('#tabs button').some((b) => b.dataset.tab === fromHash) ? fromHash : 'dashboard');
}

async function refreshBase() {
  const [settings, { products }] = await Promise.all([api('/settings'), api('/products')]);
  state.settings = settings;
  state.products = products;
}

// ---- Tabs -------------------------------------------------------------------
function setTab(tab) {
  state.tab = tab;
  history.replaceState(null, '', `#${tab}`);
  $$('#tabs button').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false'));
  $('#periodBar').hidden = !['dashboard', 'sales', 'expenses'].includes(tab);
  render();
}
$('#tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setTab(b.dataset.tab); });

const VIEWS = {};
let renderToken = 0;
async function render() {
  const token = ++renderToken;
  const el = $('#content');
  el.setAttribute('aria-busy', 'true');
  try {
    const html = await VIEWS[state.tab]();
    if (token !== renderToken) return;
    el.innerHTML = html;
    VIEWS[`${state.tab}Bind`]?.(el);
  } catch (e) {
    if (token === renderToken) el.innerHTML = `<div class="panel"><p class="form-error">${esc(e.message)}</p></div>`;
  } finally {
    el.removeAttribute('aria-busy');
  }
}

// ---- Shared bits ------------------------------------------------------------
const productName = (id) => state.products.find((p) => p.id === id)?.name || id;
const productOptions = (selected) =>
  state.products.filter((p) => p.active).map((p) => `<option value="${esc(p.id)}"${p.id === selected ? ' selected' : ''}>${esc(p.name)}</option>`).join('');
const sizeOptions = (selected) => SIZES.map((s) => `<option${s === selected ? ' selected' : ''}>${s}</option>`).join('');

function stat(label, value, note = '', tone = '') {
  return `<div class="stat ${tone}"><p class="stat-label">${label}</p><p class="stat-value">${value}</p>${note ? `<p class="stat-note">${note}</p>` : ''}</div>`;
}

function lowStockItems() {
  const low = state.settings.low_stock;
  const out = [];
  for (const p of state.products.filter((x) => x.active)) {
    for (const s of SIZES) {
      const q = p.stock[s] ?? 0;
      if (q <= low && (p.sold30[s] || q < 0)) out.push({ p, size: s, qty: q });
    }
  }
  return out.sort((a, b) => a.qty - b.qty);
}

// ---- Dashboard ----------------------------------------------------------------
VIEWS.dashboard = async () => {
  const r = await api(`/report?${rangeQuery()}`);
  state.report = r;
  const t = r.totals;
  const margin = t.revenue ? t.net_profit / t.revenue : 0;
  const low = lowStockItems();

  const tiles = `
    <div class="stats">
      ${stat('Sales', peso(t.revenue), `${t.orders} order${t.orders === 1 ? '' : 's'}, ${t.units} bottle${t.units === 1 ? '' : 's'}`)}
      ${stat('Bottle costs', peso(t.cogs), 'What the sold bottles cost you')}
      ${stat('Other expenses', peso(t.expenses), t.discounts ? `Discounts given: ${peso(t.discounts)}` : 'Ads, delivery, etc.')}
      ${stat('Profit', peso(t.net_profit), t.revenue ? `${pct(margin)} of sales` : 'No sales yet', t.net_profit < 0 ? 'neg' : 'pos')}
    </div>`;

  const chart = r.byMonth.length ? monthChart(r.byMonth) : `<p class="empty">No sales or expenses in this period yet. <button class="link" data-goto="sales">Record a sale</button></p>`;

  const top = r.byProduct.length
    ? `<table class="table"><thead><tr><th>Scent</th><th>Size</th><th class="num">Sold</th><th class="num">Sales</th><th class="num">Profit</th></tr></thead><tbody>
        ${r.byProduct.slice(0, 8).map((x) => `<tr><td>${esc(x.name || x.product_id)}</td><td>${x.size}</td><td class="num">${x.units}</td><td class="num">${peso(x.sales)}</td><td class="num">${peso(x.profit)}</td></tr>`).join('')}
      </tbody></table>`
    : `<p class="empty">Best sellers appear here once you record sales.</p>`;

  const lowHtml = low.length
    ? `<ul class="low-list">${low.slice(0, 10).map((x) => `<li><span>${esc(x.p.name)} ${x.size}</span><strong class="${x.qty <= 0 ? 'neg-text' : ''}">${x.qty} left</strong></li>`).join('')}</ul>
       <button class="btn btn-line btn-sm" data-goto="inventory">Restock</button>`
    : `<p class="empty">Nothing is running low.</p>`;

  return `
    ${tiles}
    <div class="grid-2">
      <section class="panel span-2"><h2>Month by month</h2>${chart}</section>
      <section class="panel"><h2>Best sellers</h2>${top}</section>
      <section class="panel"><h2>Running low</h2><p class="hint">Scents that sold in the last 30 days and have ${state.settings.low_stock} or fewer left.</p>${lowHtml}</section>
    </div>`;
};
VIEWS.dashboardBind = (el) => {
  el.addEventListener('click', (e) => { const b = e.target.closest('[data-goto]'); if (b) setTab(b.dataset.goto); });
  bindChart(el);
};

// Grouped bars: sales vs profit per month, one shared ₱ axis. Hover for exact values; table below.
function monthChart(rows) {
  const W = 720, H = 260, padL = 64, padR = 12, padT = 12, padB = 32;
  const max = Math.max(1, ...rows.map((r) => Math.max(r.revenue, r.net_profit)));
  const min = Math.min(0, ...rows.map((r) => r.net_profit));
  const step = niceStep((max - min) / 4);
  const top = Math.ceil(max / step) * step, bottom = Math.floor(min / step) * step;
  const y = (v) => padT + (top - v) / (top - bottom || 1) * (H - padT - padB);
  const band = (W - padL - padR) / rows.length;
  const bw = Math.min(28, (band - 18) / 2);
  const ticks = [];
  for (let v = bottom; v <= top + 1e-9; v += step) ticks.push(v);
  const bar = (x, v, cls, r, label) => {
    const y0 = y(0), y1 = y(v), h = Math.max(1, Math.abs(y0 - y1));
    const yTop = Math.min(y0, y1);
    const rr = Math.min(4, h);
    // round only the data end (away from the baseline)
    const d = v >= 0
      ? `M${x},${y0} V${yTop + rr} Q${x},${yTop} ${x + rr},${yTop} H${x + bw - rr} Q${x + bw},${yTop} ${x + bw},${yTop + rr} V${y0} Z`
      : `M${x},${y0} V${yTop + h - rr} Q${x},${yTop + h} ${x + rr},${yTop + h} H${x + bw - rr} Q${x + bw},${yTop + h} ${x + bw},${yTop + h - rr} V${y0} Z`;
    return `<path class="${cls}" d="${d}"/>`;
  };
  const groups = rows.map((r, i) => {
    const cx = padL + band * i + band / 2;
    return `<g class="bar-group" data-i="${i}">
      <rect class="hit" x="${padL + band * i}" y="${padT}" width="${band}" height="${H - padT - padB}"/>
      ${bar(cx - bw - 1, r.revenue, 'bar-sales')}
      ${bar(cx + 1, r.net_profit, 'bar-profit')}
      <text class="axis-label" x="${cx}" y="${H - 10}" text-anchor="middle">${monthName(r.month).replace(' 20', " '")}</text>
    </g>`;
  }).join('');
  const grid = ticks.map((v) => `<line class="${v === 0 ? 'zero' : 'grid'}" x1="${padL}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}"/><text class="axis-label" x="${padL - 8}" y="${y(v) + 4}" text-anchor="end">${peso(v)}</text>`).join('');

  const table = `<details class="chart-table"><summary>Show as table</summary>
    <table class="table"><thead><tr><th>Month</th><th class="num">Sales</th><th class="num">Bottle costs</th><th class="num">Expenses</th><th class="num">Profit</th></tr></thead><tbody>
    ${rows.map((r) => `<tr><td>${monthName(r.month)}</td><td class="num">${peso(r.revenue)}</td><td class="num">${peso(r.cogs)}</td><td class="num">${peso(r.expenses)}</td><td class="num">${peso(r.net_profit)}</td></tr>`).join('')}
    </tbody></table></details>`;

  return `
    <div class="legend"><span><i class="sw sw-sales"></i>Sales</span><span><i class="sw sw-profit"></i>Profit (after bottle costs and expenses)</span></div>
    <div class="chart-wrap">
      <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Sales and profit by month">${grid}${groups}</svg>
      <div class="tip" hidden></div>
    </div>
    <script type="application/json" class="chart-data">${JSON.stringify(rows).replace(/</g, '\\u003c')}</script>
    ${table}`;
}

function niceStep(raw) {
  const p = 10 ** Math.floor(Math.log10(raw || 1));
  const n = raw / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

function bindChart(el) {
  const wrap = $('.chart-wrap', el);
  if (!wrap) return;
  const rows = JSON.parse($('.chart-data', el).textContent);
  const tip = $('.tip', wrap);
  wrap.addEventListener('pointermove', (e) => {
    const g = e.target.closest('.bar-group');
    $$('.bar-group', wrap).forEach((x) => x.classList.toggle('dim', g && x !== g));
    if (!g) { tip.hidden = true; return; }
    const r = rows[g.dataset.i];
    tip.innerHTML = `<strong>${monthName(r.month)}</strong>
      <span><i class="sw sw-sales"></i>Sales <b>${peso(r.revenue)}</b></span>
      <span><i class="sw sw-profit"></i>Profit <b>${peso(r.net_profit)}</b></span>
      <span class="muted">${r.units} bottles · costs ${peso(r.cogs)} · expenses ${peso(r.expenses)}</span>`;
    tip.hidden = false;
    const box = wrap.getBoundingClientRect();
    const x = e.clientX - box.left, yy = e.clientY - box.top;
    tip.style.left = `${Math.min(x + 14, box.width - tip.offsetWidth - 4)}px`;
    tip.style.top = `${Math.max(4, yy - tip.offsetHeight - 10)}px`;
  });
  wrap.addEventListener('pointerleave', () => { tip.hidden = true; $$('.bar-group', wrap).forEach((x) => x.classList.remove('dim')); });
}

// ---- Sales --------------------------------------------------------------------
VIEWS.sales = async () => {
  const { sales } = await api(`/sales?${rangeQuery()}`);
  const list = sales.length
    ? sales.map((s) => {
        const total = s.items.reduce((n, i) => n + i.qty * i.unit_price, 0) - s.discount;
        const cost = s.items.reduce((n, i) => n + i.qty * i.unit_cost, 0);
        return `<tr>
          <td>${prettyDate(s.date)}</td>
          <td>${esc(s.customer) || '<span class="muted">—</span>'}${s.notes ? `<div class="muted small">${esc(s.notes)}</div>` : ''}</td>
          <td>${s.items.map((i) => `${i.qty}× ${esc(i.name || i.product_id)} ${i.size}${i.unit_price !== state.settings.sizes[i.size]?.price ? ` <span class="muted">@ ${peso(i.unit_price)}</span>` : ''}`).join('<br>')}${s.discount ? `<div class="muted small">Discount ${peso(s.discount)}</div>` : ''}</td>
          <td class="num">${peso(total)}</td>
          <td class="num">${peso(total - cost)}</td>
          <td class="num"><button class="link danger" data-del-sale="${s.id}">Delete</button></td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="6" class="empty">No sales in this period.</td></tr>`;

  return `
    <div class="grid-2 sales-layout">
      <section class="panel">
        <h2>Record a sale</h2>
        <details class="paste">
          <summary>Paste an order from Messenger</summary>
          <p class="hint">Copy the order message the customer sent from the website and paste it here. It fills in the items for you.</p>
          <textarea id="pasteBox" rows="6" placeholder="Hi Note.d! I'd like to order:&#10;• 2 × Rouge Cristal (10mL) — ₱198"></textarea>
          <button class="btn btn-line btn-sm" id="pasteBtn" type="button">Fill in items</button>
        </details>
        <form id="saleForm" class="form">
          <div class="row">
            <label>Date <input type="date" name="date" value="${today()}" required /></label>
            <label>Customer <input name="customer" placeholder="Name or FB name" /></label>
          </div>
          <div id="saleItems"></div>
          <button class="link" type="button" id="addItem">+ Add another item</button>
          <div class="row">
            <label>Discount (₱) <input type="number" name="discount" min="0" step="1" value="0" /></label>
            <label>Notes <input name="notes" placeholder="Optional" /></label>
          </div>
          <label class="check"><input type="checkbox" name="deduct" checked /> Take these bottles out of inventory</label>
          <div class="sale-summary" id="saleSummary"></div>
          <button class="btn btn-rose btn-block" type="submit">Save sale</button>
        </form>
      </section>
      <section class="panel">
        <h2>Sales in this period</h2>
        <div class="table-scroll"><table class="table"><thead><tr><th>Date</th><th>Customer</th><th>Items</th><th class="num">Total</th><th class="num">Profit</th><th></th></tr></thead>
        <tbody>${list}</tbody></table></div>
      </section>
    </div>`;
};

function itemRow(it = {}) {
  const size = it.size || '10mL';
  const price = it.unit_price ?? state.settings.sizes[size].price;
  return `<div class="item-row">
    <label class="grow">Scent <select name="product_id" required><option value="">Choose…</option>${productOptions(it.product_id)}</select></label>
    <label>Size <select name="size">${sizeOptions(size)}</select></label>
    <label class="narrow">Qty <input type="number" name="qty" min="1" step="1" value="${it.qty || 1}" required /></label>
    <label class="narrow">Price each <input type="number" name="unit_price" min="0" step="1" value="${price}" required /></label>
    <button class="icon-btn" type="button" data-remove-item aria-label="Remove item">✕</button>
  </div>`;
}

function readSaleForm(form) {
  const items = $$('.item-row', form).map((r) => ({
    product_id: $('[name=product_id]', r).value,
    size: $('[name=size]', r).value,
    qty: Number($('[name=qty]', r).value),
    unit_price: Number($('[name=unit_price]', r).value),
  }));
  return {
    date: form.date.value,
    customer: form.customer.value,
    discount: Number(form.discount.value || 0),
    notes: form.notes.value,
    deduct_stock: form.deduct.checked,
    items,
  };
}

function updateSaleSummary(form) {
  const s = readSaleForm(form);
  const gross = s.items.reduce((n, i) => n + (i.qty || 0) * (i.unit_price || 0), 0) - s.discount;
  const cost = s.items.reduce((n, i) => n + (i.qty || 0) * (state.settings.sizes[i.size]?.cost || 0), 0);
  const short = s.deduct_stock
    ? s.items.filter((i) => i.product_id && (state.products.find((p) => p.id === i.product_id)?.stock[i.size] ?? 0) < i.qty)
    : [];
  $('#saleSummary').innerHTML = `
    <div><span>Total</span><strong>${peso(gross)}</strong></div>
    <div><span>Bottle costs</span><span>${peso(cost)}</span></div>
    <div><span>Profit on this sale</span><strong class="${gross - cost < 0 ? 'neg-text' : ''}">${peso(gross - cost)}</strong></div>
    ${short.length ? `<p class="warn">Inventory shows fewer bottles than this for ${short.map((i) => `${esc(productName(i.product_id))} ${i.size}`).join(', ')}. You can still save; the count will go below 0 until you restock or correct it.</p>` : ''}`;
}

function parseMessengerOrder(text) {
  const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const byName = Object.fromEntries(state.products.map((p) => [norm(p.name), p.id]));
  const items = [], unknown = [];
  for (const line of text.split('\n')) {
    const m = line.match(/(\d+)\s*[×x*]\s*(.+?)\s*\((10\s*ml|30\s*ml)\)/i);
    if (!m) continue;
    const id = byName[norm(m[2])];
    if (!id) { unknown.push(m[2].trim()); continue; }
    const size = m[3].replace(/\s/g, '').replace(/ml/i, 'mL');
    items.push({ product_id: id, size, qty: Number(m[1]) });
  }
  const name = text.match(/^\s*Name:\s*(.+)$/im)?.[1]?.trim();
  return { items, unknown, name };
}

VIEWS.salesBind = (el) => {
  const form = $('#saleForm', el);
  const itemsBox = $('#saleItems', el);
  itemsBox.innerHTML = itemRow();
  updateSaleSummary(form);

  form.addEventListener('input', () => updateSaleSummary(form));
  form.addEventListener('change', (e) => {
    if (e.target.name === 'size') {
      const row = e.target.closest('.item-row');
      $('[name=unit_price]', row).value = state.settings.sizes[e.target.value].price;
    }
    updateSaleSummary(form);
  });
  $('#addItem', el).addEventListener('click', () => { itemsBox.insertAdjacentHTML('beforeend', itemRow()); updateSaleSummary(form); });
  itemsBox.addEventListener('click', (e) => {
    if (!e.target.closest('[data-remove-item]')) return;
    if ($$('.item-row', itemsBox).length > 1) e.target.closest('.item-row').remove();
    updateSaleSummary(form);
  });

  $('#pasteBtn', el).addEventListener('click', () => {
    const { items, unknown, name } = parseMessengerOrder($('#pasteBox', el).value);
    if (!items.length) { toast('No items found. Paste the whole order message, including the lines that start with •.', true); return; }
    itemsBox.innerHTML = items.map(itemRow).join('');
    if (name && !form.customer.value) form.customer.value = name;
    updateSaleSummary(form);
    toast(unknown.length ? `Filled ${items.length} item(s). Not recognized: ${unknown.join(', ')}` : `Filled ${items.length} item(s). Check them, then save.`, unknown.length > 0);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    guarded(async () => {
      await api('/sales', { method: 'POST', body: readSaleForm(form) });
      toast('Sale saved.');
      await refreshBase();
      render();
    }, $('button[type=submit]', form));
  });

  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-del-sale]');
    if (!b) return;
    if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.textContent = 'Tap again to delete'; return; }
    guarded(async () => {
      await api(`/sales/${b.dataset.delSale}`, { method: 'DELETE' });
      toast('Sale deleted. Its bottles went back into inventory.');
      await refreshBase();
      render();
    }, b);
  });
};

// ---- Inventory --------------------------------------------------------------
VIEWS.inventory = async () => {
  await refreshBase();
  const { movements } = await api('/stock');
  const { sizes, low_stock } = state.settings;
  let units = 0, value = 0;
  const rows = state.products.map((p) => {
    const cells = SIZES.map((s) => {
      const q = p.stock[s] ?? 0;
      units += Math.max(0, q);
      value += Math.max(0, q) * (sizes[s]?.cost || 0);
      const sold = p.sold30[s] || 0;
      const days = sold ? Math.floor(q / (sold / 30)) : null;
      const cls = q <= 0 ? 'neg-text' : q <= low_stock ? 'warn-text' : '';
      return `<td class="num"><strong class="${cls}">${q}</strong></td><td class="num muted">${sold || '–'}</td><td class="num muted">${days === null ? '–' : days <= 0 ? 'Out' : `${days} d`}</td>`;
    }).join('');
    return `<tr class="${p.active ? '' : 'inactive'}"><td>${esc(p.name)}${p.active ? '' : ' <span class="muted small">(hidden)</span>'}<div class="muted small">${esc(p.inspired)}</div></td>${cells}
      <td class="num"><button class="link" data-edit="${esc(p.id)}">Edit</button></td></tr>`;
  }).join('');

  const reasonLabel = { restock: 'Restock', sale: 'Sale', sale_deleted: 'Sale deleted', adjust: 'Count correction' };
  const history = movements.length
    ? movements.slice(0, 30).map((m) => `<tr><td>${new Date(m.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td><td>${esc(m.name || m.product_id)} ${m.size}</td><td>${reasonLabel[m.reason] || m.reason}${m.note ? ` <span class="muted">· ${esc(m.note)}</span>` : ''}</td><td class="num ${m.delta < 0 ? 'neg-text' : 'pos-text'}">${m.delta > 0 ? '+' : '−'}${Math.abs(m.delta)}</td></tr>`).join('')
    : `<tr><td colspan="4" class="empty">No stock changes yet.</td></tr>`;

  return `
    <div class="stats">
      ${stat('Bottles in stock', units.toLocaleString())}
      ${stat('Stock value at cost', peso(value), 'What it cost you to make')}
      ${stat('Low-stock alert at', `${low_stock} bottles`, '<button class="link" data-goto="settings">Change</button>')}
    </div>
    <div class="grid-2 inv-layout">
      <section class="panel">
        <h2>Add or correct stock</h2>
        <form id="stockForm" class="form">
          <label>Scent <select name="product_id" required><option value="">Choose…</option>${productOptions()}</select></label>
          <div class="row">
            <label>Size <select name="size">${sizeOptions()}</select></label>
            <label>What happened
              <select name="reason">
                <option value="restock">I made new bottles</option>
                <option value="adjust-set">I counted them (set exact number)</option>
                <option value="adjust-minus">Some broke, spilled or were given away</option>
              </select>
            </label>
          </div>
          <label><span id="qtyLabel">How many new bottles</span> <input type="number" name="qty" min="0" step="1" required /></label>
          <label>Note <input name="note" placeholder="Optional, e.g. batch 3, freebie for Ana" /></label>
          <button class="btn btn-rose btn-block" type="submit">Save</button>
        </form>
        <hr />
        <h2>Add a new scent</h2>
        <form id="newScent" class="form">
          <label>Name <input name="name" required maxlength="80" /></label>
          <label>Inspired by <input name="inspired" maxlength="120" /></label>
          <p class="hint">This adds it to inventory and sales. To show it on the shop page, its description and color also need adding to the website code.</p>
          <button class="btn btn-line btn-block" type="submit">Add scent</button>
        </form>
      </section>
      <section class="panel">
        <h2>Stock by scent</h2>
        <p class="hint">“Sold” is the last 30 days. “Lasts” estimates how long the bottles will last at that pace.</p>
        <div class="table-scroll"><table class="table inv-table">
          <thead><tr><th rowspan="2">Scent</th><th colspan="3" class="group">10mL</th><th colspan="3" class="group">30mL</th><th rowspan="2"></th></tr>
          <tr><th class="num">Left</th><th class="num">Sold</th><th class="num">Lasts</th><th class="num">Left</th><th class="num">Sold</th><th class="num">Lasts</th></tr></thead>
          <tbody>${rows}</tbody></table></div>
      </section>
      <section class="panel span-2">
        <h2>Recent stock changes</h2>
        <div class="table-scroll"><table class="table"><thead><tr><th>When</th><th>Scent</th><th>Why</th><th class="num">Change</th></tr></thead><tbody>${history}</tbody></table></div>
      </section>
    </div>
    <dialog id="editDialog"></dialog>`;
};

VIEWS.inventoryBind = (el) => {
  const form = $('#stockForm', el);
  const labels = { restock: 'How many new bottles', 'adjust-set': 'How many are there now', 'adjust-minus': 'How many to remove' };
  form.reason.addEventListener('change', () => { $('#qtyLabel', el).textContent = labels[form.reason.value]; });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const p = state.products.find((x) => x.id === form.product_id.value);
    const qty = Number(form.qty.value);
    let delta, reason = 'adjust';
    if (form.reason.value === 'restock') { delta = qty; reason = 'restock'; }
    else if (form.reason.value === 'adjust-minus') delta = -qty;
    else delta = qty - (p?.stock[form.size.value] ?? 0);
    if (!delta) { toast('No change: the count is already that number.'); return; }
    guarded(async () => {
      const r = await api('/stock', { method: 'POST', body: { product_id: form.product_id.value, size: form.size.value, delta, reason, note: form.note.value } });
      toast(`${p.name} ${form.size.value}: now ${r.qty} in stock.`);
      render();
    }, $('button', form));
  });

  $('#newScent', el).addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    guarded(async () => {
      await api('/products', { method: 'POST', body: { name: f.name.value, inspired: f.inspired.value } });
      toast(`${f.name.value} added.`);
      render();
    }, $('button', f));
  });

  el.addEventListener('click', (e) => {
    const g = e.target.closest('[data-goto]');
    if (g) return setTab(g.dataset.goto);
    const b = e.target.closest('[data-edit]');
    if (!b) return;
    const p = state.products.find((x) => x.id === b.dataset.edit);
    const dlg = $('#editDialog', el);
    dlg.innerHTML = `<form method="dialog" class="form" id="editForm">
      <h2>Edit ${esc(p.name)}</h2>
      <label>Name <input name="name" value="${esc(p.name)}" required maxlength="80" /></label>
      <label>Inspired by <input name="inspired" value="${esc(p.inspired)}" maxlength="120" /></label>
      <label class="check"><input type="checkbox" name="active" ${p.active ? 'checked' : ''} /> Show in sales and inventory lists</label>
      <div class="row"><button class="btn btn-line" value="cancel" formnovalidate>Cancel</button><button class="btn btn-rose" value="save">Save</button></div>
    </form>`;
    dlg.showModal();
    $('#editForm', dlg).addEventListener('submit', (ev) => {
      if (ev.submitter?.value !== 'save') return;
      ev.preventDefault();
      const f = ev.target;
      guarded(async () => {
        await api(`/products/${encodeURIComponent(p.id)}`, { method: 'PUT', body: { name: f.name.value, inspired: f.inspired.value, active: f.active.checked } });
        dlg.close();
        toast('Scent updated.');
        render();
      }, ev.submitter);
    });
  });
};

// ---- Expenses -------------------------------------------------------------------
VIEWS.expenses = async () => {
  const { expenses } = await api(`/expenses?${rangeQuery()}`);
  const total = expenses.reduce((n, x) => n + x.amount, 0);
  const byCat = {};
  for (const x of expenses) byCat[x.category] = (byCat[x.category] || 0) + x.amount;
  const rows = expenses.length
    ? expenses.map((x) => `<tr><td>${prettyDate(x.date)}</td><td>${esc(x.category)}</td><td>${esc(x.description)}</td><td class="num">${peso(x.amount)}</td><td class="num"><button class="link danger" data-del-exp="${x.id}">Delete</button></td></tr>`).join('')
    : `<tr><td colspan="5" class="empty">No expenses in this period.</td></tr>`;
  return `
    <div class="grid-2 sales-layout">
      <section class="panel">
        <h2>Add an expense</h2>
        <p class="hint">For costs that aren't already in your per-bottle cost (₱${state.settings.sizes['10mL'].cost} for 10mL, ₱${state.settings.sizes['30mL'].cost} for 30mL). Don't add bottles, oil or packaging here if they're already counted in that cost.</p>
        <form id="expForm" class="form">
          <div class="row">
            <label>Date <input type="date" name="date" value="${today()}" required /></label>
            <label>Amount (₱) <input type="number" name="amount" min="1" step="1" required /></label>
          </div>
          <label>Category <select name="category">${EXPENSE_CATEGORIES.map((c) => `<option>${c}</option>`).join('')}</select></label>
          <label>Description <input name="description" placeholder="e.g. FB boost, 3 days" /></label>
          <button class="btn btn-rose btn-block" type="submit">Save expense</button>
        </form>
      </section>
      <section class="panel">
        <h2>Expenses in this period: ${peso(total)}</h2>
        ${Object.keys(byCat).length ? `<ul class="cat-list">${Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => `<li><span>${esc(c)}</span><strong>${peso(v)}</strong></li>`).join('')}</ul>` : ''}
        <div class="table-scroll"><table class="table"><thead><tr><th>Date</th><th>Category</th><th>Description</th><th class="num">Amount</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      </section>
    </div>`;
};
VIEWS.expensesBind = (el) => {
  $('#expForm', el).addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    guarded(async () => {
      await api('/expenses', { method: 'POST', body: { date: f.date.value, amount: Number(f.amount.value), category: f.category.value, description: f.description.value } });
      toast('Expense saved.');
      render();
    }, $('button', f));
  });
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-del-exp]');
    if (!b) return;
    if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.textContent = 'Tap again to delete'; return; }
    guarded(async () => { await api(`/expenses/${b.dataset.delExp}`, { method: 'DELETE' }); toast('Expense deleted.'); render(); }, b);
  });
};

// ---- Projections ------------------------------------------------------------------
VIEWS.projections = async () => {
  await refreshBase();
  // pace from the last 30 days, and average monthly expenses over the last 3 months
  const t = today();
  const d3 = new Date(Date.now() + 8 * 36e5 - 90 * 864e5).toISOString().slice(0, 10);
  const r3 = await api(`/report?from=${d3}&to=${t}`);
  const sold30 = { '10mL': 0, '30mL': 0 };
  for (const p of state.products) for (const s of SIZES) sold30[s] += p.sold30[s] || 0;
  const avgExp = Math.round(r3.totals.expenses / 3);
  const { sizes } = state.settings;

  const sizeInputs = SIZES.map((s) => `
    <fieldset class="proj-size">
      <legend>${s}</legend>
      <label>Selling price (₱) <input type="number" min="0" step="1" name="price-${s}" value="${sizes[s].price}" /></label>
      <label>Cost per bottle (₱) <input type="number" min="0" step="1" name="cost-${s}" value="${sizes[s].cost}" /></label>
      <label>Bottles sold per month <input type="number" min="0" step="1" name="units-${s}" value="${sold30[s] || 20}" /></label>
      <p class="hint">${sold30[s] ? `You sold ${sold30[s]} in the last 30 days.` : 'No sales in the last 30 days yet, so this starts at 20. Change it.'}</p>
    </fieldset>`).join('');

  return `
    <div class="grid-2 proj-layout">
      <section class="panel">
        <h2>What if…</h2>
        <p class="hint">Change any number to see what a month would look like. This doesn't change your real prices. To change prices on the shop, go to <button class="link" data-goto="settings">Settings</button>.</p>
        <form id="projForm" class="form">
          ${sizeInputs}
          <label>Other expenses per month (₱) <input type="number" min="0" step="1" name="fixed" value="${avgExp}" /></label>
          <p class="hint">${avgExp ? 'Starts at your average over the last 3 months.' : 'Ads, delivery you pay, tools, etc.'}</p>
        </form>
      </section>
      <section class="panel" id="projOut"></section>
      <section class="panel span-2">
        <h2>Compare prices</h2>
        <p class="hint">Profit per bottle at different prices, using the costs above.</p>
        <div id="priceCompare" class="compare-grid"></div>
      </section>
    </div>`;
};

VIEWS.projectionsBind = (el) => {
  const f = $('#projForm', el);
  const v = (n) => Number(f[n].value) || 0;
  const draw = () => {
    let revenue = 0, cost = 0, units = 0;
    const per = SIZES.map((s) => {
      const price = v(`price-${s}`), c = v(`cost-${s}`), u = v(`units-${s}`);
      revenue += price * u; cost += c * u; units += u;
      return { s, price, c, u, profit: price - c };
    });
    const fixed = v('fixed');
    const net = revenue - cost - fixed;
    const avgProfit = units ? (revenue - cost) / units : 0;
    const breakEven = avgProfit > 0 ? Math.ceil(fixed / avgProfit) : null;
    $('#projOut', el).innerHTML = `
      <h2>One month at that pace</h2>
      <div class="stats stats-compact">
        ${stat('Sales', peso(revenue), `${units} bottles`)}
        ${stat('Bottle costs', peso(cost))}
        ${stat('Other expenses', peso(fixed))}
        ${stat('Profit', peso(net), revenue ? `${pct(net / revenue)} of sales` : '', net < 0 ? 'neg' : 'pos')}
      </div>
      <table class="table"><thead><tr><th>Size</th><th class="num">Profit per bottle</th><th class="num">Margin</th><th class="num">Profit per month</th></tr></thead><tbody>
        ${per.map((x) => `<tr><td>${x.s}</td><td class="num ${x.profit <= 0 ? 'neg-text' : ''}">${peso(x.profit)}</td><td class="num">${x.price ? pct(x.profit / x.price) : '–'}</td><td class="num">${peso(x.profit * x.u)}</td></tr>`).join('')}
      </tbody></table>
      <p class="callout">${breakEven === null
        ? 'At these prices you lose money on every bottle. Raise the price or lower the cost.'
        : fixed
          ? `You need to sell about <strong>${breakEven} bottles a month</strong> (at this size mix) just to cover ${peso(fixed)} of other expenses. Every bottle after that is profit.`
          : `Each bottle earns you about <strong>${peso(avgProfit)}</strong> on average at this size mix.`}</p>
      <p class="callout">To earn <strong>₱10,000 profit a month</strong>, you'd need to sell about <strong>${avgProfit > 0 ? Math.ceil((10000 + fixed) / avgProfit) : '–'} bottles</strong>.</p>`;

    const candidates = { '10mL': [99, 109, 119, 129, 149], '30mL': [249, 250, 275, 299, 349] };
    $('#priceCompare', el).innerHTML = SIZES.map((s) => {
      const c = v(`cost-${s}`), current = state.settings.sizes[s].price;
      const list = [...new Set([...candidates[s], current, v(`price-${s}`)])].sort((a, b) => a - b);
      return `<table class="table"><thead><tr><th>${s} price</th><th class="num">Profit per bottle</th><th class="num">Margin</th></tr></thead><tbody>
        ${list.map((p) => `<tr class="${p === current ? 'current' : ''}"><td>${peso(p)}${p === current ? ' <span class="pill">on the shop now</span>' : ''}</td><td class="num ${p - c <= 0 ? 'neg-text' : ''}">${peso(p - c)}</td><td class="num">${p ? pct((p - c) / p) : '–'}</td></tr>`).join('')}
      </tbody></table>`;
    }).join('');
  };
  f.addEventListener('input', draw);
  el.addEventListener('click', (e) => { const g = e.target.closest('[data-goto]'); if (g) setTab(g.dataset.goto); });
  draw();
};

// ---- Settings ---------------------------------------------------------------------
VIEWS.settings = async () => {
  state.settings = await api('/settings');
  const { sizes, low_stock, show_stock } = state.settings;
  return `
    <div class="grid-2">
      <section class="panel">
        <h2>Prices and costs</h2>
        <p class="hint">Prices here are what the shop page shows. Changes appear on the shop within about a minute. Past sales keep the price and cost they were recorded with.</p>
        <form id="settingsForm" class="form">
          ${SIZES.map((s) => `<div class="row">
            <label>${s} price (₱) <input type="number" name="price-${s}" min="1" step="1" value="${sizes[s].price}" required /></label>
            <label>${s} cost (₱) <input type="number" name="cost-${s}" min="0" step="1" value="${sizes[s].cost}" required /></label>
          </div>`).join('')}
          <p class="hint" id="marginHint"></p>
          <label>Warn me when a scent has this many or fewer <input type="number" name="low_stock" min="0" step="1" value="${low_stock}" required /></label>
          <label class="check"><input type="checkbox" name="show_stock" ${show_stock ? 'checked' : ''} /> Show “Sold out” on the shop when a size has 0 in stock</label>
          <p class="hint">Turn this on only after you've entered your real stock counts in Inventory. Otherwise every scent will show as sold out.</p>
          <button class="btn btn-rose btn-block" type="submit">Save settings</button>
        </form>
      </section>
      <section class="panel">
        <h2>Change your password</h2>
        <form id="pwForm" class="form">
          <label>Current password <input type="password" name="current" autocomplete="current-password" required /></label>
          <label>New password <input type="password" name="next" autocomplete="new-password" minlength="10" required /></label>
          <p class="hint">At least 10 characters.</p>
          <button class="btn btn-line btn-block" type="submit">Change password</button>
        </form>
      </section>
    </div>`;
};
VIEWS.settingsBind = (el) => {
  const f = $('#settingsForm', el);
  const hint = () => {
    $('#marginHint', el).textContent = SIZES.map((s) => {
      const p = Number(f[`price-${s}`].value), c = Number(f[`cost-${s}`].value);
      return `${s}: ${peso(p - c)} profit per bottle${p ? ` (${pct((p - c) / p)})` : ''}`;
    }).join(' · ');
  };
  f.addEventListener('input', hint);
  hint();
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const body = {
      sizes: Object.fromEntries(SIZES.map((s) => [s, { price: Number(f[`price-${s}`].value), cost: Number(f[`cost-${s}`].value) }])),
      low_stock: Number(f.low_stock.value),
      show_stock: f.show_stock.checked,
    };
    guarded(async () => { state.settings = await api('/settings', { method: 'PUT', body }); toast('Settings saved.'); }, $('button', f));
  });
  $('#pwForm', el).addEventListener('submit', (e) => {
    e.preventDefault();
    const p = e.target;
    guarded(async () => {
      await api('/auth/password', { method: 'POST', body: { current: p.current.value, next: p.next.value } });
      p.reset();
      toast('Password changed.');
    }, $('button', p));
  });
};

// ---- Boot -------------------------------------------------------------------------
(async () => {
  try {
    const { user } = await api('/auth/me');
    await startApp(user);
  } catch {
    showLogin();
  }
})();
