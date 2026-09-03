import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import appCss from "../styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "DompetKu — Keuangan pribadi, lebih tenang" },
      {
        name: "description",
        content: "Kelola dompet, transaksi, budget, tabungan, dan kewajiban dalam satu tempat.",
      },
      { name: "theme-color", content: "#f6f5f8" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  notFoundComponent: () => (
    <main className="grid min-h-svh place-items-center p-6 text-center">
      <div>
        <p className="text-caption">404</p>
        <h1 className="text-title mt-2">Halaman tidak ditemukan</h1>
      </div>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster closeButton position="top-center" richColors />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
