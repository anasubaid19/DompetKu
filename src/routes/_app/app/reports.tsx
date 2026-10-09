import { Chart03Icon, Money01Icon, Wallet01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute } from "@tanstack/react-router"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { average, CycleCompare, percentChange } from "@/components/cycle-compare"
import { CategoryLabel } from "@/components/finance-visuals"
import { PageHeader } from "@/components/page-header"
import { SpendingCalendar } from "@/components/spending-calendar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getFinanceData } from "@/lib/finance.functions"
import { categoryChartColor } from "@/lib/finance-options"
import { formatCompactNumber, formatMoney, recentCycles } from "@/lib/utils"

export const Route = createFileRoute("/_app/app/reports")({
  loader: () => getFinanceData(),
  component: ReportsPage,
})

function ReportsPage() {
  const data = Route.useLoaderData()
  const money = (value: number) =>
    data.settings.hide_balance ? "••••••" : formatMoney(value, data.settings.currency)
  const income = data.transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0)
  const expense = data.transactions.reduce(
    (sum, item) =>
      sum + (item.type === "expense" ? item.amount : item.type === "transfer" ? item.fee : 0),
    0,
  )
  const netWorth = data.wallets.reduce((sum, wallet) => sum + wallet.balance, 0)

  const months = recentCycles(data.settings, 6).map(({ start, end, shortLabel }) => {
    const transactions = data.transactions.filter(
      (item) => item.transaction_date >= start && item.transaction_date <= end,
    )
    return {
      month: shortLabel,
      pemasukan: transactions
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0),
      pengeluaran: transactions.reduce(
        (sum, item) =>
          sum + (item.type === "expense" ? item.amount : item.type === "transfer" ? item.fee : 0),
        0,
      ),
    }
  })

  const netWorthTrend: { month: string; kekayaan: number }[] = []
  let runningNetWorth = netWorth
  for (let index = months.length - 1; index >= 0; index -= 1) {
    netWorthTrend[index] = { month: months[index].month, kekayaan: runningNetWorth }
    runningNetWorth -= months[index].pemasukan - months[index].pengeluaran
  }
  const hasNetWorth = netWorthTrend.some((item) => item.kekayaan !== 0)

  const categoriesById = new Map(data.categories.map((category) => [category.id, category]))
  const categoryTotals = new Map<
    string,
    { name: string; value: number; category?: (typeof data.categories)[number] }
  >()
  for (const item of data.transactions) {
    if (item.type === "expense") {
      const key = item.category_id ?? "uncategorized"
      const category = item.category_id ? categoriesById.get(item.category_id) : undefined
      const current = categoryTotals.get(key)
      categoryTotals.set(key, {
        name: category?.name ?? "Tanpa kategori",
        value: (current?.value ?? 0) + item.amount,
        category,
      })
    }
    if (item.type === "transfer" && item.fee > 0) {
      const current = categoryTotals.get("transfer-fee")
      categoryTotals.set("transfer-fee", {
        name: "Biaya transfer",
        value: (current?.value ?? 0) + item.fee,
      })
    }
  }
  const categories = Array.from(categoryTotals.values()).sort((a, b) => b.value - a.value)
  const largestCategory = categories[0]?.value ?? 1
  const categoryTotal = categories.reduce((sum, category) => sum + category.value, 0)

  const cycles = recentCycles(data.settings, 6)
  const currentMonth = months[months.length - 1]
  const previousMonth = months[months.length - 2]
  const priorThree = months.slice(Math.max(0, months.length - 4), months.length - 1)

  const incomeDelta = percentChange(currentMonth.pemasukan, previousMonth?.pemasukan ?? 0)
  const expenseDelta = percentChange(currentMonth.pengeluaran, previousMonth?.pengeluaran ?? 0)
  const incomeAverage = average(priorThree.map((item) => item.pemasukan))
  const expenseAverage = average(priorThree.map((item) => item.pengeluaran))

  const categorySumsInRange = (start: string, end: string) => {
    const map = new Map<string, number>()
    for (const item of data.transactions) {
      if (item.type !== "expense") continue
      if (item.transaction_date < start || item.transaction_date > end) continue
      const key = item.category_id ?? "uncategorized"
      map.set(key, (map.get(key) ?? 0) + item.amount)
    }
    return map
  }
  const currentCycle = cycles[cycles.length - 1]
  const previousCycle = cycles[cycles.length - 2]
  const currentCats = categorySumsInRange(currentCycle.start, currentCycle.end)
  const previousCats = previousCycle
    ? categorySumsInRange(previousCycle.start, previousCycle.end)
    : new Map<string, number>()
  const increases = Array.from(currentCats.entries())
    .map(([key, value]) => ({
      key,
      name:
        key === "uncategorized"
          ? "Tanpa kategori"
          : (categoriesById.get(key)?.name ?? "Tanpa kategori"),
      category: key === "uncategorized" ? undefined : categoriesById.get(key),
      delta: value - (previousCats.get(key) ?? 0),
    }))
    .filter((item) => item.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3)

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        description="Bandingkan pemasukan dan pengeluaran antar siklus."
        eyebrow="Analisis keuangan"
        title="Laporan"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <ReportStat
          icon={Money01Icon}
          label="Total pemasukan"
          tone="text-success"
          value={money(income)}
        />
        <ReportStat
          icon={Chart03Icon}
          label="Total pengeluaran"
          tone="text-destructive"
          value={money(expense)}
        />
        <ReportStat
          icon={Wallet01Icon}
          label="Kekayaan bersih"
          tone="text-primary"
          value={money(netWorth)}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Perbandingan siklus ini</CardTitle>
            <CardDescription>
              Siklus aktif dibanding siklus sebelumnya dan rata-rata tiga siklus.
            </CardDescription>
          </div>
          <Badge>Siklus</Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <CycleCompare
              average={money(incomeAverage)}
              delta={incomeDelta}
              goodWhenUp
              label="Pemasukan"
              value={money(currentMonth.pemasukan)}
            />
            <CycleCompare
              average={money(expenseAverage)}
              delta={expenseDelta}
              label="Pengeluaran"
              value={money(currentMonth.pengeluaran)}
            />
          </div>
          {increases.length > 0 && (
            <div className="grid gap-2">
              <p className="text-label">Kenaikan terbesar vs siklus lalu</p>
              <div className="flex flex-wrap gap-2">
                {increases.map((item) => (
                  <span
                    className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive"
                    key={item.key}
                  >
                    {item.category ? <CategoryLabel category={item.category} /> : item.name}
                    <span className="tabular-nums">+{money(item.delta)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Perbandingan 6 siklus</CardTitle>
              <CardDescription>Enam siklus terakhir dari seluruh dompet.</CardDescription>
            </div>
            <Badge>Arus kas</Badge>
          </CardHeader>
          <CardContent>
            <div
              aria-describedby="monthly-report-summary"
              aria-label={`Grafik pemasukan dan pengeluaran enam siklus, ${data.settings.cycle_length} bulan per siklus`}
              className="flex h-72 w-full min-w-0 flex-col"
              role="img"
            >
              <p className="sr-only" id="monthly-report-summary">
                {months
                  .map(
                    (item) =>
                      `${item.month}: pemasukan ${money(item.pemasukan)}, pengeluaran ${money(item.pengeluaran)}`,
                  )
                  .join(". ")}
              </p>
              <div
                aria-hidden
                className="mb-2 flex items-center justify-end gap-4 text-xs text-muted-foreground"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-[var(--chart-3)]" /> Pemasukan
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-[var(--chart-1)]" /> Pengeluaran
                </span>
              </div>
              <div className="min-h-0 min-w-0 flex-1">
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart
                    accessibilityLayer={false}
                    data={months}
                    margin={{ left: 0, right: 0, top: 12, bottom: 0 }}
                  >
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" vertical={false} />
                    <XAxis
                      axisLine={false}
                      dataKey="month"
                      fontSize={11}
                      tick={{ fill: "var(--muted-foreground)" }}
                      tickLine={false}
                    />
                    <YAxis
                      axisLine={false}
                      fontSize={10}
                      tick={{ fill: "var(--muted-foreground)" }}
                      tickFormatter={(value) => formatCompactNumber(Number(value))}
                      tickLine={false}
                    />
                    <Tooltip formatter={(value) => money(Number(value))} />
                    <Bar
                      dataKey="pemasukan"
                      fill="var(--chart-3)"
                      isAnimationActive={false}
                      name="Pemasukan"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="pengeluaran"
                      fill="var(--chart-1)"
                      isAnimationActive={false}
                      name="Pengeluaran"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Pengeluaran terbesar</CardTitle>
              <CardDescription>Akumulasi menurut kategori.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5">
            {categories.length > 0 && (
              <div aria-hidden className="pointer-events-none relative mx-auto h-40 w-40">
                <ResponsiveContainer height="100%" width="100%">
                  <PieChart>
                    <Pie
                      data={categories.slice(0, 6)}
                      dataKey="value"
                      innerRadius="64%"
                      isAnimationActive={false}
                      nameKey="name"
                      outerRadius="100%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {categories.slice(0, 6).map((category) => (
                        <Cell
                          fill={categoryChartColor(category.category?.color)}
                          key={category.category?.id ?? category.name}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="text-caption">Total</p>
                    <p className="text-sm font-semibold tabular-nums">{money(categoryTotal)}</p>
                  </div>
                </div>
              </div>
            )}
            {categories.length > 6 && (
              <p className="-mt-2 text-center text-xs text-muted-foreground tabular-nums">
                Donat menampilkan 6 terbesar · +{categories.length - 6} kategori lainnya
              </p>
            )}
            {categories.slice(0, 6).map((category) => (
              <div className="grid min-w-0 gap-2" key={category.category?.id ?? category.name}>
                <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
                  {category.category ? (
                    <CategoryLabel category={category.category} />
                  ) : (
                    <span>{category.name}</span>
                  )}
                  <strong className="min-w-0 tabular-nums break-words text-right">
                    {money(category.value)}
                  </strong>
                </div>
                <Progress
                  aria-label={`${category.name}, ${money(category.value)}`}
                  value={(category.value / largestCategory) * 100}
                />
              </div>
            ))}
            {categories.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Belum ada pengeluaran untuk dianalisis.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Tren kekayaan bersih</CardTitle>
            <CardDescription>Perkiraan saldo total di akhir tiap siklus.</CardDescription>
          </div>
          <Badge>Perkiraan</Badge>
        </CardHeader>
        <CardContent>
          {hasNetWorth ? (
            <div
              aria-describedby="net-worth-summary"
              aria-label="Grafik tren kekayaan bersih enam siklus terakhir"
              className="flex h-64 w-full min-w-0 flex-col"
              role="img"
            >
              <p className="sr-only" id="net-worth-summary">
                {netWorthTrend.map((item) => `${item.month}: ${money(item.kekayaan)}`).join(". ")}
              </p>
              <div className="min-h-0 min-w-0 flex-1">
                <ResponsiveContainer height="100%" width="100%">
                  <AreaChart
                    accessibilityLayer={false}
                    data={netWorthTrend}
                    margin={{ left: 0, right: 0, top: 12, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="netWorth" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
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
                      dataKey="kekayaan"
                      fill="url(#netWorth)"
                      isAnimationActive={false}
                      name="Kekayaan bersih"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      type="monotone"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Belum ada data kekayaan bersih.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Kalender pengeluaran</CardTitle>
            <CardDescription>Lihat tanggal dengan pengeluaran terbesar.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <SpendingCalendar
            currency={data.settings.currency}
            hidden={Boolean(data.settings.hide_balance)}
            transactions={data.transactions}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function ReportStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: typeof Money01Icon
  tone: string
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] tabular-nums break-words">
            {value}
          </p>
        </div>
        <span className={`grid size-10 place-items-center rounded-2xl bg-secondary ${tone}`}>
          <HugeiconsIcon icon={icon} />
        </span>
      </CardContent>
    </Card>
  )
}
