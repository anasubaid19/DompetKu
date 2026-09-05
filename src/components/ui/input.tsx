import { Input as InputPrimitive } from "@base-ui/react/input"
import type * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      className={cn(
        "h-11 w-full min-w-0 rounded-xl border border-transparent bg-input px-3.5 text-base outline-none transition-[background-color,border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-ring/20 disabled:opacity-50 md:text-sm pointer-coarse:text-base",
        (props.type === "number" || props.type === "date" || props.inputMode === "numeric") &&
          "tabular-nums",
        props.type === "date" &&
          "[&::-webkit-date-and-time-value]:min-w-0 [&::-webkit-datetime-edit]:min-w-0",
        className,
      )}
      data-slot="input"
      {...props}
    />
  )
}

export { Input }
