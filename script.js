// ---- Config -------------------------------------------------------------
const FB_PAGE = 'notedph';
const MESSENGER_URL = `https://m.me/${FB_PAGE}`;
const FACEBOOK_URL = `https://facebook.com/${FB_PAGE}`;
const SIZES = { '10mL': 119, '30mL': 275 };
// Live stock from the admin (see noted-admin/STOCK-SYNC.md). Empty = use the stock flags below.
const STOCK_URL = 'https://docker-vm.chronicle-logarithm.ts.net:8443/stock';
// Scents whose admin ID differs from the site ID (admin builds IDs from the name entered there)
const ADMIN_ID = { amethyste: 'amethyse', 'bleu-noble': 'de-chanel', vendredi: 'friday', 'ombre-sable': 'ombre-nomade' };

// gender: male | female | unisex · time: day | night | any
// vibes: fresh | sweet | floral | bold · colors: card gradient [from, to]
const SCENTS = [
  { id: 'symphonie-doree', name: 'Symphonie Dorée', inspired: 'Louis Vuitton Symphony', gender: 'unisex', time: 'day', vibes: ['fresh'], notes: 'Grapefruit · Ginger · Bergamot', desc: 'Grapefruit and ginger lifted by bright bergamot. A golden hour that never ends.', best: 'Day · Office · Casual', colors: ['#f8ecc9', '#c99a2e'], stock: true },
  { id: 'voile-blanc', name: 'Voile Blanc', inspired: 'Parfums de Marly Valaya', gender: 'female', time: 'day', vibes: ['fresh', 'floral'], notes: 'Bergamot · Orange blossom · Musk', desc: 'Bergamot wakes orange blossom, settling into clean musk. Airy and graceful.', best: 'Day · Office · Date', colors: ['#f4efe9', '#b9a48e'], stock: true },
  { id: 'vendredi', name: 'Vendredi', inspired: 'Zara Friday', gender: 'female', time: 'any', vibes: ['sweet', 'floral'], notes: 'Pear · Florals · Vanilla', desc: 'Juicy pear and soft florals on a cozy vanilla base. The weekend starts now.', best: 'Day & Night · Casual · Night out', colors: ['#f7e1d9', '#c76b5a'], stock: true },
  { id: 'reverie', name: 'Rêverie', inspired: 'Louis Vuitton Imagination', gender: 'unisex', time: 'any', vibes: ['bold', 'sweet'], notes: 'Black tea · Ginger · Cinnamon', desc: 'Black tea steeped with ginger and cinnamon. Quiet luxury, cozy warmth.', best: 'Cold days · Café · Evenings', colors: ['#ece3d7', '#8a6a4a'], stock: true },
  { id: 'rouge-cristal', name: 'Rouge Cristal', inspired: 'Baccarat Rouge 540', gender: 'unisex', time: 'night', vibes: ['sweet', 'bold'], notes: 'Saffron · Cedar · Ambergris', desc: 'Saffron, smoked cedar and ambergris. Lingers in the room long after you leave.', best: 'Night · Formal · Evening', colors: ['#f4d6d0', '#a3263a'], stock: true, top: true },
  { id: 'fiamma', name: 'Fiamma', inspired: 'Versace Eros Flame', gender: 'male', time: 'night', vibes: ['sweet', 'bold'], notes: 'Red apple · Tonka · Sage', desc: 'Red apple and tonka wrapped in aromatic sage. Starts bold, ends unforgettable.', best: 'Night · Date · Party', colors: ['#f6d2c4', '#c2452d'], stock: true },
  { id: 'bleu-noble', name: 'Bleu Noble', inspired: 'Bleu de Chanel', gender: 'male', time: 'any', vibes: ['fresh', 'bold'], notes: 'Grapefruit · Incense · Cedar', desc: 'Bright grapefruit over smoky incense and smooth cedar. Clean, confident, effortlessly classy.', best: 'Day & Night · Office · Date', colors: ['#dde4f3', '#16326e'], stock: true },
  { id: 'sauvage-homme', name: 'Sauvage Homme', inspired: 'Dior Sauvage', gender: 'male', time: 'any', vibes: ['fresh', 'bold'], notes: 'Bergamot · Pepper · Ambroxan', desc: 'Peppery bergamot crashing into deep ambroxan. Untamed and unmistakable.', best: 'Day & Night · All occasions', colors: ['#d9dfe8', '#2f4a6b'], stock: true, top: true },
  { id: 'cristalline', name: 'Cristalline', inspired: 'Bvlgari Omnia Crystalline', gender: 'female', time: 'day', vibes: ['fresh', 'floral'], notes: 'Lotus · Bamboo · White tea', desc: 'Lotus floating above bamboo and white tea. Pure, luminous, serene.', best: 'Day · Office · Brunch', colors: ['#e6f2ef', '#8bbcb1'], stock: true },
  { id: 'amethyste', name: 'Améthyste', inspired: 'Bvlgari Omnia Amethyste', gender: 'female', time: 'day', vibes: ['floral', 'fresh'], notes: 'Iris · Rose · Pink grapefruit', desc: 'Powdery iris and dewy rose lifted by pink grapefruit. Soft, polished, quietly radiant.', best: 'Day · Office · Brunch', colors: ['#ece2f2', '#8a5aa8'], stock: true },
  { id: 'nectarine-bloom', name: 'Nectarine Bloom', inspired: 'Jo Malone Nectarine Blossom & Honey', gender: 'female', time: 'day', vibes: ['floral', 'sweet'], notes: 'Nectarine · Peony · Honey', desc: 'Ripe nectarine, peony petals and a drizzle of honey. Bright and joyful.', best: 'Day · Garden · Brunch', colors: ['#fde2cc', '#e88a4f'], stock: true },
  { id: 'ombre-sable', name: 'Ombre Sable', inspired: 'Louis Vuitton Ombre Nomade', gender: 'unisex', time: 'night', vibes: ['bold', 'sweet'], notes: 'Oud · Raspberry · Incense', desc: 'Smoky oud and incense softened by dark raspberry. Rich, mysterious, unforgettable.', best: 'Night · Formal · Cold evenings', colors: ['#ead9cf', '#5a2e24'], stock: true },
  { id: 'noir-intense', name: 'Noir Intense', inspired: 'YSL Y Intense', gender: 'male', time: 'night', vibes: ['bold'], notes: 'Ginger · Lavender · Vetiver', desc: 'Sharp ginger through lavender, grounded by dark vetiver. Bold and electric.', best: 'Night · Party · Date', colors: ['#d9d9e3', '#2b2b3d'], stock: true },
  { id: 'acqua-profonda', name: 'Acqua Profonda', inspired: 'Acqua di Gio Profondo', gender: 'male', time: 'day', vibes: ['fresh'], notes: 'Marine · Bergamot · Cypress', desc: 'Crisp sea air and sharp bergamot over grounded cypress. Bottled confidence.', best: 'Day · Beach · Office', colors: ['#cfe6f2', '#5b93b5'], stock: true },
  { id: 'eclat-florale', name: 'Éclat Florale', inspired: "Lanvin Éclat d'Arpège", gender: 'female', time: 'day', vibes: ['floral'], notes: 'Lilac · Peach · White musk', desc: 'Lilac and peach kissed by white musk. Delicate, romantic, timeless.', best: 'Day · Garden party · Date', colors: ['#ebe0f3', '#9a7cc0'], stock: true },
  { id: 'fluidite-douce', name: 'Fluidité Douce', inspired: 'MFK Gentle Fluidity Silver', gender: 'unisex', time: 'any', vibes: ['sweet', 'fresh'], notes: 'Juniper · Musk · Vanilla', desc: 'Fresh juniper glides into soft musk and warm vanilla. Subtle, but noticed.', best: 'Day & Night · Office · Casual', colors: ['#ece6dc', '#a69580'] },
  { id: 'blanc-frais', name: 'Blanc Frais', inspired: 'Lacoste L.12.12 White', gender: 'male', time: 'day', vibes: ['fresh'], notes: 'Grapefruit · Cardamom · Cedar', desc: 'Fresh grapefruit and cardamom on smooth cedar. Crisp, sporty, clean.', best: 'Day · Sport · Office', colors: ['#eef1ea', '#7f9a72'] },
  { id: '212', name: '212°', inspired: 'Carolina Herrera 212', gender: 'unisex', time: 'day', vibes: ['fresh'], notes: 'Citrus · Florals · Sandalwood', desc: 'Zesty citrus over soft sandalwood. For the one who never stops moving.', best: 'Day · City · Everyday', colors: ['#e3e7ee', '#6b7a90'] },
  { id: 'azzurro-mare', name: 'Azzurro Mare', inspired: 'Dolce & Gabbana Light Blue', gender: 'unisex', time: 'day', vibes: ['fresh'], notes: 'Lemon · Cedar · Musk', desc: 'Sicilian lemon, sea breeze, crisp cedar and clean musk. Freedom in a bottle.', best: 'Day · Beach · Casual', colors: ['#d6ebf7', '#3f8fc4'] },
  { id: 'corail-solaire', name: 'Corail Solaire', inspired: 'Bvlgari Omnia Coral', gender: 'female', time: 'day', vibes: ['floral'], notes: 'Hibiscus · Pomegranate · Cedar', desc: 'Hibiscus and pomegranate burst against creamy cedar. Summer, bottled.', best: 'Day · Beach · Summer', colors: ['#fbd9cc', '#e2694f'] },
  { id: 'paradosso', name: 'Paradosso', inspired: 'Prada Paradoxe', gender: 'female', time: 'night', vibes: ['sweet', 'floral'], notes: 'Pear · Jasmine · Vanilla bourbon', desc: 'Sweet pear and jasmine dissolving into vanilla bourbon. Soft, yet unshakable.', best: 'Night · Date · Formal', colors: ['#f1e2ea', '#8c4a6e'] },
  { id: 'saphir-rose', name: 'Saphir Rose', inspired: 'Bvlgari Omnia Pink Sapphire', gender: 'female', time: 'day', vibes: ['floral', 'fresh'], notes: 'Pink grapefruit · Frangipani · Musk', desc: 'Juicy pink grapefruit melting into frangipani, peach and rose, then soft musk. Bright, pretty and easy to love.', best: 'Day · Brunch · Date', colors: ['#fbdde3', '#d9667f'] },
  { id: 'lunico', name: "L'Unico", inspired: 'Dolce & Gabbana The One', gender: 'unisex', time: 'night', vibes: ['sweet'], notes: 'Peach · Vanilla · Amber', desc: 'Juicy peach melting into creamy vanilla and golden amber. Warm and magnetic.', best: 'Night · Date · Intimate', colors: ['#f6e3c8', '#b97a2e'] },
  { id: 'merveille-bleue', name: 'Merveille Ambrée', inspired: 'Hermès Eau des Merveilles', gender: 'female', time: 'any', vibes: ['bold', 'fresh'], notes: 'Orange · Amber · Cedar', desc: 'Sparkling orange over warm amber and dry cedar. Bright, woody and softly glowing, like sunlight on warm skin.', best: 'Day & Night · Casual · Date', colors: ['#f3e1cf', '#a8582e'] },
  { id: 'infuse', name: 'Infusé', inspired: 'Armaf Infusion', gender: 'unisex', time: 'any', vibes: ['fresh'], notes: 'Bergamot · Black tea · Cedar', desc: 'Bright bergamot steeped with black tea and a hint of spice, settling on smooth cedar. Calm, clean and easy all day.', best: 'Day & Night · Office · Casual', colors: ['#ebe6d6', '#7d6b3f'] },
  { id: 'delina-rose', name: 'Delina Rose', inspired: 'Parfums de Marly Delina', gender: 'female', time: 'any', vibes: ['floral'], notes: 'Lychee · Rhubarb · Turkish rose', desc: 'Juicy lychee and tangy rhubarb around Turkish rose. Feminine and fierce.', best: 'Day & Night · Date · Formal', colors: ['#fbdbe4', '#d0587e'], top: true },
  { id: 'santal-velours', name: 'Santal Velours', inspired: 'Le Labo Santal 33', gender: 'unisex', time: 'any', vibes: ['bold'], notes: 'Sandalwood · Cardamom · Leather', desc: 'Creamy sandalwood, cardamom and a soft touch of leather. Smoky, woody and effortlessly cool.', best: 'Day & Night · City · Date', colors: ['#eee2d3', '#8c6239'] },
  { id: 'musc-treize', name: 'Musc Treize', inspired: 'Le Labo Another 13', gender: 'unisex', time: 'any', vibes: ['fresh'], notes: 'Ambrette · Ambroxan · Musk', desc: 'Ambrette and ambroxan wrapped in clean, skin-like musk. Like your own skin, only better.', best: 'Day & Night · Office · Everyday', colors: ['#ececea', '#7d7f86'] },
  { id: 'pivoine-glacee', name: 'Pivoine Glacée', inspired: 'Versace Bright Crystal', gender: 'female', time: 'day', vibes: ['floral', 'fresh'], notes: 'Pomegranate · Peony · Musk', desc: 'Icy pomegranate and yuzu over peony and magnolia, settling into soft musk. Fresh, pretty and sparkling.', best: 'Day · Brunch · Office', colors: ['#f9e3ec', '#c4527d'] },
  { id: 'belle-bombe', name: 'Belle Bombe', inspired: "Victoria's Secret Bombshell", gender: 'female', time: 'any', vibes: ['sweet', 'floral'], notes: 'Passion fruit · Peony · Vanilla orchid', desc: 'Juicy passion fruit and peony over creamy vanilla orchid. Flirty, fun and impossible to ignore.', best: 'Day & Night · Night out · Date', colors: ['#f6dff0', '#b1408f'] },
  { id: 'coin-du-feu', name: 'Coin du Feu', inspired: 'Maison Margiela Replica By the Fireplace', gender: 'unisex', time: 'night', vibes: ['sweet', 'bold'], notes: 'Chestnut · Clove · Vanilla', desc: 'Roasted chestnut, clove and smoky woods melting into warm vanilla. A crackling fire on a cold night.', best: 'Night · Cold days · Cozy dates', colors: ['#f0d9c6', '#8e3f1f'] },
];

