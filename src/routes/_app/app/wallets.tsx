import { Delete02Icon, Wallet01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { toast } from "sonner"
import { WalletDialog } from "@/components/finance-dialogs"
import { WalletLogo } from "@/components/finance-visuals"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { deleteWallet, getFinanceData } from "@/lib/finance.functions"
import { walletCardFace } from "@/lib/finance-options"
import { formatMoney } from "@/lib/utils"

export const Route = createFileRoute("/_app/app/wallets")({
  head: () => ({ meta: [{ title: "Dompet · DompetKu" }] }),
  loader: () => getFinanceData(),
  component: WalletsPage,
})

function WalletsPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const currency = data.settings.currency
  const hide = Boolean(data.settings.hide_balance)
  const money = (value: number) => (hide ? "••••••" : formatMoney(value, currency))

  async function remove(walletId: string) {
    try {
      await deleteWallet({ data: { id: walletId } })
      toast.success("Dompet dihapus.")
      await router.invalidate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus dompet.")
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 pb-14 lg:pb-0">
      <PageHeader
        action={<WalletDialog />}
        description="Kelola semua sumber dana Anda."
        eyebrow="Dompet"
        title="Daftar dompet"
      />
      {data.wallets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
              <HugeiconsIcon icon={Wallet01Icon} />
            </span>
            <p className="text-sm font-medium">Belum ada dompet</p>
            <WalletDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.wallets
            .slice()
            .sort((a, b) => b.balance - a.balance)
            .map((wallet) => {
              const face = walletCardFace(wallet.icon, wallet.color)
              return (
                <Card key={wallet.id}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-xl"
                      style={{ backgroundColor: face.from, color: face.ink }}
                    >
                      <WalletLogo className="size-5" wallet={wallet} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={wallet.name}>
                        {wallet.name}
                      </p>
                      <p className="text-caption">
                        {wallet.type === "saving" ? "Tabungan" : "Harian"}
                      </p>
                      <p className="mt-1 text-base font-semibold tabular-nums break-words">
                        {money(wallet.balance)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <WalletDialog wallet={wallet} />
                      <Button
                        aria-label={`Hapus ${wallet.name}`}
                        onClick={() => remove(wallet.id)}
                        size="icon"
                        variant="ghost"
                      >
                        <HugeiconsIcon icon={Delete02Icon} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      )}
      <div className="pt-2">
        <Link
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          to="/app"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}
