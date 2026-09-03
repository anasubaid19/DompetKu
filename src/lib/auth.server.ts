import { getRequestHeaders } from "@tanstack/react-start/server"
import { auth } from "@/lib/auth"

export function currentSession() {
  return auth.api.getSession({ headers: getRequestHeaders() })
}

export async function requireUser() {
  const session = await currentSession()
  if (!session) throw new Error("Unauthorized")
  return session.user
}
