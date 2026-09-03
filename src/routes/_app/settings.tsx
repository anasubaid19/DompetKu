import {
  Add01Icon,
  Download01Icon,
  PaintBrush01Icon,
  Settings01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { type ChangeEvent, type FormEvent, useState } from "react"
import { toast } from "sonner"
import { CategoryIndicator, categoryIcons } from "@/components/finance-visuals"
import { FormField } from "@/components/form-field"
import { PageHeader } from "@/components/page-header"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  createCategory,
  getFinanceData,
  importFinanceData,
  resetFinanceData,
  updateSettings,
} from "@/lib/finance.functions"
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/finance-options"
import { cn, today } from "@/lib/utils"

export const Route = createFileRoute("/_app/settings")({
  loader: () => getFinanceData(),
  component: SettingsPage,
})

function SettingsPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    const form = new FormData(event.currentTarget)
    try {
      await updateSettings({
        data: {
          currency: String(form.get("currency")),
          cycle_start: Number(form.get("cycleStart")),
          cycle_length: Number(form.get("cycleLength")),
          hide_balance: form.get("hideBalance") === "on" ? 1 : 0,
        },
      })
      await router.invalidate()
      toast.success("Pengaturan disimpan")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Pengaturan gagal disimpan")
    } finally {
      setPending(false)
    }
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `dompetku-backup-${today()}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success("Backup JSON diunduh")
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      await importFinanceData({ data: { json: await file.text() } })
      await router.invalidate()
      toast.success("Backup berhasil dipulihkan")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Backup gagal dipulihkan")
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        description="Sesuaikan tampilan, periode laporan, dan kendali data."
        eyebrow="Preferensi akun"
        title="Pengaturan"
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Tampilan & privasi</CardTitle>
              <CardDescription>Preferensi finansial berlaku pada akunmu.</CardDescription>
            </div>
            <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <HugeiconsIcon icon={PaintBrush01Icon} />
            </span>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-5">
            <form className="grid gap-3 sm:gap-5" onSubmit={save}>
              <div className="flex items-center justify-between rounded-2xl bg-secondary/55 px-3 py-2 sm:p-3">
                <div>
                  <p className="text-sm font-medium">Tema aplikasi</p>
                  <p className="text-caption mt-0.5">Tema terang atau gelap di perangkat ini</p>
                </div>
                <ThemeToggle />
              </div>
              <label className="flex items-center justify-between gap-4 rounded-2xl bg-secondary/55 px-3 py-2 sm:p-3">
                <span>
                  <span className="block text-sm font-medium">Sembunyikan saldo</span>
                  <span className="text-caption mt-0.5 block">
                    Sembunyikan nominal di seluruh aplikasi.
                  </span>
                </span>
                <input
                  className="size-5 accent-primary"
                  defaultChecked={Boolean(data.settings.hide_balance)}
                  name="hideBalance"
                  type="checkbox"
                />
              </label>
              <FormField label="Mata uang">
                <Select defaultValue={data.settings.currency} name="currency">
                  <option value="IDR">Rupiah (IDR)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="MYR">Ringgit (MYR)</option>
                  <option value="JPY">Yen (JPY)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">Pound (GBP)</option>
                  <option value="SAR">Riyal (SAR)</option>
                </Select>
              </FormField>
              <FormField hint="Gunakan tanggal 1–28" label="Tanggal mulai siklus">
                <Input
                  defaultValue={data.settings.cycle_start}
                  max="28"
                  min="1"
                  name="cycleStart"
                  required
                  type="number"
                />
              </FormField>
              <FormField label="Rentang laporan">
                <Select defaultValue={data.settings.cycle_length} name="cycleLength">
                  <option value="1">1 bulan</option>
                  <option value="3">3 bulan</option>
                  <option value="6">6 bulan</option>
                </Select>
              </FormField>
              <Button disabled={pending} type="submit">
                {pending ? "Menyimpan…" : "Simpan pengaturan"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Kategori kustom</CardTitle>
              <CardDescription>Kategori bawaan dan milikmu sendiri.</CardDescription>
            </div>
            <CategoryDialog />
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <p className="text-caption mb-2 uppercase tracking-wider">Pengeluaran</p>
              <div className="flex flex-wrap gap-2">
                {data.categories
                  .filter((item) => item.type === "expense")
                  .map((item) => (
                    <Badge className="gap-1.5" key={item.id}>
                      <CategoryIndicator category={item} />
                      {item.name}
                    </Badge>
                  ))}
              </div>
            </div>
            <div>
              <p className="text-caption mb-2 uppercase tracking-wider">Pemasukan</p>
              <div className="flex flex-wrap gap-2">
                {data.categories
                  .filter((item) => item.type === "income")
                  .map((item) => (
                    <Badge className="gap-1.5" key={item.id}>
                      <CategoryIndicator category={item} />
                      {item.name}
                    </Badge>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Backup & restore</CardTitle>
              <CardDescription>JSON mencakup seluruh data finansial akunmu.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button onClick={exportBackup} variant="outline">
              <HugeiconsIcon icon={Download01Icon} /> Export JSON
            </Button>
            <label
              className={cn(
                buttonVariants({ variant: "outline" }),
                "relative focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
              )}
            >
              <HugeiconsIcon className="size-4" icon={Upload01Icon} /> Import JSON
              <input
                accept="application/json,.json"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={importBackup}
                type="file"
              />
            </label>
            <p className="text-caption sm:col-span-2">
              Import mengganti seluruh data finansial saat ini setelah file berhasil divalidasi.
            </p>
          </CardContent>
        </Card>

        <Card className="ring-destructive/20">
          <CardHeader>
            <div>
              <CardTitle>Zona berbahaya</CardTitle>
              <CardDescription>
                Operasi ini tidak dapat dibatalkan tanpa file backup.
              </CardDescription>
            </div>
            <HugeiconsIcon className="size-5 text-destructive" icon={Settings01Icon} />
          </CardHeader>
          <CardContent>
            <ResetDialog />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CategoryDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [color, setColor] = useState("violet")
  const [icon, setIcon] = useState("receipt")
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    const form = new FormData(event.currentTarget)
    try {
      await createCategory({
        data: {
          name: String(form.get("name")),
          type: form.get("type") === "income" ? "income" : "expense",
          color,
          icon,
        },
      })
      setOpen(false)
      await router.invalidate()
      toast.success("Kategori ditambahkan")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kategori gagal ditambahkan")
    } finally {
      setPending(false)
    }
  }
  return (
    <Dialog
      onOpenChange={(value) => {
        setOpen(value)
        if (value) {
          setColor("violet")
          setIcon("receipt")
        }
      }}
      open={open}
    >
      <DialogTrigger render={<Button aria-label="Tambah kategori" size="icon" variant="outline" />}>
        <HugeiconsIcon icon={Add01Icon} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kategori baru</DialogTitle>
          <DialogDescription>
            Gunakan nama singkat yang mudah ditemukan saat mencatat transaksi.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-5" id="category-form" onSubmit={submit}>
          <FormField label="Nama kategori">
            <Input name="name" required />
          </FormField>
          <FormField label="Jenis">
            <Select name="type">
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </Select>
          </FormField>
          <fieldset className="grid gap-2">
            <legend className="text-label">Warna aksen</legend>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((option) => (
                <button
                  aria-label={option.label}
                  aria-pressed={color === option.value}
                  className={cn(
                    "grid size-11 place-items-center rounded-xl border transition-[border-color,box-shadow] focus-visible:ring-3 focus-visible:ring-ring/20",
                    color === option.value ? "border-ring ring-2 ring-ring/20" : "border-border",
                  )}
                  key={option.value}
                  onClick={() => setColor(option.value)}
                  title={option.label}
                  type="button"
                >
                  <span className={cn("size-3 rounded-full", option.className)} />
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="grid gap-2">
            <legend className="text-label">Icon</legend>
            <div className="grid grid-cols-6 gap-2">
              {CATEGORY_ICONS.map((option) => (
                <button
                  aria-label={option.label}
                  aria-pressed={icon === option.value}
                  className={cn(
                    "grid size-11 place-items-center rounded-xl border text-muted-foreground transition-[border-color,color,box-shadow] focus-visible:ring-3 focus-visible:ring-ring/20",
                    icon === option.value
                      ? "border-ring bg-primary/10 text-primary ring-2 ring-ring/20"
                      : "border-border hover:bg-secondary",
                  )}
                  key={option.value}
                  onClick={() => setIcon(option.value)}
                  title={option.label}
                  type="button"
                >
                  <HugeiconsIcon className="size-5" icon={categoryIcons[option.value]} />
                </button>
              ))}
            </div>
          </fieldset>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Batal</DialogClose>
          <Button disabled={pending} form="category-form" type="submit">
            {pending ? "Menambahkan…" : "Tambah"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ResetDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  async function reset() {
    try {
      await resetFinanceData()
      setOpen(false)
      await router.invalidate()
      toast.success("Data finansial telah direset")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reset gagal")
    }
  }
  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button variant="destructive" />}>
        Reset semua data finansial
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset semua data?</DialogTitle>
          <DialogDescription>
            Dompet, transaksi, budget, tabungan, hutang/piutang, dan langganan akan dihapus
            permanen. Akunmu tetap aktif.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Batal</DialogClose>
          <Button onClick={reset} variant="destructive">
            Hapus semua data finansial
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
