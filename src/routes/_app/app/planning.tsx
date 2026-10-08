import {
  Add01Icon,
  BadgeCheckIcon,
  Calendar03Icon,
  ChevronRightIcon,
  Delete02Icon,
  Edit02Icon,
  Invoice01Icon,
  MoneyAdd01Icon,
  MoneySavingJarIcon,
  Search02Icon,
  Target01Icon,
  UserIcon,
  WalletAdd01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { type FormEvent, type ReactNode, useState } from "react"
import { toast } from "sonner"
import {
  CategoryLabel,
  CategorySelect,
  WalletLabel,
  WalletSelect,
} from "@/components/finance-visuals"
import { FormField } from "@/components/form-field"
import { MoneyInput } from "@/components/money-input"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
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
import { Progress } from "@/components/ui/progress"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Select } from "@/components/ui/select"
import {
  addDebtAmount,
  type Category,
  createBudget,
  createDebt,
  createSaving,
  createSubscription,
  createWalletBudget,
  type Debt,
  deleteBudget,
  deleteDebt,
  deleteSaving,
  deleteSubscription,
  deleteWalletBudget,
  type FinanceTransaction,
  getFinanceData,
  moveSavingFunds,
  paySubscription,
  recordDebtPayment,
  reopenDebt,
  type Saving,
  type Subscription,
  settleDebt,
  updateDebt,
  updateSaving,
  updateSubscription,
  type Wallet,
} from "@/lib/finance.functions"
import { cn, cycleRange, daysUntil, formatMoney, parseNumberInput, today } from "@/lib/utils"

export const Route = createFileRoute("/_app/app/planning")({
  loader: () => getFinanceData(),
  component: PlanningPage,
})

