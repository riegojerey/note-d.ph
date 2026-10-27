<div align="center">
  <img src="logo.png" width="120" alt="Note.d logo" />
  <h1>Note.d</h1>
  <p><em>Designer-inspired perfume oils from ₱119</em></p>
</div>

---

Oil-based, designer-inspired perfumes hand-poured in the Philippines — because
smelling unforgettable shouldn't cost a fortune.

### What's inside

- **21 fragrances** inspired by iconic designer scents
- **10 mL** and **30 mL** hand-poured bottles
- Build an order on the site, send it via Messenger

### The collection

| #  | Note.d              | Inspired By                     | Notes                                |
| -- | ------------------- | ------------------------------- | ------------------------------------ |
| 1  | Acqua Profonda      | Acqua di Gio Profondo           | Marine &middot; Bergamot &middot; Cypress  |
| 2  | Fiamma              | Eros Flame                      | Red Apple &middot; Tonka &middot; Sage      |
| 3  | Fluidité Douce      | Gentle Fluidity                 | Juniper &middot; Musk &middot; Vanilla      |
| 4  | Rouge Cristal       | Baccarat Rouge 540              | Saffron &middot; Cedar &middot; Ambergris   |
| 5  | 212°                | Carolina Herrera 212            | Citrus &middot; Florals &middot; Sandalwood  |
| 6  | Corail Solaire      | Bulgari Omnia Coral            | Hibiscus &middot; Pomegranate &middot; Cedar  |
| 7  | Cristalline         | Bulgari Omnia Crystalline      | Lotus &middot; Bamboo &middot; White Tea     |
| 8  | Sauvage Homme       | Dior Sauvage                    | Bergamot &middot; Pepper &middot; Ambroxan   |
| 9  | Azzurro Mare        | Dolce & Gabbana Light Blue     | Lemon &middot; Cedar &middot; Musk           |
| 10 | Éclat Florale       | Lanvin Éclat d'Arpège          | Lilac &middot; Peach &middot; White Musk     |
| 11 | Merveille Bleue     | Hermès Eau des Merveilles Bleue| Salt &middot; Minerals &middot; Driftwood    |
| 12 | L'Unico             | Dolce & Gabbana The One        | Peach &middot; Vanilla &middot; Amber        |
| 13 | Acqua Classica      | Acqua di Gio                    | Seawater &middot; Jasmine &middot; Rosemary  |
| 14 | Blanc Frais         | Lacoste White                   | Grapefruit &middot; Cardamom &middot; Cedar  |
| 15 | Nectarine Bloom     | Jo Malone Nectarine             | Nectarine &middot; Peony &middot; Honey      |
| 16 | Delina Rose         | Parfums de Marly Delina         | Lychee &middot; Rhubarb &middot; Turkish Rose |
| 17 | Rêverie             | LV Imagination                  | Black Tea &middot; Ginger &middot; Cinnamon  |
| 18 | Noir Intense        | YSL Y Intense                   | Ginger &middot; Lavender &middot; Vetiver    |
| 19 | Symphonie Dorée     | LV Symphony                     | Grapefruit &middot; Ginger &middot; Bergamot |
| 20 | Voile Blanc         | Parfums de Marly Valaya         | Bergamot &middot; Orange Blossom &middot; Musk |
| 21 | Paradosso           | Prada Paradoxe                  | Pear &middot; Jasmine &middot; Vanilla Bourbon |

### Pricing

| Size   | Price   |
| ------ | ------  |
| 10 mL  | &#8369;119  |
| 30 mL  | &#8369;275 |

### Structure

```
.
├── index.html, styles.css, script.js   # Shop page
├── brand/                               # Logo files (from updated_logo.jpg)
├── admin/                               # Admin page at /admin (login required)
├── functions/                           # Cloudflare Pages Functions: the /api the admin uses
├── migrations/                          # D1 database tables + starting data
├── scripts/create-user.mjs              # Create or reset an admin login
├── labels/, gen_labels.py               # Printable perfume labels
└── wrangler.toml, package.json          # Cloudflare tooling
```

### Admin (note-d.shop/admin)

Track sales, inventory, expenses and profit, and set the prices the shop shows.

**One-time setup** (needs your Cloudflare login):

1. `npm install`
2. `npx wrangler login`
3. `npx wrangler d1 create noted-db` → copy the `database_id` it prints into `wrangler.toml`
4. `npm run db:migrate:remote` (creates the tables and loads the 21 scents)
5. Cloudflare dashboard → Workers & Pages → your site → Settings → Bindings → Add → D1 database: variable name `DB`, database `noted-db`. Then redeploy.
6. `node scripts/create-user.mjs <your-username> --remote` and type a password (10+ characters). Run it again for a partner's account, or to reset a forgotten password.

**Try it locally:** `npm run db:migrate:local`, `node scripts/create-user.mjs test --local`, then `npm run dev` and open http://localhost:8788/admin.

**Notes**
- Prices set in Admin → Settings show on the shop within about a minute. The prices written in the page are only a fallback.
- “Show sold out on the shop” starts off. Enter real stock counts in Inventory first.
- Per-bottle cost covers oil, bottle and packaging. Log only other costs (ads, delivery you pay) as expenses, so nothing is counted twice.

### Order

Message us on Facebook: **[fb.com/notedph](https://fb.com/notedph)**

---

<div align="center">
  <sub>Made with care in the Philippines</sub>
</div>
