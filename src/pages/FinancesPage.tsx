import { useState } from "react"
import { Euro, TrendingUp, TrendingDown, Wallet, Plus, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { RevenueExpenseChart } from "@/components/finances/RevenueExpenseChart"
import { TopClientsChart } from "@/components/finances/TopClientsChart"
import { ExpenseFormDialog } from "@/components/finances/ExpenseFormDialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAppData } from "@/hooks/useAppData"
import { useFinanceStats } from "@/hooks/useFinanceStats"
import { formatCurrency, formatDate } from "@/utils/format"
import type { Expense } from "@/types"

export function FinancesPage() {
  const { settings, expenses, removeExpense } = useAppData()
  const stats = useFinanceStats()
  const [expenseFormOpen, setExpenseFormOpen] = useState(false)
  const [deletingExpense, setDeletingExpense] = useState<Expense | undefined>()

  return (
    <div>
      <PageHeader
        title="Finances"
        description="Analyse détaillée de vos revenus et dépenses"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard index={0} label="Revenus totaux" value={formatCurrency(stats.totalRevenue, settings.currency)} icon={Euro} />
        <KpiCard index={1} label="Dépenses totales" value={formatCurrency(stats.totalExpenses, settings.currency)} icon={TrendingDown} accent="warning" />
        <KpiCard
          index={2}
          label="Bénéfices"
          value={formatCurrency(stats.totalProfit, settings.currency)}
          icon={TrendingUp}
          accent={stats.totalProfit >= 0 ? "good" : "critical"}
        />
        <KpiCard index={3} label="Panier moyen" value={formatCurrency(stats.averagePrestationValue, settings.currency)} icon={Wallet} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Revenus vs dépenses (12 mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueExpenseChart data={stats.monthly} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Top clients</CardTitle>
          </CardHeader>
          <CardContent>
            <TopClientsChart data={stats.topClients} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Revenus par année</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Année</TableHead>
                  <TableHead className="text-right">Revenus</TableHead>
                  <TableHead className="text-right">Dépenses</TableHead>
                  <TableHead className="text-right">Bénéfices</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.yearly.map((row) => (
                  <TableRow key={row.year}>
                    <TableCell className="font-medium">{row.year}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.revenue, settings.currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatCurrency(row.expenses, settings.currency)}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums font-medium ${row.profit >= 0 ? "text-status-good" : "text-status-critical"}`}
                    >
                      {formatCurrency(row.profit, settings.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">Dépenses</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setExpenseFormOpen(true)}>
              <Plus /> Ajouter
            </Button>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <EmptyState icon={TrendingDown} title="Aucune dépense" description="Suivez vos coûts professionnels ici." />
            ) : (
              <ul className="flex flex-col gap-1 max-h-[280px] overflow-y-auto">
                {[...expenses]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((expense) => (
                    <li
                      key={expense.id}
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 -mx-2 hover:bg-muted/60 group"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{expense.label}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(expense.date)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-medium tabular-nums text-foreground">
                          -{formatCurrency(expense.amount, settings.currency)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-status-critical"
                          onClick={() => setDeletingExpense(expense)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <ExpenseFormDialog open={expenseFormOpen} onOpenChange={setExpenseFormOpen} />

      <ConfirmDialog
        open={Boolean(deletingExpense)}
        onOpenChange={(open) => !open && setDeletingExpense(undefined)}
        title="Supprimer cette dépense ?"
        description={deletingExpense?.label}
        onConfirm={() => {
          if (deletingExpense) removeExpense(deletingExpense.id)
          setDeletingExpense(undefined)
        }}
      />
    </div>
  )
}
