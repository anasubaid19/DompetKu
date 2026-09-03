import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { cn } from "@/lib/utils"

function Progress({ className, value = 0, ...props }: ProgressPrimitive.Root.Props) {
  return (
    <ProgressPrimitive.Root
      className={cn("h-2 overflow-hidden rounded-full bg-secondary", className)}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-primary transition-transform duration-slow ease-entrance"
        style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value ?? 0))}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
