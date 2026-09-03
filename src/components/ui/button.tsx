import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border text-sm font-medium outline-none transition-[background-color,border-color,color,box-shadow,transform] duration-fast active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 pointer-coarse:min-h-11 pointer-coarse:min-w-11 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/75",
        outline: "border-border bg-card text-foreground shadow-sm hover:bg-accent",
        ghost: "border-transparent text-foreground hover:bg-accent",
        destructive: "border-destructive bg-destructive text-white hover:bg-destructive/90",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 px-5 text-base",
        icon: "size-9 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
)

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { render?: React.ReactElement }

function Button({ className, render, size, type = "button", variant, ...props }: ButtonProps) {
  return useRender({
    defaultTagName: "button",
    render,
    props: {
      ...props,
      type,
      "data-slot": "button",
      className: cn(buttonVariants({ className, size, variant })),
    },
  })
}

export { Button, buttonVariants }
