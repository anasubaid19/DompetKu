import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function EmptyState({
  icon,
  text,
  description,
  action,
  className,
}: {
  icon: IconSvgElement
  text: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <Card className={cn(className)}>
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-muted-foreground">
            <HugeiconsIcon icon={icon} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">{text}</p>
            {description && <p className="text-caption mt-1">{description}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </CardContent>
    </Card>
  )
}
