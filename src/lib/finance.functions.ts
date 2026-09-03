import { createServerFn } from "@tanstack/react-start"
import { requireUser } from "@/lib/auth.server"
import { db, ensureDefaults } from "@/lib/db"
import { isCategoryColor, isCategoryIcon, isFinancialInstitution } from "@/lib/finance-options"
import { today } from "@/lib/utils"

export type Wallet = {
  id: string
  name: string
  type: "daily" | "saving"
  balance: number
  color: string
  icon: string
}

export type Category = {
  id: string
  name: string
  type: "income" | "expense"
  color: string
  icon: string
}

export type FinanceTransaction = {
  id: string
  type: "income" | "expense" | "transfer"
  amount: number
  fee: number
  wallet_id: string
  target_wallet_id: string | null
  category_id: string | null
  saving_id: string | null
  description: string
  transaction_date: string
  category_name: string | null
  wallet_name: string
  target_wallet_name: string | null
}

export type Debt = {
  id: string
  type: "hutang" | "piutang"
  contact: string
  amount: number
  paid_amount: number
  due_date: string | null
  note: string
  status: "active" | "paid"
}

export type Budget = {
  id: string
  category_id: string
  amount: number
  category_name: string
  category_color: string
}

export type Saving = {
  id: string
  name: string
  target_amount: number
  saved_amount: number
  wallet_id: string | null
  color: string
  target_date: string | null
  wallet_name: string | null
}

export type Subscription = {
  id: string
  name: string
  amount: number
  wallet_id: string | null
  category_id: string | null
  next_due_date: string
  active: number
  wallet_name: string | null
  category_name: string | null
}

export type Settings = {
  currency: string
  cycle_start: number
  cycle_length: number
  accent: string
  hide_balance: number
}

export type FinanceData = {
  wallets: Wallet[]
  categories: Category[]
  transactions: FinanceTransaction[]
  debts: Debt[]
  budgets: Budget[]
  savings: Saving[]
  subscriptions: Subscription[]
  settings: Settings
}

type LedgerEntry = {
  type: "income" | "expense" | "transfer"
  amount: number
  fee: number
  walletId: string
  targetWalletId: string | null
}

export function calculateLedgerBalances(
  initial: Record<string, number>,
  previous: LedgerEntry | null,
  next: LedgerEntry | null,
) {
  const balances = { ...initial }
  const apply = (entry: LedgerEntry, direction: 1 | -1) => {
    const change = (walletId: string, amount: number) => {
      if (!(walletId in balances)) throw new Error("Dompet tidak ditemukan")
      balances[walletId] += amount * direction
    }

    if (entry.type === "income") change(entry.walletId, entry.amount)
    if (entry.type === "expense") change(entry.walletId, -entry.amount)
    if (entry.type === "transfer") {
      if (!entry.targetWalletId) throw new Error("Dompet tujuan tidak ditemukan")
      change(entry.walletId, -(entry.amount + entry.fee))
      change(entry.targetWalletId, entry.amount)
    }
  }

  if (previous) apply(previous, -1)
  if (next) apply(next, 1)
  if (Object.values(balances).some((balance) => balance < 0)) {
    throw new Error("Saldo dompet tidak mencukupi")
  }
  return balances
}

function requiredText(value: unknown, label: string, max = 100) {
  if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > max) {
    throw new Error(`${label} tidak valid`)
  }
  return value.trim()
}

function optionalText(value: unknown, max = 240) {
  if (value == null || value === "") return ""
  if (typeof value !== "string" || value.length > max) throw new Error("Teks tidak valid")
  return value.trim()
}

function positiveMoney(value: unknown, label = "Nominal") {
  const amount = Number(value)
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 100_000_000_000_000) {
    throw new Error(`${label} tidak valid`)
  }
  return amount
}

function ownedWallet(userId: string, walletId: unknown) {
  const id = requiredText(walletId, "Dompet", 64)
  const wallet = db
    .query("SELECT * FROM wallets WHERE id = ? AND user_id = ?")
    .get(id, userId) as Wallet | null
  if (!wallet) throw new Error("Dompet tidak ditemukan")
  return wallet
}

