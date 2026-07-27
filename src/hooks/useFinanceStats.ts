import { useMemo } from "react"
import { useAppData } from "@/hooks/useAppData"

export interface MonthlyFinancePoint {
  key: string
  label: string
  revenue: number
  expenses: number
}

export interface YearlyFinancePoint {
  year: number
  revenue: number
  expenses: number
  profit: number
}

export interface TopClientPoint {
  clientId: string
  name: string
  total: number
}

export function useFinanceStats() {
  const { clients, prestations, paiements, expenses } = useAppData()

  return useMemo(() => {
    const now = new Date()
    const monthly: MonthlyFinancePoint[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const label = new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d)
      const revenue = paiements
        .filter((p) => {
          const pd = new Date(p.date)
          return `${pd.getFullYear()}-${pd.getMonth()}` === key
        })
        .reduce((sum, p) => sum + p.amount, 0)
      const monthExpenses = expenses
        .filter((e) => {
          const ed = new Date(e.date)
          return `${ed.getFullYear()}-${ed.getMonth()}` === key
        })
        .reduce((sum, e) => sum + e.amount, 0)
      monthly.push({ key, label, revenue, expenses: monthExpenses })
    }

    const yearsSet = new Set<number>([
      ...paiements.map((p) => new Date(p.date).getFullYear()),
      ...expenses.map((e) => new Date(e.date).getFullYear()),
      now.getFullYear(),
    ])
    const yearly: YearlyFinancePoint[] = [...yearsSet]
      .sort((a, b) => b - a)
      .map((year) => {
        const revenue = paiements
          .filter((p) => new Date(p.date).getFullYear() === year)
          .reduce((sum, p) => sum + p.amount, 0)
        const yearExpenses = expenses
          .filter((e) => new Date(e.date).getFullYear() === year)
          .reduce((sum, e) => sum + e.amount, 0)
        return { year, revenue, expenses: yearExpenses, profit: revenue - yearExpenses }
      })

    const revenueByClient = new Map<string, number>()
    for (const prestation of prestations) {
      const paid = paiements
        .filter((p) => p.prestationId === prestation.id)
        .reduce((sum, p) => sum + p.amount, 0)
      revenueByClient.set(
        prestation.clientId,
        (revenueByClient.get(prestation.clientId) ?? 0) + paid
      )
    }
    const topClients: TopClientPoint[] = clients
      .map((c) => ({
        clientId: c.id,
        name: c.name,
        total: revenueByClient.get(c.id) ?? 0,
      }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    const totalRevenue = paiements.reduce((sum, p) => sum + p.amount, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const totalProfit = totalRevenue - totalExpenses
    const totalInvoiced = prestations.reduce((sum, p) => sum + p.price, 0)
    const averagePrestationValue =
      prestations.length > 0 ? totalInvoiced / prestations.length : 0

    return {
      monthly,
      yearly,
      topClients,
      totalRevenue,
      totalExpenses,
      totalProfit,
      totalInvoiced,
      averagePrestationValue,
    }
  }, [clients, prestations, paiements, expenses])
}
