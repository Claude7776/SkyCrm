import type { ExpenseRecurrence, PrestationStatus } from "@/types"

export type ImportEntityType = "clients" | "prestations" | "paiements" | "expenses"

export function normalizeHeader(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

const CLIENT_ALIASES: Record<string, string[]> = {
  name: ["nom", "name", "nom complet", "full name"],
  email: ["email", "e-mail", "mail", "courriel"],
  phone: ["telephone", "tel", "phone", "portable", "mobile"],
  company: ["entreprise", "societe", "company"],
  address: ["adresse", "address"],
  notes: ["notes", "note", "commentaire", "commentaires"],
}

const PRESTATION_ALIASES: Record<string, string[]> = {
  title: ["titre", "title"],
  clientName: ["client"],
  price: ["prix", "montant", "price"],
  date: ["date"],
  dueDate: ["echeance", "date limite", "due date"],
  status: ["statut", "status"],
  description: ["description"],
}

const PAIEMENT_ALIASES: Record<string, string[]> = {
  prestationTitle: ["prestation"],
  clientName: ["client"],
  amount: ["montant", "amount"],
  method: ["methode", "method", "moyen de paiement"],
  date: ["date"],
  note: ["note", "notes"],
}

const EXPENSE_ALIASES: Record<string, string[]> = {
  label: ["libelle", "label", "intitule"],
  amount: ["montant", "amount"],
  date: ["date"],
  category: ["categorie", "category"],
  recurrence: ["recurrence", "repetition"],
}

export const ENTITY_ALIASES: Record<ImportEntityType, Record<string, string[]>> = {
  clients: CLIENT_ALIASES,
  prestations: PRESTATION_ALIASES,
  paiements: PAIEMENT_ALIASES,
  expenses: EXPENSE_ALIASES,
}

/** Header that, if present, uniquely identifies a sheet as this entity type. */
const ANCHOR_ALIASES: Record<ImportEntityType, string[]> = {
  clients: CLIENT_ALIASES.name,
  prestations: PRESTATION_ALIASES.title,
  paiements: PAIEMENT_ALIASES.prestationTitle,
  expenses: EXPENSE_ALIASES.label,
}

export function matchColumns(
  headerRow: unknown[],
  aliases: Record<string, string[]>
): Record<string, number> {
  const normalized = headerRow.map((h) => normalizeHeader(String(h ?? "")))
  const result: Record<string, number> = {}
  for (const [field, candidates] of Object.entries(aliases)) {
    const index = normalized.findIndex((h) => candidates.includes(h))
    if (index !== -1) result[field] = index
  }
  return result
}

/** Detects which entity a sheet represents from its header row, or null if unrecognized. */
export function detectEntityType(headerRow: unknown[]): ImportEntityType | null {
  const normalized = headerRow.map((h) => normalizeHeader(String(h ?? "")))
  const matches = (Object.keys(ANCHOR_ALIASES) as ImportEntityType[]).filter((type) =>
    ANCHOR_ALIASES[type].some((alias) => normalized.includes(alias))
  )
  return matches.length === 1 ? matches[0] : null
}

export function isEmptyRow(row: unknown[]): boolean {
  return row.every((cell) => cell === null || cell === undefined || cell === "")
}

export function getCellRaw(row: unknown[], index: number | undefined): unknown {
  return index === undefined ? undefined : row[index]
}

export function getCellText(row: unknown[], index: number | undefined): string {
  const raw = getCellRaw(row, index)
  if (raw === null || raw === undefined) return ""
  if (raw instanceof Date) return raw.toISOString()
  return String(raw).trim()
}

export function toNumber(raw: unknown): number | undefined {
  if (typeof raw === "number") return raw
  if (typeof raw === "string") {
    const cleaned = raw.replace(/[^\d,.-]/g, "").replace(",", ".")
    const n = Number.parseFloat(cleaned)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

export function toISODate(raw: unknown): string | undefined {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw.toISOString()
  if (typeof raw === "string" && raw.trim()) {
    const d = new Date(raw.trim())
    if (!Number.isNaN(d.getTime())) return d.toISOString()
  }
  return undefined
}

const STATUS_MAP: Record<string, PrestationStatus> = {
  "a faire": "todo",
  todo: "todo",
  "en cours": "in_progress",
  in_progress: "in_progress",
  termine: "done",
  done: "done",
}

export function mapStatus(text: string): PrestationStatus {
  return STATUS_MAP[normalizeHeader(text)] ?? "todo"
}

const RECURRENCE_MAP: Record<string, ExpenseRecurrence> = {
  aucune: "none",
  none: "none",
  quotidienne: "daily",
  daily: "daily",
  hebdomadaire: "weekly",
  weekly: "weekly",
  mensuelle: "monthly",
  monthly: "monthly",
}

export function mapRecurrence(text: string): ExpenseRecurrence {
  return RECURRENCE_MAP[normalizeHeader(text)] ?? "none"
}
