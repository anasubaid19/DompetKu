import { Add01Icon, Delete02Icon, Edit02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "@tanstack/react-router"
import { type FormEvent, useId, useState } from "react"
import { toast } from "sonner"
import { CategorySelect, InstitutionSelect, WalletSelect } from "@/components/finance-visuals"
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
  createTransaction,
  createWallet,
  deleteWallet,
  type FinanceTransaction,
  updateTransaction,
  updateWallet,
  type Wallet,
} from "@/lib/finance.functions"
import { today } from "@/lib/utils"

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

export function TransactionDialog({
  wallets,
  categories,
  transaction,
}: {
  wallets: Wallet[]
  categories: Category[]
  transaction?: FinanceTransaction
}) {
  const router = useRouter()
  const formId = useId()
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
        amount: Number(form.get("amount")),
        fee: Number(form.get("fee") ?? 0),
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
          <FormField label="Nominal">
            <Input
              inputMode="numeric"
              min="1"
              name="amount"
              placeholder="0"
              required
              type="number"
              defaultValue={transaction?.amount}
            />
          </FormField>
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
                <Input defaultValue={transaction?.fee ?? 0} min="0" name="fee" type="number" />
              </FormField>
            </>
          ) : (
            <FormField label="Kategori">
              <CategorySelect
                categories={validCategories}
                defaultValue={transaction?.category_id}
                key={type}
                name="categoryId"
                required
              />
            </FormField>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Tanggal">
              <Input
                defaultValue={transaction?.transaction_date ?? today()}
                name="date"
                required
                type="date"
              />
            </FormField>
            <FormField label="Catatan">
              <Input
                defaultValue={transaction?.description}
                maxLength={240}
                name="description"
                placeholder="Opsional"
              />
            </FormField>
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