export const getFinanceData = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser()
  ensureDefaults(user.id)

  const wallets = db
    .query(
      "SELECT id, name, type, balance, color, icon FROM wallets WHERE user_id = ? ORDER BY created_at",
    )
    .all(user.id) as Wallet[]
  const categories = db
    .query(
      "SELECT id, name, type, color, icon FROM categories WHERE user_id = ? ORDER BY type, name",
    )
    .all(user.id) as Category[]
  const transactions = db
    .query(`
      SELECT t.id, t.type, t.amount, t.fee, t.wallet_id, t.target_wallet_id, t.saving_id,
        t.category_id, t.description, t.transaction_date,
        c.name AS category_name, w.name AS wallet_name, tw.name AS target_wallet_name
      FROM transactions t
      JOIN wallets w ON w.id = t.wallet_id
      LEFT JOIN wallets tw ON tw.id = t.target_wallet_id
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.user_id = ?
      ORDER BY t.transaction_date DESC, t.created_at DESC
    `)
    .all(user.id) as FinanceTransaction[]
  const debts = db
    .query(
      "SELECT id, type, contact, amount, paid_amount, due_date, note, status FROM debts WHERE user_id = ? ORDER BY status, due_date",
    )
    .all(user.id) as Debt[]
  const budgets = db
    .query(`
      SELECT b.id, b.category_id, b.amount, c.name AS category_name, c.color AS category_color
      FROM budgets b JOIN categories c ON c.id = b.category_id
      WHERE b.user_id = ? ORDER BY c.name
    `)
    .all(user.id) as Budget[]
  const savings = db
    .query(`
      SELECT s.id, s.name, s.target_amount, s.saved_amount, s.wallet_id, s.color, s.target_date,
        w.name AS wallet_name
      FROM savings s LEFT JOIN wallets w ON w.id = s.wallet_id
      WHERE s.user_id = ? ORDER BY s.created_at DESC
    `)
    .all(user.id) as Saving[]
  const subscriptions = db
    .query(`
      SELECT s.id, s.name, s.amount, s.wallet_id, s.category_id, s.next_due_date, s.active,
        w.name AS wallet_name, c.name AS category_name
      FROM subscriptions s
      LEFT JOIN wallets w ON w.id = s.wallet_id
      LEFT JOIN categories c ON c.id = s.category_id
      WHERE s.user_id = ? ORDER BY s.next_due_date
    `)
    .all(user.id) as Subscription[]
  const settings = db
    .query(
      "SELECT currency, cycle_start, cycle_length, accent, hide_balance FROM user_settings WHERE user_id = ?",
    )
    .get(user.id) as Settings

  return { wallets, categories, transactions, debts, budgets, savings, subscriptions, settings }
})

type WalletInput = {
  name: string
  type: "daily" | "saving"
  balance: number
  color?: string
  icon?: string
}

export const createWallet = createServerFn({ method: "POST" })
  .validator((data: WalletInput) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const name = requiredText(data.name, "Nama dompet", 60)
    const type = data.type === "saving" ? "saving" : "daily"
    const balance = Number(data.balance)
    if (!Number.isSafeInteger(balance) || balance < 0) throw new Error("Saldo awal tidak valid")
    const icon = optionalText(data.icon, 40) || "wallet"
    if (icon !== "wallet" && !isFinancialInstitution(icon)) throw new Error("Logo bank tidak valid")
    db.query(
      "INSERT INTO wallets (id, user_id, name, type, balance, color, icon) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(
      crypto.randomUUID(),
      user.id,
      name,
      type,
      balance,
      optionalText(data.color, 24) || "violet",
      icon,
    )
  })

