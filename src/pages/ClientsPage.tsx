import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Plus, Search, Mail, Phone, Building2, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { SortableHeader } from "@/components/shared/SortableHeader"
import { ClientFormDialog } from "@/components/clients/ClientFormDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { initials } from "@/utils/format"
import type { Client } from "@/types"

export function ClientsPage() {
  const { clients, prestations, removeClient } = useAppData()
  const [searchParams] = useSearchParams()
  const highlightedId = searchParams.get("id")

  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | undefined>()
  const [deletingClient, setDeletingClient] = useState<Client | undefined>()

  const prestationCountByClient = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of prestations) {
      map.set(p.clientId, (map.get(p.clientId) ?? 0) + 1)
    }
    return map
  }, [prestations])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((c) =>
      [c.name, c.email, c.company, c.phone].filter(Boolean).some((f) => f!.toLowerCase().includes(q))
    )
  }, [clients, query])

  const { sorted, sortKey, direction, toggleSort } = useSortableData<Client>(
    filtered,
    (item, key) => {
      if (key === "prestations") return prestationCountByClient.get(item.id) ?? 0
      return (item[key as keyof Client] as string) ?? ""
    },
    "name"
  )

  const openCreate = () => {
    setEditingClient(undefined)
    setFormOpen(true)
  }

  const openEdit = (client: Client) => {
    setEditingClient(client)
    setFormOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        description={`${clients.length} client${clients.length > 1 ? "s" : ""} enregistré${clients.length > 1 ? "s" : ""}`}
        actions={
          <Button onClick={openCreate}>
            <Plus /> Nouveau client
          </Button>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un client…"
          className="pl-8"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aucun client pour le moment"
          description="Ajoutez votre premier client pour commencer à suivre vos prestations."
          action={
            <Button onClick={openCreate}>
              <Plus /> Nouveau client
            </Button>
          }
        />
      ) : sorted.length === 0 ? (
        <EmptyState icon={Search} title="Aucun résultat" description="Essayez une autre recherche." />
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableHeader label="Client" sortKey="name" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                <SortableHeader label="Entreprise" sortKey="company" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                <SortableHeader label="Contact" sortKey="email" activeKey={sortKey} direction={direction} onSort={toggleSort} />
                <SortableHeader label="Prestations" sortKey="prestations" activeKey={sortKey} direction={direction} onSort={toggleSort} className="text-right" />
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((client) => (
                <TableRow
                  key={client.id}
                  className={client.id === highlightedId ? "bg-primary/5" : undefined}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-[11px] bg-primary/10 text-primary font-medium">
                          {initials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <button
                          onClick={() => openEdit(client)}
                          className="block truncate text-sm font-medium text-foreground hover:underline text-left"
                        >
                          {client.name}
                        </button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client.company ? (
                      <span className="flex items-center gap-1.5">
                        <Building2 className="size-3.5" /> {client.company}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex flex-col gap-0.5">
                      {client.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="size-3.5" /> {client.email}
                        </span>
                      )}
                      {client.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="size-3.5" /> {client.phone}
                        </span>
                      )}
                      {!client.email && !client.phone && "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {prestationCountByClient.get(client.id) ?? 0}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(client)}>
                          <Pencil /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeletingClient(client)}
                        >
                          <Trash2 /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ClientFormDialog open={formOpen} onOpenChange={setFormOpen} client={editingClient} />

      <ConfirmDialog
        open={Boolean(deletingClient)}
        onOpenChange={(open) => !open && setDeletingClient(undefined)}
        title="Supprimer ce client ?"
        description={`${deletingClient?.name ?? ""} sera définitivement supprimé. Cette action est irréversible.`}
        onConfirm={() => {
          if (deletingClient) removeClient(deletingClient.id)
          setDeletingClient(undefined)
        }}
      />
    </div>
  )
}
