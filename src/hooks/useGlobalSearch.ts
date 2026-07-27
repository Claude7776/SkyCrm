import { useMemo } from "react"
import { useAppData } from "@/hooks/useAppData"

export interface SearchResult {
  id: string
  type: "client" | "prestation"
  title: string
  subtitle: string
  href: string
}

export function useGlobalSearch(query: string): SearchResult[] {
  const { clients, prestations } = useAppData()
  const clientById = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients]
  )

  return useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    const clientResults: SearchResult[] = clients
      .filter((c) =>
        [c.name, c.email, c.company, c.phone]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(q))
      )
      .map((c) => ({
        id: c.id,
        type: "client" as const,
        title: c.name,
        subtitle: c.company || c.email || "Client",
        href: `/clients?id=${c.id}`,
      }))

    const prestationResults: SearchResult[] = prestations
      .filter((p) =>
        [p.title, p.description, clientById.get(p.clientId)?.name]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(q))
      )
      .map((p) => ({
        id: p.id,
        type: "prestation" as const,
        title: p.title,
        subtitle: clientById.get(p.clientId)?.name ?? "Prestation",
        href: `/prestations?id=${p.id}`,
      }))

    return [...clientResults, ...prestationResults].slice(0, 20)
  }, [query, clients, prestations, clientById])
}
