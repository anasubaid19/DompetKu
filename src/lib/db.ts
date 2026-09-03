import { Database } from "bun:sqlite"

export const db = new Database(process.env.DATABASE_PATH ?? "dompetku.sqlite", {
  create: true,
})

db.exec("PRAGMA foreign_keys = ON")
db.exec("PRAGMA journal_mode = WAL")

db.exec(`
  CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('daily', 'saving')),
    balance INTEGER NOT NULL DEFAULT 0,
    color TEXT NOT NULL DEFAULT 'violet',
    icon TEXT NOT NULL DEFAULT 'wallet',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS wallets_user_idx ON wallets(user_id);

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT NOT NULL DEFAULT 'violet',
    icon TEXT NOT NULL DEFAULT 'receipt',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name, type)
  );

  CREATE INDEX IF NOT EXISTS categories_user_idx ON categories(user_id);

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    fee INTEGER NOT NULL DEFAULT 0 CHECK (fee >= 0),
    wallet_id TEXT NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    target_wallet_id TEXT REFERENCES wallets(id) ON DELETE RESTRICT,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    saving_id TEXT REFERENCES savings(id) ON DELETE SET NULL,
    description TEXT NOT NULL DEFAULT '',
    transaction_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS transactions_user_date_idx ON transactions(user_id, transaction_date DESC);

  CREATE TABLE IF NOT EXISTS debts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('hutang', 'piutang')),
    contact TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    paid_amount INTEGER NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    due_date TEXT,
    note TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS debts_user_idx ON debts(user_id);

  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category_id)
  );

  CREATE TABLE IF NOT EXISTS savings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount INTEGER NOT NULL CHECK (target_amount > 0),
    saved_amount INTEGER NOT NULL DEFAULT 0 CHECK (saved_amount >= 0),
    wallet_id TEXT REFERENCES wallets(id) ON DELETE SET NULL,
    color TEXT NOT NULL DEFAULT 'violet',
    target_date TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS savings_user_idx ON savings(user_id);

  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    wallet_id TEXT REFERENCES wallets(id) ON DELETE SET NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    next_due_date TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON subscriptions(user_id);

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
    currency TEXT NOT NULL DEFAULT 'IDR',
    cycle_start INTEGER NOT NULL DEFAULT 1 CHECK (cycle_start BETWEEN 1 AND 28),
    cycle_length INTEGER NOT NULL DEFAULT 1 CHECK (cycle_length IN (1, 3, 6)),
    accent TEXT NOT NULL DEFAULT 'violet',
    hide_balance INTEGER NOT NULL DEFAULT 0
  );
`)

const transactionColumns = db.query("PRAGMA table_info(transactions)").all() as { name: string }[]
if (!transactionColumns.some((column) => column.name === "saving_id")) {
  db.exec(
    "ALTER TABLE transactions ADD COLUMN saving_id TEXT REFERENCES savings(id) ON DELETE SET NULL",
  )
}

export function ensureDefaults(userId: string) {
  db.query("INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)").run(userId)

  const defaults = [
    ["Makanan", "expense", "orange", "receipt"],
    ["Transportasi", "expense", "blue", "car"],
    ["Belanja", "expense", "violet", "bag"],
    ["Tagihan", "expense", "red", "invoice"],
    ["Gaji", "income", "green", "money"],
    ["Bonus", "income", "cyan", "sparkles"],
  ] as const

  const insert = db.query(
    "INSERT OR IGNORE INTO categories (id, user_id, name, type, color, icon) VALUES (?, ?, ?, ?, ?, ?)",
  )
  const seed = db.transaction(() => {
    for (const [name, type, color, icon] of defaults) {
      insert.run(crypto.randomUUID(), userId, name, type, color, icon)
    }
  })
  seed()
}
