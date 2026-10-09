import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  CalendarDaysIcon,
  CalendarRangeIcon,
  Invoice01Icon,
  TransactionHistoryIcon,
  UserIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import { average, CycleCompare, percentChange } from "@/components/cycle-compare"
import { TransactionDialog, WalletDialog } from "@/components/finance-dialogs"
import { CategoryLabel, WalletLabel, WalletLogo } from "@/components/finance-visuals"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { getFinanceData } from "@/lib/finance.functions"
import {
  cashFlowMessage,
  cn,
  cycleRange,
  daysUntil,
  formatMoney,
  formatTransactionAmount,
  recentCycles,
  recentDays,
  today,
} from "@/lib/utils"

export const Route = createFileRoute("/_app/app/")({
  loader: () => getFinanceData(),
  component: DashboardPage,
})

const chartRangeOptions = [
  {
    label: (
      <span className="inline-flex items-center gap-1.5">
        <HugeiconsIcon aria-hidden className="size-4" icon={CalendarRangeIcon} />
        Siklus
      </span>
    ),
    value: "cycle",
  },
  {
    label: (
      <span className="inline-flex items-center gap-1.5">
        <HugeiconsIcon aria-hidden className="size-4" icon={CalendarDaysIcon} />
        Mingguan
      </span>
    ),
    value: "weekly",
  },
] as const

