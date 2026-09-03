import { Wallet01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, useRouter } from "@tanstack/react-router"
import { type FormEvent, useState } from "react"
import { FormField } from "@/components/form-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setPending(true)
    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") ?? "").trim()
    const password = String(form.get("password") ?? "")
    const name = String(form.get("name") ?? "").trim()

    const result =
      mode === "register"
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password })

    if (result.error) {
      setError(
        mode === "login"
          ? "Email atau password salah."
          : "Akun tidak dapat dibuat. Periksa data lalu coba lagi.",
      )
      setPending(false)
      return
    }
    await router.navigate({ to: "/" })
  }

  return (
    <div className="relative grid min-h-svh place-items-center overflow-hidden px-4 py-10">
      <div aria-hidden className="surface-grid absolute inset-0 opacity-55" />
      <div
        aria-hidden
        className="absolute left-1/2 top-[-18rem] size-[34rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl"
      />
      <section className="relative w-full max-w-md rounded-4xl bg-card p-6 shadow-xl ring-1 ring-foreground/6 sm:p-8">
        <Link
          className="mb-8 inline-flex items-center gap-2.5"
          search={{ redirect: "/" }}
          to="/login"
        >
          <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <HugeiconsIcon icon={Wallet01Icon} className="size-5" />
          </span>
          <span className="font-semibold tracking-[-0.03em]">DompetKu</span>
        </Link>
        <h1 className="text-title">
          {mode === "register" ? "Mulai dengan tenang" : "Selamat datang kembali"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {mode === "register"
            ? "Buat ruang privat untuk semua catatan finansialmu."
            : "Masuk untuk melanjutkan mengelola keuanganmu."}
        </p>

        <form className="mt-7 grid gap-5" onSubmit={submit}>
          {mode === "register" && (
            <FormField label="Nama">
              <Input autoComplete="name" name="name" placeholder="Nama kamu" required />
            </FormField>
          )}
          <FormField label="Email">
            <Input
              autoComplete="email"
              name="email"
              placeholder="nama@email.com"
              required
              type="email"
            />
          </FormField>
          <FormField hint={mode === "register" ? "Minimal 8 karakter" : undefined} label="Password">
            <Input
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              minLength={8}
              name="password"
              required
              type="password"
            />
          </FormField>
          {error && (
            <p
              aria-live="polite"
              className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <Button disabled={pending} size="lg" type="submit">
            {pending ? "Memproses…" : mode === "register" ? "Buat akun" : "Masuk"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "register" ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
          {mode === "register" ? (
            <Link
              className="font-medium text-primary hover:underline"
              search={{ redirect: "/" }}
              to="/login"
            >
              Masuk
            </Link>
          ) : (
            <Link className="font-medium text-primary hover:underline" to="/register">
              Daftar
            </Link>
          )}
        </p>
      </section>
    </div>
  )
}
