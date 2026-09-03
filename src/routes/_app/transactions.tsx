import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Delete02Icon,
  Search02Icon,
  TransactionHistoryIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useDeferredValue, useState } from "react"
import { toast } from "sonner"
import { TransactionDialog } from "@/components/finance-dialogs"
import { CategoryLabel, WalletLabel } from "@/components/finance-visuals"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { deleteTransaction, type FinanceTransaction, getFinanceData } from "@/lib/finance.functions"
import { cn, cycleRange, formatMoney, formatTransactionAmount } from "@/lib/utils"

export const Route = createFileRoute("/_app/transactions")({
  loader: () => getFinanceData(),
  component: TransactionsPage,
})

function TransactionsPage() {
  const data = Route.useLoaderData()
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query.toLowerCase())
  const [filter, setFilter] = useState<"all" | "income" | "expense" | "transfer">("all")
  const [period, setPeriod] = useState<"cycle" | "all">("cycle")
  const cycle = cycleRange(data.settings)
  const categoriesById = new Map(data.categories.map((category) => [category.id, category]))
  const walletsById = new Map(data.wallets.map((wallet) => [wallet.id, wallet]))
  const money = (value: number) =>
    data.settings.hide_balance ? "••••••" : formatMoney(value, data.settings.currency)

  const transactions = data.transactions.filter((item) => {
    const matchesType = filter === "all" || item.type === filter
    const matchesPeriod =
      period === "all" ||
      (item.transaction_date >= cycle.start && item.transaction_date <= cycle.end)
    const haystack =
      `${item.description} ${item.category_name} ${item.wallet_name} ${item.target_wallet_name}`.toLowerCase()
    return matchesType && matchesPeriod && haystack.includes(deferredQuery)
  })

  return (
    <div className="grid gap-6">
      <PageHeader
        action={<TransactionDialog categories={data.categories} wallets={data.wallets} />}
        description="Cari dan tinjau pergerakan uang dari semua dompet."
        eyebrow="Catatan keuangan"
        title="Transaksi"
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-2xl flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <HugeiconsIcon
              className="absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
              icon={Search02Icon}
            />
            <Input
              aria-label="Cari transaksi"
              className="pl-10"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari catatan, kategori, atau dompet…"
              value={query}
            />
          </div>
          <Select
            aria-label="Rentang transaksi"
            className="w-auto"
            onChange={(event) => setPeriod(event.target.value === "all" ? "all" : "cycle")}
            value={period}
          >
            <option value="cycle">Siklus: {cycle.label}</option>
            <option value="all">Semua periode</option>
          </Select>
        </div>
        <SegmentedControl
          ariaLabel="Filter jenis transaksi"
          className="overflow-x-auto"
          itemClassName="shrink-0"
          onChange={setFilter}
          options={[
            { label: "Semua", value: "all" },
            { label: "Pemasukan", value: "income" },
            { label: "Pengeluaran", value: "expense" },
            { label: "Transfer", value: "transfer" },
          ]}
          value={filter}
        />
      </div>

      <Card>
        <CardContent className="p-2 sm:p-3">
          <div className="grid gap-1">
            {transactions.map((item) => {
              const category = item.category_id ? categoriesById.get(item.category_id) : undefined
              const wallet = walletsById.get(item.wallet_id)
              const targetWallet = item.target_wallet_id
                ? walletsById.get(item.target_wallet_id)
                : undefined
              return (
                <article
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-secondary/55 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                  key={item.id}
                >
                  <span
                    className={cn(
                      "grid size-11 place-items-center rounded-2xl",
                      item.type === "income"
                        ? "bg-success/10 text-success"
                        : item.type === "expense"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary",
                    )}
                  >
                    <HugeiconsIcon
                      icon={
                        item.type === "income"
                          ? ArrowDown01Icon
                          : item.type === "expense"
                            ? ArrowUp01Icon
                            : TransactionHistoryIcon
                      }
                    />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-medium">
                        {item.description || item.category_name || "Transfer antar-dompet"}
                      </h2>
                      <Badge className="gap-1.5">
                        {category ? <CategoryLabel category={category} /> : item.type}
                      </Badge>
                    </div>
                    <div className="text-caption mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                      {wallet && <WalletLabel wallet={wallet} />}
                      {targetWallet && <span aria-hidden>→</span>}
                      {targetWallet && <WalletLabel wallet={targetWallet} />}
                      <span aria-hidden>·</span>
                      <span>
                        {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
                          new Date(`${item.transaction_date}T00:00:00`),
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="col-start-2 flex items-center justify-between gap-3 sm:col-start-3 sm:row-start-1">
                    <div className="text-right">
                      <p
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          item.type === "income" && "text-success",
                          item.type === "expense" && "text-destructive",
                        )}
                      >
                        {formatTransactionAmount(
                          item.type,
                          item.amount,
                          data.settings.currency,
                          Boolean(data.settings.hide_balance),
                        )}
                      </p>
                      {item.type === "transfer" && item.fee > 0 && (
                        <p className="text-caption mt-0.5">Biaya transfer {money(item.fee)}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {item.saving_id ? (
                        <Badge>Target tabungan</Badge>
                      ) : (
                        <>
                          <TransactionDialog
                            categories={data.categories}
                            transaction={item}
                            wallets={data.wallets}
                          />
                          <DeleteTransactionDialog transaction={item} />
                        </>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
            {transactions.length === 0 && (
              <div className="grid place-items-center py-16 text-center">
                <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                  <HugeiconsIcon icon={TransactionHistoryIcon} />
                </span>
                <p className="mt-4 text-sm font-medium">Tidak ada transaksi yang cocok</p>
                <p className="text-caption mt-1">Ubah kata kunci atau filter transaksi.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DeleteTransactionDialog({ transaction }: { transaction: FinanceTransaction }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function remove() {
    setPending(true)
    try {
      await deleteTransaction({ data: { id: transaction.id } })
      setOpen(false)
      await router.invalidate()
      toast.success("Transaksi dihapus dan saldo dikembalikan")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transaksi gagal dihapus")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button
            aria-label="Hapus transaksi"
            className="text-muted-foreground hover:text-destructive"
            size="icon"
            variant="ghost"
          />
        }
      >
        <HugeiconsIcon icon={Delete02Icon} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus transaksi?</DialogTitle>
          <DialogDescription>
            Saldo dompet akan dikembalikan ke kondisi sebelum transaksi ini. Tindakan ini tidak
            dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Batal</DialogClose>
          <Button disabled={pending} onClick={remove} variant="destructive">
            {pending ? "Menghapus…" : "Hapus transaksi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
