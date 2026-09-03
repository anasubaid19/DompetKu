import { createFileRoute, redirect } from "@tanstack/react-router"
import { AuthForm } from "@/components/auth-form"
import { getSession } from "@/lib/auth.functions"

export const Route = createFileRoute("/register")({
  beforeLoad: async () => {
    if (await getSession()) throw redirect({ to: "/app" })
  },
  component: () => <AuthForm mode="register" />,
})
