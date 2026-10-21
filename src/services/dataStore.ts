import type { BusinessSettings, Client, Expense, Paiement, Prestation } from "@/types"
import { currentUserId, isRemoteStorage, requireSupabase, toRow } from "@/lib/supabase"
import { readCollection, writeCollection } from "./storage"
import { clientsRepository } from "./clients.service"
import { prestationsRepository } from "./prestations.service"
import { paiementsRepository } from "./paiements.service"
import { expensesRepository } from "./expenses.service"
import { settingsService } from "./settings.service"

/** Whole-dataset operations: backups, first-login migration and reset. */
export interface DataSnapshot {
  clients?: Client[]
  prestations?: Prestation[]
  paiements?: Paiement[]
  expenses?: Expense[]
  settings?: BusinessSettings
}

const TABLES = ["clients", "prestations", "paiements", "expenses"] as const
const INSERT_CHUNK = 500

export async function readSnapshot(): Promise<DataSnapshot> {
  const [clients, prestations, paiements, expenses, settings] = await Promise.all([
    clientsRepository.list(),
    prestationsRepository.list(),
    paiementsRepository.list(),
    expensesRepository.list(),
    settingsService.get(),
  ])
  return { clients, prestations, paiements, expenses, settings }
}

/** Replaces every collection present in the snapshot; others are left untouched. */
export async function writeSnapshot(snapshot: DataSnapshot): Promise<void> {
  if (!isRemoteStorage) {
    for (const table of TABLES) {
      if (snapshot[table]) writeCollection(table, snapshot[table])
    }
    if (snapshot.settings) writeCollection("settings", snapshot.settings)
    return
  }

  const db = requireSupabase()
  const userId = await currentUserId()
  for (const table of TABLES) {
    const items = snapshot[table]
    if (!items) continue
    const { error } = await db.from(table).delete().eq("user_id", userId)
    if (error) throw error
    for (let i = 0; i < items.length; i += INSERT_CHUNK) {
      const rows = items
        .slice(i, i + INSERT_CHUNK)
        .map((item) => toRow(item as unknown as Record<string, unknown>))
      const { error } = await db.from(table).insert(rows)
      if (error) throw error
    }
  }
  if (snapshot.settings) await settingsService.replace(snapshot.settings)
}

export async function hasAnyData(): Promise<boolean> {
  if (!isRemoteStorage) {
    return (
      readCollection<Client[]>("clients", []).length > 0 ||
      readCollection<Prestation[]>("prestations", []).length > 0 ||
      readCollection<BusinessSettings | null>("settings", null) !== null
    )
  }
  const db = requireSupabase()
  const counts = await Promise.all(
    [...TABLES, "settings"].map((table) =>
      db.from(table).select("*", { count: "exact", head: true })
    )
  )
  return counts.some(({ count }) => (count ?? 0) > 0)
}

export async function clearAll(): Promise<void> {
  if (!isRemoteStorage) {
    window.localStorage.clear()
    return
  }
  await writeSnapshot({ clients: [], prestations: [], paiements: [], expenses: [] })
  const { error } = await requireSupabase().from("settings").delete().eq("user_id", await currentUserId())
  if (error) throw error
}

/** Data an older version of the app left in this browser's localStorage. */
export function readBrowserSnapshot(): DataSnapshot | null {
  const snapshot: DataSnapshot = {
    clients: readCollection<Client[]>("clients", []),
    prestations: readCollection<Prestation[]>("prestations", []),
    paiements: readCollection<Paiement[]>("paiements", []),
    expenses: readCollection<Expense[]>("expenses", []),
    settings: readCollection<BusinessSettings | undefined>("settings", undefined),
  }
  const isEmpty = TABLES.every((table) => snapshot[table]!.length === 0) && !snapshot.settings
  return isEmpty ? null : snapshot
}
