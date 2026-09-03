export const CATEGORY_COLORS = [
  { value: "orange", label: "Jingga", className: "bg-orange-500" },
  { value: "blue", label: "Biru", className: "bg-blue-500" },
  { value: "violet", label: "Ungu", className: "bg-violet-500" },
  { value: "red", label: "Merah", className: "bg-red-500" },
  { value: "green", label: "Hijau", className: "bg-emerald-500" },
  { value: "cyan", label: "Sian", className: "bg-cyan-500" },
  { value: "pink", label: "Merah muda", className: "bg-pink-500" },
  { value: "yellow", label: "Kuning", className: "bg-amber-400" },
] as const

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
