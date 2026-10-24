export type Wallet = {
  id: string
  name: string
  type: "daily" | "saving"
  balance: number
  color: string
  icon: string
}

export type Category = {
  id: string
  name: string
  type: "income" | "expense"
  color: string
  icon: string
  parent_id: string | null
}

export type FinanceTransaction = {
  id: string
  type: "income" | "expense" | "transfer"
  amount: number
  fee: number
  wallet_id: string
  target_wallet_id: string | null
  category_id: string | null
  saving_id: string | null
  debt_id: string | null
  description: string
  transaction_date: string
  category_name: string | null
  wallet_name: string
  target_wallet_name: string | null
}

export type Debt = {
  id: string
  type: "hutang" | "piutang"
  contact: string
  amount: number
  paid_amount: number
  due_date: string | null
  note: string
  status: "active" | "paid"
}

export type DebtState = Pick<Debt, "amount" | "paid_amount" | "status">

export type Budget = {
  id: string
  category_id: string
  amount: number
  category_name: string
  category_color: string
}

export type WalletBudget = {
  id: string
  wallet_id: string
  amount: number
  wallet_name: string
}

export type Saving = {
  id: string
  name: string
  target_amount: number
  saved_amount: number
  wallet_id: string | null
  color: string
  target_date: string | null
  wallet_name: string | null
}

export type Subscription = {
  id: string
  name: string
  amount: number
  wallet_id: string | null
  category_id: string | null
  next_due_date: string
  interval_months: number
  direction: "expense" | "income"
  active: number
  wallet_name: string | null
  category_name: string | null
}

export type Settings = {
  currency: string
  cycle_start: number
  cycle_length: number
  accent: string
  hide_balance: number
}

export type FinanceData = {
  wallets: Wallet[]
  categories: Category[]
  transactions: FinanceTransaction[]
  debts: Debt[]
  budgets: Budget[]
  walletBudgets: WalletBudget[]
  savings: Saving[]
  subscriptions: Subscription[]
  settings: Settings
}

export type LedgerEntry = {
  type: "income" | "expense" | "transfer"
  amount: number
  fee: number
  walletId: string
  targetWalletId: string | null
}

export type CategoryTreeNode = Category & { children: CategoryTreeNode[] }

export function nextDebtState(
  debt: DebtState,
  operation: { type: "add" | "pay"; amount: number },
): DebtState {
  if (operation.type === "add") {
    const amount = debt.amount + operation.amount
    return {
      amount,
      paid_amount: debt.paid_amount,
      status: debt.paid_amount >= amount ? "paid" : "active",
    }
  }
  const paidAmount = debt.paid_amount + operation.amount
  if (paidAmount > debt.amount) throw new Error("Nominal cicilan melebihi sisa kewajiban")
  return {
    amount: debt.amount,
    paid_amount: paidAmount,
    status: paidAmount >= debt.amount ? "paid" : "active",
  }
}

export function calculateLedgerBalances(
  initial: Record<string, number>,
  previous: LedgerEntry | null,
  next: LedgerEntry | null,
) {
  const balances = { ...initial }
  const apply = (entry: LedgerEntry, direction: 1 | -1) => {
    const change = (walletId: string, amount: number) => {
      if (!(walletId in balances)) throw new Error("Dompet tidak ditemukan")
      balances[walletId] += amount * direction
    }

    if (entry.type === "income") change(entry.walletId, entry.amount)
    if (entry.type === "expense") change(entry.walletId, -entry.amount)
    if (entry.type === "transfer") {
      if (!entry.targetWalletId) throw new Error("Dompet tujuan tidak ditemukan")
      change(entry.walletId, -(entry.amount + entry.fee))
      change(entry.targetWalletId, entry.amount)
    }
  }

  if (previous) apply(previous, -1)
  if (next) apply(next, 1)
  if (Object.values(balances).some((balance) => balance < 0)) {
    throw new Error("Saldo dompet tidak mencukupi")
  }
  return balances
}

export function requiredText(value: unknown, label: string, max = 100) {
  if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > max) {
    throw new Error(`${label} tidak valid`)
  }
  return value.trim()
}

export function optionalText(value: unknown, max = 240) {
  if (value == null || value === "") return ""
  if (typeof value !== "string" || value.length > max) throw new Error("Teks tidak valid")
  return value.trim()
}

export function positiveMoney(value: unknown, label = "Nominal") {
  const amount = Number(value)
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 100_000_000_000_000) {
    throw new Error(`${label} tidak valid`)
  }
  return amount
}

export function getCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>()
  const roots: CategoryTreeNode[] = []
  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] })
  }
  for (const cat of categories) {
    const node = map.get(cat.id)
    if (!node) continue
    if (cat.parent_id) {
      const parent = map.get(cat.parent_id)
      if (parent) parent.children.push(node)
      else roots.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

export function flattenCategoryTree(tree: CategoryTreeNode[]): Category[] {
  const result: Category[] = []
  function walk(nodes: CategoryTreeNode[]) {
    for (const node of nodes) {
      const { children, ...cat } = node
      result.push(cat)
      if (children.length > 0) walk(children)
    }
  }
  walk(tree)
  return result
}

export function getCategoryAndDescendantsIds(categories: Category[], categoryId: string): string[] {
  const ids = [categoryId]
  const cat = categories.find((c) => c.id === categoryId)
  if (!cat) return ids
  const children = categories.filter((c) => c.parent_id === categoryId)
  for (const child of children) {
    ids.push(...getCategoryAndDescendantsIds(categories, child.id))
  }
  return ids
}

export function getRootCategory(
  categories: Category[],
  categoryId: string | null | undefined,
): Category | null {
  if (!categoryId) return null
  const cat = categories.find((c) => c.id === categoryId)
  if (!cat) return null
  if (!cat.parent_id) return cat
  return getRootCategory(categories, cat.parent_id)
}
