import { ChevronDownIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type * as React from "react"
import { cn } from "@/lib/utils"

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative w-full", className)}>
      <select
        className="h-11 w-full min-w-0 appearance-none rounded-xl border border-transparent bg-input px-3.5 pr-9 text-base outline-none transition-[background-color,border-color,box-shadow] focus-visible:border-ring focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-ring/20 disabled:opacity-50 md:text-sm pointer-coarse:text-base"
        data-slot="select"
        {...props}
      />
      <HugeiconsIcon
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        icon={ChevronDownIcon}
      />
    </div>
  )
}

export { Select }