const GENDER_LABEL = { male: 'For him', female: 'For her', unisex: 'Unisex' };
const peso = (n) => `₱${n.toLocaleString('en-PH')}`;
const $ = (sel) => document.querySelector(sel);

// ---- Links --------------------------------------------------------------
document.querySelectorAll('.js-messenger').forEach((a) => {
  a.href = MESSENGER_URL;
  a.target = '_blank';
  a.rel = 'noopener';
});
document.querySelectorAll('.js-facebook').forEach((a) => {
  a.href = FACEBOOK_URL;
  a.target = '_blank';
  a.rel = 'noopener';
});

// ---- Toast --------------------------------------------------------------
const toastEl = $('#toast');
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

// ---- Product grid -------------------------------------------------------
const grid = $('#grid');

const num = (i) => String(i + 1).padStart(2, '0');

// "Marine · Bergamot · Cypress" -> "Marine, bergamot, cypress"
function listText(str, joiner = ', ') {
  const parts = str.split(' · ').map((p, i) => (i === 0 ? p : p.charAt(0).toLowerCase() + p.slice(1)));
  return parts.join(joiner);
}

function swatch(s, cls = 'swatch') {
  const i = SCENTS.indexOf(s);
  return `<span class="${cls}" style="--c1:${s.colors[0]};--c2:${s.colors[1]}" aria-hidden="true">Nº${num(i)}</span>`;
}

