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

export interface Expense {
  id: ID
  label: string
  amount: number
  date: string
  category?: string
  createdAt: string
}

export type ExpenseInput = Omit<Expense, "id" | "createdAt">

export type ThemeMode = "light" | "dark" | "system"

export interface BusinessSettings {
  businessName: string
  logo?: string
  phone?: string
  email?: string
  currency: string
  accentColor: string
  themeMode: ThemeMode
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
