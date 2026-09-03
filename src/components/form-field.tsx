import type * as React from "react"
import { cn } from "@/lib/utils"

export function FormField({
  label,
  hint,
  className,
  children,
}: {
  label: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: every caller supplies its form control as children.
    <label className={cn("grid gap-2", className)}>
      <span className="text-label">{label}</span>
      {children}
      {hint && <span className="text-caption">{hint}</span>}
    </label>
  )
}
