import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import type * as React from "react"
import { cn } from "@/lib/utils"

function Progress({
  className,
  indicatorStyle,
  value = 0,
  ...props
}: ProgressPrimitive.Root.Props & { indicatorStyle?: React.CSSProperties }) {
  return (
    <ProgressPrimitive.Root
      className={cn("h-2 overflow-hidden rounded-full bg-secondary", className)}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-primary transition-[width] duration-slow ease-entrance"
        style={indicatorStyle}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
