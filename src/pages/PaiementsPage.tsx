import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Plus, Search, Wallet, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { SortableHeader } from "@/components/shared/SortableHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { PaiementFormDialog } from "@/components/paiements/PaiementFormDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAppData } from "@/hooks/useAppData"
import { useSortableData } from "@/hooks/useSortableData"
import { formatCurrency, formatDate } from "@/utils/format"
import type { Paiement } from "@/types"

export function PaiementsPage() {
  const { clients, prestations, paiements, settings, removePaiement } = useAppData()
  const [searchParams] = useSearchParams()
  const highlightedId = searchParams.get("id")

  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [deletingPaiement, setDeletingPaiement] = useState<Paiement | undefined>()

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients])
  const prestationById = useMemo(() => new Map(prestations.map((p) => [p.id, p])), [prestations])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return paiements
    return paiements.filter((pay) => {
      const prestation = prestationById.get(pay.prestationId)
      const clientName = prestation ? clientById.get(prestation.clientId)?.name ?? "" : ""
      return [prestation?.title, clientName, pay.method, pay.note]
        .filter(Boolean)
        .some((f) => f!.toLowerCase().includes(q))
    })
  }, [paiements, query, prestationById, clientById])

  const { sorted, sortKey, direction, toggleSort } = useSortableData<Paiement>(
    filtered,
    (item, key) => {
      if (key === "prestation") return prestationById.get(item.prestationId)?.title ?? ""
      if (key === "client") {
        const prestation = prestationById.get(item.prestationId)
        return prestation ? clientById.get(prestation.clientId)?.name ?? "" : ""
      }
      return (item[key as keyof Paiement] as string | number) ?? ""
    },
    "date",
    "desc"
  )

  const totalReceived = paiements.reduce((sum, p) => sum + p.amount, 0)
  const now = new Date()
  const totalThisMonth = paiements
    .filter((p) => {
      const d = new Date(p.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div>
      <PageHeader
        title="Paiements"
        description="Historique des paiements reçus"
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus /> Nouveau paiement
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 mb-4 max-w-md">
        <KpiCard label="Total reçu" value={formatCurrency(totalReceived, settings.currency)} icon={Wallet} />
        <KpiCard label="Ce mois-ci" value={formatCurrency(totalThisMonth, settings.currency)} icon={Wallet} accent="good" index={1} />
      </div>

      {paiements.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Aucun paiement enregistré"
          description="Enregistrez un paiement pour une prestation existante."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> Nouveau paiement
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un paiement…"
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {sorted.length === 0 ? (
            <EmptyState icon={Search} title="Aucun résultat" description="Essayez une autre recherche." />
          ) : (
            <div className="rounded-xl border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <SortableHeader label="Prestation" sortKey="prestation" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                    <SortableHeader label="Client" sortKey="client" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                    <SortableHeader label="Montant" sortKey="amount" activeKey={sortKey} direction={direction} onSort={toggleSort} className="text-right" />
                    <TableHead>Méthode</TableHead>
                    <SortableHeader label="Date" sortKey="date" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((pay) => {
                    const prestation = prestationById.get(pay.prestationId)
                    return (
                      <TableRow
                        key={pay.id}
                        className={pay.id === highlightedId ? "bg-primary/5" : undefined}
                      >
                        <TableCell className="text-sm font-medium text-foreground">
                          {prestation?.title ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {prestation ? clientById.get(prestation.clientId)?.name ?? "—" : "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium tabular-nums text-status-good">
                          +{formatCurrency(pay.amount, settings.currency)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{pay.method || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(pay.date)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-status-critical"
                            onClick={() => setDeletingPaiement(pay)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <PaiementFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={Boolean(deletingPaiement)}
        onOpenChange={(open) => !open && setDeletingPaiement(undefined)}
        title="Supprimer ce paiement ?"
        description="Cette action est irréversible et modifiera le statut de paiement de la prestation."
        onConfirm={() => {
          if (deletingPaiement) removePaiement(deletingPaiement.id)
          setDeletingPaiement(undefined)
        }}
      />
    </div>
  )
}