export const updateWallet = createServerFn({ method: "POST" })
  .validator((data: { id: string; name: string; icon?: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const icon = optionalText(data.icon, 40) || "wallet"
    if (icon !== "wallet" && !isFinancialInstitution(icon)) throw new Error("Logo bank tidak valid")
    const result = db
      .query("UPDATE wallets SET name = ?, icon = ? WHERE id = ? AND user_id = ?")
      .run(
        requiredText(data.name, "Nama dompet", 60),
        icon,
        requiredText(data.id, "Dompet", 64),
        user.id,
      )
    if (result.changes !== 1) throw new Error("Dompet tidak ditemukan")
  })

export const deleteWallet = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const wallet = ownedWallet(user.id, data.id)
    const transaction = db
      .query(
        "SELECT 1 FROM transactions WHERE user_id = ? AND (wallet_id = ? OR target_wallet_id = ?) LIMIT 1",
      )
      .get(user.id, wallet.id, wallet.id)
    if (transaction) throw new Error("Hapus transaksi dompet ini terlebih dahulu")

    db.query("DELETE FROM wallets WHERE id = ? AND user_id = ?").run(wallet.id, user.id)
  })

type TransactionInput = {
  type: "income" | "expense" | "transfer"
  amount: number
  fee?: number
  walletId: string
  targetWalletId?: string
  categoryId?: string
  description?: string
  date: string
}

type ValidatedTransaction = LedgerEntry & {
  categoryId: string | null
  description: string
  date: string
}

