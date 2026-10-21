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
