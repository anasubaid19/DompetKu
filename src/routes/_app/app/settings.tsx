import {
  BookOpen01Icon,
  Download01Icon,
  PaintBrush01Icon,
  Settings01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { type ChangeEvent, type FormEvent, useState } from "react"
import { toast } from "sonner"
import { CategoryDialog } from "@/components/finance-dialogs"
import { CategoryIndicator } from "@/components/finance-visuals"
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
  type Category,
  getFinanceData,
  importFinanceData,
  type RestoreSummary,
  resetFinanceData,
  updateSettings,
} from "@/lib/finance.functions"
import { isSeedCategory } from "@/lib/finance-options"
import { cn, today, transactionsToCsv } from "@/lib/utils"

export const Route = createFileRoute("/_app/app/settings")({
  loader: () => getFinanceData(),
  component: SettingsPage,
})

function SettingsPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [lastRestore, setLastRestore] = useState<RestoreSummary | null>(null)

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

  function exportTransactions() {
    const blob = new Blob(["\uFEFF", transactionsToCsv(data.transactions)], {
      type: "text/csv;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `dompetku-transaksi-${today()}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success("CSV transaksi diunduh")
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      const summary = await importFinanceData({ data: { json: await file.text() } })
      await router.invalidate()
      setLastRestore(summary)
      toast.success("Backup berhasil dipulihkan")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Backup gagal dipulihkan")
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        action={
          <Button render={<Link to="/help" />} variant="outline">
            <HugeiconsIcon icon={BookOpen01Icon} /> Tutorial & FAQ
          </Button>
        }
        description="Atur mata uang, tanggal siklus, kategori, dan backup data."
        eyebrow="Preferensi akun"
        title="Pengaturan"
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
                <span className="grid size-9 shrink-0 place-items-center pointer-coarse:size-11">
                  <input
                    className="size-5 accent-primary"
                    defaultChecked={Boolean(data.settings.hide_balance)}
                    name="hideBalance"
                    type="checkbox"
                  />
                </span>
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
          <CardContent className="grid grid-cols-1 gap-4">
            <div className="min-w-0">
              <p className="text-caption mb-2 uppercase tracking-wider">Pengeluaran</p>
              <CategoryBadges items={data.categories.filter((item) => item.type === "expense")} />
            </div>
            <div className="min-w-0">
              <p className="text-caption mb-2 uppercase tracking-wider">Pemasukan</p>
              <CategoryBadges items={data.categories.filter((item) => item.type === "income")} />
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
            <Button className="sm:col-span-2" onClick={exportTransactions} variant="outline">
              <HugeiconsIcon icon={Download01Icon} /> Export CSV transaksi
            </Button>
            <p className="text-caption sm:col-span-2">
              JSON untuk backup lengkap. CSV untuk membaca transaksi di aplikasi spreadsheet. Import
              JSON mengganti seluruh data finansial setelah file berhasil divalidasi.
            </p>
            {lastRestore && <RestoreSummaryView summary={lastRestore} />}
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

function CategoryBadges({ items }: { items: Category[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span className="inline-flex min-w-0 max-w-full items-center gap-1" key={item.id}>
          <Badge className="min-w-0 max-w-full gap-1.5">
            <CategoryIndicator category={item} />
            <span className="min-w-0 truncate">{item.name}</span>
          </Badge>
          {!isSeedCategory(item.name, item.type) && <CategoryDialog category={item} />}
        </span>
      ))}
    </div>
  )
}

function RestoreSummaryView({ summary }: { summary: RestoreSummary }) {
  const labels: Record<string, string> = {
    wallets: "Dompet",
    categories: "Kategori",
    transactions: "Transaksi",
    debts: "Hutang & piutang",
    budgets: "Anggaran",
    savings: "Tabungan",
    subscriptions: "Langganan",
  }
  const skipped = summary.skipped.transactions
  return (
    <div className="grid gap-2 rounded-2xl bg-secondary/55 p-4 sm:col-span-2">
      <p className="text-label">Hasil pemulihan terakhir</p>
      <ul className="grid gap-1 text-sm tabular-nums">
        {Object.entries(labels).map(([key, label]) => (
          <li className="flex items-center justify-between gap-3" key={key}>
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{summary.imported[key] ?? 0} dipulihkan</span>
          </li>
        ))}
      </ul>
      <p className="text-caption">
        {skipped > 0
          ? `${skipped} transaksi dilewati karena dompet tidak dikenal atau jenis tidak valid.`
          : "Tidak ada baris yang dilewati."}
      </p>
    </div>
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
            Dompet, transaksi, anggaran, tabungan, hutang/piutang, dan langganan akan dihapus
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
