import { describe, expect, test } from "bun:test"
import {
  calculateLedgerBalances,
  debtPaymentDraft,
  nextDebtState,
  parseBackupJson,
} from "@/lib/finance.functions"
import {
  isCategoryColor,
  isCategoryIcon,
  isFinancialInstitution,
  isSeedCategory,
  walletCardFace,
} from "@/lib/finance-options"
import type { FinanceData, FinanceTransaction, Wallet } from "@/lib/finance-types"
import { assessFinancialHealth, HEALTH_THRESHOLDS } from "@/lib/health"
import {
  addMonths,
  cycleRange,
  daysUntil,
  formatCompactNumber,
  formatNumberInput,
  formatTransactionAmount,
  parseNumberInput,
  recentCycles,
  recentDays,
  transactionsToCsv,
} from "@/lib/utils"

describe("balance invariants", () => {
  test("income, expense, and transfer preserve the expected balances", () => {
    expect(
      calculateLedgerBalances({ source: 100_000 }, null, {
        type: "income",
        walletId: "source",
        targetWalletId: null,
        amount: 50_000,
        fee: 0,
      }),
    ).toEqual({ source: 150_000 })
    expect(
      calculateLedgerBalances({ source: 100_000 }, null, {
        type: "expense",
        walletId: "source",
        targetWalletId: null,
        amount: 40_000,
        fee: 0,
      }),
    ).toEqual({ source: 60_000 })
    expect(
      calculateLedgerBalances({ source: 100_000, target: 20_000 }, null, {
        type: "transfer",
        walletId: "source",
        targetWalletId: "target",
        amount: 30_000,
        fee: 2_500,
      }),
    ).toEqual({ source: 67_500, target: 50_000 })
  })

  test("a balance can never be spent below zero", () => {
    expect(() =>
      calculateLedgerBalances({ source: 10_000 }, null, {
        type: "expense",
        walletId: "source",
        targetWalletId: null,
        amount: 10_001,
        fee: 0,
      }),
    ).toThrow("Saldo dompet tidak mencukupi")
  })

  test("editing or deleting reverses the previous ledger impact", () => {
    const previous = {
      type: "expense" as const,
      walletId: "source",
      targetWalletId: null,
      amount: 40_000,
      fee: 0,
    }
    expect(
      calculateLedgerBalances({ source: 60_000 }, previous, { ...previous, amount: 20_000 }),
    ).toEqual({ source: 80_000 })
    expect(calculateLedgerBalances({ source: 60_000 }, previous, null)).toEqual({ source: 100_000 })
  })
})

test("reporting cycles include the anchor and stay consecutive at month end", () => {
  const settings = { cycle_start: 25, cycle_length: 1 }
  expect(cycleRange(settings, new Date(2026, 7, 31))).toMatchObject({
    start: "2026-08-25",
    end: "2026-09-24",
  })
  expect(
    recentCycles(settings, 3, new Date(2026, 7, 31)).map(({ start, end }) => [start, end]),
  ).toEqual([
    ["2026-06-25", "2026-07-24"],
    ["2026-07-25", "2026-08-24"],
    ["2026-08-25", "2026-09-24"],
  ])
})

test("weekly chart shows seven rolling daily ranges", () => {
  const days = recentDays(7, new Date(2026, 8, 4))
  expect(days).toHaveLength(7)
  expect(days.map(({ start, end }) => [start, end])).toEqual([
    ["2026-08-29", "2026-08-29"],
    ["2026-08-30", "2026-08-30"],
    ["2026-08-31", "2026-08-31"],
    ["2026-09-01", "2026-09-01"],
    ["2026-09-02", "2026-09-02"],
    ["2026-09-03", "2026-09-03"],
    ["2026-09-04", "2026-09-04"],
  ])
})

