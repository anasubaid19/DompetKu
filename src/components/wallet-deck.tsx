import { ChevronDownIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { WalletDialog } from "@/components/finance-dialogs"
import { WalletLogo } from "@/components/finance-visuals"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { walletCardFace } from "@/lib/finance-options"
import type { Wallet } from "@/lib/finance-types"
import { cn, formatMoney } from "@/lib/utils"

const CARD_H = 150
const PEEK = 20
const SPREAD = 64
const POCKET_H = 190
const LIFT = 34
const TOP = 12

export function WalletDeck({
  wallets,
  balance,
  currency,
  hidden,
}: {
  wallets: Wallet[]
  balance: number
  currency: string
  hidden: boolean
}) {
  const [open, setOpen] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const deck = wallets
  const money = (value: number) => (hidden ? "••••••" : formatMoney(value, currency))
  const height = TOP + deck.length * PEEK + POCKET_H + 6
  const grown = height + Math.max(0, deck.length - 1) * (SPREAD - PEEK) + LIFT

  return (
    <Card className="order-first xl:order-last">
      <CardHeader>
        <div>
          <CardTitle>Dompet</CardTitle>
          <CardDescription>{wallets.length} sumber dana aktif</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="relative w-full overflow-hidden rounded-[36px] border-[3px] motion-reduce:transition-none"
          style={{
            backgroundColor: "#0A0A0A",
            borderColor: "rgba(255,255,255,0.16)",
            height: open ? grown : height,
            transition: "height 600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          {deck.map((wallet, index) => {
            const face = walletCardFace(wallet.icon, wallet.color)
            const fromFront = deck.length - 1 - index
            const y = TOP + index * (open ? SPREAD : PEEK)
            const tilt = open ? (index - (deck.length - 1) / 2) * 3.5 : 0
            const scale = open ? 1 : 1 - fromFront * 0.03
            return (
              <div
                aria-hidden
                className="pointer-events-none absolute rounded-2xl border motion-reduce:transition-none"
                key={wallet.id}
                style={{
                  backgroundImage: `linear-gradient(135deg, ${face.from} 0%, ${face.to} 100%)`,
                  borderColor:
                    face.ink === "#FFFFFF" ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)",
                  color: face.ink,
                  height: CARD_H,
                  left: 24,
                  top: 0,
                  transform: `translateY(${y}px) rotate(${tilt}deg) scale(${scale})`,
                  transformOrigin: "50% 0%",
                  transition: "transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                  width: "calc(100% - 48px)",
                  zIndex: index + 1,
                }}
              >
                <div className="flex h-full flex-col p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-extrabold uppercase italic tracking-wide"
                        title={wallet.name}
                      >
                        {wallet.name}
                      </p>
                      <p className="mt-0.5 text-xs font-medium tabular-nums opacity-80">
                        {money(wallet.balance)}
                      </p>
                    </div>
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/90">
                      <WalletLogo className="size-4" wallet={wallet} />
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          <button
            aria-expanded={open}
            aria-label={`Dompet, Total saldo ${money(balance)}`}
            className="absolute inset-x-1.5 bottom-1.5 flex h-[190px] flex-col items-center justify-center overflow-hidden rounded-[26px] outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            onClick={() => setOpen((value) => !value)}
            style={{
              backgroundImage:
                "linear-gradient(160deg, #1C1C1C 0%, #050505 45%, rgba(255,107,122,0.55) 100%)",
              boxShadow: "0px 24px 48px rgba(0, 0, 0, 0.55)",
              zIndex: 10,
            }}
            type="button"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-2 rounded-[22px] border border-dashed"
              style={{ borderColor: "rgba(255,255,255,0.28)" }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-[26px]"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 100%)",
              }}
            />
            <span className="text-sm" style={{ color: "#A1A1A1" }}>
              Total saldo
            </span>
            <span
              className="mt-1 max-w-full px-4 text-center text-[clamp(1.25rem,3.4vw,1.75rem)] font-semibold leading-tight tabular-nums whitespace-nowrap"
              style={{ color: "#EDEDED" }}
            >
              {money(balance)}
            </span>
          </button>
        </div>

        {wallets.length > 0 && (
          <div className="mt-4">
            <button
              aria-expanded={listOpen}
              className="flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setListOpen((value) => !value)}
              type="button"
            >
              <span>{listOpen ? "Sembunyikan daftar dompet" : "Tampilkan daftar dompet"}</span>
              <HugeiconsIcon
                aria-hidden
                className={cn(
                  "size-4 transition-transform duration-fast",
                  listOpen ? "rotate-180" : "rotate-0",
                )}
                icon={ChevronDownIcon}
              />
            </button>
            {listOpen && (
              <ul className="mt-1 grid grid-cols-1 gap-1">
                {wallets.map((wallet) => (
                  <li
                    className="flex min-w-0 items-center gap-3 rounded-2xl bg-secondary/55 p-2.5"
                    key={wallet.id}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-card text-primary shadow-sm">
                      <WalletLogo wallet={wallet} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={wallet.name}>
                        {wallet.name}
                      </p>
                      <p className="text-caption">
                        {wallet.type === "saving" ? "Tabungan" : "Harian"}
                      </p>
                    </div>
                    <p className="min-w-0 text-sm font-semibold tabular-nums break-words text-right">
                      {money(wallet.balance)}
                    </p>
                    <WalletDialog wallet={wallet} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