let bottleUid = 0;
function miniBottle(s) {
  const id = `b${bottleUid++}`;
  return `<svg class="mini" viewBox="0 0 80 130" aria-hidden="true">
    <defs><clipPath id="${id}"><rect x="12" y="38" width="56" height="86" rx="14"/></clipPath></defs>
    <rect x="26" y="4" width="28" height="24" rx="4" fill="#e9b24c"/>
    <rect x="26" y="4" width="9" height="24" rx="3" fill="rgba(255,255,255,.35)"/>
    <rect x="31" y="28" width="18" height="11" fill="rgba(255,255,255,.7)"/>
    <rect x="12" y="38" width="56" height="86" rx="14" fill="rgba(255,255,255,.35)"/>
    <rect x="0" y="56" width="80" height="80" fill="${s.colors[1]}" clip-path="url(#${id})"/>
    <rect x="12" y="38" width="56" height="86" rx="14" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="2"/>
    <rect x="18" y="44" width="5" height="70" rx="2.5" fill="rgba(255,255,255,.45)"/>
    <rect x="22" y="76" width="36" height="26" rx="2" fill="#fffaf6"/>
    <image href="brand/mark.png" x="32" y="80" width="16" height="12"/>
  </svg>`;
}

function cardHTML(s, i) {
  return `
  <article class="card" data-id="${s.id}" style="--c1:${s.colors[0]};--c2:${s.colors[1]}">
    <div class="card-label">
      <span class="card-no">Nº ${num(i)}</span>
      <span class="tag">${GENDER_LABEL[s.gender]}</span>
      ${s.stock ? '' : '<span class="tag preorder">Pre-order</span>'}
      ${s.top ? '<span class="pick">Our pick</span>' : ''}
      ${miniBottle(s)}
    </div>
    <div class="card-body">
      <p class="inspired">Inspired by <strong>${s.inspired}</strong></p>
      <h3>${s.name}</h3>
      <p class="notes">${listText(s.notes)}</p>
      <p class="desc">${s.desc}</p>
      <p class="best">Best for ${listText(s.best).toLowerCase()}</p>
      <div class="card-buy">
        <div class="sizes" role="radiogroup" aria-label="Size">
          ${Object.entries(SIZES).map(([size, price], j) => `
            <button class="size${j === 0 ? ' active' : ''}" role="radio" aria-checked="${j === 0}" data-size="${size}">
              ${size} <strong>${peso(price)}</strong>
            </button>`).join('')}
        </div>
        <button class="btn btn-rose add-btn">${s.stock ? 'Add' : 'Pre-order'}</button>
      </div>
    </div>
  </article>`;
}

