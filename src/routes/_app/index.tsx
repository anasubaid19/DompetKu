import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  EyeIcon,
  TransactionHistoryIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import { TransactionDialog, WalletDialog } from "@/components/finance-dialogs"
import { CategoryLabel, WalletLabel, WalletLogo } from "@/components/finance-visuals"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getFinanceData } from "@/lib/finance.functions"
import { cycleRange, formatMoney, formatTransactionAmount, recentCycles } from "@/lib/utils"

export const Route = createFileRoute("/_app/")({
  loader: () => getFinanceData(),
  component: DashboardPage,
})

function DashboardPage() {
  const data = Route.useLoaderData()
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
  const balance = data.wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
  const hide = Boolean(data.settings.hide_balance)
  const money = (value: number) => (hide ? "••••••" : formatMoney(value, currency))
  const categoriesById = new Map(data.categories.map((category) => [category.id, category]))
  const walletsById = new Map(data.wallets.map((wallet) => [wallet.id, wallet]))

  const chart = recentCycles(data.settings, 6).map(({ start, end, shortLabel }) => {
    const monthly = data.transactions.filter(
      (item) => item.transaction_date >= start && item.transaction_date <= end,
    )
    return {
      month: shortLabel,
      masuk: monthly
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0),
      keluar: monthly.reduce(
        (sum, item) =>
          sum + (item.type === "expense" ? item.amount : item.type === "transfer" ? item.fee : 0),
        0,
      ),
    }
  })

  return (
    <div className="grid gap-6">
      <PageHeader
        action={
          <>
            <WalletDialog />
            <TransactionDialog categories={data.categories} wallets={data.wallets} />
          </>
        }
        description={`${cycle.label}. Pantau arus kas tanpa tenggelam dalam angka.`}
        eyebrow="Ringkasan siklus aktif"
        title="Uangmu, dalam satu pandangan."
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

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={Wallet01Icon} label="Total saldo" value={money(balance)} />
        <SummaryCard
          className="text-success"
          icon={ArrowDown01Icon}
          label="Pemasukan"
          value={money(income)}
        />
        <SummaryCard
          className="text-destructive"
          icon={ArrowUp01Icon}
          label="Pengeluaran"
          value={money(expense)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Arus kas 6 siklus</CardTitle>
              <CardDescription>Perbandingan sesuai rentang laporanmu.</CardDescription>
            </div>
            <Badge>{data.settings.cycle_length} bln/siklus</Badge>
          </CardHeader>
          <CardContent>
            <div
              aria-describedby="cash-flow-summary"
              aria-label={`Grafik arus kas enam siklus, ${data.settings.cycle_length} bulan per siklus`}
              className="flex h-64 w-full flex-col"
              role="img"
            >
              <p className="sr-only" id="cash-flow-summary">
                {chart
                  .map(
                    (item) =>
                      `${item.month}: pemasukan ${money(item.masuk)}, pengeluaran ${money(item.keluar)}`,
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
              <div className="min-h-0 flex-1">
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
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" vertical={false} />
                    <XAxis
                      axisLine={false}
                      dataKey="month"
                      fontSize={11}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Dompet</CardTitle>
              <CardDescription>{data.wallets.length} sumber dana aktif</CardDescription>
            </div>
            <HugeiconsIcon icon={EyeIcon} className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="grid gap-2">
            {data.wallets.slice(0, 5).map((wallet) => (
              <div
                className="flex items-center gap-3 rounded-2xl bg-secondary/55 p-3"
                key={wallet.id}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-card text-primary shadow-sm">
                  <WalletLogo wallet={wallet} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{wallet.name}</p>
                  <p className="text-caption">{wallet.type === "saving" ? "Tabungan" : "Harian"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-semibold tabular-nums">{money(wallet.balance)}</p>
                  <WalletDialog wallet={wallet} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Transaksi terbaru</CardTitle>
            <CardDescription>Aktivitas terakhir dari semua dompet.</CardDescription>
          </div>
          <Button render={<Link to="/transactions" />} size="sm" variant="ghost">
            Lihat semua
          </Button>
        </CardHeader>
        <CardContent className="grid gap-1">
          {data.transactions.slice(0, 6).map((item) => {
            const category = item.category_id ? categoriesById.get(item.category_id) : undefined
            const wallet = walletsById.get(item.wallet_id)
            const targetWallet = item.target_wallet_id
              ? walletsById.get(item.target_wallet_id)
              : undefined
            return (
              <div
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b py-3 last:border-0"
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
                  <p className="truncate text-sm font-medium">
                    {item.description || item.category_name || "Transfer dompet"}
                  </p>
                  <div className="text-caption mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                    {category && <CategoryLabel category={category} />}
                    {category && <span aria-hidden>·</span>}
                    {wallet && <WalletLabel wallet={wallet} />}
                    {targetWallet && <span aria-hidden>→</span>}
                    {targetWallet && <WalletLabel wallet={targetWallet} />}
                    <span aria-hidden>·</span>
                    <span>{item.transaction_date}</span>
                  </div>
                </div>
                <p
                  className={
                    item.type === "income"
                      ? "text-sm font-semibold text-success"
                      : "text-sm font-semibold"
                  }
                >
                  {formatTransactionAmount(item.type, item.amount, currency, hide)}
                </p>
              </div>
            )
          })}
          {data.transactions.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Belum ada transaksi.</p>
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
}: {
  label: string
  value: string
  icon: typeof Wallet01Icon
  className?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] tabular-nums">{value}</p>
        </div>
        <span
          className={`grid size-10 place-items-center rounded-2xl bg-secondary ${className ?? "text-primary"}`}
        >
          <HugeiconsIcon icon={icon} />
        </span>
      </CardContent>
    </Card>
  )
}
