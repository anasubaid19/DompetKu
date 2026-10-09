import { cn } from "@/lib/utils"

export function percentChange(value: number, base: number) {
  return base > 0 ? Math.round(((value - base) / base) * 100) : null
}

export function average(values: number[]) {
  return values.length > 0
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : 0
}

export function CycleCompare({
  label,
  value,
  delta,
  average,
  goodWhenUp = false,
}: {
  label: string
  value: string
  delta: number | null
  average: string
  goodWhenUp?: boolean
}) {
  const improving = delta !== null && delta !== 0 && delta > 0 === goodWhenUp
  const tone =
    delta === null || delta === 0
      ? "text-muted-foreground"
      : improving
        ? "text-success"
        : "text-destructive"
  const direction = delta === null || delta === 0 ? "" : delta > 0 ? "Naik" : "Turun"
  return (
    <div className="rounded-2xl bg-secondary/55 p-4">
      <p className="text-caption">{label} siklus ini</p>
      <p className="mt-1 text-xl font-semibold tabular-nums break-words">{value}</p>
      <p className={cn("text-caption mt-1 tabular-nums", tone)}>
        {delta === null
          ? "Belum ada pembanding"
          : delta === 0
            ? "Sama dengan siklus lalu"
            : `${direction} ${Math.abs(delta)}% vs siklus lalu`}
      </p>
      <p className="text-caption mt-0.5 tabular-nums">Rata-rata 3 siklus: {average}</p>
    </div>
  )
}
