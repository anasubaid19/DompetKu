import {
  Add01Icon,
  Calendar03Icon,
  Invoice01Icon,
  MoneySavingJarIcon,
  Target01Icon,
  UserIcon,
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
  type Category,
  createBudget,
  createDebt,
  createSaving,
  createSubscription,
  getFinanceData,
  moveSavingFunds,
  type Saving,
  toggleDebtPaid,
  type Wallet,
} from "@/lib/finance.functions"
import { cn, cycleRange, formatMoney, today } from "@/lib/utils"

export const Route = createFileRoute("/_app/app/planning")({
  loader: () => getFinanceData(),
  component: PlanningPage,
})

function PlanningPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [tab, setTab] = useState<"budget" | "saving" | "debt" | "subscription">("budget")
  const money = (value: number) =>
    data.settings.hide_balance ? "••••••" : formatMoney(value, data.settings.currency)
  const cycle = cycleRange(data.settings)
  const categoriesById = new Map(data.categories.map((category) => [category.id, category]))
  const walletsById = new Map(data.wallets.map((wallet) => [wallet.id, wallet]))

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

  async function markDebt(id: string) {
    try {
      await toggleDebtPaid({ data: { id } })
      await router.invalidate()
      toast.success("Status kewajiban diperbarui")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status gagal diperbarui")
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        description="Satukan batas pengeluaran, target tabungan, kewajiban, dan tagihan rutin."
        eyebrow="Rencana finansial"
        title="Rencanakan sebelum uang pergi."
      />

      <SegmentedControl
        ariaLabel="Bagian perencanaan"
        className="grid grid-cols-2 sm:flex sm:w-fit"
        onChange={setTab}
        options={[
          { label: "Budget", value: "budget" },
          { label: "Tabungan", value: "saving" },
          { label: "Hutang & piutang", value: "debt" },
          { label: "Langganan", value: "subscription" },
        ]}
        value={tab}
      />

      {tab === "budget" && (
        <section className="grid gap-4">
          <SectionHeading
            action={
              <PlanningDialog
                button="Atur budget"
                description="Budget berlaku pada kategori pengeluaran untuk siklus aktif."
                title="Budget kategori"
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
            {data.budgets.map((budget) => {
              const spent = expenseByCategory.get(budget.category_id) ?? 0
              const percent = Math.round((spent / budget.amount) * 100)
              const category = categoriesById.get(budget.category_id)
              return (
                <Card key={budget.id}>
                  <CardHeader>
                    <div>
                      <h3 className="text-subtitle">
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
                    <p className="text-caption mt-3 tabular-nums">
                      {percent > 100
                        ? `Melebihi ${money(spent - budget.amount)}`
                        : `Tersisa ${money(budget.amount - spent)}`}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {data.budgets.length === 0 && (
            <Empty icon={Target01Icon} text="Belum ada budget kategori." />
          )}
        </section>
      )}

      {tab === "saving" && (
        <section className="grid gap-4">
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
            {data.savings.map((saving) => {
              const percent = Math.round((saving.saved_amount / saving.target_amount) * 100)
              const wallet = saving.wallet_id ? walletsById.get(saving.wallet_id) : undefined
              return (
                <Card key={saving.id}>
                  <CardHeader>
                    <div>
                      <h3 className="text-subtitle">{saving.name}</h3>
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
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {data.savings.length === 0 && (
            <Empty icon={MoneySavingJarIcon} text="Belum ada target tabungan." />
          )}
        </section>
      )}

      {tab === "debt" && (
        <section className="grid gap-4">
          <SectionHeading
            action={
              <PlanningDialog
                button="Tambah catatan"
                description="Catat kewajiban tanpa mengubah saldo dompet."
                title="Hutang atau piutang"
              >
                {(close) => <DebtForm close={close} />}
              </PlanningDialog>
            }
            description="Pantau siapa, berapa, dan kapan kewajiban harus diselesaikan."
            title="Hutang & piutang"
          />
          <div className="grid gap-3">
            {data.debts.map((debt) => {
              const overdue = debt.status === "active" && debt.due_date && debt.due_date < today()
              return (
                <Card className={cn(overdue && "ring-destructive/30")} key={debt.id}>
                  <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <span
                      className={cn(
                        "grid size-11 place-items-center rounded-2xl",
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
                        {overdue && (
                          <Badge className="bg-destructive/10 text-destructive">Terlambat</Badge>
                        )}
                      </div>
                      <p className="text-caption mt-1 tabular-nums">
                        {debt.due_date ? `Jatuh tempo ${debt.due_date}` : "Tanpa jatuh tempo"}
                        {debt.note ? ` · ${debt.note}` : ""}
                      </p>
                    </div>
                    <p className="text-lg font-semibold tabular-nums">{money(debt.amount)}</p>
                    <Button
                      onClick={() => markDebt(debt.id)}
                      size="sm"
                      variant={debt.status === "paid" ? "secondary" : "outline"}
                    >
                      {debt.status === "paid" ? "Aktifkan" : "Tandai lunas"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {data.debts.length === 0 && (
            <Empty icon={UserIcon} text="Belum ada hutang atau piutang." />
          )}
        </section>
      )}

      {tab === "subscription" && (
        <section className="grid gap-4">
          <SectionHeading
            action={
              <PlanningDialog
                button="Tambah langganan"
                description="Dompet tidak otomatis dipotong; catatan ini berfungsi sebagai reminder."
                title="Langganan rutin"
              >
                {(close) => (
                  <SubscriptionForm
                    categories={data.categories.filter((category) => category.type === "expense")}
                    close={close}
                    wallets={data.wallets}
                  />
                )}
              </PlanningDialog>
            }
            description="Lihat tagihan rutin sebelum tanggal jatuh temponya."
            title="Langganan"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.subscriptions.map((subscription) => {
              const wallet = subscription.wallet_id
                ? walletsById.get(subscription.wallet_id)
                : undefined
              const category = subscription.category_id
                ? categoriesById.get(subscription.category_id)
                : undefined
              return (
                <Card key={subscription.id}>
                  <CardHeader>
                    <div>
                      <h3 className="text-subtitle">{subscription.name}</h3>
                      <CardDescription className="flex flex-wrap items-center gap-1.5">
                        {wallet ? <WalletLabel wallet={wallet} /> : "Tanpa dompet"}
                        <span aria-hidden>·</span>
                        {category ? <CategoryLabel category={category} /> : "Tanpa kategori"}
                      </CardDescription>
                    </div>
                    <span className="grid size-10 place-items-center rounded-2xl bg-warning/12 text-warning">
                      <HugeiconsIcon icon={Invoice01Icon} />
                    </span>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold tabular-nums">
                      {money(subscription.amount)}
                    </p>
                    <p className="text-caption mt-2 flex items-center gap-1.5 tabular-nums">
                      <HugeiconsIcon icon={Calendar03Icon} className="size-3.5" />{" "}
                      {subscription.next_due_date}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {data.subscriptions.length === 0 && (
            <Empty icon={Invoice01Icon} text="Belum ada langganan rutin." />
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
          data: { categoryId: String(form.get("category")), amount: Number(form.get("amount")) },
        })
      }
      close={close}
      id="budget-form"
    >
      <FormField label="Kategori">
        <CategorySelect categories={categories} name="category" required />
      </FormField>
      <FormField label="Batas per siklus">
        <Input min="1" name="amount" placeholder="0" required type="number" />
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
            targetAmount: Number(form.get("amount")),
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
        <Input min="1" name="amount" required type="number" />
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
            amount: Number(form.get("amount")),
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
        <Input min="1" name="amount" required type="number" />
      </FormField>
      <FormField label={direction === "deposit" ? "Ambil dari dompet" : "Kirim ke dompet"}>
        <WalletSelect name="wallet" required wallets={wallets} />
      </FormField>
    </MutationForm>
  )
}

function DebtForm({ close }: { close: () => void }) {
  return (
    <MutationForm
      action={(form) =>
        createDebt({
          data: {
            type: form.get("type") === "hutang" ? "hutang" : "piutang",
            contact: String(form.get("contact")),
            amount: Number(form.get("amount")),
            dueDate: String(form.get("date")),
            note: String(form.get("note")),
          },
        })
      }
      close={close}
      id="debt-form"
    >
      <FormField label="Jenis">
        <Select name="type">
          <option value="piutang">Piutang — saya meminjamkan</option>
          <option value="hutang">Hutang — saya meminjam</option>
        </Select>
      </FormField>
      <FormField label="Nama kontak">
        <Input name="contact" required />
      </FormField>
      <FormField label="Nominal">
        <Input min="1" name="amount" required type="number" />
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

function SubscriptionForm({
  wallets,
  categories,
  close,
}: {
  wallets: Wallet[]
  categories: Category[]
  close: () => void
}) {
  return (
    <MutationForm
      action={(form) =>
        createSubscription({
          data: {
            name: String(form.get("name")),
            amount: Number(form.get("amount")),
            walletId: String(form.get("wallet")),
            categoryId: String(form.get("category")),
            nextDueDate: String(form.get("date")),
          },
        })
      }
      close={close}
      id="subscription-form"
    >
      <FormField label="Nama layanan">
        <Input name="name" placeholder="Contoh: Spotify" required />
      </FormField>
      <FormField label="Nominal">
        <Input min="1" name="amount" required type="number" />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Dompet">
          <WalletSelect name="wallet" placeholder="Tanpa dompet" wallets={wallets} />
        </FormField>
        <FormField label="Kategori">
          <CategorySelect categories={categories} name="category" placeholder="Tanpa kategori" />
        </FormField>
      </div>
      <FormField label="Tagihan berikutnya">
        <Input defaultValue={today()} name="date" required type="date" />
      </FormField>
    </MutationForm>
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
