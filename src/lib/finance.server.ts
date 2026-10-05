import { db, ensureDefaults } from "@/lib/db"
import {
  type FinanceData,
  optionalText,
  positiveMoney,
  type RestoreSummary,
  requiredText,
} from "@/lib/finance.functions"

export function restoreFinanceData(userId: string, parsed: Partial<FinanceData>): RestoreSummary {
  const summary: RestoreSummary = {
    imported: {
      wallets: 0,
      categories: 0,
      transactions: 0,
      debts: 0,
      budgets: 0,
      savings: 0,
      subscriptions: 0,
    },
    skipped: { transactions: 0 },
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
      db.query(`DELETE FROM ${table} WHERE user_id = ?`).run(userId)
    }
    for (const wallet of wallets) {
      db.query(
        "INSERT INTO wallets (id, user_id, name, type, balance, color, icon) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ).run(wallet.id, userId, wallet.name, wallet.type, wallet.balance, wallet.color, wallet.icon)
      summary.imported.wallets += 1
    }
    for (const category of categories) {
      db.query(
        "INSERT INTO categories (id, user_id, name, type, color, icon) VALUES (?, ?, ?, ?, ?, ?)",
      ).run(category.id, userId, category.name, category.type, category.color, category.icon)
      summary.imported.categories += 1
    }
    for (const item of parsed.transactions ?? []) {
      const walletId = walletIds.get(item.wallet_id)
      if (!walletId) {
        summary.skipped.transactions += 1
        continue
      }
      const targetWalletId = item.target_wallet_id
        ? (walletIds.get(item.target_wallet_id) ?? null)
        : null
      const categoryId = item.category_id ? (categoryIds.get(item.category_id) ?? null) : null
      if (!["income", "expense", "transfer"].includes(item.type)) {
        summary.skipped.transactions += 1
        continue
      }
      db.query(
        `INSERT INTO transactions (id, user_id, type, amount, fee, wallet_id, target_wallet_id, category_id, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        crypto.randomUUID(),
        userId,
        item.type,
        positiveMoney(item.amount),
        Math.max(0, Number(item.fee) || 0),
        walletId,
        targetWalletId,
        categoryId,
        optionalText(item.description),
        requiredText(item.transaction_date, "Tanggal", 10),
      )
      summary.imported.transactions += 1
    }
    for (const item of parsed.debts ?? []) {
      db.query(
        "INSERT INTO debts (id, user_id, type, contact, amount, paid_amount, due_date, note, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(
        crypto.randomUUID(),
        userId,
        item.type === "hutang" ? "hutang" : "piutang",
        requiredText(item.contact, "Kontak", 80),
        positiveMoney(item.amount),
        Math.max(0, Number(item.paid_amount) || 0),
        item.due_date || null,
        optionalText(item.note),
        item.status === "paid" ? "paid" : "active",
      )
      summary.imported.debts += 1
    }
    for (const item of parsed.budgets ?? []) {
      const categoryId = categoryIds.get(item.category_id)
      if (categoryId) {
        db.query(
          "INSERT OR IGNORE INTO budgets (id, user_id, category_id, amount) VALUES (?, ?, ?, ?)",
        ).run(crypto.randomUUID(), userId, categoryId, positiveMoney(item.amount))
        summary.imported.budgets += 1
      }
    }
    for (const item of parsed.savings ?? []) {
      db.query(
        "INSERT INTO savings (id, user_id, name, target_amount, saved_amount, wallet_id, color, target_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(
        crypto.randomUUID(),
        userId,
        requiredText(item.name, "Target", 80),
        positiveMoney(item.target_amount),
        Math.max(0, Number(item.saved_amount) || 0),
        item.wallet_id ? (walletIds.get(item.wallet_id) ?? null) : null,
        optionalText(item.color, 24) || "violet",
        item.target_date || null,
      )
      summary.imported.savings += 1
    }
    for (const item of parsed.subscriptions ?? []) {
      db.query(
        "INSERT INTO subscriptions (id, user_id, name, amount, wallet_id, category_id, next_due_date, active, interval_months, direction) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(
        crypto.randomUUID(),
        userId,
        requiredText(item.name, "Langganan", 80),
        positiveMoney(item.amount),
        item.wallet_id ? (walletIds.get(item.wallet_id) ?? null) : null,
        item.category_id ? (categoryIds.get(item.category_id) ?? null) : null,
        requiredText(item.next_due_date, "Tanggal", 10),
        item.active ? 1 : 0,
        [1, 3, 6, 12].includes(Number(item.interval_months)) ? Number(item.interval_months) : 1,
        item.direction === "income" ? "income" : "expense",
      )
      summary.imported.subscriptions += 1
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
        userId,
      )
    }
  })
  restore.immediate()
  ensureDefaults(userId)
  return summary
}
