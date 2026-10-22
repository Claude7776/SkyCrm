import { Banknote, DollarSign, Euro, PoundSterling, SwissFranc, type LucideIcon } from "lucide-react"

export const CURRENCIES = [
  { value: "EUR", label: "Euro (€)", icon: Euro },
  { value: "USD", label: "Dollar US ($)", icon: DollarSign },
  { value: "GBP", label: "Livre sterling (£)", icon: PoundSterling },
  { value: "CHF", label: "Franc suisse (CHF)", icon: SwissFranc },
  { value: "CAD", label: "Dollar canadien (CAD)", icon: DollarSign },
] as const

export function currencyIcon(code: string): LucideIcon {
  return CURRENCIES.find((c) => c.value === code)?.icon ?? Banknote
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100
}

/** "€", "$", "£", "CHF"… as rendered by the French locale. */
export function currencySymbol(code: string): string {
  const parts = new Intl.NumberFormat("fr-FR", { style: "currency", currency: code }).formatToParts(0)
  return parts.find((p) => p.type === "currency")?.value ?? code
}
