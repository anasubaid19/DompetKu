import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { AppShell } from "@/components/app-shell"
import { AppSkeleton } from "@/components/app-skeleton"
import { getSession } from "@/lib/auth.functions"
import { getDueCount } from "@/lib/finance.functions"

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: "/login", search: { redirect: location.href } })
    }
    const dueCount = await getDueCount()
    return { user: session.user, dueCount }
  },
  pendingComponent: AppSkeleton,
  component: ProtectedLayout,
})

function ProtectedLayout() {
  const { user, dueCount } = Route.useRouteContext()
  return (
    <AppShell dueCount={dueCount} user={user}>
      <Outlet />
    </AppShell>
  )
}