function PlanningPage() {
  const data = Route.useLoaderData()
  const [tab, setTab] = useState<"budget" | "saving" | "debt" | "subscription">("budget")
  const [query, setQuery] = useState("")
  const money = (value: number) =>
    data.settings.hide_balance ? "••••••" : formatMoney(value, data.settings.currency)
  const cycle = cycleRange(data.settings)
  const categoriesById = new Map(data.categories.map((category) => [category.id, category]))
  const walletsById = new Map(data.wallets.map((wallet) => [wallet.id, wallet]))
  const q = query.trim().toLowerCase()
  const budgets = data.budgets.filter((budget) => budget.category_name.toLowerCase().includes(q))
  const savings = data.savings.filter((saving) => saving.name.toLowerCase().includes(q))
  const debts = data.debts.filter((debt) =>
    `${debt.contact} ${debt.note}`.toLowerCase().includes(q),
  )
  const subscriptions = data.subscriptions.filter((subscription) =>
    subscription.name.toLowerCase().includes(q),
  )

  const expenseByCategory = new Map<string, number>()
  for (const item of data.transactions) {
    if (
      item.type === "expense" &&
      item.category_id &&
      item.transaction_date >= cycle.start &&
      item.transaction_date <= cycle.end
    ) {
      expenseByCategory.set(
        item.category_id,
        (expenseByCategory.get(item.category_id) ?? 0) + item.amount,
      )
    }
  }

  const expenseByWallet = new Map<string, number>()
  for (const item of data.transactions) {
    if (
      item.type === "expense" &&
      item.transaction_date >= cycle.start &&
      item.transaction_date <= cycle.end
    ) {
      expenseByWallet.set(item.wallet_id, (expenseByWallet.get(item.wallet_id) ?? 0) + item.amount)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        description="Atur batas pengeluaran, target tabungan, hutang, dan langganan."
        eyebrow="Rencana finansial"
        title="Atur rencana keuanganmu."
      />

      <div className="relative max-w-md">
        <HugeiconsIcon
          className="absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
          icon={Search02Icon}
        />
        <Input
          aria-label="Cari rencana"
          className="pl-10"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari anggaran, target, kontak, atau langganan…"
          value={query}
        />
      </div>

      <SegmentedControl
        ariaLabel="Bagian perencanaan"
        className="grid grid-cols-2 sm:flex sm:w-fit"
        onChange={setTab}
        options={[
          { label: "Anggaran", value: "budget" },
          { label: "Tabungan", value: "saving" },
          { label: "Hutang & piutang", value: "debt" },
          { label: "Rutin", value: "subscription" },
        ]}
        value={tab}
      />

      {tab === "budget" && (
        <section className="grid grid-cols-1 gap-4">
          <SectionHeading
            action={
              <PlanningDialog
                button="Atur anggaran"
                description="Anggaran berlaku pada kategori pengeluaran untuk siklus aktif."
                title="Anggaran kategori"
              >
                {(close) => (
                  <BudgetForm
                    categories={data.categories.filter((category) => category.type === "expense")}
                    close={close}
                  />
                )}
              </PlanningDialog>
            }
            description="Bandingkan realisasi siklus aktif dengan batas yang kamu tetapkan."
            title="Batas pengeluaran"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {budgets.map((budget) => {
              const spent = expenseByCategory.get(budget.category_id) ?? 0
              const percent = Math.round((spent / budget.amount) * 100)
              const category = categoriesById.get(budget.category_id)
              return (
                <Card key={budget.id}>
                  <CardHeader>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold">
                        {category ? <CategoryLabel category={category} /> : budget.category_name}
                      </h3>
                      <CardDescription className="tabular-nums">
                        {money(spent)} dari {money(budget.amount)}
                      </CardDescription>
                    </div>
                    <Badge
                      className={cn(
                        "tabular-nums",
                        percent > 100
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      {percent}%
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <Progress
                      aria-label={`${budget.category_name}, ${percent}% dari batas siklus`}
                      value={Math.min(percent, 100)}
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-caption tabular-nums">
                        {percent > 100
                          ? `Melebihi ${money(spent - budget.amount)}`
                          : `Tersisa ${money(budget.amount - spent)}`}
                      </p>
                      <ConfirmDeleteDialog
                        action={() => deleteBudget({ data: { id: budget.id } })}
                        ariaLabel={`Hapus budget ${budget.category_name}`}
                        confirmLabel="Hapus anggaran"
                        description={`Batas pengeluaran untuk ${budget.category_name} akan dihapus.`}
                        success="Anggaran dihapus"
                        title="Hapus anggaran?"
                        undo={() =>
                          createBudget({
                            data: { categoryId: budget.category_id, amount: budget.amount },
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {budgets.length === 0 && (
            <Empty icon={Target01Icon} text="Belum ada anggaran kategori." />
          )}

          <div className="grid grid-cols-1 gap-4 pt-2">
            <SectionHeading
              action={
                <PlanningDialog
                  button="Atur batas dompet"
                  description="Batasi pengeluaran dari dompet tertentu per siklus."
                  title="Anggaran per dompet"
                >
                  {(close) => <WalletBudgetForm close={close} wallets={data.wallets} />}
                </PlanningDialog>
              }
              description="Batas pengeluaran dari tiap dompet, dihitung dari transaksi pengeluaran."
              title="Anggaran per dompet"
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.walletBudgets.map((walletBudget) => {
                const spent = expenseByWallet.get(walletBudget.wallet_id) ?? 0
                const percent = Math.round((spent / walletBudget.amount) * 100)
                return (
                  <Card key={walletBudget.id}>
                    <CardHeader>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold">{walletBudget.wallet_name}</h3>
                        <CardDescription className="tabular-nums">
                          {money(spent)} dari {money(walletBudget.amount)}
                        </CardDescription>
                      </div>
                      <Badge
                        className={cn(
                          "tabular-nums",
                          percent > 100
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        {percent}%
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <Progress
                        aria-label={`${walletBudget.wallet_name}, ${percent}% dari batas siklus`}
                        value={Math.min(percent, 100)}
                      />
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-caption tabular-nums">
                          {percent > 100
                            ? `Melebihi ${money(spent - walletBudget.amount)}`
                            : `Tersisa ${money(walletBudget.amount - spent)}`}
                        </p>
                        <ConfirmDeleteDialog
                          action={() => deleteWalletBudget({ data: { id: walletBudget.id } })}
                          ariaLabel={`Hapus anggaran ${walletBudget.wallet_name}`}
                          confirmLabel="Hapus anggaran"
                          description={`Batas pengeluaran untuk ${walletBudget.wallet_name} akan dihapus.`}
                          success="Anggaran dompet dihapus"
                          title="Hapus anggaran dompet?"
                          undo={() =>
                            createWalletBudget({
                              data: {
                                walletId: walletBudget.wallet_id,
                                amount: walletBudget.amount,
                              },
                            })
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            {data.walletBudgets.length === 0 && (
              <Empty icon={WalletAdd01Icon} text="Belum ada anggaran per dompet." />
            )}
          </div>
        </section>
      )}

      {tab === "saving" && (
        <section className="grid grid-cols-1 gap-4">
          <SectionHeading
            action={
              <PlanningDialog
                button="Target baru"
                description="Hubungkan target dengan dompet bertipe tabungan."
                title="Buat target tabungan"
              >
                {(close) => (
                  <SavingForm
                    close={close}
                    wallets={data.wallets.filter((wallet) => wallet.type === "saving")}
                  />
                )}
              </PlanningDialog>
            }
            description="Berikan setiap tujuan nama, target, dan tempat menyimpan dananya."
            title="Target tabungan"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {savings.map((saving) => {
              const percent = Math.round((saving.saved_amount / saving.target_amount) * 100)
              const wallet = saving.wallet_id ? walletsById.get(saving.wallet_id) : undefined
              return (
                <Card key={saving.id}>
                  <CardHeader>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold">{saving.name}</h3>
                      <CardDescription>
                        {wallet ? <WalletLabel wallet={wallet} /> : "Belum terhubung ke dompet"}
                      </CardDescription>
                    </div>
                    <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <HugeiconsIcon icon={MoneySavingJarIcon} />
                    </span>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="mb-3 flex items-end justify-between gap-3">
                      <p className="text-lg font-semibold tabular-nums">
                        {money(saving.saved_amount)}
                      </p>
                      <p className="text-caption tabular-nums">
                        target {money(saving.target_amount)}
                      </p>
                    </div>
                    <Progress
                      aria-label={`${saving.name}, ${percent}% dari target`}
                      value={Math.min(percent, 100)}
                    />
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        {saving.wallet_id ? (
                          <PlanningDialog
                            button="Isi / tarik"
                            description="Pindahkan dana antara dompet harian dan target ini."
                            title={`Kelola ${saving.name}`}
                          >
                            {(close) => (
                              <SavingFundsForm
                                close={close}
                                saving={saving}
                                wallets={data.wallets.filter((wallet) => wallet.type === "daily")}
                              />
                            )}
                          </PlanningDialog>
                        ) : (
                          <p className="text-caption">
                            Hubungkan dompet tabungan untuk mengisi target.
                          </p>
                        )}
                      </div>
                      <SavingEditDialog
                        saving={saving}
                        wallets={data.wallets.filter((wallet) => wallet.type === "saving")}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {savings.length === 0 && (
            <Empty icon={MoneySavingJarIcon} text="Belum ada target tabungan." />
          )}
        </section>
      )}

      {tab === "debt" && (
        <section className="grid grid-cols-1 gap-4">
          <SectionHeading
            action={
              <PlanningDialog
                button="Tambah catatan"
                description="Catat kewajiban tanpa mengubah saldo dompet."
                title="Hutang atau piutang"
              >
                {(close) => <DebtForm close={close} wallets={data.wallets} />}
              </PlanningDialog>
            }
            description="Pantau siapa, berapa, dan kapan kewajiban harus diselesaikan."
            title="Hutang & piutang"
          />
          <div className="grid gap-3">
            {debts.map((debt) => (
              <DebtDialog
                debt={debt}
                key={debt.id}
                money={money}
                transactions={data.transactions}
                wallets={data.wallets}
              />
            ))}
          </div>
          {debts.length === 0 && <Empty icon={UserIcon} text="Belum ada hutang atau piutang." />}
        </section>
      )}

      {tab === "subscription" && (
        <section className="grid grid-cols-1 gap-4">
          <SectionHeading
            action={
              <PlanningDialog
                button="Tambah rutin"
                description="Catatan pengeluaran atau pemasukan yang berulang."
                title="Rutin"
              >
                {(close) => (
                  <SubscriptionForm
                    categories={data.categories}
                    close={close}
                    wallets={data.wallets}
                  />
                )}
              </PlanningDialog>
            }
            description="Pantau tagihan dan pemasukan rutin sebelum jatuh temponya."
            title="Langganan & pemasukan rutin"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {subscriptions.map((subscription) => {
              const wallet = subscription.wallet_id
                ? walletsById.get(subscription.wallet_id)
                : undefined
              const category = subscription.category_id
                ? categoriesById.get(subscription.category_id)
                : undefined
              const dueIn = subscription.next_due_date
                ? daysUntil(subscription.next_due_date)
                : null
              const overdue = dueIn !== null && dueIn < 0
              const dueSoon = dueIn !== null && dueIn >= 0 && dueIn <= 7
              return (
                <Card key={subscription.id}>
                  <CardHeader>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold">{subscription.name}</h3>
                        <Badge
                          className={cn(
                            subscription.direction === "income"
                              ? "bg-success/10 text-success"
                              : "bg-destructive/10 text-destructive",
                          )}
                        >
                          {subscription.direction === "income" ? "Pemasukan" : "Pengeluaran"}
                        </Badge>
                        {overdue && (
                          <Badge className="bg-destructive/10 text-destructive">Terlambat</Badge>
                        )}
                        {dueSoon && (
                          <Badge className="bg-warning/12 text-warning">
                            {dueIn === 0 ? "Jatuh tempo hari ini" : `${dueIn} hari lagi`}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex flex-wrap items-center gap-1.5">
                        {wallet ? <WalletLabel wallet={wallet} /> : "Tanpa dompet"}
                        <span aria-hidden>·</span>
                        {category ? <CategoryLabel category={category} /> : "Tanpa kategori"}
                      </CardDescription>
                    </div>
                    <span
                      className={cn(
                        "grid size-10 place-items-center rounded-2xl",
                        subscription.direction === "income"
                          ? "bg-success/10 text-success"
                          : "bg-warning/12 text-warning",
                      )}
                    >
                      <HugeiconsIcon icon={Invoice01Icon} />
                    </span>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold tabular-nums break-words">
                          {money(subscription.amount)}
                        </p>
                        <p className="text-caption mt-2 flex items-center gap-1.5 tabular-nums">
                          <HugeiconsIcon icon={Calendar03Icon} className="size-3.5" />{" "}
                          {subscription.next_due_date}
                          <span aria-hidden>·</span>
                          tiap {subscription.interval_months} bulan
                        </p>
                      </div>
                      <SubscriptionEditDialog
                        categories={data.categories}
                        subscription={subscription}
                        wallets={data.wallets}
                      />
                    </div>
                    <PaySubscriptionDialog
                      money={money}
                      subscription={subscription}
                      wallets={data.wallets}
                    />
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {subscriptions.length === 0 && (
            <Empty icon={Invoice01Icon} text="Belum ada langganan atau pemasukan rutin." />
          )}
        </section>
      )}
    </div>
  )
}

function PlanningDialog({
  button,
  title,
  description,
  children,
}: {
  button: string
  title: string
  description: string
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button />}>
        <HugeiconsIcon icon={Add01Icon} /> {button}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children(() => setOpen(false))}
      </DialogContent>
    </Dialog>
  )
}

function MutationForm({
  id,
  close,
  children,
  action,
  success = "Rencana disimpan",
}: {
  id: string
  close: () => void
  children: ReactNode
  action: (form: FormData) => Promise<void>
  success?: string
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    try {
      await action(new FormData(event.currentTarget))
      close()
      await router.invalidate()
      toast.success(success)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Data gagal disimpan")
    } finally {
      setPending(false)
    }
  }
  return (
    <>
      <form className="grid gap-5" id={id} onSubmit={submit}>
        {children}
      </form>
      <DialogFooter>
        <DialogClose render={<Button variant="ghost" />}>Batal</DialogClose>
        <Button disabled={pending} form={id} type="submit">
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
      </DialogFooter>
    </>
  )
}

function BudgetForm({ categories, close }: { categories: Category[]; close: () => void }) {
  return (
    <MutationForm
      action={(form) =>
        createBudget({
          data: {
            categoryId: String(form.get("category")),
            amount: parseNumberInput(form.get("amount")),
          },
        })
      }
      close={close}
      id="budget-form"
    >
      <FormField label="Kategori">
        <CategorySelect categories={categories} name="category" required />
      </FormField>
      <FormField label="Batas per siklus">
        <MoneyInput min="1" name="amount" required />
      </FormField>
    </MutationForm>
  )
}

function WalletBudgetForm({ wallets, close }: { wallets: Wallet[]; close: () => void }) {
  return (
    <MutationForm
      action={(form) =>
        createWalletBudget({
          data: {
            walletId: String(form.get("wallet")),
            amount: parseNumberInput(form.get("amount")),
          },
        })
      }
      close={close}
      id="wallet-budget-form"
    >
      <FormField label="Dompet">
        <WalletSelect name="wallet" required wallets={wallets} />
      </FormField>
      <FormField label="Batas per siklus">
        <MoneyInput min="1" name="amount" required />
      </FormField>
    </MutationForm>
  )
}

function SavingForm({ wallets, close }: { wallets: Wallet[]; close: () => void }) {
  return (
    <MutationForm
      action={(form) =>
        createSaving({
          data: {
            name: String(form.get("name")),
            targetAmount: parseNumberInput(form.get("amount")),
            walletId: String(form.get("wallet")),
            targetDate: String(form.get("date")),
          },
        })
      }
      close={close}
      id="saving-form"
    >
      <FormField label="Nama target">
        <Input name="name" placeholder="Contoh: Dana darurat" required />
      </FormField>
      <FormField label="Target nominal">
        <MoneyInput min="1" name="amount" required />
      </FormField>
      <FormField
        hint={
          wallets.length === 0
            ? "Buat dompet bertipe tabungan dari dashboard terlebih dahulu."
            : undefined
        }
        label="Dompet tabungan"
      >
        <WalletSelect name="wallet" placeholder="Belum dihubungkan" wallets={wallets} />
      </FormField>
      <FormField label="Tanggal target">
        <Input name="date" type="date" />
      </FormField>
    </MutationForm>
  )
}

function SavingFundsForm({
  saving,
  wallets,
  close,
}: {
  saving: Saving
  wallets: Wallet[]
  close: () => void
}) {
  const [direction, setDirection] = useState<"deposit" | "withdraw">("deposit")
  return (
    <MutationForm
      action={(form) =>
        moveSavingFunds({
          data: {
            id: saving.id,
            walletId: String(form.get("wallet")),
            amount: parseNumberInput(form.get("amount")),
            direction,
          },
        })
      }
      close={close}
      id={`saving-funds-${saving.id}`}
      success="Dana tabungan diperbarui"
    >
      <SegmentedControl
        ariaLabel="Arah dana tabungan"
        className="grid grid-cols-2"
        itemClassName="w-full"
        onChange={setDirection}
        options={[
          { label: "Isi target", value: "deposit" },
          { label: "Tarik dana", value: "withdraw" },
        ]}
        value={direction}
      />
      <FormField label={direction === "deposit" ? "Nominal ditabung" : "Nominal ditarik"}>
        <MoneyInput min="1" name="amount" required />
      </FormField>
      <FormField label={direction === "deposit" ? "Ambil dari dompet" : "Kirim ke dompet"}>
        <WalletSelect name="wallet" required wallets={wallets} />
      </FormField>
    </MutationForm>
  )
}

function DebtForm({ close, wallets }: { close: () => void; wallets: Wallet[] }) {
  const [debtType, setDebtType] = useState<"hutang" | "piutang">("piutang")
  const [amount, setAmount] = useState("")
  const [walletId, setWalletId] = useState("")
  const wallet = wallets.find((item) => item.id === walletId)
  const movement =
    wallet && parseNumberInput(amount) > 0
      ? debtType === "hutang"
        ? `Akan menambah ${wallet.name} sebagai pemasukan.`
        : `Akan mengurangi ${wallet.name} sebagai pengeluaran.`
      : null
  return (
    <MutationForm
      action={(form) =>
        createDebt({
          data: {
            type: form.get("type") === "hutang" ? "hutang" : "piutang",
            contact: String(form.get("contact")),
            amount: parseNumberInput(form.get("amount")),
            dueDate: String(form.get("date")),
            note: String(form.get("note")),
            walletId: String(form.get("wallet") ?? ""),
          },
        })
      }
      close={close}
      id="debt-form"
    >
      <FormField label="Jenis">
        <Select
          name="type"
          onChange={(event) => setDebtType(event.target.value === "hutang" ? "hutang" : "piutang")}
          value={debtType}
        >
          <option value="piutang">Piutang — saya meminjamkan</option>
          <option value="hutang">Hutang — saya meminjam</option>
        </Select>
      </FormField>
      <FormField label="Nama kontak">
        <Input name="contact" required />
      </FormField>
      <FormField label="Nominal">
        <MoneyInput
          min="1"
          name="amount"
          onChange={(event) => setAmount(event.currentTarget.value)}
          required
        />
      </FormField>
      <FormField
        hint="Kosongkan jika nominal ini sudah tercatat di pemasukan/pengeluaran."
        label={debtType === "piutang" ? "Keluarkan dari dompet" : "Terima ke dompet"}
      >
        <div className="grid gap-2">
          <WalletSelect
            name="wallet"
            onChange={(event) => setWalletId(event.target.value)}
            placeholder="Hanya catatan"
            value={walletId}
            wallets={wallets}
          />
          {movement && (
            <p className="rounded-2xl bg-secondary/60 px-3 py-2 text-sm tabular-nums">{movement}</p>
          )}
        </div>
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Jatuh tempo">
          <Input name="date" type="date" />
        </FormField>
        <FormField label="Catatan">
          <Input name="note" />
        </FormField>
      </div>
    </MutationForm>
  )
}

function DebtDialog({
  debt,
  money,
  wallets,
  transactions,
}: {
  debt: Debt
  money: (value: number) => string
  wallets: Wallet[]
  transactions: FinanceTransaction[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<
    "menu" | "add" | "edit" | "pay" | "settle" | "reopen" | "delete"
  >("menu")
  const [pending, setPending] = useState(false)
  const overdue = debt.status === "active" && debt.due_date && debt.due_date < today()
  const isPaid = debt.status === "paid"
  const dueIn = debt.due_date ? daysUntil(debt.due_date) : null
  const dueSoon = debt.status === "active" && dueIn !== null && dueIn >= 0 && dueIn <= 7
  const remaining = Math.max(0, debt.amount - debt.paid_amount)
  const paidPercent = Math.round((debt.paid_amount / debt.amount) * 100)
  const payments = transactions.filter((item) => item.debt_id === debt.id)

  function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) setMode("menu")
  }

  async function reopen() {
    setPending(true)
    try {
      await reopenDebt({ data: { id: debt.id } })
      changeOpen(false)
      await router.invalidate()
      toast.success("Kewajiban diaktifkan dan pembayaran dibalikkan")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Pengaktifan gagal")
    } finally {
      setPending(false)
    }
  }

  async function remove() {
    setPending(true)
    try {
      await deleteDebt({ data: { id: debt.id } })
      changeOpen(false)
      await router.invalidate()
      toast.success("Kewajiban dihapus", {
        action: {
          label: "Urungkan",
          onClick: () => {
            void createDebt({
              data: {
                type: debt.type,
                contact: debt.contact,
                amount: debt.amount,
                dueDate: debt.due_date ?? "",
                note: debt.note,
              },
            }).then(() => router.invalidate())
          },
        },
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kewajiban gagal dihapus")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog onOpenChange={changeOpen} open={open}>
      <DialogTrigger
        nativeButton={false}
        render={
          <Card
            className={cn(
              "cursor-pointer transition-[box-shadow,ring-color] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              overdue && "ring-destructive/30",
            )}
          />
        }
      >
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-2xl",
              debt.type === "piutang"
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive",
            )}
          >
            <HugeiconsIcon icon={UserIcon} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium">{debt.contact}</h3>
              <Badge>{debt.type === "piutang" ? "Piutang" : "Hutang"}</Badge>
              {overdue && <Badge className="bg-destructive/10 text-destructive">Terlambat</Badge>}
              {dueSoon && (
                <Badge className="bg-warning/12 text-warning">
                  {dueIn === 0 ? "Jatuh tempo hari ini" : `${dueIn} hari lagi`}
                </Badge>
              )}
              {isPaid && <Badge className="bg-success/10 text-success">Lunas</Badge>}
            </div>
            <p className="text-caption mt-1 tabular-nums">
              {debt.due_date ? `Jatuh tempo ${debt.due_date}` : "Tanpa jatuh tempo"}
              {debt.note ? ` · ${debt.note}` : ""}
            </p>
            {!isPaid && debt.paid_amount > 0 && (
              <Progress
                aria-label={`Terbayar ${money(debt.paid_amount)} dari ${money(debt.amount)}`}
                className="mt-3"
                value={paidPercent}
              />
            )}
          </div>
          <div className="min-w-0 sm:text-right">
            <p className="text-lg font-semibold tabular-nums break-words">{money(remaining)}</p>
            <p className="text-caption tabular-nums">{isPaid ? "Lunas" : "Sisa"}</p>
          </div>
          <HugeiconsIcon
            className="hidden shrink-0 text-muted-foreground sm:block"
            icon={ChevronRightIcon}
          />
        </CardContent>
      </DialogTrigger>
      <DialogContent>
        {mode === "delete" ? (
          <>
            <DialogHeader>
              <DialogTitle>Hapus kewajiban?</DialogTitle>
              <DialogDescription>
                Catatan {debt.contact} sebesar {money(debt.amount)} akan dihapus permanen.
                {payments.length > 0
                  ? " Riwayat pembayaran tetap tercatat sebagai transaksi biasa."
                  : " Transaksi penambahan yang tercatat terpisah tidak ikut terhapus."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button disabled={pending} onClick={() => setMode("menu")} variant="ghost">
                Kembali
              </Button>
              <Button disabled={pending} onClick={remove} variant="destructive">
                <HugeiconsIcon icon={Delete02Icon} />
                {pending ? "Menghapus…" : "Hapus kewajiban"}
              </Button>
            </DialogFooter>
          </>
        ) : mode === "reopen" ? (
          <>
            <DialogHeader>
              <DialogTitle>Aktifkan kembali?</DialogTitle>
              <DialogDescription>
                {payments.length > 0
                  ? `${payments.length} pembayaran tertaut akan dihapus dan saldo dompet dikembalikan.`
                  : "Status kewajiban kembali aktif dan nominal yang sudah dibayar direset."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button disabled={pending} onClick={() => setMode("menu")} variant="ghost">
                Kembali
              </Button>
              <Button disabled={pending} onClick={reopen}>
                {pending ? "Memproses…" : "Aktifkan kewajiban"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{debt.contact}</DialogTitle>
              <DialogDescription>
                {debt.type === "piutang" ? "Piutang — saya meminjamkan" : "Hutang — saya meminjam"}
                {debt.due_date ? ` · Jatuh tempo ${debt.due_date}` : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-end justify-between gap-3 rounded-2xl bg-secondary/60 p-4">
              <div>
                <p className="text-caption">Sisa kewajiban</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{money(remaining)}</p>
              </div>
              {debt.paid_amount > 0 && (
                <p className="text-caption tabular-nums">Terbayar {money(debt.paid_amount)}</p>
              )}
            </div>

            {mode === "menu" && (
              <div className="grid gap-2">
                <Button
                  disabled={pending}
                  onClick={() => setMode(isPaid ? "reopen" : "settle")}
                  variant="outline"
                >
                  <HugeiconsIcon icon={BadgeCheckIcon} />
                  {isPaid ? "Aktifkan" : "Tandai lunas"}
                </Button>
                <Button onClick={() => setMode("add")} variant="outline">
                  <HugeiconsIcon icon={MoneyAdd01Icon} />
                  {debt.type === "piutang" ? "Tambah piutang" : "Tambah hutang"}
                </Button>
                <Button disabled={isPaid} onClick={() => setMode("pay")} variant="outline">
                  <HugeiconsIcon icon={WalletAdd01Icon} />
                  {debt.type === "piutang" ? "Terima cicilan" : "Cicil hutang"}
                </Button>
                <Button onClick={() => setMode("edit")} variant="outline">
                  <HugeiconsIcon icon={Edit02Icon} />
                  Edit catatan
                </Button>
                <Button onClick={() => setMode("delete")} variant="destructive">
                  <HugeiconsIcon icon={Delete02Icon} />
                  {debt.type === "piutang" ? "Hapus piutang" : "Hapus hutang"}
                </Button>
              </div>
            )}

            {mode === "menu" && payments.length > 0 && (
              <div className="grid gap-2">
                <p className="text-label">Riwayat pembayaran</p>
                {payments.map((item) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/55 px-3 py-2 text-sm"
                    key={item.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.description}</p>
                      <p className="text-caption tabular-nums">{item.transaction_date}</p>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums">{money(item.amount)}</p>
                  </div>
                ))}
              </div>
            )}

            {mode === "add" && (
              <MutationForm
                action={(form) =>
                  addDebtAmount({
                    data: {
                      id: debt.id,
                      amount: parseNumberInput(form.get("amount")),
                      walletId: String(form.get("wallet") ?? ""),
                    },
                  })
                }
                close={() => changeOpen(false)}
                id={`debt-add-${debt.id}`}
                success="Nominal hutang ditambahkan"
              >
                <FormField
                  hint={
                    isPaid ? "Kewajiban akan aktif kembali karena nominal bertambah." : undefined
                  }
                  label="Nominal ditambahkan"
                >
                  <MoneyInput autoFocus min="1" name="amount" required />
                </FormField>
                <FormField
                  hint="Kosongkan jika nominal ini sudah tercatat di pemasukan/pengeluaran."
                  label={debt.type === "piutang" ? "Keluarkan dari dompet" : "Terima ke dompet"}
                >
                  <WalletSelect name="wallet" placeholder="Hanya catatan" wallets={wallets} />
                </FormField>
              </MutationForm>
            )}

            {mode === "edit" && (
              <MutationForm
                action={(form) =>
                  updateDebt({
                    data: {
                      id: debt.id,
                      contact: String(form.get("contact")),
                      dueDate: String(form.get("date")),
                      note: String(form.get("note")),
                    },
                  })
                }
                close={() => changeOpen(false)}
                id={`debt-edit-${debt.id}`}
                success="Catatan kewajiban diperbarui"
              >
                <FormField label="Nama kontak">
                  <Input
                    autoFocus
                    defaultValue={debt.contact}
                    maxLength={80}
                    name="contact"
                    required
                  />
                </FormField>
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField label="Jatuh tempo">
                    <Input defaultValue={debt.due_date ?? ""} name="date" type="date" />
                  </FormField>
                  <FormField label="Catatan">
                    <Input defaultValue={debt.note} name="note" />
                  </FormField>
                </div>
              </MutationForm>
            )}

            {mode === "pay" && (
              <MutationForm
                action={(form) =>
                  recordDebtPayment({
                    data: {
                      id: debt.id,
                      walletId: String(form.get("wallet")),
                      amount: parseNumberInput(form.get("amount")),
                    },
                  })
                }
                close={() => changeOpen(false)}
                id={`debt-pay-${debt.id}`}
                success="Cicilan dicatat dan saldo dompet diperbarui"
              >
                <FormField hint={`Sisa kewajiban ${money(remaining)}`} label="Nominal cicilan">
                  <MoneyInput autoFocus max={remaining} min="1" name="amount" required />
                </FormField>
                <FormField
                  hint={
                    wallets.length === 0
                      ? "Buat dompet terlebih dahulu dari dashboard."
                      : debt.type === "piutang"
                        ? "Saldo dompet akan bertambah."
                        : "Saldo dompet akan berkurang."
                  }
                  label={debt.type === "piutang" ? "Dompet penerima" : "Dompet pembayar"}
                >
                  <WalletSelect name="wallet" required wallets={wallets} />
                </FormField>
              </MutationForm>
            )}

            {mode === "settle" && (
              <MutationForm
                action={(form) =>
                  settleDebt({ data: { id: debt.id, walletId: String(form.get("wallet")) } })
                }
                close={() => changeOpen(false)}
                id={`debt-settle-${debt.id}`}
                success="Kewajiban dilunasi dan saldo dompet diperbarui"
              >
                <div className="flex items-end justify-between gap-3 rounded-2xl bg-secondary/60 p-4">
                  <div>
                    <p className="text-caption">Dibayar lunas</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">{money(remaining)}</p>
                  </div>
                  <p className="text-caption tabular-nums">
                    {debt.type === "piutang" ? "Masuk ke dompet" : "Keluar dari dompet"}
                  </p>
                </div>
                <FormField
                  hint={
                    wallets.length === 0 ? "Buat dompet terlebih dahulu dari dashboard." : undefined
                  }
                  label={debt.type === "piutang" ? "Dompet penerima" : "Dompet pembayar"}
                >
                  <WalletSelect name="wallet" required wallets={wallets} />
                </FormField>
              </MutationForm>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SubscriptionForm({
  wallets,
  categories,
  close,
}: {
  wallets: Wallet[]
  categories: Category[]
  close: () => void
}) {
  const [direction, setDirection] = useState<"expense" | "income">("expense")
  const validCategories = categories.filter((category) => category.type === direction)
  return (
    <MutationForm
      action={(form) =>
        createSubscription({
          data: {
            name: String(form.get("name")),
            amount: parseNumberInput(form.get("amount")),
            walletId: String(form.get("wallet")),
            categoryId: String(form.get("category")),
            nextDueDate: String(form.get("date")),
            intervalMonths: Number(form.get("interval")),
            direction: form.get("direction") === "income" ? "income" : "expense",
          },
        })
      }
      close={close}
      id="subscription-form"
    >
      <FormField label="Jenis">
        <Select
          name="direction"
          onChange={(event) => setDirection(event.target.value === "income" ? "income" : "expense")}
          value={direction}
        >
          <option value="expense">Pengeluaran rutin</option>
          <option value="income">Pemasukan rutin</option>
        </Select>
      </FormField>
      <FormField label={direction === "income" ? "Nama pemasukan" : "Nama layanan"}>
        <Input
          name="name"
          placeholder={direction === "income" ? "Contoh: Gaji bulanan" : "Contoh: Spotify"}
          required
        />
      </FormField>
      <FormField label="Nominal">
        <MoneyInput min="1" name="amount" required />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Dompet">
          <WalletSelect name="wallet" placeholder="Tanpa dompet" wallets={wallets} />
        </FormField>
        <FormField label="Kategori">
          <CategorySelect
            categories={validCategories}
            key={direction}
            name="category"
            placeholder="Tanpa kategori"
          />
        </FormField>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Ulang tiap">
          <Select defaultValue="1" name="interval">
            <option value="1">1 bulan</option>
            <option value="3">3 bulan</option>
            <option value="6">6 bulan</option>
            <option value="12">12 bulan</option>
          </Select>
        </FormField>
        <FormField label={direction === "income" ? "Diterima berikutnya" : "Tagihan berikutnya"}>
          <Input defaultValue={today()} name="date" required type="date" />
        </FormField>
      </div>
    </MutationForm>
  )
}

function ConfirmDeleteDialog({
  title,
  description,
  confirmLabel,
  ariaLabel,
  success = "Data dihapus",
  action,
  undo,
}: {
  title: string
  description: string
  confirmLabel: string
  ariaLabel: string
  success?: string
  action: () => Promise<void>
  undo?: () => Promise<void>
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function remove() {
    setPending(true)
    try {
      await action()
      setOpen(false)
      await router.invalidate()
      toast.success(success, {
        action: undo
          ? {
              label: "Urungkan",
              onClick: () => {
                void undo().then(() => router.invalidate())
              },
            }
          : undefined,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Data gagal dihapus")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button
            aria-label={ariaLabel}
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Batal</DialogClose>
          <Button disabled={pending} onClick={remove} variant="destructive">
            <HugeiconsIcon icon={Delete02Icon} />
            {pending ? "Menghapus…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SavingEditDialog({ saving, wallets }: { saving: Saving; wallets: Wallet[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const formId = `saving-edit-${saving.id}`

  function changeOpen(next: boolean) {
    setOpen(next)
    if (!next) setConfirmingDelete(false)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    const form = new FormData(event.currentTarget)
    try {
      await updateSaving({
        data: {
          id: saving.id,
          name: String(form.get("name")),
          targetAmount: parseNumberInput(form.get("amount")),
          walletId: String(form.get("wallet") ?? ""),
          targetDate: String(form.get("date") ?? ""),
        },
      })
      changeOpen(false)
      await router.invalidate()
      toast.success("Target tabungan diperbarui")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Target gagal disimpan")
    } finally {
      setPending(false)
    }
  }

  async function remove() {
    setPending(true)
    try {
      await deleteSaving({ data: { id: saving.id } })
      changeOpen(false)
      await router.invalidate()
      toast.success("Target tabungan dihapus", {
        action: {
          label: "Urungkan",
          onClick: () => {
            void createSaving({
              data: {
                name: saving.name,
                targetAmount: saving.target_amount,
                walletId: saving.wallet_id ?? "",
                targetDate: saving.target_date ?? "",
              },
            }).then(() => router.invalidate())
          },
        },
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Target gagal dihapus")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog onOpenChange={changeOpen} open={open}>
      <DialogTrigger
        render={
          <Button
            aria-label={`Edit ${saving.name}`}
            size="icon"
            variant="ghost"
            className="shrink-0"
          />
        }
      >
        <HugeiconsIcon icon={Edit02Icon} />
      </DialogTrigger>
      <DialogContent>
        {confirmingDelete ? (
          <>
            <DialogHeader>
              <DialogTitle>Hapus target?</DialogTitle>
              <DialogDescription>
                Target {saving.name} akan dihapus. Dana yang sudah dipindahkan tetap tercatat
                sebagai transaksi dompet.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button disabled={pending} onClick={() => setConfirmingDelete(false)} variant="ghost">
                Kembali
              </Button>
              <Button disabled={pending} onClick={remove} variant="destructive">
                <HugeiconsIcon icon={Delete02Icon} />
                {pending ? "Menghapus…" : "Hapus target"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Edit target</DialogTitle>
              <DialogDescription>
                Perbarui nama, target, dompet penyimpan, atau tanggal target.
              </DialogDescription>
            </DialogHeader>
            <form className="grid gap-5" id={formId} onSubmit={submit}>
              <FormField label="Nama target">
                <Input defaultValue={saving.name} maxLength={80} name="name" required />
              </FormField>
              <FormField label="Target nominal">
                <MoneyInput defaultValue={saving.target_amount} min="1" name="amount" required />
              </FormField>
              <FormField
                hint={
                  wallets.length === 0
                    ? "Buat dompet bertipe tabungan dari dashboard terlebih dahulu."
                    : undefined
                }
                label="Dompet tabungan"
              >
                <WalletSelect
                  defaultValue={saving.wallet_id ?? ""}
                  name="wallet"
                  placeholder="Belum dihubungkan"
                  wallets={wallets}
                />
              </FormField>
              <FormField label="Tanggal target">
                <Input defaultValue={saving.target_date ?? ""} name="date" type="date" />
              </FormField>
            </form>
            <DialogFooter className="sm:justify-between">
              <Button
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={pending}
                onClick={() => setConfirmingDelete(true)}
                variant="ghost"
              >
                <HugeiconsIcon icon={Delete02Icon} />
                Hapus target
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <DialogClose render={<Button variant="ghost" />}>Batal</DialogClose>
                <Button disabled={pending} form={formId} type="submit">
                  {pending ? "Menyimpan…" : "Simpan perubahan"}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SubscriptionEditDialog({
  subscription,
  wallets,
  categories,
}: {
  subscription: Subscription
  wallets: Wallet[]
  categories: Category[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [direction, setDirection] = useState<"expense" | "income">(subscription.direction)
  const formId = `subscription-edit-${subscription.id}`

  function changeOpen(next: boolean) {
    setOpen(next)
    if (!next) setConfirmingDelete(false)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    const form = new FormData(event.currentTarget)
    try {
      await updateSubscription({
        data: {
          id: subscription.id,
          name: String(form.get("name")),
          amount: parseNumberInput(form.get("amount")),
          walletId: String(form.get("wallet") ?? ""),
          categoryId: String(form.get("category") ?? ""),
          nextDueDate: String(form.get("date")),
          intervalMonths: Number(form.get("interval")),
          direction: form.get("direction") === "income" ? "income" : "expense",
        },
      })
      changeOpen(false)
      await router.invalidate()
      toast.success("Langganan diperbarui")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Langganan gagal disimpan")
    } finally {
      setPending(false)
    }
  }

  async function remove() {
    setPending(true)
    try {
      await deleteSubscription({ data: { id: subscription.id } })
      changeOpen(false)
      await router.invalidate()
      toast.success("Langganan dihapus", {
        action: {
          label: "Urungkan",
          onClick: () => {
            void createSubscription({
              data: {
                name: subscription.name,
                amount: subscription.amount,
                walletId: subscription.wallet_id ?? "",
                categoryId: subscription.category_id ?? "",
                nextDueDate: subscription.next_due_date,
                intervalMonths: subscription.interval_months,
                direction: subscription.direction,
              },
            }).then(() => router.invalidate())
          },
        },
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Langganan gagal dihapus")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog onOpenChange={changeOpen} open={open}>
      <DialogTrigger
        render={
          <Button
            aria-label={`Edit ${subscription.name}`}
            className="shrink-0"
            size="icon"
            variant="ghost"
          />
        }
      >
        <HugeiconsIcon icon={Edit02Icon} />
      </DialogTrigger>
      <DialogContent>
        {confirmingDelete ? (
          <>
            <DialogHeader>
              <DialogTitle>Hapus langganan?</DialogTitle>
              <DialogDescription>
                Catatan {subscription.name} akan dihapus permanen. Transaksi yang sudah dicatat
                tidak ikut terhapus.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button disabled={pending} onClick={() => setConfirmingDelete(false)} variant="ghost">
                Kembali
              </Button>
              <Button disabled={pending} onClick={remove} variant="destructive">
                <HugeiconsIcon icon={Delete02Icon} />
                {pending ? "Menghapus…" : "Hapus langganan"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Edit langganan</DialogTitle>
              <DialogDescription>
                Perbarui nominal, dompet, kategori, atau tanggal tagihan.
              </DialogDescription>
            </DialogHeader>
            <form className="grid gap-5" id={formId} onSubmit={submit}>
              <FormField label="Jenis">
                <Select
                  name="direction"
                  onChange={(event) =>
                    setDirection(event.target.value === "income" ? "income" : "expense")
                  }
                  value={direction}
                >
                  <option value="expense">Pengeluaran rutin</option>
                  <option value="income">Pemasukan rutin</option>
                </Select>
              </FormField>
              <FormField label={direction === "income" ? "Nama pemasukan" : "Nama layanan"}>
                <Input defaultValue={subscription.name} maxLength={80} name="name" required />
              </FormField>
              <FormField label="Nominal">
                <MoneyInput defaultValue={subscription.amount} min="1" name="amount" required />
              </FormField>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Dompet">
                  <WalletSelect
                    defaultValue={subscription.wallet_id ?? ""}
                    name="wallet"
                    placeholder="Tanpa dompet"
                    wallets={wallets}
                  />
                </FormField>
                <FormField label="Kategori">
                  <CategorySelect
                    categories={categories.filter((category) => category.type === direction)}
                    defaultValue={subscription.category_id ?? ""}
                    key={direction}
                    name="category"
                    placeholder="Tanpa kategori"
                  />
                </FormField>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Ulang tiap">
                  <Select defaultValue={String(subscription.interval_months)} name="interval">
                    <option value="1">1 bulan</option>
                    <option value="3">3 bulan</option>
                    <option value="6">6 bulan</option>
                    <option value="12">12 bulan</option>
                  </Select>
                </FormField>
                <FormField
                  label={direction === "income" ? "Diterima berikutnya" : "Tagihan berikutnya"}
                >
                  <Input
                    defaultValue={subscription.next_due_date}
                    name="date"
                    required
                    type="date"
                  />
                </FormField>
              </div>
            </form>
            <DialogFooter className="sm:justify-between">
              <Button
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={pending}
                onClick={() => setConfirmingDelete(true)}
                variant="ghost"
              >
                <HugeiconsIcon icon={Delete02Icon} />
                Hapus langganan
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <DialogClose render={<Button variant="ghost" />}>Batal</DialogClose>
                <Button disabled={pending} form={formId} type="submit">
                  {pending ? "Menyimpan…" : "Simpan perubahan"}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function PaySubscriptionDialog({
  subscription,
  wallets,
  money,
}: {
  subscription: Subscription
  wallets: Wallet[]
  money: (value: number) => string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const formId = `subscription-pay-${subscription.id}`

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    const form = new FormData(event.currentTarget)
    try {
      await paySubscription({
        data: {
          id: subscription.id,
          walletId: String(form.get("wallet")),
          date: String(form.get("date")),
        },
      })
      setOpen(false)
      await router.invalidate()
      toast.success(
        subscription.direction === "income"
          ? "Pemasukan rutin diterima dan saldo dompet diperbarui"
          : "Langganan dibayar dan saldo dompet diperbarui",
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Pembayaran gagal")
    } finally {
      setPending(false)
    }
  }

  const income = subscription.direction === "income"
  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button className="w-full" variant="outline" />}>
        <HugeiconsIcon icon={BadgeCheckIcon} />
        {income ? "Tandai diterima" : "Tandai dibayar"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {income ? "Terima" : "Bayar"} {subscription.name}?
          </DialogTitle>
          <DialogDescription>
            Saldo dompet {income ? "bertambah" : "berkurang"} {money(subscription.amount)} dan
            jadwal maju {subscription.interval_months} bulan.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-5" id={formId} onSubmit={submit}>
          <div className="flex items-end justify-between gap-3 rounded-2xl bg-secondary/60 p-4">
            <div>
              <p className="text-caption">{income ? "Nominal diterima" : "Nominal dibayar"}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {money(subscription.amount)}
              </p>
            </div>
          </div>
          <FormField
            hint={wallets.length === 0 ? "Buat dompet terlebih dahulu dari dashboard." : undefined}
            label={income ? "Dompet penerima" : "Dompet pembayar"}
          >
            <WalletSelect
              defaultValue={subscription.wallet_id ?? ""}
              name="wallet"
              required
              wallets={wallets}
            />
          </FormField>
          <FormField label={income ? "Tanggal diterima" : "Tanggal bayar"}>
            <Input defaultValue={today()} name="date" required type="date" />
          </FormField>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Batal</DialogClose>
          <Button disabled={pending} form={formId} type="submit">
            {pending ? "Menyimpan…" : income ? "Terima pemasukan" : "Bayar langganan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-subtitle">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

function Empty({ icon, text }: { icon: typeof Target01Icon; text: string }) {
  return (
    <Card>
      <CardContent className="grid place-items-center py-16 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
          <HugeiconsIcon icon={icon} />
        </span>
        <p className="mt-4 text-sm font-medium">{text}</p>
      </CardContent>
    </Card>
  )
}
