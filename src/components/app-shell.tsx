import {
  Chart03Icon,
  Home01Icon,
  Logout01Icon,
  Settings01Icon,
  Target01Icon,
  TransactionHistoryIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

const navigation = [
  { to: "/app", label: "Ringkasan", icon: Home01Icon },
  { to: "/app/transactions", label: "Transaksi", icon: TransactionHistoryIcon },
  { to: "/app/planning", label: "Rencana", icon: Target01Icon },
  { to: "/app/reports", label: "Laporan", icon: Chart03Icon },
  { to: "/app/settings", label: "Pengaturan", icon: Settings01Icon },
] as const

export function AppShell({
  user,
  children,
}: {
  user: { name: string; email: string }
  children: React.ReactNode
}) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function signOut() {
    setSigningOut(true)
    await authClient.signOut()
    await router.navigate({ to: "/login", search: { redirect: "/app" } })
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <a
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform focus:translate-y-0"
        href="#main-content"
      >
        Lewati ke konten utama
      </a>
      <aside className="translucent fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-sidebar/88 px-3 py-4 backdrop-blur-xl lg:flex">
        <Link className="mb-7 flex items-center gap-3 px-2" to="/app">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <HugeiconsIcon icon={Wallet01Icon} className="size-5" />
          </span>
          <span>
            <strong className="block text-base tracking-[-0.03em]">DompetKu</strong>
            <span className="text-caption">Ruang finansialmu</span>
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="grid gap-1">
          {navigation.map((item) => (
            <Link
              activeOptions={item.to === "/app" ? { exact: true } : undefined}
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
              className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
              key={item.to}
              to={item.to}
            >
              <HugeiconsIcon icon={item.icon} className="size-[18px]" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl bg-card p-3 ring-1 ring-foreground/6">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button
              aria-label="Keluar"
              disabled={signingOut}
              onClick={signOut}
              size="icon"
              variant="ghost"
            >
              <HugeiconsIcon icon={Logout01Icon} />
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="translucent sticky top-0 z-30 h-16 border-b bg-background/82 px-4 backdrop-blur-xl sm:px-6 lg:px-9">
          <div className="mx-auto flex h-full w-full max-w-[1200px] items-center justify-between">
            <Link
              className="flex items-center gap-2 font-semibold tracking-[-0.03em] lg:hidden"
              to="/app"
            >
              <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
                <HugeiconsIcon icon={Wallet01Icon} className="size-4" />
              </span>
              DompetKu
            </Link>
            <p className="hidden text-sm text-muted-foreground lg:block">
              Keuangan pribadi, lebih tenang.
            </p>
            <ThemeToggle />
          </div>
        </header>

        <main
          className="mx-auto min-h-[calc(100svh-4rem)] max-w-[1200px] px-4 pb-28 pt-6 sm:px-6 lg:px-9 lg:pb-10"
          id="main-content"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      <nav
        aria-label="Navigasi seluler"
        className="translucent fixed inset-x-4 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-40 grid grid-cols-5 rounded-2xl bg-card/88 p-1 shadow-lg ring-1 ring-foreground/8 backdrop-blur-xl lg:hidden"
      >
        {navigation.map((item) => (
          <Link
            activeOptions={item.to === "/app" ? { exact: true } : undefined}
            activeProps={{ className: "bg-primary/10 text-primary" }}
            className="relative flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-medium text-muted-foreground"
            key={item.to}
            to={item.to}
          >
            <HugeiconsIcon icon={item.icon} className="size-[18px]" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
