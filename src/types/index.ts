export type ID = string

export interface Client {
  id: ID
  name: string
  email?: string
  phone?: string
  company?: string
  address?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type ClientInput = Omit<Client, "id" | "createdAt" | "updatedAt">

export type PrestationStatus = "todo" | "in_progress" | "done"
export type PaymentStatus = "unpaid" | "partial" | "paid"

export interface Prestation {
  id: ID
  clientId: ID
  title: string
  description?: string
  price: number
  date: string
  dueDate?: string
  status: PrestationStatus
  createdAt: string
  updatedAt: string
}

export type PrestationInput = Omit<
  Prestation,
  "id" | "createdAt" | "updatedAt"
>

export interface Paiement {
  id: ID
  prestationId: ID
  amount: number
  date: string
  method?: string
  note?: string
  createdAt: string
}

export type PaiementInput = Omit<Paiement, "id" | "createdAt">

export type ExpenseRecurrence = "none" | "daily" | "weekly" | "monthly"

export interface Expense {
  id: ID
  label: string
  amount: number
  date: string
  category?: string
  recurrence?: ExpenseRecurrence
  recurringSourceId?: ID
  createdAt: string
}

export type ExpenseInput = Omit<Expense, "id" | "createdAt">

/** A transaction from the PayPal Business history (id is PayPal's transaction id). */
export interface PaypalTransaction {
  id: ID
  date: string
  /** PayPal event code, e.g. T0006 (payment received), T0400 (withdrawal to bank). */
  eventCode: string
  /** S completed, P pending, D denied, V reversed. */
  status: string
  /** Gross amount, negative for money going out. */
  amount: number
  /** PayPal fee, negative when charged. */
  fee: number
  currency: string
  payerEmail?: string
  payerName?: string
  description?: string
  invoiceId?: string
  /** SkyCRM payment this transaction was recorded as. */
  paiementId?: ID
  /** Expense the fee was recorded in. */
  expenseId?: ID
  ignored?: boolean
  createdAt: string
}

/** What PayPal provides; the rest is SkyCRM's own bookkeeping. */
export type PaypalTransactionData = Omit<
  PaypalTransaction,
  "paiementId" | "expenseId" | "ignored" | "createdAt"
>

export type ThemeMode = "light" | "dark" | "system"

export interface BusinessSettings {
  businessName: string
  logo?: string
  phone?: string
  email?: string
  /** Currency shown in the app; amounts are converted from `baseCurrency`. */
  currency: string
  /** Currency the amounts are stored in. Set once, on first load. */
  baseCurrency?: string
  accentColor: string
  themeMode: ThemeMode
  sendClientEmails: boolean
}

export interface ActivityItem {
  id: ID
  type: "client" | "prestation" | "paiement"
  label: string
  description: string
  date: string
  href?: string
}

export interface AppData {
  clients: Client[]
  prestations: Prestation[]
  paiements: Paiement[]
  expenses: Expense[]
  settings: BusinessSettings
  exportedAt: string
  version: number
}