function validateTransaction(userId: string, data: TransactionInput): ValidatedTransaction {
  const type = ["income", "expense", "transfer"].includes(data.type) ? data.type : null
  if (!type) throw new Error("Jenis transaksi tidak valid")

  const amount = positiveMoney(data.amount)
  const fee = type === "transfer" && data.fee ? positiveMoney(data.fee, "Biaya admin") : 0
  const wallet = ownedWallet(userId, data.walletId)
  const description = optionalText(data.description)
  const date = requiredText(data.date, "Tanggal", 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Tanggal tidak valid")

  let targetWalletId: string | null = null
  if (type === "transfer") {
    const target = ownedWallet(userId, data.targetWalletId)
    if (target.id === wallet.id) throw new Error("Dompet tujuan harus berbeda")
    targetWalletId = target.id
  }

  let categoryId: string | null = null
  if (type !== "transfer") {
    categoryId = requiredText(data.categoryId, "Kategori", 64)
    const category = db
      .query("SELECT id FROM categories WHERE id = ? AND user_id = ? AND type = ?")
      .get(categoryId, userId, type)
    if (!category) throw new Error("Kategori tidak ditemukan")
  }

  return {
    type,
    amount,
    fee,
    walletId: wallet.id,
    targetWalletId,
    categoryId,
    description,
    date,
  }
}

function updateWalletBalances(
  userId: string,
  previous: LedgerEntry | null,
  next: LedgerEntry | null,
) {
  const walletIds = new Set(
    [previous?.walletId, previous?.targetWalletId, next?.walletId, next?.targetWalletId].filter(
      (id): id is string => Boolean(id),
    ),
  )
  const initial: Record<string, number> = {}
  for (const walletId of walletIds) initial[walletId] = ownedWallet(userId, walletId).balance
  const balances = calculateLedgerBalances(initial, previous, next)
  const update = db.query("UPDATE wallets SET balance = ? WHERE id = ? AND user_id = ?")
  for (const [walletId, balance] of Object.entries(balances)) update.run(balance, walletId, userId)
}

export const createTransaction = createServerFn({ method: "POST" })
  .validator((data: TransactionInput) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const transaction = validateTransaction(user.id, data)

    const commit = db.transaction(() => {
      updateWalletBalances(user.id, null, transaction)
      db.query(`
        INSERT INTO transactions
          (id, user_id, type, amount, fee, wallet_id, target_wallet_id, category_id, description, transaction_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        user.id,
        transaction.type,
        transaction.amount,
        transaction.fee,
        transaction.walletId,
        transaction.targetWalletId,
        transaction.categoryId,
        transaction.description,
        transaction.date,
      )
    })
    commit.immediate()
  })

export const updateTransaction = createServerFn({ method: "POST" })
  .validator((data: TransactionInput & { id: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const id = requiredText(data.id, "Transaksi", 64)
    const next = validateTransaction(user.id, data)
    const commit = db.transaction(() => {
      const previous = db
        .query(`
          SELECT type, amount, fee, wallet_id AS walletId, target_wallet_id AS targetWalletId,
            saving_id AS savingId
          FROM transactions WHERE id = ? AND user_id = ?
        `)
        .get(id, user.id) as (LedgerEntry & { savingId: string | null }) | null
      if (!previous) throw new Error("Transaksi tidak ditemukan")
      if (previous.savingId) throw new Error("Kelola transaksi ini dari target tabungan")

      updateWalletBalances(user.id, previous, next)
      db.query(`
        UPDATE transactions SET type = ?, amount = ?, fee = ?, wallet_id = ?,
          target_wallet_id = ?, category_id = ?, description = ?, transaction_date = ?
        WHERE id = ? AND user_id = ?
      `).run(
        next.type,
        next.amount,
        next.fee,
        next.walletId,
        next.targetWalletId,
        next.categoryId,
        next.description,
        next.date,
        id,
        user.id,
      )
    })
    commit.immediate()
  })

export const deleteTransaction = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const id = requiredText(data.id, "Transaksi", 64)
    const commit = db.transaction(() => {
      const previous = db
        .query(`
          SELECT type, amount, fee, wallet_id AS walletId, target_wallet_id AS targetWalletId,
            saving_id AS savingId
          FROM transactions WHERE id = ? AND user_id = ?
        `)
        .get(id, user.id) as (LedgerEntry & { savingId: string | null }) | null
      if (!previous) throw new Error("Transaksi tidak ditemukan")
      if (previous.savingId) throw new Error("Kelola transaksi ini dari target tabungan")

      updateWalletBalances(user.id, previous, null)
      db.query("DELETE FROM transactions WHERE id = ? AND user_id = ?").run(id, user.id)
    })
    commit.immediate()
  })

type DebtInput = {
  type: "hutang" | "piutang"
  contact: string
  amount: number
  dueDate?: string
  note?: string
}

export const createDebt = createServerFn({ method: "POST" })
  .validator((data: DebtInput) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const type = data.type === "hutang" ? "hutang" : "piutang"
    db.query(
      "INSERT INTO debts (id, user_id, type, contact, amount, due_date, note) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(
      crypto.randomUUID(),
      user.id,
      type,
      requiredText(data.contact, "Nama kontak", 80),
      positiveMoney(data.amount),
      data.dueDate ? requiredText(data.dueDate, "Jatuh tempo", 10) : null,
      optionalText(data.note),
    )
  })

export const toggleDebtPaid = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const result = db
      .query(
        "UPDATE debts SET status = CASE status WHEN 'active' THEN 'paid' ELSE 'active' END, paid_amount = CASE status WHEN 'active' THEN amount ELSE 0 END WHERE id = ? AND user_id = ?",
      )
      .run(requiredText(data.id, "Hutang", 64), user.id)
    if (result.changes !== 1) throw new Error("Hutang tidak ditemukan")
  })

export const createBudget = createServerFn({ method: "POST" })
  .validator((data: { categoryId: string; amount: number }) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const categoryId = requiredText(data.categoryId, "Kategori", 64)
    const category = db
      .query("SELECT id FROM categories WHERE id = ? AND user_id = ? AND type = 'expense'")
      .get(categoryId, user.id)
    if (!category) throw new Error("Kategori tidak ditemukan")
    db.query(`
      INSERT INTO budgets (id, user_id, category_id, amount) VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, category_id) DO UPDATE SET amount = excluded.amount
    `).run(crypto.randomUUID(), user.id, categoryId, positiveMoney(data.amount))
  })

type SavingInput = { name: string; targetAmount: number; walletId?: string; targetDate?: string }

export const createSaving = createServerFn({ method: "POST" })
  .validator((data: SavingInput) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const wallet = data.walletId ? ownedWallet(user.id, data.walletId) : null
    if (wallet && wallet.type !== "saving") throw new Error("Pilih dompet bertipe tabungan")
    db.query(
      "INSERT INTO savings (id, user_id, name, target_amount, wallet_id, target_date) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(
      crypto.randomUUID(),
      user.id,
      requiredText(data.name, "Nama target", 80),
      positiveMoney(data.targetAmount, "Target"),
      wallet?.id ?? null,
      data.targetDate ? requiredText(data.targetDate, "Tanggal target", 10) : null,
    )
  })

export const moveSavingFunds = createServerFn({ method: "POST" })
  .validator(
    (data: { id: string; walletId: string; amount: number; direction: "deposit" | "withdraw" }) =>
      data,
  )
  .handler(async ({ data }) => {
    const user = await requireUser()
    const id = requiredText(data.id, "Target tabungan", 64)
    const amount = positiveMoney(data.amount)
    const direction = data.direction === "withdraw" ? "withdraw" : "deposit"
    const dailyWallet = ownedWallet(user.id, data.walletId)
    if (dailyWallet.type !== "daily") throw new Error("Pilih dompet harian")

    const commit = db.transaction(() => {
      const saving = db
        .query("SELECT id, name, saved_amount, wallet_id FROM savings WHERE id = ? AND user_id = ?")
        .get(id, user.id) as Pick<Saving, "id" | "name" | "saved_amount" | "wallet_id"> | null
      if (!saving) throw new Error("Target tabungan tidak ditemukan")
      if (!saving.wallet_id) throw new Error("Hubungkan target dengan dompet tabungan")
      const savingWallet = ownedWallet(user.id, saving.wallet_id)
      if (savingWallet.id === dailyWallet.id) throw new Error("Dompet harian harus berbeda")
      if (direction === "withdraw" && amount > saving.saved_amount) {
        throw new Error("Dana target tabungan tidak mencukupi")
      }

      const movement: LedgerEntry = {
        type: "transfer",
        amount,
        fee: 0,
        walletId: direction === "deposit" ? dailyWallet.id : savingWallet.id,
        targetWalletId: direction === "deposit" ? savingWallet.id : dailyWallet.id,
      }
      updateWalletBalances(user.id, null, movement)
      db.query("UPDATE savings SET saved_amount = ? WHERE id = ? AND user_id = ?").run(
        saving.saved_amount + (direction === "deposit" ? amount : -amount),
        saving.id,
        user.id,
      )
      db.query(`
        INSERT INTO transactions
          (id, user_id, type, amount, fee, wallet_id, target_wallet_id, saving_id, description, transaction_date)
        VALUES (?, ?, 'transfer', ?, 0, ?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        user.id,
        amount,
        movement.walletId,
        movement.targetWalletId,
        saving.id,
        direction === "deposit" ? `Tabung: ${saving.name}` : `Tarik tabungan: ${saving.name}`,
        today(),
      )
    })
    commit.immediate()
  })