grid.innerHTML = SCENTS.map(cardHTML).join('');

grid.addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;

  const sizeBtn = e.target.closest('.size');
  if (sizeBtn) {
    card.querySelectorAll('.size').forEach((b) => {
      const on = b === sizeBtn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-checked', on);
    });
    return;
  }

  const addBtn = e.target.closest('.add-btn');
  if (addBtn) {
    const size = card.querySelector('.size.active').dataset.size;
    addToCart(card.dataset.id, size);
    const label = addBtn.textContent;
    addBtn.textContent = 'Added';
    addBtn.classList.add('added');
    setTimeout(() => {
      addBtn.textContent = label;
      addBtn.classList.remove('added');
    }, 1200);
  }
});

// Admin stock wins over the hardcoded flags; if the admin can't be reached, the flags stay.
if (STOCK_URL) {
  fetch(STOCK_URL, AbortSignal.timeout ? { signal: AbortSignal.timeout(5000) } : {})
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((live) => {
      SCENTS.forEach((s) => {
        const id = ADMIN_ID[s.id] || s.id;
        if (id in live) s.stock = live[id];
      });
      grid.innerHTML = SCENTS.map(cardHTML).join('');
      applyFilters();
      renderCart();
    })
    .catch(() => {});
}

// ---- Filter + search ----------------------------------------------------
let activeFilter = 'all';
let query = '';

