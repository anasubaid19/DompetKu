import type * as React from "react"
import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-3xl bg-card shadow-sm ring-1 ring-foreground/6 dark:ring-foreground/10",
        className,
      )}
      data-slot="card"
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex items-start justify-between gap-4 p-5 pb-0", className)} {...props} />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-subtitle", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={cn("mt-1 text-sm leading-relaxed text-muted-foreground", className)} {...props} />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-5", className)} {...props} />
}

export { Card, CardContent, CardDescription, CardHeader, CardTitle }