type SubscriptionInput = {
  name: string
  amount: number
  walletId?: string
  categoryId?: string
  nextDueDate: string
}

export const createSubscription = createServerFn({ method: "POST" })
  .validator((data: SubscriptionInput) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const wallet = data.walletId ? ownedWallet(user.id, data.walletId) : null
    let categoryId: string | null = null
    if (data.categoryId) {
      categoryId = requiredText(data.categoryId, "Kategori", 64)
      const category = db
        .query("SELECT id FROM categories WHERE id = ? AND user_id = ?")
        .get(categoryId, user.id)
      if (!category) throw new Error("Kategori tidak ditemukan")
    }
    db.query(
      "INSERT INTO subscriptions (id, user_id, name, amount, wallet_id, category_id, next_due_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(
      crypto.randomUUID(),
      user.id,
      requiredText(data.name, "Nama langganan", 80),
      positiveMoney(data.amount),
      wallet?.id ?? null,
      categoryId,
      requiredText(data.nextDueDate, "Tanggal tagihan", 10),
    )
  })

export const updateSettings = createServerFn({ method: "POST" })
  .validator((data: Partial<Settings>) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()
    ensureDefaults(user.id)
    const currency = ["IDR", "USD", "MYR", "JPY", "EUR", "GBP", "SAR"].includes(data.currency ?? "")
      ? (data.currency ?? "IDR")
      : "IDR"
    const cycleStart = Number(data.cycle_start)
    const cycleLength = Number(data.cycle_length)
    if (!Number.isInteger(cycleStart) || cycleStart < 1 || cycleStart > 28)
      throw new Error("Tanggal siklus tidak valid")
    if (![1, 3, 6].includes(cycleLength)) throw new Error("Rentang laporan tidak valid")
    db.query(
      "UPDATE user_settings SET currency = ?, cycle_start = ?, cycle_length = ?, hide_balance = ? WHERE user_id = ?",
    ).run(currency, cycleStart, cycleLength, data.hide_balance ? 1 : 0, user.id)
  })