test("financial presentation keeps transfers neutral and chart values meaningful", () => {
  expect(formatTransactionAmount("income", 125_000, "IDR", false)).toBe("+Rp125.000")
  expect(formatTransactionAmount("expense", 125_000, "IDR", false)).toBe("−Rp125.000")
  expect(formatTransactionAmount("transfer", 50_000, "IDR", false)).toBe("Rp50.000")
  expect(formatTransactionAmount("transfer", 50_000, "IDR", true)).toBe("••••••")
  expect(formatCompactNumber(125_000)).toContain("125")
  expect(formatCompactNumber(125_000)).not.toContain("0jt")
})

const HEALTH_NOW = new Date(2026, 9, 27)
let healthTransactionId = 0

function healthTransaction(input: {
  date: string
  type: "income" | "expense" | "transfer"
  amount: number
  wallet?: string
  target?: string
  category?: string
  debt?: string
  description?: string
}): FinanceTransaction {
  healthTransactionId += 1
  return {
    id: `health-${healthTransactionId}`,
    type: input.type,
    amount: input.amount,
    fee: 0,
    wallet_id: input.wallet ?? "daily",
    target_wallet_id: input.target ?? null,
    category_id: null,
    saving_id: null,
    debt_id: input.debt ?? null,
    description: input.description ?? "",
    transaction_date: input.date,
    category_name: input.category ?? null,
    wallet_name: "Dompet harian",
    target_wallet_name: null,
  }
}

function healthData(
  transactions: FinanceTransaction[],
  options: { balance?: number; savingBalance?: number; withSavings?: boolean } = {},
): FinanceData {
  const wallets: Wallet[] = [
    {
      id: "daily",
      name: "Dompet harian",
      type: "daily",
      balance: options.balance ?? 0,
      color: "violet",
      icon: "wallet",
    },
  ]
  if (options.withSavings !== false) {
    wallets.push({
      id: "saving",
      name: "Tabungan",
      type: "saving",
      balance: options.savingBalance ?? 0,
      color: "green",
      icon: "wallet",
    })
  }
  return {
    wallets,
    categories: [],
    transactions,
    debts: [],
    budgets: [],
    walletBudgets: [],
    savings: [],
    subscriptions: [],
    settings: {
      currency: "IDR",
      cycle_start: 1,
      cycle_length: 1,
      accent: "violet",
      hide_balance: 0,
    },
  }
}

