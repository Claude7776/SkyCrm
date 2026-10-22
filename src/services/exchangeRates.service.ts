export interface ExchangeRate {
  from: string
  to: string
  rate: number
  /** Day the rate was published (European Central Bank reference rates). */
  date: string
}

const CACHE_PREFIX = "skycrm:fx:"
const MAX_CACHE_AGE_MS = 12 * 60 * 60 * 1000

interface CachedRate extends ExchangeRate {
  fetchedAt: number
}

function readCache(key: string): CachedRate | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as CachedRate) : null
  } catch {
    return null
  }
}

/**
 * Daily rate from Frankfurter (free, no API key). Cached for 12 hours, and
 * the last known rate is reused when the network is unavailable.
 */
export async function getExchangeRate(from: string, to: string): Promise<ExchangeRate> {
  if (from === to) return { from, to, rate: 1, date: new Date().toISOString().slice(0, 10) }

  const key = `${CACHE_PREFIX}${from}:${to}`
  const cached = readCache(key)
  if (cached && Date.now() - cached.fetchedAt < MAX_CACHE_AGE_MS) return cached

  try {
    const response = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const body = (await response.json()) as { date: string; rates: Record<string, number> }
    const rate = body.rates[to]
    if (!rate) throw new Error(`Taux ${from}→${to} indisponible`)
    const result: CachedRate = { from, to, rate, date: body.date, fetchedAt: Date.now() }
    try {
      window.localStorage.setItem(key, JSON.stringify(result))
    } catch {
      // Storage full or blocked: the rate still works for this session.
    }
    return result
  } catch (error) {
    if (cached) return cached
    throw error
  }
}
