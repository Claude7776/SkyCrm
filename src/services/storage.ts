const STORAGE_PREFIX = "skycrm:v1:"

export function readCollection<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeCollection<T>(key: string, value: T): void {
  window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  window.dispatchEvent(
    new CustomEvent("skycrm:storage", { detail: { key } })
  )
}

export function subscribeToStorage(listener: (key: string) => void) {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ key: string }>).detail
    listener(detail?.key ?? "")
  }
  window.addEventListener("skycrm:storage", handler)
  return () => window.removeEventListener("skycrm:storage", handler)
}

export function exportAllRaw(): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (!key || !key.startsWith(STORAGE_PREFIX)) continue
    const raw = window.localStorage.getItem(key)
    if (raw == null) continue
    out[key.slice(STORAGE_PREFIX.length)] = JSON.parse(raw)
  }
  return out
}

export function importAllRaw(data: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(data)) {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  }
  window.dispatchEvent(new CustomEvent("skycrm:storage", { detail: { key: "*" } }))
}
