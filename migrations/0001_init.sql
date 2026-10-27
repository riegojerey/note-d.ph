-- Note.d admin schema

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  pass_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE TABLE login_attempts (
  key TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX idx_login_attempts ON login_attempts(key, ts);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  inspired TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE stock (
  product_id TEXT NOT NULL REFERENCES products(id),
  size TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, size)
);

-- every stock change, so counts can be traced
CREATE TABLE movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  size TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL, -- restock | sale | sale_deleted | adjust
  sale_id INTEGER,
  note TEXT NOT NULL DEFAULT '',
  username TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_movements_created ON movements(created_at);

CREATE TABLE sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL, -- YYYY-MM-DD (Manila)
  customer TEXT NOT NULL DEFAULT '',
  discount INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  deducted_stock INTEGER NOT NULL DEFAULT 1,
  username TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_sales_date ON sales(date);

-- price and cost are copied at the time of sale so history stays correct after price changes
CREATE TABLE sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  size TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  unit_cost INTEGER NOT NULL
);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);

-- costs not already in the per-bottle cost: ads, delivery you pay, tools, etc.
CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount INTEGER NOT NULL,
  username TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_expenses_date ON expenses(date);
