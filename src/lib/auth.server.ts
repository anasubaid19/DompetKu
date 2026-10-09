import { getRequestHeaders } from "@tanstack/react-start/server"
import { betterAuth } from "better-auth"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { db } from "@/lib/db"

const developmentBaseURL = {
  allowedHosts: [
    "localhost:9026",
    "127.0.0.1:9026",
    "192.168.*.*:9026",
    "169.254.*.*:9026",
    "100.78.228.127:9026",
    "unas.tailab2d6c.ts.net:9026",
  ],
  fallback: "http://localhost:9026",
  protocol: "auto" as const,
}

export const auth = betterAuth({
  appName: "DompetKu",
  baseURL: process.env.BETTER_AUTH_URL ?? developmentBaseURL,
  database: db,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
  },
  advanced: {
    trustedProxyHeaders: false,
  },
  plugins: [tanstackStartCookies()],
})

await (await auth.$context).runMigrations()

export function currentSession() {
  if (process.env.NODE_ENV === "production" && !process.env.BETTER_AUTH_URL) {
    throw new Error("BETTER_AUTH_URL belum diatur di server produksi")
  }
  return auth.api.getSession({ headers: getRequestHeaders() })
}

export async function requireUser() {
  const session = await currentSession()
  if (!session) throw new Error("Unauthorized")
  return session.user
}
