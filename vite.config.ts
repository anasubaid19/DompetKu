import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  resolve: { tsconfigPaths: true },
  server: { allowedHosts: ["unas.tailab2d6c.ts.net"] },
  plugins: [tailwindcss(), tanstackStart(), viteReact()],
})
