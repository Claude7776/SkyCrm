import type { ExpenseRecurrence, Paiement, PaymentStatus, Prestation, PrestationStatus } from "@/types"

export const PRESTATION_STATUS_LABELS: Record<PrestationStatus, string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
}

export const EXPENSE_RECURRENCE_LABELS: Record<ExpenseRecurrence, string> = {
  none: "Aucune",
  daily: "Quotidienne",
  weekly: "Hebdomadaire",
  monthly: "Mensuelle",
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Impayé",
  partial: "Partiel",
  paid: "Payé",
}

export const PRESTATION_STATUS_BADGE: Record<PrestationStatus, string> = {
  todo: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-chart-1/10 text-chart-1 border-chart-1/25",
  done: "bg-status-good/10 text-status-good border-status-good/25",
}

export const PAYMENT_STATUS_BADGE: Record<PaymentStatus, string> = {
  unpaid: "bg-status-critical/10 text-status-critical border-status-critical/25",
  partial: "bg-status-warning/10 text-amber-700 dark:text-status-warning border-status-warning/30",
  paid: "bg-status-good/10 text-status-good border-status-good/25",
}

export function totalPaidFor(prestationId: string, paiements: Paiement[]): number {
  return paiements
    .filter((p) => p.prestationId === prestationId)
    .reduce((sum, p) => sum + p.amount, 0)
}

export function computePaymentStatus(
  prestation: Prestation,
  paiements: Paiement[]
): PaymentStatus {
  const paid = totalPaidFor(prestation.id, paiements)
  if (paid <= 0) return "unpaid"
  if (paid >= prestation.price) return "paid"
  return "partial"
}

export function remainingAmount(prestation: Prestation, paiements: Paiement[]): number {
  const paid = totalPaidFor(prestation.id, paiements)
  return Math.max(prestation.price - paid, 0)
}
