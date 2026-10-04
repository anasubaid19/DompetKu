import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function SegmentedControl<T extends string>({
  ariaLabel,
  className,
  itemClassName,
  onChange,
  options,
  value,
}: {
  ariaLabel: string
  className?: string
  itemClassName?: string
  onChange: (value: T) => void
  options: readonly { label: ReactNode; value: T }[]
  value: T
}) {
  return (
    <fieldset
      aria-label={ariaLabel}
      className={cn("flex min-w-0 gap-1 rounded-xl bg-secondary p-1", className)}
    >
      {options.map((option) => (
        <button
          aria-pressed={value === option.value}
          className={cn(
            "h-9 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-[background-color,color,box-shadow] aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            itemClassName,
          )}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  )
}
