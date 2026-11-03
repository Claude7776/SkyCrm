import { addDays, subDays, subYears } from "date-fns"
import type { PaypalTransaction, PaypalTransactionData } from "@/types"
import { fromRow, isRemoteStorage, requireSupabase, selectAll, toRow } from "@/lib/supabase"
import { callApi } from "./api"
import { readCollection, writeCollection } from "./storage"

const TABLE = "paypal_transactions"
const UPSERT_CHUNK = 500
// PayPal accepts 31 days per request; stay a bit under.
const WINDOW_DAYS = 30
// PayPal keeps three years of history.
const HISTORY_YEARS = 3
// Re-read recent days so pending transactions pick up their final status.
const OVERLAP_DAYS = 3

export interface PaypalSyncProgress {
  done: number
  total: number
}

const byDateDesc = (a: PaypalTransaction, b: PaypalTransaction) =>
  new Date(b.date).getTime() - new Date(a.date).getTime()

export const paypalService = {
  async list(): Promise<PaypalTransaction[]> {
    const items = isRemoteStorage
      ? (await selectAll(TABLE)).map((row) => fromRow<PaypalTransaction>(row))
      : readCollection<PaypalTransaction[]>(TABLE, [])
    return items.sort(byDateDesc)
  },

  /** Inserts new transactions and refreshes known ones, keeping SkyCRM's links. */
  async save(transactions: PaypalTransactionData[]): Promise<void> {
    if (transactions.length === 0) return
    if (!isRemoteStorage) {
      const existing = new Map(
        readCollection<PaypalTransaction[]>(TABLE, []).map((t) => [t.id, t])
      )
      for (const t of transactions) {
        const previous = existing.get(t.id)
        existing.set(t.id, { ...previous, ...t, createdAt: previous?.createdAt ?? new Date().toISOString() })
      }
      writeCollection(TABLE, [...existing.values()])
      return
    }
    // Only PayPal's columns are sent, so an upsert leaves paiement_id,
    // expense_id and ignored untouched on rows that already exist.
    for (let i = 0; i < transactions.length; i += UPSERT_CHUNK) {
      const rows = transactions
        .slice(i, i + UPSERT_CHUNK)
        .map((t) => toRow(t as unknown as Record<string, unknown>))
      const { error } = await requireSupabase().from(TABLE).upsert(rows, { onConflict: "id" })
      if (error) throw error
    }
  },

  async update(
    id: string,
    patch: Partial<Pick<PaypalTransaction, "paiementId" | "expenseId" | "ignored">>
  ): Promise<void> {
    if (!isRemoteStorage) {
      const items = readCollection<PaypalTransaction[]>(TABLE, [])
      writeCollection(
        TABLE,
        items.map((t) => (t.id === id ? { ...t, ...patch } : t))
      )
      return
    }
    const { error } = await requireSupabase()
      .from(TABLE)
      .update(toRow(patch as Record<string, unknown>))
      .eq("id", id)
    if (error) throw error
  },

  /**
   * Fetches from PayPal everything since the latest saved transaction (or
   * the last three years the first time), 30 days per request.
   */
  async sync(
    known: PaypalTransaction[],
    onProgress?: (progress: PaypalSyncProgress) => void
  ): Promise<number> {
    const now = new Date()
    const latest = known.reduce<Date | null>((max, t) => {
      const d = new Date(t.date)
      return !max || d > max ? d : max
    }, null)
    const oldestAllowed = addDays(subYears(now, HISTORY_YEARS), 1)
    let start = latest ? subDays(latest, OVERLAP_DAYS) : oldestAllowed
    if (start < oldestAllowed) start = oldestAllowed

    const windows: { start: Date; end: Date }[] = []
    while (start < now) {
      const end = new Date(Math.min(start.getTime() + WINDOW_DAYS * 86_400_000, now.getTime()))
      windows.push({ start, end })
      start = end
    }

    let fetched = 0
    for (const [index, window] of windows.entries()) {
      onProgress?.({ done: index, total: windows.length })
      const { transactions } = await callApi<{ transactions: PaypalTransactionData[] }>(
        "/api/paypal-transactions",
        { startDate: window.start.toISOString(), endDate: window.end.toISOString() }
      )
      await this.save(transactions)
      fetched += transactions.length
    }
    onProgress?.({ done: windows.length, total: windows.length })
    return fetched
  },
}