describe("financial health", () => {
  test("keeps the sourced thresholds in one configuration", () => {
    expect(HEALTH_THRESHOLDS.debt.risk).toBe(0.35)
    expect(HEALTH_THRESHOLDS.debt.attention).toBe(0.3)
    expect(HEALTH_THRESHOLDS.savings.attention).toBe(0.1)
    expect(HEALTH_THRESHOLDS.buffer.attention).toBe(4)
  })

  test("marks a balanced cycle as sehat", () => {
    const health = assessFinancialHealth(
      healthData(
        [
          healthTransaction({ date: "2026-09-05", type: "income", amount: 10_000_000 }),
          healthTransaction({ date: "2026-09-10", type: "expense", amount: 6_500_000 }),
          healthTransaction({ date: "2026-09-15", type: "expense", amount: 1_000_000, debt: "d1" }),
          healthTransaction({
            date: "2026-09-20",
            type: "transfer",
            amount: 1_500_000,
            target: "saving",
          }),
        ],
        { balance: 22_000_000, savingBalance: 10_000_000 },
      ),
      HEALTH_NOW,
    )

    expect(health.status).toBe("sehat")
    expect(health.metrics.map((metric) => metric.status)).toEqual([
      "sehat",
      "sehat",
      "sehat",
      "sehat",
    ])
  })

  test("flags overspending even when the balance stays positive", () => {
    const health = assessFinancialHealth(
      healthData(
        [
          healthTransaction({ date: "2026-09-05", type: "income", amount: 10_000_000 }),
          healthTransaction({ date: "2026-09-28", type: "expense", amount: 9_500_000 }),
        ],
        { balance: 2_000_000 },
      ),
      HEALTH_NOW,
    )

    expect(health.status).toBe("berisiko")
    expect(health.metrics.find((metric) => metric.key === "savings")?.status).toBe("berisiko")
    expect(health.metrics.find((metric) => metric.key === "buffer")?.status).toBe("berisiko")
  })

  test("does not call a negative cash flow healthy", () => {
    const health = assessFinancialHealth(
      healthData(
        [
          healthTransaction({ date: "2026-09-05", type: "income", amount: 6_000_000 }),
          healthTransaction({ date: "2026-09-20", type: "expense", amount: 8_000_000 }),
        ],
        { balance: 1_500_000 },
      ),
      HEALTH_NOW,
    )

    expect(health.status).toBe("berisiko")
    expect(health.metrics.find((metric) => metric.key === "cashflow")?.status).toBe("berisiko")
  })

  test("a single high installment cannot be averaged away", () => {
    const health = assessFinancialHealth(
      healthData(
        [
          healthTransaction({ date: "2026-09-05", type: "income", amount: 10_000_000 }),
          healthTransaction({ date: "2026-09-08", type: "expense", amount: 2_500_000 }),
          healthTransaction({ date: "2026-09-12", type: "expense", amount: 4_500_000, debt: "d1" }),
          healthTransaction({
            date: "2026-09-20",
            type: "transfer",
            amount: 1_200_000,
            target: "saving",
          }),
        ],
        { balance: 30_000_000 },
      ),
      HEALTH_NOW,
    )

    expect(health.metrics.find((metric) => metric.key === "debt")?.status).toBe("berisiko")
    expect(health.metrics.filter((metric) => metric.status === "sehat")).toHaveLength(3)
    expect(health.status).toBe("berisiko")
  })

  test("asks for more data instead of guessing on a fresh cycle", () => {
    const health = assessFinancialHealth(
      healthData([
        healthTransaction({ date: "2026-10-25", type: "income", amount: 3_000_000 }),
        healthTransaction({ date: "2026-10-26", type: "expense", amount: 1_000_000 }),
      ]),
      HEALTH_NOW,
    )

    expect(health.status).toBe("data_belum_cukup")
    expect(health.metrics).toHaveLength(0)
  })

  test("uses a three-cycle average when income is irregular", () => {
    const health = assessFinancialHealth(
      healthData(
        [
          healthTransaction({ date: "2026-07-05", type: "income", amount: 12_000_000 }),
          healthTransaction({ date: "2026-07-20", type: "expense", amount: 4_300_000 }),
          healthTransaction({ date: "2026-08-05", type: "income", amount: 3_000_000 }),
          healthTransaction({ date: "2026-08-20", type: "expense", amount: 4_300_000 }),
          healthTransaction({ date: "2026-09-05", type: "income", amount: 9_000_000 }),
          healthTransaction({ date: "2026-09-20", type: "expense", amount: 4_300_000 }),
        ],
        { balance: 8_000_000, withSavings: false },
      ),
      HEALTH_NOW,
    )

    expect(health.basisNote).toContain("3 siklus")
    expect(health.metrics.find((metric) => metric.key === "savings")?.status).toBe("belum_dinilai")
    expect(health.metrics.find((metric) => metric.key === "cashflow")?.value).toBeCloseTo(0.4625, 4)
    expect(health.status).toBe("perlu_perhatian")
  })

  test("treats borrowed money as a liability, not income", () => {
    const health = assessFinancialHealth(
      healthData(
        [
          healthTransaction({ date: "2026-09-05", type: "income", amount: 1_000_000 }),
          healthTransaction({
            date: "2026-09-06",
            type: "income",
            amount: 10_000_000,
            category: "Pinjaman Masuk",
            description: "Tambahan hutang: Budi",
          }),
          healthTransaction({ date: "2026-09-10", type: "expense", amount: 9_000_000 }),
        ],
        { balance: 1_000_000 },
      ),
      HEALTH_NOW,
    )

    expect(health.metrics.find((metric) => metric.key === "cashflow")?.value).toBeLessThan(0)
    expect(health.status).toBe("berisiko")
  })

  test("ignores legacy debt-inflow rows from before the category split", () => {
    const health = assessFinancialHealth(
      healthData(
        [
          healthTransaction({ date: "2026-09-05", type: "income", amount: 5_000_000 }),
          healthTransaction({
            date: "2026-09-06",
            type: "income",
            amount: 5_000_000,
            category: "Piutang Dibayar",
            description: "Tambahan hutang: Sari",
          }),
          healthTransaction({ date: "2026-09-10", type: "expense", amount: 1_000_000 }),
        ],
        { balance: 20_000_000 },
      ),
      HEALTH_NOW,
    )

    expect(health.metrics.find((metric) => metric.key === "cashflow")?.value).toBeCloseTo(0.8, 4)
  })

  test("caps the verdict when no wallet can be measured", () => {
    const data = healthData(
      [
        healthTransaction({ date: "2026-09-05", type: "income", amount: 10_000_000 }),
        healthTransaction({ date: "2026-09-10", type: "expense", amount: 3_000_000 }),
      ],
      { withSavings: false },
    )
    data.wallets = []

    const health = assessFinancialHealth(data, HEALTH_NOW)

    expect(health.status).toBe("perlu_perhatian")
    expect(health.reasons).toContain("Tambahkan dompet agar dana darurat bisa dinilai.")
  })
})

