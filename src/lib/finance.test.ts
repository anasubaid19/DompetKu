import { describe, expect, test } from "bun:test"
import { calculateLedgerBalances } from "@/lib/finance.functions"
import { isCategoryColor, isCategoryIcon, isFinancialInstitution } from "@/lib/finance-options"
import {
  cashFlowMessage,
  currentCycleWeeks,
  cycleRange,
  formatCompactNumber,
  formatNumberInput,
  formatTransactionAmount,
  parseNumberInput,
  recentCycles,
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

test("weekly chart ranges follow the active cycle through today", () => {
  expect(
    currentCycleWeeks({ cycle_start: 25, cycle_length: 1 }, new Date(2026, 8, 4)).map(
      ({ start, end }) => [start, end],
    ),
  ).toEqual([
    ["2026-08-25", "2026-08-31"],
    ["2026-09-01", "2026-09-04"],
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

test("cash-flow health uses a useful message for empty, positive, and negative periods", () => {
  expect(cashFlowMessage(0, 0)).toBe("Mulai catat transaksi untuk melihat kondisi arus kasmu.")
  expect(cashFlowMessage(5_000_000, 3_000_000)).toBe(
    "Arus kasmu positif. Pertahankan ruang untuk menabung.",
  )
  expect(cashFlowMessage(3_000_000, 5_000_000)).toBe(
    "Pengeluaran melebihi pemasukan. Tinjau kategori terbesar.",
  )
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
