// Dev-only seed script. Run with: bun run scripts/seed-dev.ts [email]
// Inserts example transactions, debts, and savings so the dashboard, reports,
// and planning screens have data to render. Never run in production.
import { Database } from "bun:sqlite"

const dbPath = process.env.DATABASE_PATH ?? "dompetku.sqlite"
const db = new Database(dbPath)
const email = process.argv[2]

const user = email
  ? (db.query("SELECT id FROM user WHERE email = ?").get(email) as { id: string } | null)
  : (db.query("SELECT id FROM user ORDER BY created_at LIMIT 1").get() as { id: string } | null)

if (!user) {
  console.error("No user found. Register an account first.")
  process.exit(1)
}
const userId = user.id
console.log(`Seeding data for user ${userId}`)

// Clean previous seed rows
db.run("DELETE FROM transactions WHERE user_id = ? AND id LIKE 'seed-%'", [userId])
db.run("DELETE FROM debts WHERE user_id = ? AND contact LIKE 'Seed %'", [userId])

const wallet = db
  .query("SELECT id FROM wallets WHERE user_id = ? AND type = 'daily' LIMIT 1")
  .get(userId) as { id: string } | null
if (!wallet) {
  console.error("No daily wallet found. Create a wallet first.")
  process.exit(1)
}
const walletId = wallet.id

function cat(name: string, type: "income" | "expense") {
  const row = db
    .query("SELECT id FROM categories WHERE user_id = ? AND name = ? AND type = ?")
    .get(userId, name, type) as { id: string } | null
  return row?.id ?? null
}

const gaji = cat("Gaji", "income")
const bonus = cat("Bonus", "income")
const makanan = cat("Makanan", "expense")
const transportasi = cat("Transportasi", "expense")
const tagihan = cat("Tagihan", "expense")
const belanja = cat("Belanja", "expense")

// 6 cycles of income/expense (May..Oct 2026)
const cycles = [
  { month: 5, income: 8_000_000, expenses: [[makanan, 2_200_000], [transportasi, 600_000], [tagihan, 1_200_000]] },
  { month: 6, income: 8_500_000, expenses: [[makanan, 2_400_000], [transportasi, 700_000], [tagihan, 1_200_000], [belanja, 500_000]] },
  { month: 7, income: 9_000_000, expenses: [[makanan, 2_600_000], [transportasi, 800_000], [tagihan, 1_300_000]] },
  { month: 8, income: 8_200_000, expenses: [[makanan, 2_300_000], [transportasi, 650_000], [tagihan, 1_200_000], [belanja, 900_000]] },
  { month: 9, income: 9_500_000, expenses: [[makanan, 2_800_000], [transportasi, 900_000], [tagihan, 1_300_000]] },
  { month: 10, income: 10_000_000, expenses: [[makanan, 2_500_000], [transportasi, 700_000], [tagihan, 1_200_000], [belanja, 600_000]] },
]

let n = 0
for (const c of cycles) {
  const pad = (v: number) => String(v).padStart(2, "0")
  db.run(
    "INSERT INTO transactions (id,user_id,type,amount,fee,wallet_id,category_id,description,transaction_date) VALUES (?,?,?,?,?,?,?,?,?)",
    [`seed-${userId.slice(0,6)}-inc-${n}`, userId, "income", c.income, 0, walletId, gaji, "Gaji bulanan", `2026-${pad(c.month)}-05`],
  )
  n++
  if (c.month === 7) {
    db.run(
      "INSERT INTO transactions (id,user_id,type,amount,fee,wallet_id,category_id,description,transaction_date) VALUES (?,?,?,?,?,?,?,?,?)",
      [`seed-${userId.slice(0,6)}-bonus-${n}`, userId, "income", 1_500_000, 0, walletId, bonus, "Bonus proyek", `2026-07-20`],
    )
    n++
  }
  for (const [catId, amount] of c.expenses) {
    db.run(
      "INSERT INTO transactions (id,user_id,type,amount,fee,wallet_id,category_id,description,transaction_date) VALUES (?,?,?,?,?,?,?,?,?)",
      [`seed-${userId.slice(0,6)}-exp-${n}`, userId, "expense", amount, 0, walletId, catId, "Pengeluaran rutin", `2026-${pad(c.month)}-15`],
    )
    n++
  }
  // extra transactions on a couple of dates in the latest cycle
  if (c.month === 10) {
    db.run(
      "INSERT INTO transactions (id,user_id,type,amount,fee,wallet_id,category_id,description,transaction_date) VALUES (?,?,?,?,?,?,?,?,?)",
      [`seed-${userId.slice(0,6)}-exp-${n}`, userId, "expense", 85_000, 0, walletId, makanan, "Makan siang", "2026-10-28"],
    )
    n++
    db.run(
      "INSERT INTO transactions (id,user_id,type,amount,fee,wallet_id,category_id,description,transaction_date) VALUES (?,?,?,?,?,?,?,?,?)",
      [`seed-${userId.slice(0,6)}-exp-${n}`, userId, "expense", 45_000, 0, walletId, transportasi, "Ojek online", "2026-10-27"],
    )
    n++
    db.run(
      "INSERT INTO transactions (id,user_id,type,amount,fee,wallet_id,category_id,description,transaction_date) VALUES (?,?,?,?,?,?,?,?,?)",
      [`seed-${userId.slice(0,6)}-inc-${n}`, userId, "income", 200_000, 0, walletId, bonus, "Bonus kecil", "2026-10-26"],
    )
    n++
  }
}

// debts
db.run(
  "INSERT INTO debts (id,user_id,type,contact,amount,paid_amount,due_date,note,status) VALUES (?,?,?,?,?,?,?,?,?)",
  ["seed-${userId.slice(0,6)}-hutang", userId, "hutang", "Seed Bank", 2_169_000, 500_000, "2026-12-15", "Cicilan kendaraan", "active"],
)
db.run(
  "INSERT INTO debts (id,user_id,type,contact,amount,paid_amount,due_date,note,status) VALUES (?,?,?,?,?,?,?,?,?)",
  ["seed-${userId.slice(0,6)}-piutang", userId, "piutang", "Seed Teman", 1_000_000, 0, "2026-11-30", "Pinjaman ke teman", "active"],
)

// Recurring subscription
const subCat = cat("Tagihan", "expense")
db.run(
  "INSERT INTO subscriptions (id,user_id,name,amount,wallet_id,category_id,next_due_date,interval_months,direction,active) VALUES (?,?,?,?,?,?,?,?,?,?)",
  ["seed-${userId.slice(0,6)}-sub", userId, "Internet rumah", 350_000, walletId, subCat, "2026-11-10", 1, "expense", 1],
)

// Update wallet balance to reflect seeded transactions
const bal = db
  .query(
    "SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount WHEN type='expense' THEN -amount ELSE -fee END),0) AS b FROM transactions WHERE user_id = ? AND wallet_id = ?",
  )
  .get(userId, walletId) as { b: number }
db.run("UPDATE wallets SET balance = ? WHERE id = ?", [bal.b, walletId])

console.log(`Seeded ${n} transactions, 2 debts, 1 subscription. Wallet balance: ${bal.b}.`)
db.close()