test("money inputs format thousands and recover the raw integer", () => {
  expect(formatNumberInput("001500000")).toBe("1.500.000")
  expect(formatNumberInput(25_000)).toBe("25.000")
  expect(formatNumberInput(0)).toBe("0")
  expect(formatNumberInput("")).toBe("")
  expect(parseNumberInput("1.500.000")).toBe(1_500_000)
})

test("finance visual options reject unknown persisted values", () => {
  expect(isCategoryColor("violet")).toBe(true)
  expect(isCategoryColor("rainbow")).toBe(false)
  expect(isCategoryIcon("food")).toBe(true)
  expect(isCategoryIcon("unknown")).toBe(false)
  expect(isFinancialInstitution("bca")).toBe(true)
  expect(isFinancialInstitution("not-a-bank")).toBe(false)
})

test("transaction CSV keeps Indonesian labels and escapes spreadsheet values", () => {
  const csv = transactionsToCsv([
    {
      transaction_date: "2026-09-04",
      type: "expense",
      amount: 25_000,
      fee: 0,
      wallet_name: "Tunai",
      target_wallet_name: null,
      category_name: "Makanan",
      description: 'Makan, "siang"\nbersama',
    },
  ])
  expect(csv).toBe(
    'Tanggal,Jenis,Nominal,Biaya admin,Dompet sumber,Dompet tujuan,Kategori,Catatan\r\n2026-09-04,Pengeluaran,25000,0,Tunai,,Makanan,"Makan, ""siang""\nbersama"',
  )
  expect(
    transactionsToCsv([
      {
        transaction_date: "2026-09-04",
        type: "income",
        amount: 25_000,
        fee: 0,
        wallet_name: "Bank",
        target_wallet_name: null,
        category_name: "Gaji",
        description: "=SUM(A1:A2)",
      },
    ]),
  ).toContain("'=SUM(A1:A2)")
})

test("debt installments accumulate and additions reactivate a settled debt", () => {
  const active = { amount: 100_000, paid_amount: 0, status: "active" as const }
  expect(nextDebtState(active, { type: "pay", amount: 40_000 })).toEqual({
    amount: 100_000,
    paid_amount: 40_000,
    status: "active",
  })
  expect(
    nextDebtState(
      { amount: 100_000, paid_amount: 60_000, status: "active" as const },
      { type: "pay", amount: 40_000 },
    ),
  ).toEqual({ amount: 100_000, paid_amount: 100_000, status: "paid" })
  expect(() =>
    nextDebtState(
      { amount: 100_000, paid_amount: 60_000, status: "active" as const },
      { type: "pay", amount: 41_000 },
    ),
  ).toThrow("Nominal cicilan melebihi sisa kewajiban")
  expect(
    nextDebtState(
      { amount: 100_000, paid_amount: 100_000, status: "paid" as const },
      { type: "add", amount: 50_000 },
    ),
  ).toEqual({ amount: 150_000, paid_amount: 100_000, status: "active" })
})

