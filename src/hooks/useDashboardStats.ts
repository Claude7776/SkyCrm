import { useMemo } from "react"
import { useAppData } from "@/hooks/useAppData"
import { computePaymentStatus, remainingAmount } from "@/utils/status"

export function useDashboardStats() {
  const { clients, prestations, paiements } = useAppData()

  return useMemo(() => {
    const now = new Date()
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`
    const currentYear = now.getFullYear()

    const revenueThisMonth = paiements
      .filter((p) => {
        const d = new Date(p.date)
        return `${d.getFullYear()}-${d.getMonth()}` === currentMonthKey
      })
      .reduce((sum, p) => sum + p.amount, 0)

    const revenueThisYear = paiements
      .filter((p) => new Date(p.date).getFullYear() === currentYear)
      .reduce((sum, p) => sum + p.amount, 0)

    const inProgressCount = prestations.filter(
      (p) => p.status === "in_progress"
    ).length
    const doneCount = prestations.filter((p) => p.status === "done").length
    const unpaidCount = prestations.filter(
      (p) => remainingAmount(p, paiements) > 0
    ).length

    const statusBreakdown = [
      {
        name: "À faire",
        value: prestations.filter((p) => p.status === "todo").length,
      },
      { name: "En cours", value: inProgressCount },
      { name: "Terminé", value: doneCount },
    ]

    return {
      revenueThisMonth,
      revenueThisYear,
      clientsCount: clients.length,
      inProgressCount,
      doneCount,
      unpaidCount,
      statusBreakdown,
      computePaymentStatus: (prestationId: string) => {
        const prestation = prestations.find((p) => p.id === prestationId)
        if (!prestation) return "unpaid" as const
        return computePaymentStatus(prestation, paiements)
      },
    }
  }, [clients, prestations, paiements])
}
