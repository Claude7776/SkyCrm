import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowDownLeft,
  CreditCard,
  EyeOff,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
  TriangleAlert,
} from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { KpiCard } from "@/components/shared/KpiCard"
import { RecordPaypalPaymentDialog } from "@/components/paypal/RecordPaypalPaymentDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAppData } from "@/hooks/useAppData"
import { isRemoteStorage } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { convertAmount } from "@/services/exchangeRates.service"
import { paypalService, type PaypalSyncProgress } from "@/services/paypal.service"
import { formatCurrency, formatDate, formatDateTime } from "@/utils/format"
import {
  PAYPAL_STATUS_BADGE,
  PAYPAL_STATUS_LABELS,
  isReceivedPayment,
  normalizeEmail,
  paypalMatchState,
  paypalTypeLabel,
  type PaypalMatchState,
} from "@/utils/paypal"
import type { PaypalTransaction } from "@/types"

type Filter = "todo" | "all" | "recorded" | "ignored"

const PAGE_SIZE = 100
const LAST_SYNC_KEY = "skycrm:paypal:last-sync"

function readLastSync(): string | null {
  try {
    return window.localStorage.getItem(LAST_SYNC_KEY)
  } catch {
    return null
  }
}

export function PaypalPage() {
  const { clients, paiements, addExpense, currency } = useAppData()
  const [transactions, setTransactions] = useState<PaypalTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState<PaypalSyncProgress | null>(null)
  const [lastSync, setLastSync] = useState(readLastSync)
  const [filter, setFilter] = useState<Filter>("todo")
  const [query, setQuery] = useState("")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [recording, setRecording] = useState<PaypalTransaction | undefined>()
  const [isSavingFees, setIsSavingFees] = useState(false)

  const load = useCallback(async () => {
    try {
      setTransactions(await paypalService.list())
    } catch (error) {
      console.error(error)
      toast.error("Impossible de charger l'historique PayPal")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const clientByEmail = useMemo(
    () => new Map(clients.filter((c) => c.email).map((c) => [normalizeEmail(c.email), c])),
    [clients]
  )
  const paiementIds = useMemo(() => new Set(paiements.map((p) => p.id)), [paiements])
  const stateOf = useCallback(
    (t: PaypalTransaction): PaypalMatchState => paypalMatchState(t, paiementIds),
    [paiementIds]
  )

  const counts = useMemo(() => {
    const result = { todo: 0, recorded: 0, ignored: 0 }
    for (const t of transactions) {
      const state = stateOf(t)
      if (state !== "other") result[state]++
    }
    return result
  }, [transactions, stateOf])

  // Totals in the most used currency; other currencies are only counted.
  const totals = useMemo(() => {
    const received = transactions.filter(isReceivedPayment)
    const byCurrency = new Map<string, number>()
    for (const t of received) byCurrency.set(t.currency, (byCurrency.get(t.currency) ?? 0) + 1)
    const main = [...byCurrency.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? currency
    const inMain = received.filter((t) => t.currency === main)
    const gross = inMain.reduce((sum, t) => sum + t.amount, 0)
    const fees = inMain.reduce((sum, t) => sum + t.fee, 0)
    return { main, gross, fees, net: gross + fees, otherCurrencies: byCurrency.size > 1 }
  }, [transactions, currency])

  const unrecordedFees = useMemo(
    () => transactions.filter((t) => t.fee < 0 && t.status === "S" && !t.expenseId),
    [transactions]
  )

  const filtered = useMemo(() => {
    const q = normalizeEmail(query)
    return transactions.filter((t) => {
      const state = stateOf(t)
      if (filter === "todo" && state !== "todo") return false
      if (filter === "recorded" && state !== "recorded") return false
      if (filter === "ignored" && state !== "ignored") return false
      if (!q) return true
      return [t.payerName, t.payerEmail, t.description, t.id, t.invoiceId]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    })
  }, [transactions, filter, query, stateOf])

  // Default to "everything" once there is nothing left to reconcile.
  useEffect(() => {
    if (!isLoading && filter === "todo" && counts.todo === 0 && transactions.length > 0) {
      setFilter("all")
    }
  }, [isLoading, filter, counts.todo, transactions.length])

  useEffect(() => setVisibleCount(PAGE_SIZE), [filter, query])

  const patchLocal = (id: string, patch: Partial<PaypalTransaction>) =>
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))

  const handleSync = async () => {
    setProgress({ done: 0, total: 1 })
    try {
      const fetched = await paypalService.sync(transactions, setProgress)
      await load()
      const now = new Date().toISOString()
      try {
        window.localStorage.setItem(LAST_SYNC_KEY, now)
      } catch {
        // Only a display convenience.
      }
      setLastSync(now)
      toast.success(
        fetched > 0 ? `${fetched} transaction(s) PayPal récupérée(s)` : "Aucune nouvelle transaction"
      )
    } catch (error) {
      toast.error((error as Error).message || "La synchronisation PayPal a échoué")
      await load()
    } finally {
      setProgress(null)
    }
  }

  const setIgnored = async (t: PaypalTransaction, ignored: boolean) => {
    try {
      await paypalService.update(t.id, { ignored })
      patchLocal(t.id, { ignored })
    } catch {
      toast.error("Une erreur est survenue")
    }
  }

  /** One expense per month and currency, so fees don't flood the expense list. */
  const handleRecordFees = async () => {
    setIsSavingFees(true)
    try {
      const groups = new Map<string, PaypalTransaction[]>()
      for (const t of unrecordedFees) {
        const key = `${t.date.slice(0, 7)}|${t.currency}`
        groups.set(key, [...(groups.get(key) ?? []), t])
      }
      for (const group of groups.values()) {
        const total = -group.reduce((sum, t) => sum + t.fee, 0)
        const latest = group.reduce((a, b) => (new Date(a.date) > new Date(b.date) ? a : b))
        const month = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(
          new Date(latest.date)
        )
        const expense = await addExpense({
          label: `Frais PayPal — ${month}`,
          amount: await convertAmount(total, group[0].currency, currency),
          date: new Date(latest.date).toISOString(),
          category: "Frais PayPal",
          recurrence: "none",
        })
        for (const t of group) {
          await paypalService.update(t.id, { expenseId: expense.id })
          patchLocal(t.id, { expenseId: expense.id })
        }
      }
      toast.success(`Frais enregistrés en ${groups.size} dépense(s), visibles dans Finances`)
    } catch {
      toast.error("Impossible d'enregistrer les frais")
    } finally {
      setIsSavingFees(false)
    }
  }

  const isSyncing = progress !== null
  const visible = filtered.slice(0, visibleCount)

  return (
    <div>
      <PageHeader
        title="PayPal"
        description={
          lastSync
            ? `Historique PayPal Business · dernière synchronisation le ${formatDateTime(lastSync)}`
            : "Historique de votre compte PayPal Business"
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleRecordFees}
              disabled={unrecordedFees.length === 0 || isSavingFees}
            >
              <Receipt /> Frais en dépenses
            </Button>
            <Button onClick={handleSync} disabled={!isRemoteStorage || isSyncing}>
              <RefreshCw className={cn(isSyncing && "animate-spin")} /> Synchroniser
            </Button>
          </div>
        }
      />

      {!isRemoteStorage && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-status-warning/30 bg-status-warning/10 p-4 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-status-warning" />
          <p className="text-foreground">
            La synchronisation PayPal nécessite la base en ligne (Supabase) : elle passe par un
            serveur qui garde vos identifiants PayPal secrets. Voir le README pour la configuration.
          </p>
        </div>
      )}

      {isSyncing && (
        <div className="mb-4 rounded-xl border border-border p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-foreground">Récupération de l'historique PayPal…</span>
            <span className="tabular-nums text-muted-foreground">
              {progress.done} / {progress.total} mois
            </span>
          </div>
          <Progress value={(progress.done / Math.max(progress.total, 1)) * 100} />
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label={`Paiements reçus${totals.otherCurrencies ? ` (${totals.main})` : ""}`}
          value={formatCurrency(totals.gross, totals.main)}
          icon={ArrowDownLeft}
          accent="good"
        />
        <KpiCard
          label="Frais PayPal"
          value={formatCurrency(totals.fees, totals.main)}
          icon={Receipt}
          accent="warning"
          index={1}
        />
        <KpiCard label="Net encaissé" value={formatCurrency(totals.net, totals.main)} icon={CreditCard} index={2} />
        <KpiCard
          label="À rapprocher"
          value={String(counts.todo)}
          icon={TriangleAlert}
          accent={counts.todo > 0 ? "critical" : "default"}
          index={3}
        />
      </div>

      {!isLoading && transactions.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Aucune transaction PayPal"
          description={
            isRemoteStorage
              ? "Cliquez sur Synchroniser pour récupérer jusqu'à 3 ans d'historique de votre compte PayPal Business."
              : "Connectez SkyCRM à Supabase pour synchroniser votre compte PayPal Business."
          }
          action={
            isRemoteStorage && (
              <Button onClick={handleSync} disabled={isSyncing}>
                <RefreshCw /> Synchroniser
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <TabsList>
                <TabsTrigger value="todo">À rapprocher ({counts.todo})</TabsTrigger>
                <TabsTrigger value="all">Tout</TabsTrigger>
                <TabsTrigger value="recorded">Enregistrés ({counts.recorded})</TabsTrigger>
                <TabsTrigger value="ignored">Ignorés ({counts.ignored})</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Payeur, email, description…"
                className="pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={filter === "todo" ? Receipt : Search}
              title={filter === "todo" && !query ? "Tout est rapproché" : "Aucun résultat"}
              description={
                filter === "todo" && !query
                  ? "Chaque paiement PayPal reçu est enregistré ou ignoré."
                  : "Essayez un autre filtre ou une autre recherche."
              }
            />
          ) : (
            <div className="rounded-xl border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Payeur</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Frais</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Rapprochement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((t) => {
                    const client = clientByEmail.get(normalizeEmail(t.payerEmail))
                    const state = stateOf(t)
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(t.date)}
                        </TableCell>
                        <TableCell className="max-w-56">
                          <div className="truncate text-sm font-medium text-foreground">
                            {t.payerName || t.payerEmail || "—"}
                          </div>
                          {client ? (
                            <div className="truncate text-xs text-primary">Client : {client.name}</div>
                          ) : (
                            t.payerName &&
                            t.payerEmail && (
                              <div className="truncate text-xs text-muted-foreground">{t.payerEmail}</div>
                            )
                          )}
                        </TableCell>
                        <TableCell className="max-w-64 truncate text-sm text-muted-foreground">
                          {t.description || "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {paypalTypeLabel(t)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "whitespace-nowrap text-right text-sm font-medium tabular-nums",
                            t.amount >= 0 ? "text-status-good" : "text-foreground"
                          )}
                        >
                          {t.amount >= 0 ? "+" : ""}
                          {formatCurrency(t.amount, t.currency)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right text-sm tabular-nums text-muted-foreground">
                          {t.fee !== 0 ? formatCurrency(t.fee, t.currency) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={PAYPAL_STATUS_BADGE[t.status] ?? PAYPAL_STATUS_BADGE.V}
                          >
                            {PAYPAL_STATUS_LABELS[t.status] ?? t.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          {state === "todo" && (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="outline" onClick={() => setRecording(t)}>
                                Enregistrer
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-muted-foreground"
                                aria-label="Ignorer"
                                title="Ignorer"
                                onClick={() => setIgnored(t, true)}
                              >
                                <EyeOff className="size-4" />
                              </Button>
                            </div>
                          )}
                          {state === "recorded" && (
                            <Button size="sm" variant="ghost" asChild>
                              <Link to={`/paiements?id=${t.paiementId}`}>Voir le paiement</Link>
                            </Button>
                          )}
                          {state === "ignored" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground"
                              onClick={() => setIgnored(t, false)}
                            >
                              <RotateCcw /> Rétablir
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {filtered.length > visibleCount && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
                Afficher plus ({filtered.length - visibleCount} restantes)
              </Button>
            </div>
          )}
        </>
      )}

      <RecordPaypalPaymentDialog
        transaction={recording}
        client={recording ? clientByEmail.get(normalizeEmail(recording.payerEmail)) : undefined}
        onOpenChange={(open) => !open && setRecording(undefined)}
        onRecorded={(id, paiementId) => patchLocal(id, { paiementId })}
      />
    </div>
  )
}
