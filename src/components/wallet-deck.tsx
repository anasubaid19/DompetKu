import { WalletDialog } from "@/components/finance-dialogs"
import { WalletLogo } from "@/components/finance-visuals"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { walletCardFace } from "@/lib/finance-options"
import type { Wallet } from "@/lib/finance-types"
import { formatMoney } from "@/lib/utils"

export function WalletDeck({
  wallets,
  currency,
  hidden,
}: {
  wallets: Wallet[]
  currency: string
  hidden: boolean
}) {
  const money = (value: number) => (hidden ? "••••••" : formatMoney(value, currency))

  if (wallets.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Dompet</CardTitle>
          <CardDescription>{wallets.length} sumber dana aktif</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {wallets.map((wallet) => {
              const face = walletCardFace(wallet.icon, wallet.color)
              return (
                <li
                  className="flex min-w-[150px] max-w-[180px] snap-start flex-col gap-2 rounded-2xl border border-border/60 bg-secondary/40 p-3"
                  key={wallet.id}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-xl"
                      style={{ backgroundColor: face.from, color: face.ink }}
                    >
                      <WalletLogo className="size-4" wallet={wallet} />
                    </span>
                    <p className="min-w-0 truncate text-sm font-medium" title={wallet.name}>
                      {wallet.name}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums break-words">
                    {money(wallet.balance)}
                  </p>
                  <p className="text-caption">{wallet.type === "saving" ? "Tabungan" : "Harian"}</p>
                </li>
              )
            })}
            <li className="flex min-w-[150px] max-w-[180px] snap-start">
              <WalletDialog className="flex h-full min-h-[96px] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 p-3 text-muted-foreground hover:bg-secondary/40" />
            </li>
          </ul>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent"
          />
        </div>
      </CardContent>
    </Card>
  )
}
