import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMoney(amount: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  })
    .format(amount)
    .replace(/\s/g, "")
}

export function formatCompactNumber(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount)
}

export function cashFlowMessage(income: number, expense: number) {
  if (income === 0 && expense === 0)
    return "Mulai catat transaksi untuk melihat kondisi arus kasmu."
  if (income >= expense) return "Arus kasmu positif. Pertahankan ruang untuk menabung."
  return "Pengeluaran melebihi pemasukan. Tinjau kategori terbesar."
}

export function formatNumberInput(value: string | number | null | undefined) {
  const digits = String(value ?? "")
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export function parseNumberInput(value: FormDataEntryValue | null) {
  return Number(String(value ?? "").replaceAll(".", ""))
}

type CsvTransaction = {
  transaction_date: string
  type: "income" | "expense" | "transfer"
  amount: number
  fee: number
  wallet_name: string
  target_wallet_name: string | null
  category_name: string | null
  description: string
}

export function transactionsToCsv(transactions: CsvTransaction[]) {
  const cell = (value: string | number | null) => {
    let text = String(value ?? "")
    if (/^[=+\-@]/.test(text)) text = `'${text}`
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
  }
  const labels = { income: "Pemasukan", expense: "Pengeluaran", transfer: "Transfer" }
  return [
    [
      "Tanggal",
      "Jenis",
      "Nominal",
      "Biaya admin",
      "Dompet sumber",
      "Dompet tujuan",
      "Kategori",
      "Catatan",
    ],
    ...transactions.map((item) => [
      item.transaction_date,
      labels[item.type],
      item.amount,
      item.fee,
      item.wallet_name,
      item.target_wallet_name,
      item.category_name,
      item.description,
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n")
}

export function formatTransactionAmount(
  type: "income" | "expense" | "transfer",
  amount: number,
  currency = "IDR",
  hidden = false,
) {
  const prefix = type === "income" ? "+" : type === "expense" ? "−" : ""
  return `${prefix}${hidden ? "••••••" : formatMoney(amount, currency)}`
}

export function today() {
  return dateKey()
}

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

type CycleSettings = { cycle_start: number; cycle_length: number }

export function cycleRange(settings: CycleSettings, anchor = new Date()) {
  const boundary = new Date(
    anchor.getFullYear(),
    anchor.getMonth() + (anchor.getDate() >= settings.cycle_start ? 1 : 0),
    settings.cycle_start,
  )
  const startDate = new Date(
    boundary.getFullYear(),
    boundary.getMonth() - settings.cycle_length,
    settings.cycle_start,
  )
  const endDate = new Date(boundary)
  endDate.setDate(endDate.getDate() - 1)
  const format = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  return {
    start: dateKey(startDate),
    end: dateKey(endDate),
    label: `${format.format(startDate)} - ${format.format(endDate)}`,
    shortLabel: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(endDate),
  }
}

export function recentCycles(settings: CycleSettings, count: number, now = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const monthsAgo = (count - 1 - index) * settings.cycle_length
    return cycleRange(
      settings,
      new Date(now.getFullYear(), now.getMonth() - monthsAgo, now.getDate()),
    )
  })
}
