import { useMemo } from "react"
import { addMonths, differenceInCalendarMonths, startOfMonth, startOfYear, subMonths } from "date-fns"
import { useAppData } from "@/hooks/useAppData"

export type RevenuePeriod = "3m" | "6m" | "12m" | "ytd" | "all"

export interface RevenuePoint {
  key: string
  label: string
  revenue: number
}

export interface RevenueSeries {
  points: RevenuePoint[]
  total: number
  averagePerMonth: number
  /** Revenue over the same span just before (one year before for "ytd"); null for "all". */
  previousTotal: number | null
  /** Relative change vs `previousTotal`, null when it can't be computed. */
  change: number | null
}

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`

/** Monthly revenue from payments, optionally limited to one client. */
export function useRevenueSeries(period: RevenuePeriod, clientId: string | "all"): RevenueSeries {
  const { paiements, prestations } = useAppData()

  return useMemo(() => {
    const clientByPrestation = new Map(prestations.map((p) => [p.id, p.clientId]))
    const relevant =
      clientId === "all"
        ? paiements
        : paiements.filter((p) => clientByPrestation.get(p.prestationId) === clientId)

    const now = new Date()
    const thisMonth = startOfMonth(now)
    let start: Date
    if (period === "ytd") start = startOfYear(now)
    else if (period === "all") {
      const earliest = relevant.reduce<Date | null>((min, p) => {
        const d = new Date(p.date)
        return !min || d < min ? d : min
      }, null)
      start = startOfMonth(earliest && earliest < thisMonth ? earliest : thisMonth)
    } else start = subMonths(thisMonth, Number.parseInt(period) - 1)

    const monthCount = differenceInCalendarMonths(thisMonth, start) + 1
    const spansYears = start.getFullYear() !== now.getFullYear()
    const monthFormat = new Intl.DateTimeFormat("fr-FR", {
      month: "short",
      ...(spansYears && { year: "2-digit" }),
    })

    const byMonth = new Map<string, number>()
    for (const p of relevant) {
      const key = monthKey(new Date(p.date))
      byMonth.set(key, (byMonth.get(key) ?? 0) + p.amount)
    }

    const points: RevenuePoint[] = []
    for (let i = 0; i < monthCount; i++) {
      const d = addMonths(start, i)
      const key = monthKey(d)
      points.push({ key, label: monthFormat.format(d), revenue: byMonth.get(key) ?? 0 })
    }

    const total = relevant
      .filter((p) => {
        const d = new Date(p.date)
        return d >= start && d <= now
      })
      .reduce((sum, p) => sum + p.amount, 0)

    // Same-length window, ending at the same point in time, so a month in
    // progress is compared with an equally partial month.
    let previousTotal: number | null = null
    if (period !== "all") {
      const shift = period === "ytd" ? 12 : monthCount
      const prevStart = subMonths(start, shift)
      const prevEnd = subMonths(now, shift)
      previousTotal = relevant
        .filter((p) => {
          const d = new Date(p.date)
          return d >= prevStart && d <= prevEnd
        })
        .reduce((sum, p) => sum + p.amount, 0)
    }

    return {
      points,
      total,
      averagePerMonth: total / monthCount,
      previousTotal,
      change: previousTotal ? (total - previousTotal) / previousTotal : null,
    }
  }, [paiements, prestations, period, clientId])
}
