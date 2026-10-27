import type { FinanceData, FinanceTransaction } from "@/lib/finance-types"
import { daysUntil, recentCycles } from "@/lib/utils"

export type HealthStatus = "sehat" | "perlu_perhatian" | "berisiko" | "data_belum_cukup"
export type MetricStatus = HealthStatus | "belum_dinilai"

export type HealthMetric = {
  key: "cashflow" | "savings" | "debt" | "buffer"
  label: string
  status: MetricStatus
  value: number | null
  detail: string
}

export type HealthAssessment = {
  status: HealthStatus
  headline: string
  metrics: HealthMetric[]
  reasons: string[]
  nextStep: { label: string; to: "/app/transactions" | "/app/planning" } | null
  basisNote: string | null
}

/**
 * Patokan penilaian. Angka yang bersumber dari OJK ditandai; sisanya rekomendasi
 * produk yang perlu diuji ulang sebelum dianggap baku.
 * OJK "Periksa Dompet": cicilan < 35% penghasilan, tabungan > 10%, harta >= 4 bulan pengeluaran.
 * OJK "Periksa Anggaran": cicilan utang 30% dari anggaran.
 */
export const HEALTH_THRESHOLDS = {
  cashflow: { risk: 0, attention: 0.1 },
  savings: { risk: 0, attention: 0.1 },
  debt: { attention: 0.3, risk: 0.35 },
  buffer: { risk: 1, attention: 4 },
  stability: { stableCv: 0.2 },
  smoothingCycles: 3,
  lookbackCycles: 4,
} as const

const percent = new Intl.NumberFormat("id-ID", { style: "percent", maximumFractionDigits: 0 })
const monthCount = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 })

function mean(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function coefficientOfVariation(values: number[]) {
  const average = mean(values)
  if (average <= 0) return 1
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2))) / average
}

/** Pinjaman cair dan pelunasan piutang bukan pendapatan; keduanya tidak boleh menaikkan status. */
function isDebtInflow(item: FinanceTransaction) {
  return (
    item.category_name === "Pinjaman Masuk" ||
    item.category_name === "Piutang Dibayar" ||
    item.description.startsWith("Tambahan hutang:")
  )
}

type CycleSums = { income: number; expense: number; savings: number; debtPayments: number }

function cycleSums(
  transactions: FinanceTransaction[],
  start: string,
  end: string,
  walletTypes: Map<string, string>,
): CycleSums {
  const sums: CycleSums = { income: 0, expense: 0, savings: 0, debtPayments: 0 }
  for (const item of transactions) {
    if (item.transaction_date < start || item.transaction_date > end) continue
    if (item.type === "income") {
      if (!isDebtInflow(item)) sums.income += item.amount
      continue
    }
    if (item.type === "expense") {
      sums.expense += item.amount
      if (item.debt_id) sums.debtPayments += item.amount
      continue
    }
    sums.expense += item.fee
    const targetType = item.target_wallet_id ? walletTypes.get(item.target_wallet_id) : undefined
    const sourceType = walletTypes.get(item.wallet_id)
    if (targetType === "saving") sums.savings += item.amount
    else if (sourceType === "saving") sums.savings -= item.amount
  }
  return sums
}

function severity(status: MetricStatus) {
  if (status === "berisiko") return 3
  if (status === "perlu_perhatian") return 2
  if (status === "sehat") return 1
  return 0
}

function bandHigherIsBetter(value: number, risk: number, attention: number): HealthStatus {
  if (value < risk) return "berisiko"
  if (value < attention) return "perlu_perhatian"
  return "sehat"
}

/** Menabung 0% sudah berisiko, jadi batas bawahnya inklusif. */
function bandSavings(value: number): HealthStatus {
  if (value <= HEALTH_THRESHOLDS.savings.risk) return "berisiko"
  if (value < HEALTH_THRESHOLDS.savings.attention) return "perlu_perhatian"
  return "sehat"
}

const headlineByStatus: Record<HealthStatus, string> = {
  sehat: "Keuanganmu dalam kondisi baik",
  perlu_perhatian: "Ada hal yang perlu dijaga",
  berisiko: "Ada risiko yang perlu ditangani",
  data_belum_cukup: "Belum cukup data untuk menilai",
}