test("debt money movements map to the correct transaction type and description", () => {
  expect(debtPaymentDraft("hutang", "pay", "Budi")).toEqual({
    txType: "expense",
    description: "Cicil hutang: Budi",
  })
  expect(debtPaymentDraft("hutang", "settle", "Budi")).toEqual({
    txType: "expense",
    description: "Pelunasan hutang: Budi",
  })
  expect(debtPaymentDraft("piutang", "pay", "Ani")).toEqual({
    txType: "income",
    description: "Cicilan piutang: Ani",
  })
  expect(debtPaymentDraft("piutang", "settle", "Ani")).toEqual({
    txType: "income",
    description: "Pelunasan piutang: Ani",
  })
  expect(debtPaymentDraft("hutang", "add", "Budi")).toEqual({
    txType: "income",
    description: "Tambahan hutang: Budi",
  })
  expect(debtPaymentDraft("piutang", "add", "Ani")).toEqual({
    txType: "expense",
    description: "Tambahan piutang: Ani",
  })
})

test("billing dates roll forward by whole months and clamp to month end", () => {
  expect(addMonths("2026-01-15", 1)).toBe("2026-02-15")
  expect(addMonths("2026-12-01", 1)).toBe("2027-01-01")
  expect(addMonths("2026-01-31", 1)).toBe("2026-02-28")
  expect(addMonths("2026-01-31", 3)).toBe("2026-04-30")
  expect(addMonths("2026-03-31", 1)).toBe("2026-04-30")
})

test("wallet card faces use institution colors with readable ink", () => {
  expect(walletCardFace("bca", "blue").from).toBe("#0060AF")
  expect(walletCardFace("bca", "blue").ink).toBe("#FFFFFF")
  expect(walletCardFace("kb-bukopin", "yellow").ink).toBe("#111111")
  expect(walletCardFace("wallet", "violet").from).toBe("#7C3AED")
})

test("days until a due date counts calendar days", () => {
  const now = new Date(2026, 9, 4)
  expect(daysUntil("2026-10-04", now)).toBe(0)
  expect(daysUntil("2026-10-06", now)).toBe(2)
  expect(daysUntil("2026-10-01", now)).toBe(-3)
})

test("seed categories are recognized by name and type", () => {
  expect(isSeedCategory("Makanan", "expense")).toBe(true)
  expect(isSeedCategory("Gaji", "income")).toBe(true)
  expect(isSeedCategory("Bayar Hutang", "expense")).toBe(true)
  expect(isSeedCategory("Makanan", "income")).toBe(false)
  expect(isSeedCategory("Jajan", "expense")).toBe(false)
  expect(isSeedCategory("makanan", "expense")).toBe(false)
})

test("backup parsing accepts valid files and rejects malformed ones", () => {
  const valid = parseBackupJson(JSON.stringify({ wallets: [], settings: { currency: "IDR" } }))
  expect(valid.wallets).toEqual([])
  expect(() => parseBackupJson("bukan json")).toThrow("File JSON tidak valid")
  expect(() => parseBackupJson("x".repeat(5_000_001))).toThrow("File terlalu besar")
  expect(() => parseBackupJson(JSON.stringify({ wallets: { id: "a" } }))).toThrow(
    "Struktur backup tidak valid",
  )
  expect(() => parseBackupJson(JSON.stringify({ wallets: new Array(5001).fill({}) }))).toThrow(
    "Struktur backup tidak valid",
  )
  expect(parseBackupJson(JSON.stringify({ transactions: [] })).transactions).toEqual([])
})
