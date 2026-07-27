import { Euro, Users, Loader2, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { KpiCard } from "@/components/shared/KpiCard"
import { RevenueChart } from "@/components/dashboard/RevenueChart"
import { StatusDonut } from "@/components/dashboard/StatusDonut"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { useAppData } from "@/hooks/useAppData"
import { formatCurrency } from "@/utils/format"

export function DashboardPage() {
  const { settings } = useAppData()
  const stats = useDashboardStats()

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre activité"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          index={0}
          label="CA du mois"
          value={formatCurrency(stats.revenueThisMonth, settings.currency)}
          icon={Euro}
        />
        <KpiCard
          index={1}
          label="Revenus annuels"
          value={formatCurrency(stats.revenueThisYear, settings.currency)}
          icon={TrendingUp}
        />
        <KpiCard
          index={2}
          label="Clients"
          value={String(stats.clientsCount)}
          icon={Users}
        />
        <KpiCard
          index={3}
          label="En cours"
          value={String(stats.inProgressCount)}
          icon={Loader2}
        />
        <KpiCard
          index={4}
          label="Terminées"
          value={String(stats.doneCount)}
          icon={CheckCircle2}
          accent="good"
        />
        <KpiCard
          index={5}
          label="Impayées"
          value={String(stats.unpaidCount)}
          icon={AlertCircle}
          accent="critical"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Revenus sur 12 mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={stats.monthlyRevenue} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Répartition des prestations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDonut data={stats.statusBreakdown} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Dernières activités
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
