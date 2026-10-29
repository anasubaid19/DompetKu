import { ChevronDownIcon, PlusIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { WalletDialog } from "@/components/finance-dialogs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { walletCardFace } from "@/lib/finance-options"
import type { Wallet } from "@/lib/finance-types"
import { formatMoney } from "@/lib/utils"

const CARD_H = 110
const PEEK = 28
const SPREAD = 72
const POCKET_H = 112
const LIFT = 24
const TOP = 8

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

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
  const [entered, setEntered] = useState(false)
  const reduced = prefersReducedMotion()
  const money = (value: number) => (hidden ? "••••••" : formatMoney(value, currency))

  const sorted = [...wallets].sort((a, b) => b.balance - a.balance)
  // Always cap at 4 cards when >4 wallets: 3 wallets + "Lihat semua".
  const capped = sorted.length > 4
  const deck = capped ? sorted.slice(0, 3) : sorted
  const cards: Array<{ kind: "wallet"; wallet: Wallet } | { kind: "seeAll"; count: number }> =
    deck.map((wallet) => ({ kind: "wallet", wallet }))
  if (capped) cards.push({ kind: "seeAll", count: sorted.length })

  const n = cards.length
  const pocketTop = TOP + n * PEEK
  const closedHeight = pocketTop + POCKET_H
  const openHeight = closedHeight + Math.max(0, n - 1) * (SPREAD - PEEK) + LIFT

  useEffect(() => {
    if (reduced) {
      setEntered(true)
      return
    }
    const t = window.setTimeout(() => setEntered(true), 60)
    return () => window.clearTimeout(t)
  }, [reduced])

  function toggle() {
    if (!reduced) {
      try {
        navigator.vibrate?.(10)
      } catch {
        // ignore
      }
    }
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  if (wallets.length === 0) {
    return (
      <Card className="rounded-[28px] border-2 border-zinc-900/70 dark:border-zinc-700">
        <CardHeader>
          <div>
            <CardTitle>Dompet</CardTitle>
            <CardDescription>0 sumber dana aktif</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <WalletDialog
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground hover:bg-secondary/40"
            trigger={
              <>
                <HugeiconsIcon icon={PlusIcon} className="size-4" />
                Tambah dompet
              </>
            }
            variant="ghost"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-[28px] border-2 border-zinc-900/70 dark:border-zinc-700">
      <CardHeader>
        <div>
          <CardTitle>Dompet</CardTitle>
          <CardDescription>{wallets.length} sumber dana aktif</CardDescription>
        </div>
        <WalletDialog
          className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-medium text-foreground hover:bg-secondary/40"
          trigger={
            <>
              <HugeiconsIcon icon={PlusIcon} className="size-3.5" />
              Tambah
            </>
          }
          variant="ghost"
        />
      </CardHeader>
      <CardContent className="p-0">
        <div
          className="relative w-full overflow-hidden transition-[height] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
          style={{ height: open ? openHeight : closedHeight }}
        >
          {cards.map((card, index) => {
            const fromFront = n - 1 - index
            const closedY = TOP + index * PEEK
            const openY = TOP + index * SPREAD
            const tilt = open ? (index - (n - 1) / 2) * 2.5 : 0
            const scale = open ? 1 : 1 - fromFront * 0.03
            const y = open ? openY : closedY
            const isSeeAll = card.kind === "seeAll"
            const wallet = card.kind === "wallet" ? card.wallet : null
            const face = wallet ? walletCardFace(wallet.icon, wallet.color) : null
            const delay = reduced || entered ? 0 : index * 90

            const cardStyle: React.CSSProperties = {
              height: CARD_H,
              left: 8,
              width: "calc(100% - 16px)",
              zIndex: index + 1,
              transform: entered
                ? `translateY(${y}px) rotate(${tilt}deg) scale(${scale})`
                : `translateY(${closedY + 16}px) scale(0.92)`,
              opacity: entered ? 1 : 0,
              transformOrigin: "50% 0%",
              transition: reduced
                ? "none"
                : entered
                  ? "transform 420ms cubic-bezier(0.32,0.72,0,1), opacity 420ms ease"
                  : `transform 320ms cubic-bezier(0.32,0.72,0,1) ${delay}ms, opacity 320ms ease ${delay}ms`,
              pointerEvents: open ? "auto" : "none",
            }

            if (isSeeAll) {
              const c = card as { kind: "seeAll"; count: number }
              return (
                <Link
                  aria-label={`Lihat semua ${c.count} dompet`}
                  className="absolute rounded-2xl border border-dashed border-white/30 bg-zinc-900 p-4 text-left text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  key="see-all"
                  style={cardStyle}
                  to="/app/wallets"
                >
                  <p className="text-sm font-extrabold uppercase italic tracking-wide">
                    Lihat semua
                  </p>
                  <p className="mt-1 text-xs opacity-80">{c.count} dompet</p>
                </Link>
              )
            }

            if (!wallet || !face) return null
            const w = wallet
            const f = face
            return (
              <WalletDialog
                ariaLabel={`${w.name}, ${money(w.balance)}`}
                className="absolute rounded-2xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                key={w.id}
                size="default"
                style={{
                  ...cardStyle,
                  backgroundImage: `linear-gradient(135deg, ${f.from} 0%, ${f.to} 100%)`,
                  borderColor: f.ink === "#FFFFFF" ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)",
                  color: f.ink,
                }}
                trigger={
                  <div className="flex h-full flex-col justify-between">
                    {/* compact strip (visible when closed) */}
                    <div
                      className="flex items-center justify-between gap-2 transition-opacity duration-200"
                      style={{ opacity: open ? 0 : 1 }}
                    >
                      <p
                        className="min-w-0 truncate text-[12px] font-semibold uppercase leading-none tracking-wide"
                        style={{ lineHeight: 1, paddingTop: 6 }}
                        title={w.name}
                      >
                        {w.name}
                      </p>
                      <p
                        className="shrink-0 text-[12px] font-semibold tabular-nums leading-none"
                        style={{ lineHeight: 1, paddingTop: 6 }}
                      >
                        {money(w.balance)}
                      </p>
                    </div>
                    {/* full face (visible when open) */}
                    <div
                      className="transition-opacity duration-200"
                      style={{ opacity: open ? 1 : 0, marginTop: open ? 0 : -20 }}
                    >
                      <p
                        className="truncate text-sm font-extrabold uppercase italic tracking-wide"
                        title={w.name}
                      >
                        {w.name}
                      </p>
                    </div>
                    <div style={{ opacity: open ? 1 : 0 }}>
                      <p className="text-[clamp(1.1rem,3vw,1.5rem)] font-bold tabular-nums leading-tight">
                        {money(w.balance)}
                      </p>
                      <p className="mt-0.5 text-xs font-medium opacity-80">
                        {w.type === "saving" ? "Tabungan" : "Harian"}
                      </p>
                    </div>
                  </div>
                }
                variant="ghost"
                wallet={w}
              />
            )
          })}

          {/* Pocket */}
          <button
            aria-controls="wallet-cards"
            aria-expanded={open}
            aria-label={`Dompet, total saldo ${money(balance)}`}
            className="absolute inset-x-0 bottom-0 flex h-[112px] flex-col items-center justify-center overflow-hidden rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            onClick={toggle}
            style={{
              background: "linear-gradient(160deg, #1C1C1C 0%, #0A0A0A 45%, #3A1015 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
              zIndex: 10,
            }}
            type="button"
          >
            {/* shine lip */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-[14px]"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 100%)",
              }}
            />
            {/* dashed stitch inset */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-[8px] rounded-[14px] border border-dashed"
              style={{ borderColor: "rgba(255,255,255,0.28)" }}
            />
            <span className="relative text-sm" style={{ color: "#A1A1A1" }}>
              Total saldo
            </span>
            <span
              className="relative mt-1 max-w-full px-4 text-center text-[clamp(1.25rem,3.4vw,1.75rem)] font-semibold leading-tight tabular-nums whitespace-nowrap"
              style={{ color: "#EDEDED" }}
            >
              {money(balance)}
            </span>
            <span
              className="relative mt-2 inline-flex items-center gap-1 text-[11px] font-medium"
              style={{ color: "#A1A1A1" }}
            >
              <HugeiconsIcon
                aria-hidden
                className={`size-3 transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`}
                icon={ChevronDownIcon}
              />
              {open ? "Sembunyikan kartu" : "Tampilkan kartu"}
            </span>
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
