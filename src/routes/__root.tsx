import { createRootRoute, HeadContent, Link, Scripts } from "@tanstack/react-router"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { PwaRegister } from "@/components/pwa-register"
import { Button } from "@/components/ui/button"
import appCss from "../styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "DompetKu: Catatan keuangan pribadi" },
      {
        name: "description",
        content: "Kelola dompet, transaksi, anggaran, tabungan, dan hutang dalam satu aplikasi.",
      },
      { name: "theme-color", content: "#f6f5f8" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "DompetKu" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icons/icon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
    ],
  }),
  notFoundComponent: () => (
    <main className="grid min-h-svh place-items-center p-6 text-center">
      <div>
        <p className="text-caption">404</p>
        <h1 className="text-title mt-2">Halaman tidak ditemukan</h1>
      </div>
    </main>
  ),
  pendingMs: 200,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
  shellComponent: RootDocument,
})

function RoutePending() {
  return (
    <main className="grid min-h-svh place-items-center p-6">
      <p className="text-sm text-muted-foreground" role="status">
        Memuat…
      </p>
    </main>
  )
}

function RouteError({ error, reset }: { error: unknown; reset: () => void }) {
  return (
    <main className="grid min-h-svh place-items-center p-6 text-center">
      <div className="grid max-w-sm justify-items-center gap-3">
        <h1 className="text-subtitle">Halaman gagal dimuat</h1>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Terjadi kesalahan."} Coba muat ulang halaman
          ini.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => reset()}>Coba lagi</Button>
          <Button render={<Link search={{ redirect: "/app" }} to="/login" />} variant="outline">
            Masuk ulang
          </Button>
        </div>
      </div>
    </main>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <PwaRegister />
          <Toaster closeButton position="top-center" richColors />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
