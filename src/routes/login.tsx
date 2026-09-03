import { createFileRoute, redirect } from "@tanstack/react-router"
import { AuthForm } from "@/components/auth-form"
import { getSession } from "@/lib/auth.functions"

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/app",
  }),
  beforeLoad: async () => {
    if (await getSession()) throw redirect({ to: "/app" })
  },
  component: () => <AuthForm mode="login" />,
})
