import { Add01Icon, Delete02Icon, Edit02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "@tanstack/react-router"
import { type FormEvent, useId, useRef, useState } from "react"
import { toast } from "sonner"
import {
  CategorySelect,
  categoryIcons,
  InstitutionSelect,
  WalletSelect,
} from "@/components/finance-visuals"
import { FormField } from "@/components/form-field"
import { Button } from "@/components/ui/button"
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
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Select } from "@/components/ui/select"
import {
  type Category,
  createCategory,
  createTransaction,
  createWallet,
  deleteWallet,
  type FinanceTransaction,
  updateTransaction,
  updateWallet,
  type Wallet,
} from "@/lib/finance.functions"
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/finance-options"
import { cn, dateKey, formatNumberInput, parseNumberInput, today } from "@/lib/utils"

export function WalletDialog({ wallet }: { wallet?: Wallet } = {}) {
  const router = useRouter()
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) setConfirmingDelete(false)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    const form = new FormData(event.currentTarget)
    try {
      const name = String(form.get("name"))
      const icon = String(form.get("icon"))
      if (wallet) await updateWallet({ data: { id: wallet.id, name, icon } })
      else {
        await createWallet({
          data: {
            name,
            icon,
            type: form.get("type") === "saving" ? "saving" : "daily",
            balance: Number(form.get("balance")),
          },
        })
      }
      toast.success(wallet ? "Dompet diperbarui" : "Dompet dibuat")
      setOpen(false)
      await router.invalidate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dompet gagal disimpan")
    } finally {
      setPending(false)
    }
  }

  async function remove() {
    if (!wallet) return
    setPending(true)
    try {
      await deleteWallet({ data: { id: wallet.id } })
      changeOpen(false)
      await router.invalidate()
      toast.success("Dompet dihapus")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dompet gagal dihapus")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog onOpenChange={changeOpen} open={open}>
      <DialogTrigger
        render={
          <Button
            aria-label={wallet ? `Edit ${wallet.name}` : undefined}
            size={wallet ? "icon" : "default"}
            variant={wallet ? "ghost" : "outline"}
          />
        }
      >
        <HugeiconsIcon icon={wallet ? Edit02Icon : Add01Icon} /> {!wallet && "Tambah dompet"}
      </DialogTrigger>
      <DialogContent>
        {confirmingDelete && wallet ? (
          <>
            <DialogHeader>
              <DialogTitle>Hapus dompet?</DialogTitle>
              <DialogDescription>
                Dompet {wallet.name} akan dihapus permanen. Dompet yang masih memiliki transaksi
                tidak dapat dihapus.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                autoFocus
                disabled={pending}
                onClick={() => setConfirmingDelete(false)}
                variant="ghost"
              >
                Kembali
              </Button>
              <Button disabled={pending} onClick={remove} variant="destructive">
                <HugeiconsIcon icon={Delete02Icon} />
                {pending ? "Menghapus…" : "Hapus dompet"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{wallet ? "Edit dompet" : "Dompet baru"}</DialogTitle>
              <DialogDescription>
                {wallet
                  ? "Perbarui nama dan logo tanpa mengubah saldo atau jenis dompet."
                  : "Tambahkan rekening, uang tunai, atau dompet khusus tabungan."}
              </DialogDescription>
            </DialogHeader>
            <form className="grid gap-5" id={formId} onSubmit={submit}>
              <FormField label="Nama dompet">
                <Input
                  autoFocus
                  defaultValue={wallet?.name}
                  maxLength={60}
                  name="name"
                  placeholder="Contoh: BCA Utama"
                  required
                />
              </FormField>
              <FormField hint="Opsional" label="Bank atau e-wallet">
                <InstitutionSelect defaultValue={wallet?.icon} />
              </FormField>
              {!wallet && (
                <>
                  <FormField label="Jenis">
                    <Select defaultValue="daily" name="type">
                      <option value="daily">Dompet harian</option>
                      <option value="saving">Dompet tabungan</option>
                    </Select>
                  </FormField>
                  <FormField hint="Tidak boleh negatif" label="Saldo awal">
                    <Input
                      defaultValue="0"
                      inputMode="numeric"
                      min="0"
                      name="balance"
                      required
                      type="number"
                    />
                  </FormField>
                </>
              )}
            </form>
            <DialogFooter className={wallet ? "sm:justify-between" : undefined}>
              {wallet && (
                <Button
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={pending}
                  onClick={() => setConfirmingDelete(true)}
                  variant="ghost"
                >
                  <HugeiconsIcon icon={Delete02Icon} />
                  Hapus dompet
                </Button>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <DialogClose render={<Button variant="ghost" />}>Batal</DialogClose>
                <Button disabled={pending} form={formId} type="submit">
                  {pending ? "Menyimpan…" : wallet ? "Simpan perubahan" : "Simpan dompet"}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function CategoryDialog({ type }: { type?: "expense" | "income" } = {}) {
  const router = useRouter()
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [color, setColor] = useState("violet")
  const [icon, setIcon] = useState("receipt")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    event.stopPropagation()
    setPending(true)
    const form = new FormData(event.currentTarget)
    try {
      await createCategory({
        data: {
          name: String(form.get("name")),
          type: type ?? (form.get("type") === "income" ? "income" : "expense"),
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
      <DialogTrigger
        render={
          <Button
            aria-label={
              type
                ? `Tambah kategori ${type === "income" ? "pemasukan" : "pengeluaran"}`
                : "Tambah kategori"
            }
            size="icon"
            variant="outline"
          />
        }
      >
        <HugeiconsIcon icon={Add01Icon} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kategori baru</DialogTitle>
          <DialogDescription>
            Gunakan nama singkat yang mudah ditemukan saat mencatat transaksi.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-5" id={formId} onSubmit={submit}>
          <FormField label="Nama kategori">
            <Input autoFocus maxLength={50} name="name" required />
          </FormField>
          {!type && (
            <FormField label="Jenis">
              <Select name="type">
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
              </Select>
            </FormField>
          )}
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
          <Button disabled={pending} form={formId} type="submit">
            {pending ? "Menambahkan…" : "Tambah"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TransactionDialog({
  wallets,
  categories,
  recentTransactions = [],
  transaction,
}: {
  wallets: Wallet[]
  categories: Category[]
  recentTransactions?: FinanceTransaction[]
  transaction?: FinanceTransaction
}) {
  const router = useRouter()
  const formId = useId()
  const categoryFieldId = useId()
  const amountRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [type, setType] = useState<"expense" | "income" | "transfer">(
    transaction?.type ?? "expense",
  )

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    const form = new FormData(event.currentTarget)
    try {
      const data = {
        type,
        amount: parseNumberInput(form.get("amount")),
        fee: parseNumberInput(form.get("fee")),
        walletId: String(form.get("walletId")),
        targetWalletId: String(form.get("targetWalletId") ?? ""),
        categoryId: String(form.get("categoryId") ?? ""),
        description: String(form.get("description") ?? ""),
        date: String(form.get("date")),
      }
      if (transaction) await updateTransaction({ data: { ...data, id: transaction.id } })
      else await createTransaction({ data })
      toast.success(transaction ? "Transaksi diperbarui" : "Transaksi dicatat")
      setOpen(false)
      await router.invalidate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transaksi gagal disimpan")
    } finally {
      setPending(false)
    }
  }

  const validCategories = categories.filter((category) => category.type === type)
  const recentForType = recentTransactions.filter((item) => item.type === type)
  const quickAmounts = [
    ...new Set(recentForType.map((item) => item.amount)),
    50_000,
    100_000,
    250_000,
  ].slice(0, 3)
  const quickNotes = [
    ...new Set(recentForType.map((item) => item.description.trim()).filter(Boolean)),
  ].slice(0, 3)

  function setYesterday() {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (dateRef.current) dateRef.current.value = dateKey(yesterday)
  }

  return (
    <Dialog
      onOpenChange={(value) => {
        setOpen(value)
        if (value) setType(transaction?.type ?? "expense")
      }}
      open={open}
    >
      <DialogTrigger
        render={
          <Button
            aria-label={transaction ? "Edit transaksi" : undefined}
            disabled={wallets.length === 0}
            size={transaction ? "icon" : "default"}
            variant={transaction ? "ghost" : "default"}
          />
        }
      >
        <HugeiconsIcon icon={transaction ? Edit02Icon : Add01Icon} />
        {!transaction && "Catat transaksi"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transaction ? "Edit transaksi" : "Catat transaksi"}</DialogTitle>
          <DialogDescription>
            Saldo dompet akan diperbarui langsung setelah transaksi tersimpan.
          </DialogDescription>
        </DialogHeader>
        <SegmentedControl
          ariaLabel="Jenis transaksi"
          className="grid grid-cols-3"
          itemClassName="w-full px-2"
          onChange={setType}
          options={[
            { label: "Pengeluaran", value: "expense" },
            { label: "Pemasukan", value: "income" },
            { label: "Transfer", value: "transfer" },
          ]}
          value={type}
        />
        <form className="grid gap-5" id={formId} onSubmit={submit}>
          <div className="grid gap-2">
            <FormField label="Nominal">
              <Input
                defaultValue={formatNumberInput(transaction?.amount)}
                inputMode="numeric"
                name="amount"
                onInput={(event) => {
                  event.currentTarget.value = formatNumberInput(event.currentTarget.value)
                }}
                pattern="[0-9.]*"
                placeholder="0"
                ref={amountRef}
                required
              />
            </FormField>
            {!transaction && (
              <fieldset className="flex flex-wrap gap-2 border-0 p-0">
                <legend className="sr-only">Nominal cepat</legend>
                {quickAmounts.map((amount) => (
                  <Button
                    className="h-9 tabular-nums"
                    key={amount}
                    onClick={() => {
                      if (amountRef.current) amountRef.current.value = formatNumberInput(amount)
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {formatNumberInput(amount)}
                  </Button>
                ))}
              </fieldset>
            )}
          </div>
          <FormField label={type === "income" ? "Dompet tujuan" : "Dompet sumber"}>
            <WalletSelect
              defaultValue={transaction?.wallet_id}
              name="walletId"
              required
              wallets={wallets}
            />
          </FormField>
          {type === "transfer" ? (
            <>
              <FormField label="Dompet tujuan">
                <WalletSelect
                  defaultValue={transaction?.target_wallet_id ?? ""}
                  name="targetWalletId"
                  required
                  wallets={wallets}
                />
              </FormField>
              <FormField label="Biaya admin">
                <Input
                  defaultValue={formatNumberInput(transaction?.fee ?? 0)}
                  inputMode="numeric"
                  name="fee"
                  onInput={(event) => {
                    event.currentTarget.value = formatNumberInput(event.currentTarget.value)
                  }}
                  pattern="[0-9.]*"
                />
              </FormField>
            </>
          ) : (
            <div className="grid gap-2">
              <label className="text-label" htmlFor={categoryFieldId}>
                Kategori
              </label>
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <CategorySelect
                    categories={validCategories}
                    defaultValue={transaction?.category_id}
                    id={categoryFieldId}
                    key={type}
                    name="categoryId"
                    required
                  />
                </div>
                <CategoryDialog type={type} />
              </div>
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <FormField label="Tanggal">
                <Input
                  defaultValue={transaction?.transaction_date ?? today()}
                  name="date"
                  ref={dateRef}
                  required
                  type="date"
                />
              </FormField>
              {!transaction && (
                <Button
                  className="h-9 justify-self-start"
                  onClick={setYesterday}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Kemarin
                </Button>
              )}
            </div>
            <div className="grid gap-2">
              <FormField label="Catatan">
                <Input
                  defaultValue={transaction?.description}
                  maxLength={240}
                  name="description"
                  placeholder="Opsional"
                  ref={descriptionRef}
                />
              </FormField>
              {!transaction && quickNotes.length > 0 && (
                <fieldset className="flex flex-wrap gap-2 border-0 p-0">
                  <legend className="sr-only">Catatan terakhir</legend>
                  {quickNotes.map((note) => (
                    <Button
                      className="h-auto min-h-9 max-w-full whitespace-normal py-2 text-left"
                      key={note}
                      onClick={() => {
                        if (descriptionRef.current) descriptionRef.current.value = note
                      }}
                      size="sm"
                      title={note}
                      type="button"
                      variant="outline"
                    >
                      {note}
                    </Button>
                  ))}
                </fieldset>
              )}
            </div>
          </div>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Batal</DialogClose>
          <Button disabled={pending} form={formId} type="submit">
            {pending ? "Menyimpan…" : transaction ? "Simpan perubahan" : "Simpan transaksi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
