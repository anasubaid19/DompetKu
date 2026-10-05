import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn, formatCompactNumber, formatMoney } from "@/lib/utils"

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
const MONTH_LABEL = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" })

type CalendarTransaction = {
  type: "income" | "expense" | "transfer"
  amount: number
  fee: number
  transaction_date: string
}

export function SpendingCalendar({
  transactions,
  currency,
  hidden,
}: {
  transactions: CalendarTransaction[]
  currency: string
  hidden: boolean
}) {
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const daily = new Map<string, number>()
  for (const item of transactions) {
    if (item.type === "expense") {
      daily.set(item.transaction_date, (daily.get(item.transaction_date) ?? 0) + item.amount)
    } else if (item.type === "transfer" && item.fee > 0) {
      daily.set(item.transaction_date, (daily.get(item.transaction_date) ?? 0) + item.fee)
    }
  }

  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const leading = (new Date(year, monthIndex, 1).getDay() + 6) % 7
  const key = (day: number) =>
    `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  const values = Array.from({ length: daysInMonth }, (_, index) => daily.get(key(index + 1)) ?? 0)
  const max = Math.max(1, ...values)
  const monthTotal = values.reduce((sum, value) => sum + value, 0)
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthIndex

  const cells: { id: string; day: number | null }[] = [
    ...Array.from({ length: leading }, (_, index) => ({ id: `lead-${index}`, day: null })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({
      id: key(index + 1),
      day: index + 1,
    })),
  ]

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-label capitalize">{MONTH_LABEL.format(month)}</p>
        <div className="flex items-center gap-1">
          <Button
            aria-label="Bulan sebelumnya"
            onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}
            size="icon"
            type="button"
            variant="ghost"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} />
          </Button>
          <Button
            aria-label="Bulan berikutnya"
            onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}
            size="icon"
            type="button"
            variant="ghost"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-caption" aria-hidden>
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          if (cell.day === null) return <span key={cell.id} />
          const day = cell.day
          const amount = daily.get(key(day)) ?? 0
          const intensity = amount / max
          const label = `${day} ${MONTH_LABEL.format(month)}: ${
            amount > 0
              ? hidden
                ? "disembunyikan"
                : formatMoney(amount, currency)
              : "tidak ada pengeluaran"
          }`
          return (
            <div
              aria-label={label}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-lg px-0.5 text-center",
                amount > 0 ? "bg-destructive/10" : "bg-secondary/40",
                isCurrentMonth && today.getDate() === day && "ring-2 ring-primary/40",
              )}
              key={cell.id}
              role="img"
              style={
                amount > 0
                  ? {
                      backgroundColor: `color-mix(in oklab, var(--destructive) ${Math.round(8 + intensity * 26)}%, transparent)`,
                    }
                  : undefined
              }
            >
              <span className="text-xs font-medium tabular-nums">{day}</span>
              {amount > 0 && (
                <span className="text-[10px] leading-tight text-muted-foreground tabular-nums">
                  {hidden ? "•••" : formatCompactNumber(amount)}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-caption">
        Total bulan ini:{" "}
        <span className="font-medium tabular-nums">
          {hidden ? "••••••" : formatMoney(monthTotal, currency)}
        </span>
      </p>
    </div>
  )
}