export const createCategory = createServerFn({ method: "POST" })
  .validator(
    (data: { name: string; type: "income" | "expense"; color: string; icon: string }) => data,
  )
  .handler(async ({ data }) => {
    const user = await requireUser()
    const type = data.type === "income" ? "income" : "expense"
    const color = optionalText(data.color, 24)
    const icon = optionalText(data.icon, 40)
    if (!isCategoryColor(color) || !isCategoryIcon(icon)) {
      throw new Error("Tampilan kategori tidak valid")
    }
    db.query(
      "INSERT INTO categories (id, user_id, name, type, color, icon) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(
      crypto.randomUUID(),
      user.id,
      requiredText(data.name, "Nama kategori", 50),
      type,
      color,
      icon,
    )
  })

export const resetFinanceData = createServerFn({ method: "POST" }).handler(async () => {
  const user = await requireUser()
  const reset = db.transaction(() => {
    for (const table of [
      "subscriptions",
      "savings",
      "budgets",
      "debts",
      "transactions",
      "categories",
      "wallets",
    ] as const) {
      db.query(`DELETE FROM ${table} WHERE user_id = ?`).run(user.id)
    }
    db.query("DELETE FROM user_settings WHERE user_id = ?").run(user.id)
  })
  reset.immediate()
  ensureDefaults(user.id)
})