function DashboardPage() {
  const data = Route.useLoaderData()
  const [chartRange, setChartRange] = useState<"cycle" | "weekly">("cycle")
  const currency = data.settings.currency
  const cycle = cycleRange(data.settings)
  const periodTransactions = data.transactions.filter(
    (item) => item.transaction_date >= cycle.start && item.transaction_date <= cycle.end,
  )
  const income = periodTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0)
  const expense = periodTransactions.reduce(
    (sum, item) =>
      sum + (item.type === "expense" ? item.amount : item.type === "transfer" ? item.fee : 0),
    0,
  )
  const elapsedDays = Math.max(1, 1 - daysUntil(cycle.start))
  const remainingDays = Math.max(0, daysUntil(cycle.end))
  const projectedExpense = Math.round((expense / elapsedDays) * (elapsedDays + remainingDays))
  const balance = data.wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
  const hide = Boolean(data.settings.hide_balance)
  const money = (value: number) => (hide ? "••••••" : formatMoney(value, currency))
  const categoriesById = new Map(data.categories.map((category) => [category.id, category]))
  const walletsById = new Map(data.wallets.map((wallet) => [wallet.id, wallet]))
  const overdueDebts = data.debts.filter(
    (debt) => debt.status === "active" && debt.due_date && debt.due_date < today(),
  )
  const dueSubscriptions = data.subscriptions.filter(
    (subscription) => subscription.next_due_date && daysUntil(subscription.next_due_date) <= 7,
  )
  const expenseByCategory = new Map<string, number>()
  for (const item of data.transactions) {
    if (
      item.type === "expense" &&
      item.category_id &&
      item.transaction_date >= cycle.start &&
      item.transaction_date <= cycle.end
    ) {
      expenseByCategory.set(
        item.category_id,
        (expenseByCategory.get(item.category_id) ?? 0) + item.amount,
      )
    }
  }
  const budgetAlerts = data.budgets
    .map((budget) => {
      const spent = expenseByCategory.get(budget.category_id) ?? 0
      return { ...budget, spent, percent: Math.round((spent / budget.amount) * 100) }
    })
    .filter((budget) => budget.percent >= 80)
    .sort((a, b) => b.percent - a.percent)
  const activeDebts = data.debts.filter((debt) => debt.status === "active")
  const outstanding = (type: "hutang" | "piutang") =>
    activeDebts
      .filter((debt) => debt.type === type)
      .reduce((sum, debt) => sum + Math.max(0, debt.amount - debt.paid_amount), 0)

  const chartRanges = chartRange === "weekly" ? recentDays(7) : recentCycles(data.settings, 6)
  const chart = chartRanges.map(({ start, end, shortLabel }) => {
    const transactions = data.transactions.filter(
      (item) => item.transaction_date >= start && item.transaction_date <= end,
    )
    return {
      label: shortLabel,
      masuk: transactions
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0),
      keluar: transactions.reduce(
        (sum, item) =>
          sum + (item.type === "expense" ? item.amount : item.type === "transfer" ? item.fee : 0),
        0,
      ),
    }
  })
  const hasCashFlow = chart.some((item) => item.masuk > 0 || item.keluar > 0)
  const compareRanges = recentCycles(data.settings, 4).map(({ start, end }) => {
    const transactions = data.transactions.filter(
      (item) => item.transaction_date >= start && item.transaction_date <= end,
    )
    return {
      masuk: transactions
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0),
      keluar: transactions.reduce(
        (sum, item) =>
          sum + (item.type === "expense" ? item.amount : item.type === "transfer" ? item.fee : 0),
        0,
      ),
    }
  })
  const currentCycle = compareRanges[compareRanges.length - 1]
  const previousCycle = compareRanges[compareRanges.length - 2]
  const priorThreeCycles = compareRanges.slice(
    Math.max(0, compareRanges.length - 4),
    compareRanges.length - 1,
  )
  const hasCompare = compareRanges.some((item) => item.masuk > 0 || item.keluar > 0)

  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader
        action={
          <>
            <WalletDialog />
            <TransactionDialog
              categories={data.categories}
              recentTransactions={data.transactions}
              wallets={data.wallets}
            />
          </>
        }
        description={`${cycle.label}. Saldo, pemasukan, dan pengeluaran siklus ini.`}
        eyebrow="Ringkasan"
        title="Ringkasan keuanganmu."
      />

      {data.wallets.length === 0 && (
        <Card className="border border-primary/15 bg-primary/[0.04]">
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <HugeiconsIcon icon={Wallet01Icon} className="size-5" />
            </span>
            <div className="flex-1">
              <h2 className="font-semibold">Mulai dari dompet pertamamu</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tambahkan rekening atau uang tunai sebelum mencatat transaksi.
              </p>
            </div>
            <WalletDialog />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <SummaryCard
          cardClassName="col-span-2 md:col-span-1"
          icon={Wallet01Icon}
          label="Total saldo"
          value={money(balance)}
        />
        <SummaryCard
          className="text-success"
          icon={ArrowDown01Icon}
          label="Pemasukan siklus ini"
          value={money(income)}
        />
        <SummaryCard
          className="text-destructive"
          icon={ArrowUp01Icon}
          label="Pengeluaran siklus ini"
          value={money(expense)}
        />
      </div>

      <div className="grid gap-1 rounded-2xl border border-primary/15 bg-primary/[0.04] px-4 py-3 text-sm">
        <p>{cashFlowMessage(income, expense)}</p>
        {expense > 0 && remainingDays > 0 && (
          <p className="tabular-nums text-muted-foreground">
            Dengan laju {money(expense / elapsedDays)} per hari, pengeluaran siklus ini diperkirakan{" "}
            {money(projectedExpense)}.
          </p>
        )}
      </div>

      {overdueDebts.length > 0 && (
        <Card className="border border-destructive/20 bg-destructive/[0.04]">
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <HugeiconsIcon icon={UserIcon} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">
                {overdueDebts.length} kewajiban sudah lewat jatuh tempo
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tinjau hutang & piutang agar tidak menumpuk.
              </p>
            </div>
            <Button render={<Link to="/app/planning" />} size="sm" variant="outline">
              Lihat di Rencana
            </Button>
          </CardContent>
        </Card>
      )}

      {dueSubscriptions.length > 0 && (
        <Card className="border border-warning/25 bg-warning/[0.05]">
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-warning/12 text-warning">
              <HugeiconsIcon icon={Invoice01Icon} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">
                {dueSubscriptions.length} pembayaran rutin mendekati jatuh tempo
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Termasuk yang sudah lewat. Bayar dari Rencana sebelum menumpuk.
              </p>
            </div>
            <Button render={<Link to="/app/planning" />} size="sm" variant="outline">
              Lihat di Rencana
            </Button>
          </CardContent>
        </Card>
      )}

      {budgetAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Anggaran hampir penuh</CardTitle>
              <CardDescription>
                Realisasi siklus ini terhadap batas yang kamu tetapkan.
              </CardDescription>
            </div>
            <Button render={<Link to="/app/planning" />} size="sm" variant="ghost">
              Atur
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            {budgetAlerts.slice(0, 3).map((budget) => (
              <div className="grid gap-2" key={budget.id}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium" title={budget.category_name}>
                    {budget.category_name}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 tabular-nums font-semibold",
                      budget.percent > 100 ? "text-destructive" : "text-warning",
                    )}
                  >
                    {budget.percent}%
                  </span>
                </div>
                <Progress
                  aria-label={`${budget.category_name}, ${budget.percent}% dari batas siklus`}
                  value={Math.min(budget.percent, 100)}
                />
                <p className="text-caption tabular-nums">
                  {budget.percent > 100
                    ? `Lebih ${money(budget.spent - budget.amount)}`
                    : `Tersisa ${money(budget.amount - budget.spent)}`}
                </p>
              </div>
            ))}
            {budgetAlerts.length > 3 && (
              <Button
                className="justify-self-start"
                render={<Link to="/app/planning" />}
                size="sm"
                variant="ghost"
              >
                Lihat {budgetAlerts.length - 3} lainnya di Rencana
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {activeDebts.length > 0 && (
        <Card>
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-muted-foreground">
              <HugeiconsIcon icon={UserIcon} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">Kewajiban aktif</h2>
              <p className="text-caption mt-1 tabular-nums">
                Hutang {money(outstanding("hutang"))} · Piutang {money(outstanding("piutang"))}
              </p>
            </div>
            <Button render={<Link to="/app/planning" />} size="sm" variant="outline">
              Lihat di Rencana
            </Button>
          </CardContent>
        </Card>
      )}

      {data.wallets.length > 0 && (
        <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 lg:hidden">
          <TransactionDialog
            categories={data.categories}
            fab
            recentTransactions={data.transactions}
            wallets={data.wallets}
          />
        </div>
      )}

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
        <Card>
          <CardHeader className="flex-col sm:flex-row">
            <div>
              <CardTitle>
                {chartRange === "weekly" ? "Arus kas mingguan" : "Arus kas 6 siklus"}
              </CardTitle>
              <CardDescription>
                {chartRange === "weekly"
                  ? "Tujuh hari terakhir, per hari."
                  : "Perbandingan sesuai rentang laporanmu."}
              </CardDescription>
            </div>
            <SegmentedControl
              ariaLabel="Rentang arus kas"
              className="w-full shrink-0 sm:w-auto"
              itemClassName="flex flex-1 items-center justify-center px-2.5 sm:flex-none"
              onChange={setChartRange}
              options={chartRangeOptions}
              value={chartRange}
            />
          </CardHeader>
          <CardContent>
            {hasCashFlow ? (
              <div
                aria-describedby="cash-flow-summary"
                aria-label={
                  chartRange === "weekly"
                    ? "Grafik arus kas tujuh hari terakhir"
                    : `Grafik arus kas enam siklus, ${data.settings.cycle_length} bulan per siklus`
                }
                className="flex h-64 w-full min-w-0 flex-col"
                role="img"
              >
                <p className="sr-only" id="cash-flow-summary">
                  {chart
                    .map(
                      (item) =>
                        `${item.label}: pemasukan ${money(item.masuk)}, pengeluaran ${money(item.keluar)}`,
                    )
                    .join(". ")}
                </p>
                <div
                  aria-hidden
                  className="mb-2 flex items-center justify-end gap-4 text-xs text-muted-foreground"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[var(--chart-3)]" /> Pemasukan
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[var(--chart-1)]" /> Pengeluaran
                  </span>
                </div>
                <div className="min-h-0 min-w-0 flex-1">
                  <ResponsiveContainer height="100%" width="100%">
                    <AreaChart
                      accessibilityLayer={false}
                      data={chart}
                      margin={{ left: 0, right: 0, top: 16, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="income" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expense" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
                          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="var(--border)"
                        strokeDasharray="3 6"
                        vertical={false}
                      />
                      <XAxis
                        axisLine={false}
                        dataKey="label"
                        fontSize={11}
                        interval={chartRange === "weekly" ? "preserveStartEnd" : 0}
                        minTickGap={24}
                        tick={{ fill: "var(--muted-foreground)" }}
                        tickLine={false}
                      />
                      <Tooltip formatter={(value) => money(Number(value))} />
                      <Area
                        dataKey="masuk"
                        fill="url(#income)"
                        isAnimationActive={false}
                        name="Pemasukan"
                        stroke="var(--chart-3)"
                        strokeWidth={2}
                        type="monotone"
                      />
                      <Area
                        dataKey="keluar"
                        fill="url(#expense)"
                        isAnimationActive={false}
                        name="Pengeluaran"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        type="monotone"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                  <HugeiconsIcon icon={TransactionHistoryIcon} />
                </span>
                <div>
                  <p className="text-sm font-medium">Belum ada arus kas</p>
                  <p className="text-caption mt-1">Grafik akan terisi setelah ada transaksi.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="order-first xl:order-last">
          <CardHeader>
            <div>
              <CardTitle>Dompet</CardTitle>
              <CardDescription>{data.wallets.length} sumber dana aktif</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2">
            {data.wallets.slice(0, 5).map((wallet) => (
              <div
                className="flex min-w-0 items-center gap-3 rounded-2xl bg-secondary/55 p-3"
                key={wallet.id}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-card text-primary shadow-sm">
                  <WalletLogo wallet={wallet} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={wallet.name}>
                    {wallet.name}
                  </p>
                  <p className="text-caption">{wallet.type === "saving" ? "Tabungan" : "Harian"}</p>
                </div>
                <div className="flex min-w-0 items-center gap-1">
                  <p className="min-w-0 text-sm font-semibold tabular-nums break-words text-right">
                    {money(wallet.balance)}
                  </p>
                  <WalletDialog wallet={wallet} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {hasCompare && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Dibanding siklus lalu</CardTitle>
              <CardDescription>Pemasukan dan pengeluaran vs siklus sebelumnya.</CardDescription>
            </div>
            <Button render={<Link to="/app/reports" />} size="sm" variant="ghost">
              Laporan
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <CycleCompare
              average={money(average(priorThreeCycles.map((item) => item.masuk)))}
              delta={percentChange(currentCycle.masuk, previousCycle.masuk)}
              goodWhenUp
              label="Pemasukan"
              value={money(currentCycle.masuk)}
            />
            <CycleCompare
              average={money(average(priorThreeCycles.map((item) => item.keluar)))}
              delta={percentChange(currentCycle.keluar, previousCycle.keluar)}
              label="Pengeluaran"
              value={money(currentCycle.keluar)}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Transaksi terbaru</CardTitle>
            <CardDescription>Aktivitas terakhir dari semua dompet.</CardDescription>
          </div>
          {data.transactions.length > 0 && (
            <Button render={<Link to="/app/transactions" />} size="sm" variant="ghost">
              Lihat semua
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-1">
          {data.transactions.slice(0, 6).map((item) => {
            const category = item.category_id ? categoriesById.get(item.category_id) : undefined
            const wallet = walletsById.get(item.wallet_id)
            const targetWallet = item.target_wallet_id
              ? walletsById.get(item.target_wallet_id)
              : undefined
            return (
              <div
                className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b py-3 last:border-0"
                key={item.id}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-secondary">
                  <HugeiconsIcon
                    icon={
                      item.type === "income"
                        ? ArrowDown01Icon
                        : item.type === "expense"
                          ? ArrowUp01Icon
                          : TransactionHistoryIcon
                    }
                  />
                </span>
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-medium"
                    title={item.description || item.category_name || "Transfer dompet"}
                  >
                    {item.description || item.category_name || "Transfer dompet"}
                  </p>
                  <div className="text-caption mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                    {category && <CategoryLabel category={category} />}
                    {category && <span aria-hidden>·</span>}
                    {wallet && <WalletLabel wallet={wallet} />}
                    {targetWallet && <span aria-hidden>→</span>}
                    {targetWallet && <WalletLabel wallet={targetWallet} />}
                    <span aria-hidden>·</span>
                    <span className="tabular-nums">{item.transaction_date}</span>
                  </div>
                </div>
                <p
                  className={
                    item.type === "income"
                      ? "min-w-0 text-sm font-semibold tabular-nums break-words text-right text-success"
                      : "min-w-0 text-sm font-semibold tabular-nums break-words text-right"
                  }
                >
                  {formatTransactionAmount(item.type, item.amount, currency, hide)}
                </p>
              </div>
            )
          })}
          {data.transactions.length === 0 && (
            <div className="flex flex-col items-start gap-4 py-4 sm:flex-row sm:items-center">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                <HugeiconsIcon icon={TransactionHistoryIcon} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">Belum ada transaksi</p>
                <p className="text-caption mt-1">Mulai catat pemasukan atau pengeluaranmu.</p>
              </div>
              <div>
                {data.wallets.length > 0 ? (
                  <TransactionDialog
                    categories={data.categories}
                    recentTransactions={data.transactions}
                    wallets={data.wallets}
                  />
                ) : (
                  <WalletDialog />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon,
  className,
  cardClassName,
}: {
  label: string
  value: string
  icon: typeof Wallet01Icon
  className?: string
  cardClassName?: string
}) {
  return (
    <Card className={cardClassName}>
      <CardContent className="flex items-start justify-between gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-lg font-semibold tracking-[-0.04em] tabular-nums break-words sm:mt-3 sm:text-2xl">
            {value}
          </p>
        </div>
        <span
          className={`hidden size-10 place-items-center rounded-2xl bg-secondary sm:grid ${className ?? "text-primary"}`}
        >
          <HugeiconsIcon icon={icon} />
        </span>
      </CardContent>
    </Card>
  )
}
