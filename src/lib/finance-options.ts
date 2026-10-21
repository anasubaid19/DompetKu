export const CATEGORY_COLORS = [
  {
    value: "orange",
    label: "Jingga",
    className: "bg-orange-500",
    chart: "var(--color-orange-500)",
  },
  { value: "blue", label: "Biru", className: "bg-blue-500", chart: "var(--color-blue-500)" },
  { value: "violet", label: "Ungu", className: "bg-violet-500", chart: "var(--color-violet-500)" },
  { value: "red", label: "Merah", className: "bg-red-500", chart: "var(--color-red-500)" },
  {
    value: "green",
    label: "Hijau",
    className: "bg-emerald-500",
    chart: "var(--color-emerald-500)",
  },
  { value: "cyan", label: "Sian", className: "bg-cyan-500", chart: "var(--color-cyan-500)" },
  { value: "pink", label: "Merah muda", className: "bg-pink-500", chart: "var(--color-pink-500)" },
  { value: "yellow", label: "Kuning", className: "bg-amber-400", chart: "var(--color-amber-400)" },
] as const

export function categoryChartColor(value: string | undefined) {
  if (!value) return "var(--muted-foreground)"
  return (
    CATEGORY_COLORS.find((option) => option.value === value)?.chart ?? "var(--muted-foreground)"
  )
}

const WALLET_FALLBACK_COLORS: Record<string, string> = {
  violet: "#7C3AED",
  blue: "#2563EB",
  green: "#059669",
  orange: "#EA580C",
  red: "#DC2626",
  cyan: "#0891B2",
  pink: "#DB2777",
  yellow: "#D97706",
}

const INSTITUTION_COLORS: Record<string, string> = {
  bca: "#0060AF",
  mandiri: "#003D79",
  bri: "#00529C",
  bni: "#F15A22",
  danamon: "#E4002B",
  "cimb-niaga": "#7A1B2E",
  "ocbc-nisp": "#D0021B",
  bsi: "#00A39D",
  permata: "#00A19A",
  "kb-bukopin": "#FFC20E",
  btn: "#005BAA",
  jago: "#F58220",
  seabank: "#F47B20",
  neobank: "#00AEEF",
  mega: "#E4002B",
  "bank-raya": "#00A651",
  "bank-mayapada": "#6A2C91",
  gopay: "#00AED6",
  ovo: "#4C3494",
  dana: "#118EEA",
  shopeepay: "#EE4D2D",
  linkaja: "#E82529",
}

function shadeHex(hex: string, factor: number) {
  const value = Number.parseInt(hex.slice(1), 16)
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255]
  return `#${channels
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel * factor))))
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`
}

function hexLuminance(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16)
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
    const ratio = channel / 255
    return ratio <= 0.04045 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function walletCardFace(icon: string, color: string) {
  const base = INSTITUTION_COLORS[icon] ?? WALLET_FALLBACK_COLORS[color] ?? "#7C3AED"
  return {
    from: base,
    to: shadeHex(base, 0.68),
    ink: hexLuminance(base) > 0.55 ? "#111111" : "#FFFFFF",
  }
}

export const SEED_CATEGORIES = [
  ["Makanan", "expense", "orange", "receipt"],
  ["Transportasi", "expense", "blue", "car"],
  ["Belanja", "expense", "violet", "bag"],
  ["Tagihan", "expense", "red", "invoice"],
  ["Gaji", "income", "green", "money"],
  ["Bonus", "income", "cyan", "sparkles"],
  ["Bayar Hutang", "expense", "red", "invoice"],
  ["Piutang Dibayar", "income", "green", "money"],
] as const

export function isSeedCategory(name: string, type: string) {
  return SEED_CATEGORIES.some(([seedName, seedType]) => seedName === name && seedType === type)
}

