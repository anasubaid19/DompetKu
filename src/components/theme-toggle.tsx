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
      {mounted && <HugeiconsIcon icon={resolvedTheme === "dark" ? Sun03Icon : Moon02Icon} />}
    </Button>
  )
}
