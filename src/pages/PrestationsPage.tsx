import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Briefcase, CalendarClock } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { SortableHeader } from "@/components/shared/SortableHeader"
import { PrestationStatusBadge, PaymentStatusBadge } from "@/components/shared/StatusBadge"
import { PrestationFormDialog } from "@/components/prestations/PrestationFormDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppData } from "@/hooks/useAppData"
import { useSortableData } from "@/hooks/useSortableData"
import { formatCurrency, formatDate } from "@/utils/format"
import { computePaymentStatus, remainingAmount } from "@/utils/status"
import type { Prestation, PrestationStatus } from "@/types"

type StatusFilter = "all" | PrestationStatus

export function PrestationsPage() {
  const { clients, prestations, paiements, settings, removePrestation } = useAppData()
  const [searchParams] = useSearchParams()
  const highlightedId = searchParams.get("id")

  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editingPrestation, setEditingPrestation] = useState<Prestation | undefined>()
  const [deletingPrestation, setDeletingPrestation] = useState<Prestation | undefined>()

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return prestations.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false
      if (!q) return true
      const clientName = clientById.get(p.clientId)?.name ?? ""
      return [p.title, clientName].some((f) => f.toLowerCase().includes(q))
    })
  }, [prestations, query, statusFilter, clientById])

  const { sorted, sortKey, direction, toggleSort } = useSortableData<Prestation>(
    filtered,
    (item, key) => {
      if (key === "client") return clientById.get(item.clientId)?.name ?? ""
      if (key === "remaining") return remainingAmount(item, paiements)
      return (item[key as keyof Prestation] as string | number) ?? ""
    },
    "date",
    "desc"
  )

  const openCreate = () => {
    setEditingPrestation(undefined)
    setFormOpen(true)
  }

  const openEdit = (prestation: Prestation) => {
    setEditingPrestation(prestation)
    setFormOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Prestations"
        description={`${prestations.length} prestation${prestations.length > 1 ? "s" : ""} au total`}
        actions={
          <Button onClick={openCreate} disabled={clients.length === 0}>
            <Plus /> Nouvelle prestation
          </Button>
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Ajoutez d'abord un client"
          description="Une prestation doit être associée à un client existant."
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une prestation…"
                className="pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <TabsList>
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="todo">À faire</TabsTrigger>
                <TabsTrigger value="in_progress">En cours</TabsTrigger>
                <TabsTrigger value="done">Terminé</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {prestations.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="Aucune prestation"
              description="Créez votre première prestation pour un client."
              action={
                <Button onClick={openCreate}>
                  <Plus /> Nouvelle prestation
                </Button>
              }
            />
          ) : sorted.length === 0 ? (
            <EmptyState icon={Search} title="Aucun résultat" description="Essayez une autre recherche ou un autre filtre." />
          ) : (
            <div className="rounded-xl border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <SortableHeader label="Prestation" sortKey="title" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                    <SortableHeader label="Client" sortKey="client" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                    <SortableHeader label="Prix" sortKey="price" activeKey={sortKey} direction={direction} onSort={toggleSort} className="text-right" />
                    <SortableHeader label="Date" sortKey="date" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                    <TableHead>Statut</TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((prestation) => {
                    const paymentStatus = computePaymentStatus(prestation, paiements)
                    const isOverdue =
                      prestation.status !== "done" &&
                      prestation.dueDate &&
                      new Date(prestation.dueDate) < new Date()

                    return (
                      <TableRow
                        key={prestation.id}
                        className={prestation.id === highlightedId ? "bg-primary/5" : undefined}
                      >
                        <TableCell>
                          <button
                            onClick={() => openEdit(prestation)}
                            className="block truncate text-sm font-medium text-foreground hover:underline text-left max-w-[220px]"
                          >
                            {prestation.title}
                          </button>
                          {prestation.dueDate && (
                            <span
                              className={`mt-0.5 flex items-center gap-1 text-xs ${isOverdue ? "text-status-critical" : "text-muted-foreground"}`}
                            >
                              <CalendarClock className="size-3" />
                              {formatDate(prestation.dueDate)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {clientById.get(prestation.clientId)?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium tabular-nums">
                          {formatCurrency(prestation.price, settings.currency)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(prestation.date)}
                        </TableCell>
                        <TableCell>
                          <PrestationStatusBadge status={prestation.status} />
                        </TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={paymentStatus} />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(prestation)}>
                                <Pencil /> Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeletingPrestation(prestation)}
                              >
                                <Trash2 /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <PrestationFormDialog open={formOpen} onOpenChange={setFormOpen} prestation={editingPrestation} />

      <ConfirmDialog
        open={Boolean(deletingPrestation)}
        onOpenChange={(open) => !open && setDeletingPrestation(undefined)}
        title="Supprimer cette prestation ?"
        description={`${deletingPrestation?.title ?? ""} ainsi que ses paiements associés seront supprimés définitivement.`}
        onConfirm={() => {
          if (deletingPrestation) removePrestation(deletingPrestation.id)
          setDeletingPrestation(undefined)
        }}
      />
    </div>
  )
}