export const CATEGORY_ICONS = [
  { value: "receipt", label: "Struk" },
  { value: "car", label: "Transportasi" },
  { value: "bag", label: "Belanja" },
  { value: "invoice", label: "Tagihan" },
  { value: "money", label: "Uang" },
  { value: "sparkles", label: "Bonus" },
  { value: "food", label: "Makanan" },
  { value: "home", label: "Rumah" },
  { value: "health", label: "Kesehatan" },
  { value: "education", label: "Pendidikan" },
  { value: "gift", label: "Hadiah" },
  { value: "game", label: "Hiburan" },
] as const

type FinancialInstitution = {
  value: string
  label: string
  logo: string
  darkLogo?: string
  group: "Bank" | "E-wallet"
}

export const FINANCIAL_INSTITUTIONS: readonly FinancialInstitution[] = [
  { value: "bca", label: "BCA", logo: "/banks/bca.svg", group: "Bank" },
  { value: "mandiri", label: "Mandiri", logo: "/banks/mandiri.svg", group: "Bank" },
  { value: "bri", label: "BRI", logo: "/banks/bri.svg", group: "Bank" },
  { value: "bni", label: "BNI", logo: "/banks/bni.svg", group: "Bank" },
  {
    value: "danamon",
    label: "Danamon",
    logo: "/banks/danamon.svg",
    darkLogo: "/banks/danamon-light.svg",
    group: "Bank",
  },
  {
    value: "cimb-niaga",
    label: "CIMB Niaga",
    logo: "/banks/cimb-niaga.svg",
    darkLogo: "/banks/cimb-niaga-light.svg",
    group: "Bank",
  },
  { value: "ocbc-nisp", label: "OCBC", logo: "/banks/ocbc-nisp.svg", group: "Bank" },
  { value: "bsi", label: "BSI", logo: "/banks/bsi.svg", group: "Bank" },
  {
    value: "permata",
    label: "PermataBank",
    logo: "/banks/permata.svg",
    darkLogo: "/banks/permata-light.svg",
    group: "Bank",
  },
  {
    value: "kb-bukopin",
    label: "KB Bank",
    logo: "/banks/kb-bukopin.svg",
    darkLogo: "/banks/kb-bukopin-light.svg",
    group: "Bank",
  },
  { value: "btn", label: "BTN", logo: "/banks/btn.svg", group: "Bank" },
  {
    value: "jago",
    label: "Bank Jago",
    logo: "/banks/jago.svg",
    darkLogo: "/banks/jago-light.svg",
    group: "Bank",
  },
  { value: "seabank", label: "SeaBank", logo: "/banks/seabank.svg", group: "Bank" },
  { value: "neobank", label: "Bank Neo", logo: "/banks/neobank.svg", group: "Bank" },
  {
    value: "mega",
    label: "Bank Mega",
    logo: "/banks/mega.svg",
    darkLogo: "/banks/mega-light.svg",
    group: "Bank",
  },
  { value: "bank-raya", label: "Bank Raya", logo: "/banks/bank-raya.svg", group: "Bank" },
  {
    value: "bank-mayapada",
    label: "Bank Mayapada",
    logo: "/banks/bank-mayapada.svg",
    darkLogo: "/banks/bank-mayapada-light.svg",
    group: "Bank",
  },
  {
    value: "gopay",
    label: "GoPay",
    logo: "/banks/gopay.svg",
    darkLogo: "/banks/gopay-light.svg",
    group: "E-wallet",
  },
  { value: "ovo", label: "OVO", logo: "/banks/ovo.svg", group: "E-wallet" },
  { value: "dana", label: "DANA", logo: "/banks/dana.svg", group: "E-wallet" },
  {
    value: "shopeepay",
    label: "ShopeePay",
    logo: "/banks/shopeepay.svg",
    group: "E-wallet",
  },
  { value: "linkaja", label: "LinkAja", logo: "/banks/linkaja.svg", group: "E-wallet" },
] as const

export function isCategoryColor(value: string) {
  return CATEGORY_COLORS.some((option) => option.value === value)
}

export function isCategoryIcon(value: string) {
  return CATEGORY_ICONS.some((option) => option.value === value)
}

export function isFinancialInstitution(value: string) {
  return FINANCIAL_INSTITUTIONS.some((option) => option.value === value)
}
