import { readCollection, writeCollection } from "./storage"

export interface Repository<T extends { id: string }, TInput> {
  list(): Promise<T[]>
  get(id: string): Promise<T | undefined>
  create(input: TInput): Promise<T>
  update(id: string, patch: Partial<TInput>): Promise<T>
  remove(id: string): Promise<void>
}

/**
 * Backed by localStorage today. Swapping to a remote API later only
 * requires providing a different implementation of `Repository`.
 */
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