function matchesFilter(s) {
  if (activeFilter === 'all') return true;
  if (activeFilter === 'day' || activeFilter === 'night') return s.time === activeFilter || s.time === 'any';
  return s.gender === activeFilter;
}

function matchesQuery(s) {
  if (!query) return true;
  const hay = `${s.name} ${s.inspired} ${s.notes} ${s.desc} ${s.best}`.toLowerCase();
  return query.split(/\s+/).every((w) => hay.includes(w));
}

function applyFilters() {
  let shown = 0;
  SCENTS.forEach((s) => {
    const visible = matchesFilter(s) && matchesQuery(s);
    grid.querySelector(`[data-id="${s.id}"]`).hidden = !visible;
    if (visible) shown++;
  });
  $('#empty').hidden = shown > 0;
  $('#resultCount').textContent = shown === SCENTS.length ? '' : `Showing ${shown} scent${shown === 1 ? "" : "s"}`;
}

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    applyFilters();
  });
});

function searchFor(q) {
  const input = $('#search');
  input.value = q;
  query = q.trim().toLowerCase();
  document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c.dataset.filter === 'all'));
  activeFilter = 'all';
  applyFilters();
  $('#shop').scrollIntoView({ behavior: 'smooth' });
}

$('#heroSearch').addEventListener('submit', (e) => {
  e.preventDefault();
  searchFor($('#heroInput').value);
});

