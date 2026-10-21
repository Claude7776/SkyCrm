import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

/**
 * When Supabase isn't configured the app keeps working fully offline on
 * localStorage, exactly like before.
 */
export const isRemoteStorage = Boolean(url && key)

export const supabase = isRemoteStorage ? createClient(url!, key!) : null

export function requireSupabase() {
  if (!supabase) throw new Error("Supabase n'est pas configuré")
  return supabase
}

export async function currentUserId(): Promise<string> {
  const { data } = await requireSupabase().auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new Error("Session expirée, reconnectez-vous")
  return id
}

const PAGE_SIZE = 1000

/** Supabase caps a select at 1000 rows, so read the table page by page. */
export async function selectAll(table: string): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await requireSupabase()
      .from(table)
      .select("*")
      .order("created_at")
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length < PAGE_SIZE) return rows
  }
}

const toSnake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
const toCamel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())

/** App entity → table row. `undefined` becomes `null` so cleared fields are saved. */
export function toRow(entity: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(entity)) row[toSnake(k)] = v === undefined ? null : v
  return row
}

/** Table row → app entity. `null` columns are dropped and `user_id` is hidden. */
export function fromRow<T>(row: Record<string, unknown>): T {
  const entity: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    if (v === null || k === "user_id") continue
    entity[toCamel(k)] = v
  }
  return entity as T
}
