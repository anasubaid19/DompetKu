import { betterAuth } from "better-auth"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { db } from "@/lib/db"

const developmentBaseURL = {
  allowedHosts: [
    "localhost:3001",
    "127.0.0.1:3001",
    "192.168.*.*:3001",
    "169.254.*.*:3001",
    "100.78.228.127:3001",
    "unas.tailab2d6c.ts.net:3001",
  ],
  fallback: "http://localhost:3001",
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
