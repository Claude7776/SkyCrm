import { useMemo } from "react"
import { useAppData } from "@/hooks/useAppData"
import type { ActivityItem } from "@/types"

export function useActivityFeed(limit = 8): ActivityItem[] {
  const { clients, prestations, paiements } = useAppData()

  return useMemo(() => {
    const clientById = new Map(clients.map((c) => [c.id, c]))
    const prestationById = new Map(prestations.map((p) => [p.id, p]))

    const items: ActivityItem[] = [
      ...clients.map((c) => ({
        id: `client-${c.id}`,
        type: "client" as const,
        label: "Nouveau client",
        description: c.name,
        date: c.createdAt,
        href: `/clients?id=${c.id}`,
      })),
      ...prestations.map((p) => ({
        id: `prestation-${p.id}`,
        type: "prestation" as const,
        label: "Nouvelle prestation",
        description: `${p.title} — ${clientById.get(p.clientId)?.name ?? ""}`,
        date: p.createdAt,
        href: `/prestations?id=${p.id}`,
      })),
      ...paiements.map((p) => ({
        id: `paiement-${p.id}`,
        type: "paiement" as const,
        label: "Paiement reçu",
        description: prestationById.get(p.prestationId)?.title ?? "",
        date: p.createdAt,
        href: `/paiements?id=${p.id}`,
      })),
    ]

    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
  }, [clients, prestations, paiements, limit])
}
