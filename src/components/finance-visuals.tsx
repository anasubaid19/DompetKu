import {
  BookOpen01Icon,
  Car01Icon,
  GameController01Icon,
  GiftIcon,
  HealthIcon,
  Home01Icon,
  Invoice01Icon,
  Money01Icon,
  ReceiptIcon,
  Restaurant01Icon,
  ShoppingBag01Icon,
  SparklesIcon,
  Tag01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { Select } from "@/components/ui/select"
import type { Category, Wallet } from "@/lib/finance.functions"
import { CATEGORY_COLORS, FINANCIAL_INSTITUTIONS } from "@/lib/finance-options"
import { cn } from "@/lib/utils"

const categoryIcons: Record<string, typeof ReceiptIcon> = {
  receipt: ReceiptIcon,
  car: Car01Icon,
  bag: ShoppingBag01Icon,
  invoice: Invoice01Icon,
  money: Money01Icon,
  sparkles: SparklesIcon,
  food: Restaurant01Icon,
  home: Home01Icon,
  health: HealthIcon,
  education: BookOpen01Icon,
  gift: GiftIcon,
  game: GameController01Icon,
}

function InstitutionLogo({
  institution,
  className,
}: {
  institution: (typeof FINANCIAL_INSTITUTIONS)[number]
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex h-5 w-8 shrink-0 items-center justify-center", className)}
    >
      <img
        alt=""
        className={cn("size-full object-contain", institution.darkLogo && "dark:hidden")}
        src={institution.logo}
      />
      {institution.darkLogo && (
        <img
          alt=""
          className="hidden size-full object-contain dark:block"
          src={institution.darkLogo}
        />
      )}
    </span>
  )
}

export function CategoryIndicator({
  category,
  className,
}: {
  category: Pick<Category, "color" | "icon">
  className?: string
}) {
  const color = CATEGORY_COLORS.find((option) => option.value === category.color)
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center gap-1.5", className)}>
      <HugeiconsIcon
        className="size-4 text-muted-foreground"
        icon={categoryIcons[category.icon] ?? Tag01Icon}
      />
      <span className={cn("size-2 rounded-full", color?.className ?? "bg-violet-500")} />
    </span>
  )
}

export function CategoryLabel({
  category,
  className,
}: {
  category: Pick<Category, "name" | "color" | "icon">
  className?: string
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <CategoryIndicator category={category} />
      <span className="truncate">{category.name}</span>
    </span>
  )
}

export function WalletLogo({
  wallet,
  className,
}: {
  wallet: Pick<Wallet, "icon" | "type">
  className?: string
}) {
  const institution = FINANCIAL_INSTITUTIONS.find((option) => option.value === wallet.icon)
  if (institution) {
    return <InstitutionLogo className={className} institution={institution} />
  }
  return (
    <HugeiconsIcon
      aria-hidden
      className={cn("size-5", className)}
      icon={wallet.type === "saving" ? Money01Icon : Wallet01Icon}
    />
  )
}

export function WalletLabel({ wallet, className }: { wallet: Wallet; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <WalletLogo className="size-4" wallet={wallet} />
      <span className="truncate">{wallet.name}</span>
    </span>
  )
}

export function CategorySelect({
  categories,
  defaultValue = "",
  name,
  placeholder = "Pilih kategori",
  required,
}: {
  categories: Category[]
  defaultValue?: string | null
  name: string
  placeholder?: string
  required?: boolean
}) {
  const [value, setValue] = useState(defaultValue ?? "")
  const selected = categories.find((category) => category.id === value)
  return (
    <div className="relative">
      {selected && (
        <CategoryIndicator
          category={selected}
          className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2"
        />
      )}
      <Select
        className={selected && "[&_select]:pl-[4.25rem]"}
        name={name}
        onChange={(event) => setValue(event.target.value)}
        required={required}
        value={value}
      >
        <option value="">{placeholder}</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
    </div>
  )
}

export function WalletSelect({
  wallets,
  defaultValue = "",
  name,
  placeholder = "Pilih dompet",
  required,
}: {
  wallets: Wallet[]
  defaultValue?: string | null
  name: string
  placeholder?: string
  required?: boolean
}) {
  const [value, setValue] = useState(defaultValue ?? "")
  const selected = wallets.find((wallet) => wallet.id === value)
  return (
    <div className="relative">
      {selected && (
        <WalletLogo
          wallet={selected}
          className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2"
        />
      )}
      <Select
        className={selected && "[&_select]:pl-12"}
        name={name}
        onChange={(event) => setValue(event.target.value)}
        required={required}
        value={value}
      >
        <option value="">{placeholder}</option>
        {wallets.map((wallet) => (
          <option key={wallet.id} value={wallet.id}>
            {wallet.name}
          </option>
        ))}
      </Select>
    </div>
  )
}

export function InstitutionSelect({
  defaultValue = "wallet",
  name = "icon",
}: {
  defaultValue?: string
  name?: string
}) {
  const [value, setValue] = useState(defaultValue)
  const institution = FINANCIAL_INSTITUTIONS.find((option) => option.value === value)
  return (
    <div className="relative">
      {institution && (
        <InstitutionLogo
          className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-6 -translate-y-1/2 object-contain"
          institution={institution}
        />
      )}
      <Select
        className={institution && "[&_select]:pl-12"}
        name={name}
        onChange={(event) => setValue(event.target.value)}
        value={value}
      >
        <option value="wallet">Tanpa logo</option>
        <optgroup label="Bank">
          {FINANCIAL_INSTITUTIONS.filter((option) => option.group === "Bank").map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </optgroup>
        <optgroup label="E-wallet">
          {FINANCIAL_INSTITUTIONS.filter((option) => option.group === "E-wallet").map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </optgroup>
      </Select>
    </div>
  )
}

export { categoryIcons }