export const importFinanceData = createServerFn({ method: "POST" })
  .validator((data: { json: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireUser()
    if (typeof data.json !== "string" || data.json.length > 5_000_000)
      throw new Error("File terlalu besar")

    let parsed: Partial<FinanceData>
    try {
      parsed = JSON.parse(data.json) as Partial<FinanceData>
    } catch {
      throw new Error("File JSON tidak valid")
    }
    const arrays = [
      parsed.wallets,
      parsed.categories,
      parsed.transactions,
      parsed.debts,
      parsed.budgets,
      parsed.savings,
      parsed.subscriptions,
    ]
    if (
      arrays.some((items) => items !== undefined && (!Array.isArray(items) || items.length > 5000))
    ) {
      throw new Error("Struktur backup tidak valid")
    }

    const wallets = (parsed.wallets ?? []).map((item) => ({
      oldId: requiredText(item.id, "ID dompet", 64),
      id: crypto.randomUUID(),
      name: requiredText(item.name, "Nama dompet", 60),
      type: item.type === "saving" ? "saving" : "daily",
      balance:
        Number.isSafeInteger(Number(item.balance)) && Number(item.balance) >= 0
          ? Number(item.balance)
          : 0,
      color: optionalText(item.color, 24) || "violet",
      icon: optionalText(item.icon, 80) || "wallet",
    }))
    const walletIds = new Map(wallets.map((item) => [item.oldId, item.id]))
    const categories = (parsed.categories ?? []).map((item) => ({
      oldId: requiredText(item.id, "ID kategori", 64),
      id: crypto.randomUUID(),
      name: requiredText(item.name, "Nama kategori", 50),
      type: item.type === "income" ? "income" : "expense",
      color: optionalText(item.color, 24) || "violet",
      icon: optionalText(item.icon, 80) || "receipt",
    }))
    const categoryIds = new Map(categories.map((item) => [item.oldId, item.id]))
    const settings = parsed.settings
      ? {
          currency: ["IDR", "USD", "MYR", "JPY", "EUR", "GBP", "SAR"].includes(
            parsed.settings.currency,
          )
            ? parsed.settings.currency
            : "IDR",
          cycleStart:
            Number.isInteger(parsed.settings.cycle_start) &&
            parsed.settings.cycle_start >= 1 &&
            parsed.settings.cycle_start <= 28
              ? parsed.settings.cycle_start
              : 1,
          cycleLength: [1, 3, 6].includes(parsed.settings.cycle_length)
            ? parsed.settings.cycle_length
            : 1,
          accent: optionalText(parsed.settings.accent, 24) || "violet",
          hideBalance: parsed.settings.hide_balance ? 1 : 0,
        }
      : null

    const restore = db.transaction(() => {
      for (const table of [
        "subscriptions",
        "savings",
        "budgets",
        "debts",
        "transactions",
        "categories",
        "wallets",
      ] as const) {
        db.query(`DELETE FROM ${table} WHERE user_id = ?`).run(user.id)
      }
      for (const wallet of wallets) {
        db.query(
          "INSERT INTO wallets (id, user_id, name, type, balance, color, icon) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ).run(
          wallet.id,
          user.id,
          wallet.name,
          wallet.type,
          wallet.balance,
          wallet.color,
          wallet.icon,
        )
      }
      for (const category of categories) {
        db.query(
          "INSERT INTO categories (id, user_id, name, type, color, icon) VALUES (?, ?, ?, ?, ?, ?)",
        ).run(category.id, user.id, category.name, category.type, category.color, category.icon)
      }
      for (const item of parsed.transactions ?? []) {
        const walletId = walletIds.get(item.wallet_id)
        if (!walletId) continue
        const targetWalletId = item.target_wallet_id
          ? (walletIds.get(item.target_wallet_id) ?? null)
          : null
        const categoryId = item.category_id ? (categoryIds.get(item.category_id) ?? null) : null
        if (!["income", "expense", "transfer"].includes(item.type)) continue
        db.query(
          `INSERT INTO transactions (id, user_id, type, amount, fee, wallet_id, target_wallet_id, category_id, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          crypto.randomUUID(),
          user.id,
          item.type,
          positiveMoney(item.amount),
          Math.max(0, Number(item.fee) || 0),
          walletId,
          targetWalletId,
          categoryId,
          optionalText(item.description),
          requiredText(item.transaction_date, "Tanggal", 10),
        )
      }
      for (const item of parsed.debts ?? []) {
        db.query(
          "INSERT INTO debts (id, user_id, type, contact, amount, paid_amount, due_date, note, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ).run(
          crypto.randomUUID(),
          user.id,
          item.type === "hutang" ? "hutang" : "piutang",
          requiredText(item.contact, "Kontak", 80),
          positiveMoney(item.amount),
          Math.max(0, Number(item.paid_amount) || 0),
          item.due_date || null,
          optionalText(item.note),
          item.status === "paid" ? "paid" : "active",
        )
      }
      for (const item of parsed.budgets ?? []) {
        const categoryId = categoryIds.get(item.category_id)
        if (categoryId)
          db.query(
            "INSERT OR IGNORE INTO budgets (id, user_id, category_id, amount) VALUES (?, ?, ?, ?)",
          ).run(crypto.randomUUID(), user.id, categoryId, positiveMoney(item.amount))
      }
      for (const item of parsed.savings ?? []) {
        db.query(
          "INSERT INTO savings (id, user_id, name, target_amount, saved_amount, wallet_id, color, target_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ).run(
          crypto.randomUUID(),
          user.id,
          requiredText(item.name, "Target", 80),
          positiveMoney(item.target_amount),
          Math.max(0, Number(item.saved_amount) || 0),
          item.wallet_id ? (walletIds.get(item.wallet_id) ?? null) : null,
          optionalText(item.color, 24) || "violet",
          item.target_date || null,
        )
      }
      for (const item of parsed.subscriptions ?? []) {
        db.query(
          "INSERT INTO subscriptions (id, user_id, name, amount, wallet_id, category_id, next_due_date, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ).run(
          crypto.randomUUID(),
          user.id,
          requiredText(item.name, "Langganan", 80),
          positiveMoney(item.amount),
          item.wallet_id ? (walletIds.get(item.wallet_id) ?? null) : null,
          item.category_id ? (categoryIds.get(item.category_id) ?? null) : null,
          requiredText(item.next_due_date, "Tanggal", 10),
          item.active ? 1 : 0,
        )
      }
      if (settings) {
        db.query(
          "UPDATE user_settings SET currency = ?, cycle_start = ?, cycle_length = ?, accent = ?, hide_balance = ? WHERE user_id = ?",
        ).run(
          settings.currency,
          settings.cycleStart,
          settings.cycleLength,
          settings.accent,
          settings.hideBalance,
          user.id,
        )
      }
    })
    restore.immediate()
    ensureDefaults(user.id)
  })
