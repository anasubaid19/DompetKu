import { Wallet01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

export function PublicHeader() {
  return (
    <header className="translucent sticky top-0 z-50 border-b bg-background/82 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-9">
        <Link className="flex items-center gap-2.5" to="/">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <HugeiconsIcon className="size-[18px]" icon={Wallet01Icon} />
          </span>
          <span className="font-semibold tracking-[-0.03em]">DompetKu</span>
        </Link>
        <nav aria-label="Navigasi publik" className="hidden items-center gap-7 text-sm md:flex">
          <a
            className="text-muted-foreground transition-colors duration-fast hover:text-foreground"
            href="/#fitur"
          >
            Fitur
          </a>
          <a
            className="text-muted-foreground transition-colors duration-fast hover:text-foreground"
            href="/#cara-kerja"
          >
            Cara kerja
          </a>
          <Link
            className="text-muted-foreground transition-colors duration-fast hover:text-foreground"
            to="/help"
          >
            Tutorial
          </Link>
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <Button
            className="hidden sm:inline-flex"
            render={<Link search={{ redirect: "/app" }} to="/login" />}
            variant="ghost"
          >
            Masuk
          </Button>
          <Button render={<Link to="/register" />} size="sm">
            Mulai gratis
          </Button>
        </div>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-9">
        <p>DompetKu. Keuangan pribadi, lebih tenang.</p>
        <div className="flex gap-5">
          <Link className="transition-colors duration-fast hover:text-foreground" to="/help">
            Tutorial & FAQ
          </Link>
          <Link
            className="transition-colors duration-fast hover:text-foreground"
            search={{ redirect: "/app" }}
            to="/login"
          >
            Masuk
          </Link>
        </div>
      </div>
    </footer>
  )
}
