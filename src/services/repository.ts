import { readCollection, writeCollection } from "./storage"
import { fromRow, isRemoteStorage, requireSupabase, selectAll, toRow } from "@/lib/supabase"

export interface Repository<T extends { id: string }, TInput> {
  list(): Promise<T[]>
  get(id: string): Promise<T | undefined>
  create(input: TInput): Promise<T>
  update(id: string, patch: Partial<TInput>): Promise<T>
  remove(id: string): Promise<void>
}

/**
 * Backed by Supabase when it is configured, localStorage otherwise.
 * `trackUpdatedAt` maintains an `updatedAt` field alongside `createdAt`.
 */
export function createRepository<
  T extends { id: string; createdAt: string },
  TInput extends Record<string, unknown>,
>(collectionKey: string, { trackUpdatedAt }: { trackUpdatedAt: boolean }): Repository<T, TInput> {
  if (isRemoteStorage) return createSupabaseRepository<T, TInput>(collectionKey, trackUpdatedAt)
  return trackUpdatedAt
    ? (createLocalRepository(collectionKey) as unknown as Repository<T, TInput>)
    : createSimpleLocalRepository<T, TInput>(collectionKey)
}

/** Rows live in the table named after the collection; RLS scopes them to the user. */
export function createSupabaseRepository<
  T extends { id: string; createdAt: string },
  TInput extends Record<string, unknown>,
>(table: string, trackUpdatedAt: boolean): Repository<T, TInput> {
  const db = () => requireSupabase().from(table)

  return {
    async list() {
      const rows = await selectAll(table)
      return rows.map((row) => fromRow<T>(row))
    },
    async get(id) {
      const { data, error } = await db().select("*").eq("id", id).maybeSingle()
      if (error) throw error
      return data ? fromRow<T>(data) : undefined
    },
    async create(input) {
      const now = new Date().toISOString()
      const entity = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: now,
        ...(trackUpdatedAt && { updatedAt: now }),
      }
      const { data, error } = await db().insert(toRow(entity)).select().single()
      if (error) throw error
      return fromRow<T>(data)
    },
    async update(id, patch) {
      const changes = trackUpdatedAt
        ? { ...patch, updatedAt: new Date().toISOString() }
        : patch
      const { data, error } = await db()
        .update(toRow(changes))
        .eq("id", id)
        .select()
        .maybeSingle()
      if (error) throw error
      if (!data) throw new Error(`Not found: ${id}`)
      return fromRow<T>(data)
    },
    async remove(id) {
      const { error } = await db().delete().eq("id", id)
      if (error) throw error
    },
  }
}

/** localStorage implementation with createdAt/updatedAt bookkeeping. */
export function createLocalRepository<
  T extends { id: string; createdAt: string; updatedAt: string },
  TInput extends Record<string, unknown>,
>(collectionKey: string): Repository<T, TInput> {
  const readAll = () => readCollection<T[]>(collectionKey, [])
  const writeAll = (items: T[]) => writeCollection(collectionKey, items)

  return {
    async list() {
      return readAll()
    },
    async get(id) {
      return readAll().find((item) => item.id === id)
    },
    async create(input) {
      const now = new Date().toISOString()
      const entity = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      } as unknown as T
      const items = readAll()
      items.push(entity)
      writeAll(items)
      return entity
    },
    async update(id, patch) {
      const items = readAll()
      const index = items.findIndex((item) => item.id === id)
      if (index === -1) throw new Error(`Not found: ${id}`)
      const updated = {
        ...items[index],
        ...patch,
        updatedAt: new Date().toISOString(),
      } as T
      items[index] = updated
      writeAll(items)
      return updated
    },
    async remove(id) {
      const items = readAll().filter((item) => item.id !== id)
      writeAll(items)
    },
  }
}

/** Same as `createLocalRepository` but without createdAt/updatedAt bookkeeping. */
export function createSimpleLocalRepository<
  T extends { id: string; createdAt: string },
  TInput extends Record<string, unknown>,
>(collectionKey: string): Repository<T, TInput> {
  const readAll = () => readCollection<T[]>(collectionKey, [])
  const writeAll = (items: T[]) => writeCollection(collectionKey, items)

  return {
    async list() {
      return readAll()
    },
    async get(id) {
      return readAll().find((item) => item.id === id)
    },
    async create(input) {
      const entity = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      } as unknown as T
      const items = readAll()
      items.push(entity)
      writeAll(items)
      return entity
    },
    async update(id, patch) {
      const items = readAll()
      const index = items.findIndex((item) => item.id === id)
      if (index === -1) throw new Error(`Not found: ${id}`)
      const updated = { ...items[index], ...patch } as T
      items[index] = updated
      writeAll(items)
      return updated
    },
    async remove(id) {
      const items = readAll().filter((item) => item.id !== id)
      writeAll(items)
    },
  }
}
