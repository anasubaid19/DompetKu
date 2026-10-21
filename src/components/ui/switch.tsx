import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "@/lib/utils"

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center justify-start rounded-full bg-input p-0.5 outline-none ring-1 ring-inset ring-foreground/8 transition-colors duration-fast before:absolute before:-inset-y-2.5 before:inset-x-0 before:content-[''] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[checked]:justify-end data-[checked]:bg-primary data-[checked]:ring-primary disabled:opacity-50",
        className,
      )}
      data-slot="switch"
      {...props}
    >
      <SwitchPrimitive.Thumb className="size-5 rounded-full bg-card shadow-sm transition-[background-color] duration-fast" />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
