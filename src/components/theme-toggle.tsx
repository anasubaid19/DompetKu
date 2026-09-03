import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <Button
      aria-label={
        mounted
          ? resolvedTheme === "dark"
            ? "Gunakan tema terang"
            : "Gunakan tema gelap"
          : "Ganti tema"
      }
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      size="icon"
      variant="ghost"
    >
      {mounted && (
        <span aria-hidden className="relative size-4">
          <HugeiconsIcon
            className={`absolute inset-0 transition-[opacity,scale,filter] duration-normal ease-[cubic-bezier(0.2,0,0,1)] ${
              resolvedTheme === "dark"
                ? "scale-100 opacity-100 blur-0"
                : "scale-25 opacity-0 blur-[4px]"
            }`}
            icon={Sun03Icon}
          />
          <HugeiconsIcon
            className={`absolute inset-0 transition-[opacity,scale,filter] duration-normal ease-[cubic-bezier(0.2,0,0,1)] ${
              resolvedTheme === "dark"
                ? "scale-25 opacity-0 blur-[4px]"
                : "scale-100 opacity-100 blur-0"
            }`}
            icon={Moon02Icon}
          />
        </span>
      )}
    </Button>
  )
}