const nextStepByMetric: Record<HealthMetric["key"], HealthAssessment["nextStep"]> = {
  cashflow: { label: "Tinjau transaksi terbesar", to: "/app/transactions" },
  savings: { label: "Atur target tabungan", to: "/app/planning" },
  debt: { label: "Tinjau hutang dan cicilan", to: "/app/planning" },
  buffer: { label: "Siapkan dana darurat", to: "/app/planning" },
}

function reasonFor(metric: HealthMetric) {
  const value = metric.value ?? 0
  if (metric.key === "cashflow") {
    if (metric.status === "berisiko") return "Pengeluaran dan tabungan melebihi pemasukan."
    return `Sisa ${percent.format(value)} dari pemasukan setelah pengeluaran dan tabungan.`
  }
  if (metric.key === "savings") {
    if (metric.status === "berisiko") return "Belum ada dana yang disisihkan untuk tabungan."
    if (metric.status === "perlu_perhatian")
      return `Tabungan ${percent.format(value)} dari pemasukan, di bawah patokan 10%.`
    return `Tabungan ${percent.format(value)} dari pemasukan.`
  }
  if (metric.key === "debt") {
    if (metric.status === "berisiko")
      return `Cicilan memakai ${percent.format(value)} dari pemasukan, di atas batas 35%.`
    if (metric.status === "perlu_perhatian")
      return `Cicilan ${percent.format(value)} dari pemasukan, mendekati batas 35%.`
    return `Cicilan ${percent.format(value)} dari pemasukan.`
  }
  const months = `${monthCount.format(value)} bulan pengeluaran`
  if (metric.status === "berisiko") return `Dana darurat ${months}, di bawah 1 bulan.`
  if (metric.status === "perlu_perhatian") return `Dana darurat ${months}, target 4 bulan.`
  return `Dana darurat ${months}.`
}