$('#search').addEventListener('input', (e) => {
  query = e.target.value.trim().toLowerCase();
  applyFilters();
});

// ---- Cart ---------------------------------------------------------------
let cart = [];
try { cart = JSON.parse(localStorage.getItem('noted-cart')) || []; } catch {}

const drawer = $('#drawer');
const backdrop = $('#backdrop');

function saveCart() {
  try { localStorage.setItem('noted-cart', JSON.stringify(cart)); } catch {}
}

function addToCart(id, size) {
  const line = cart.find((l) => l.id === id && l.size === size);
  if (line) line.qty++;
  else cart.push({ id, size, qty: 1 });
  saveCart();
  renderCart();
  const s = SCENTS.find((x) => x.id === id);
  toast(`Added ${s.name}, ${size}`);
  const count = $('#cartCount');
  count.classList.remove('bump');
  void count.offsetWidth;
  count.classList.add('bump');
}

function cartTotal() {
  return cart.reduce((sum, l) => sum + SIZES[l.size] * l.qty, 0);
}

function renderCart() {
  const count = cart.reduce((n, l) => n + l.qty, 0);
  $('#cartCount').textContent = count;
  $('#cartTotal').textContent = peso(cartTotal());
  $('#mobileBarTotal').textContent = `(${count} item${count === 1 ? '' : 's'}, ${peso(cartTotal())})`;
  $('#mobileBar').classList.toggle('show', count > 0);
  $('#sendOrder').disabled = count === 0;

  const items = $('#cartItems');
  if (!cart.length) {
    items.innerHTML = `<div class="cart-empty"><p>Nothing here yet. Tap Add on any scent to start your order.</p><a href="#shop" class="btn btn-line" id="cartBrowse">Browse scents</a></div>`;
    return;
  }
  items.innerHTML = cart.map((l, i) => {
    const s = SCENTS.find((x) => x.id === l.id);
    return `
    <div class="line">
      ${swatch(s)}
      <div class="line-info">
        <strong>${s.name}</strong>
        <span>${l.size}, inspired by ${s.inspired}${s.stock ? '' : ' · Pre-order'}</span>
        <div class="qty">
          <button data-i="${i}" data-d="-1" aria-label="Decrease">−</button>
          <span>${l.qty}</span>
          <button data-i="${i}" data-d="1" aria-label="Increase">+</button>
        </div>
      </div>
      <strong class="line-price">${peso(SIZES[l.size] * l.qty)}</strong>
    </div>`;
  }).join('');
}

$('#cartItems').addEventListener('click', (e) => {
  if (e.target.id === 'cartBrowse') { closeCart(); return; }
  const btn = e.target.closest('.qty button');
  if (!btn) return;
  const i = Number(btn.dataset.i);
  cart[i].qty += Number(btn.dataset.d);
  if (cart[i].qty <= 0) cart.splice(i, 1);
  saveCart();
  renderCart();
});

function openCart() {
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  backdrop.hidden = false;
  document.body.classList.add('no-scroll');
}

function closeCart() {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  backdrop.hidden = true;
  document.body.classList.remove('no-scroll');
}

$('#cartOpen').addEventListener('click', openCart);
$('#mobileBarBtn').addEventListener('click', openCart);
$('#cartClose').addEventListener('click', closeCart);
backdrop.addEventListener('click', closeCart);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });

function orderMessage() {
  const lines = cart.map((l) => {
    const s = SCENTS.find((x) => x.id === l.id);
    return `• ${l.qty} × ${s.name} (${l.size})${s.stock ? '' : ' [pre-order]'} — ${peso(SIZES[l.size] * l.qty)}`;
  });
  return [
    "Hi Note.d! I'd like to order:",
    ...lines,
    `Subtotal: ${peso(cartTotal())}`,
    '',
    'Name:',
    'Delivery address, or pick-up in Makati or Isabela:',
    'Contact number:',
  ].join('\n');
}

