import type { PaypalTransaction } from "@/types"

/** First three characters of PayPal's event code give the transaction family. */
const EVENT_FAMILY_LABELS: Record<string, string> = {
  T00: "Paiement",
  T01: "Frais",
  T02: "Conversion de devise",
  T03: "Dépôt depuis la banque",
  T04: "Virement vers la banque",
  T05: "Carte de débit",
  T06: "Carte de crédit",
  T07: "Carte de crédit",
  T11: "Remboursement",
  T12: "Ajustement",
  T15: "Litige",
  T17: "Retrait",
  T20: "Transfert",
  T21: "Réserve",
  T22: "Transfert",
}

export function paypalTypeLabel(t: PaypalTransaction): string {
  const family = t.eventCode.slice(0, 3)
  if (family === "T00") return t.amount >= 0 ? "Paiement reçu" : "Paiement envoyé"
  return EVENT_FAMILY_LABELS[family] ?? "Autre"
}

export const PAYPAL_STATUS_LABELS: Record<string, string> = {
  S: "Terminé",
  P: "En attente",
  D: "Refusé",
  V: "Annulé",
}

export const PAYPAL_STATUS_BADGE: Record<string, string> = {
  S: "bg-status-good/10 text-status-good border-status-good/25",
  P: "bg-status-warning/10 text-amber-700 dark:text-status-warning border-status-warning/30",
  D: "bg-status-critical/10 text-status-critical border-status-critical/25",
  V: "bg-muted text-muted-foreground border-border",
}

/** A completed payment received from someone: the kind worth recording in SkyCRM. */
export function isReceivedPayment(t: PaypalTransaction): boolean {
  return t.eventCode.startsWith("T00") && t.amount > 0 && t.status === "S"
}

export type PaypalMatchState = "todo" | "recorded" | "ignored" | "other"

/**
 * `paiementIds` are the payments that still exist: a transaction whose
 * payment was deleted in SkyCRM goes back to "to reconcile".
 */
export function paypalMatchState(t: PaypalTransaction, paiementIds: Set<string>): PaypalMatchState {
  if (t.paiementId && paiementIds.has(t.paiementId)) return "recorded"
  if (t.ignored) return "ignored"
  return isReceivedPayment(t) ? "todo" : "other"
}

export const normalizeEmail = (email?: string) => email?.trim().toLowerCase() ?? ""
