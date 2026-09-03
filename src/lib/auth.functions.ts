import { createServerFn } from "@tanstack/react-start"
import { currentSession } from "@/lib/auth.server"

export const getSession = createServerFn({ method: "GET" }).handler(() => currentSession())