$('#sendOrder').addEventListener('click', async () => {
  const msg = orderMessage();
  try {
    await navigator.clipboard.writeText(msg);
    toast('Order copied. Paste it in Messenger.');
  } catch {
    toast('Opening Messenger…');
  }
  window.open(`${MESSENGER_URL}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
});

renderCart();

// ---- Scent finder -------------------------------------------------------
const answers = {};
const steps = document.querySelectorAll('.quiz-step');

function showStep(n) {
  steps.forEach((s) => { s.hidden = Number(s.dataset.step) !== n; });
  $('#quizResult').hidden = n < steps.length;
}

function scoreScent(s) {
  let score = 0;
  if (answers.gender === 'any' || s.gender === answers.gender) score += 3;
  else if (s.gender === 'unisex') score += 2;
  else return -1;
  if (answers.time === 'any' || s.time === answers.time || s.time === 'any') score += 2;
  if (s.vibes[0] === answers.vibe) score += 3;
  else if (s.vibes.includes(answers.vibe)) score += 2;
  if (s.top) score += 0.5;
  return score;
}

function showResults() {
  const picks = SCENTS
    .map((s) => ({ s, score: scoreScent(s) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  $('#resultList').innerHTML = picks.map(({ s }) => `
    <div class="result">
      ${swatch(s)}
      <div class="result-info">
        <strong>${s.name}</strong>
        <span>Inspired by ${s.inspired}</span>
        <span class="notes">${listText(s.notes)}</span>
      </div>
      <button class="btn btn-rose btn-sm" data-add="${s.id}">Add 10mL, ${peso(SIZES['10mL'])}</button>
    </div>`).join('');
  showStep(steps.length);
}

document.querySelectorAll('.quiz-opts button').forEach((btn) => {
  btn.addEventListener('click', () => {
    answers[btn.dataset.key] = btn.dataset.val;
    const step = Number(btn.closest('.quiz-step').dataset.step);
    if (step + 1 < steps.length) showStep(step + 1);
    else showResults();
  });
});

$('#resultList').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add]');
  if (btn) addToCart(btn.dataset.add, '10mL');
});

$('#quizRestart').addEventListener('click', () => showStep(0));

// ---- Hero stage: tap a perfume, the bottle fills with it ------------
const TRY = ['sauvage-homme', 'bleu-noble', 'rouge-cristal', 'symphonie-doree', 'reverie', 'azzurro-mare', 'fiamma', 'noir-intense', 'paradosso', 'lunico'];
const hero = $('#hero');
const liquid = $('#liquid');
let stageScent = SCENTS.find((x) => x.id === 'rouge-cristal');

$('#tryList').innerHTML = TRY.map((id) => {
  const s = SCENTS.find((x) => x.id === id);
  return `<button type="button" class="try-btn" data-id="${id}" style="--c2:${s.colors[1]}"><span class="dot" aria-hidden="true"></span>${s.inspired.replace(/^(Dior|Versace|YSL|Prada|Dolce & Gabbana|Parfums de Marly|Louis Vuitton) /, '')}</button>`;
}).join('');

function showOnStage(s) {
  stageScent = s;
  hero.style.setProperty('--liquid', s.colors[1]);
  hero.style.setProperty('--liquid-light', s.colors[0]);
  $('#flaconName').textContent = s.name;
  $('#flaconNo').textContent = `Nº ${num(SCENTS.indexOf(s))}`;
  $('#stageName').textContent = s.name;
  $('#stageInspired').textContent = s.inspired;
  $('#stageNotes').textContent = listText(s.notes);
  document.querySelectorAll('.try-btn').forEach((b) => b.setAttribute('aria-pressed', b.dataset.id === s.id));
  liquid.classList.remove('slosh');
  void liquid.getBoundingClientRect();
  liquid.classList.add('slosh');
}

$('#tryList').addEventListener('click', (e) => {
  const b = e.target.closest('.try-btn');
  if (b) showOnStage(SCENTS.find((x) => x.id === b.dataset.id));
});

document.querySelectorAll('[data-stage-add]').forEach((b) => {
  b.addEventListener('click', () => addToCart(stageScent.id, b.dataset.stageAdd));
});

showOnStage(stageScent);
requestAnimationFrame(() => hero.classList.add('filled'));

// ---- Nav shadow ---------------------------------------------------------
const nav = $('#nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