export function assessFinancialHealth(data: FinanceData, now = new Date()): HealthAssessment {
  const cycles = recentCycles(data.settings, HEALTH_THRESHOLDS.lookbackCycles, now)
  const walletTypes = new Map(data.wallets.map((wallet) => [wallet.id, wallet.type]))
  const sums = cycles.map((cycle) =>
    cycleSums(data.transactions, cycle.start, cycle.end, walletTypes),
  )
  const current = { cycle: cycles[cycles.length - 1], sums: sums[sums.length - 1] }
  const complete = cycles
    .map((cycle, index) => ({ cycle, sums: sums[index] }))
    .filter(
      (entry) =>
        daysUntil(entry.cycle.end, now) < 0 &&
        (entry.sums.income > 0 || entry.sums.expense > 0 || entry.sums.savings !== 0),
    )

  const insufficient = (reason: string): HealthAssessment => ({
    status: "data_belum_cukup",
    headline: headlineByStatus.data_belum_cukup,
    metrics: [],
    reasons: [reason],
    nextStep: null,
    basisNote: null,
  })

  if (complete.length === 0) {
    const elapsed = Math.max(1, 1 - daysUntil(current.cycle.start, now))
    return insufficient(`Siklus ini baru berjalan ${elapsed} hari. Catat sampai siklus selesai.`)
  }

  const unstable =
    complete.length >= 2 &&
    coefficientOfVariation(complete.map((entry) => entry.sums.income)) >
      HEALTH_THRESHOLDS.stability.stableCv
  const currentHasIncome = current.sums.income > 0
  const basis =
    unstable || !currentHasIncome ? complete.slice(-HEALTH_THRESHOLDS.smoothingCycles) : [current]

  const income = mean(basis.map((entry) => entry.sums.income))
  const expense = mean(basis.map((entry) => entry.sums.expense))
  const savings = mean(basis.map((entry) => entry.sums.savings))
  const debtPayments = mean(basis.map((entry) => entry.sums.debtPayments))

  if (income <= 0) return insufficient("Pemasukan belum tercatat di siklus ini.")

  const expenseBase =
    mean(
      complete
        .filter((entry) => entry.sums.expense > 0)
        .slice(-HEALTH_THRESHOLDS.smoothingCycles)
        .map((entry) => entry.sums.expense),
    ) || current.sums.expense
  const balance = data.wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
  const buffer = data.wallets.length > 0 && expenseBase > 0 ? balance / expenseBase : null
  const hasSavingsFeature = data.savings.length > 0 || data.wallets.some((w) => w.type === "saving")
  const savingsRatio = savings / income
  const debtRatio = debtPayments / income
  const cashflowRatio = (income - expense - savings) / income

  const metrics: HealthMetric[] = [
    {
      key: "cashflow",
      label: "Arus kas",
      status: bandHigherIsBetter(
        cashflowRatio,
        HEALTH_THRESHOLDS.cashflow.risk,
        HEALTH_THRESHOLDS.cashflow.attention,
      ),
      value: cashflowRatio,
      detail: `${percent.format(cashflowRatio)} dari pemasukan tersisa`,
    },
    hasSavingsFeature
      ? {
          key: "savings",
          label: "Menabung",
          status: bandSavings(savingsRatio),
          value: savingsRatio,
          detail: `${percent.format(savingsRatio)} dari pemasukan`,
        }
      : {
          key: "savings",
          label: "Menabung",
          status: "belum_dinilai",
          value: null,
          detail: "Belum ada dompet atau target tabungan",
        },
    {
      key: "debt",
      label: "Cicilan",
      status:
        debtRatio > HEALTH_THRESHOLDS.debt.risk
          ? "berisiko"
          : debtRatio > HEALTH_THRESHOLDS.debt.attention
            ? "perlu_perhatian"
            : "sehat",
      value: debtRatio,
      detail: `${percent.format(debtRatio)} dari pemasukan`,
    },
    buffer === null
      ? {
          key: "buffer",
          label: "Dana darurat",
          status: "belum_dinilai",
          value: null,
          detail: "Belum ada dompet atau pengeluaran tercatat",
        }
      : {
          key: "buffer",
          label: "Dana darurat",
          status:
            buffer < HEALTH_THRESHOLDS.buffer.risk
              ? "berisiko"
              : buffer < HEALTH_THRESHOLDS.buffer.attention
                ? "perlu_perhatian"
                : "sehat",
          value: buffer,
          detail: `${monthCount.format(buffer)} bulan pengeluaran`,
        },
  ]

  const assessed = metrics.filter((metric) => metric.status !== "belum_dinilai")
  const worst = assessed.reduce<HealthMetric | null>(
    (found, metric) =>
      !found || severity(metric.status) > severity(found.status) ? metric : found,
    null,
  )

  let status: HealthStatus
  if (!worst || severity(worst.status) === 0) status = "data_belum_cukup"
  else if (severity(worst.status) === 3) status = "berisiko"
  else if (severity(worst.status) === 2) status = "perlu_perhatian"
  else if (assessed.length < 2) status = "data_belum_cukup"
  else status = data.wallets.length > 0 ? "sehat" : "perlu_perhatian"

  const flagged = assessed
    .filter((metric) => metric.status === "berisiko" || metric.status === "perlu_perhatian")
    .sort((a, b) => severity(b.status) - severity(a.status))
    .map(reasonFor)
  const positive = assessed.filter((metric) => metric.status === "sehat").map(reasonFor)

  const reasons = status === "sehat" ? positive.slice(0, 2) : flagged.slice(0, 3)
  if (status === "perlu_perhatian" && data.wallets.length === 0)
    reasons.push("Tambahkan dompet agar dana darurat bisa dinilai.")

  const nextStep =
    status === "sehat" || status === "data_belum_cukup" || !worst
      ? null
      : nextStepByMetric[worst.key]

  const basisNote = unstable
    ? "Dinilai dari rata-rata 3 siklus karena pemasukanmu tidak tetap."
    : currentHasIncome
      ? null
      : "Dinilai dari siklus terakhir yang lengkap."

  return {
    status,
    headline: headlineByStatus[status],
    metrics,
    reasons: reasons.length > 0 ? reasons : ["Catat transaksi rutin agar penilaian makin akurat."],
    nextStep,
    basisNote,
  }
}
