import type { ReactNode } from "react"

export function PageHeader({
  action,
  description,
  eyebrow,
  title,
}: {
  action?: ReactNode
  description: ReactNode
  eyebrow: string
  title: string
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-caption uppercase tracking-[0.14em]">{eyebrow}</p>
        <h1 className="text-title mt-1">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </header>
  )
}
