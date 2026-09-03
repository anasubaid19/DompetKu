import { Chart03Icon, Money01Icon, Wallet01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute } from "@tanstack/react-router"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CategoryLabel } from "@/components/finance-visuals"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getFinanceData } from "@/lib/finance.functions"
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

  return (
    <div className="grid gap-6">
      <PageHeader
        description="Lihat pola, bukan hanya angka terakhir."
        eyebrow="Pemahaman finansial"
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
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
              className="flex h-72 flex-col"
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
              <div className="min-h-0 flex-1">
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart
                    accessibilityLayer={false}
                    data={months}
                    margin={{ left: -12, right: 0, top: 12, bottom: 0 }}
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
          <CardContent className="grid gap-5">
            {categories.slice(0, 6).map((category) => (
              <div className="grid gap-2" key={category.category?.id ?? category.name}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  {category.category ? (
                    <CategoryLabel category={category.category} />
                  ) : (
                    <span>{category.name}</span>
                  )}
                  <strong className="tabular-nums">{money(category.value)}</strong>
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
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] tabular-nums">{value}</p>
        </div>
        <span className={`grid size-10 place-items-center rounded-2xl bg-secondary ${tone}`}>
          <HugeiconsIcon icon={icon} />
        </span>
      </CardContent>
    </Card>
  )
}
