import { useState } from "react"
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts"
import { TrendingDown, TrendingUp } from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAppData } from "@/hooks/useAppData"
import { useRevenueSeries, type RevenuePeriod } from "@/hooks/useRevenueSeries"
import { formatCompactCurrency, formatCurrency } from "@/utils/format"
import { cn } from "@/lib/utils"

const chartConfig = {
  revenue: {
    label: "Revenus",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const PERIODS: { value: RevenuePeriod; label: string; comparison: string }[] = [
  { value: "3m", label: "3 mois", comparison: "vs 3 mois précédents" },
  { value: "6m", label: "6 mois", comparison: "vs 6 mois précédents" },
  { value: "12m", label: "12 mois", comparison: "vs 12 mois précédents" },
  { value: "ytd", label: "Année", comparison: "vs même période l'an dernier" },
  { value: "all", label: "Tout", comparison: "" },
]

export function RevenueChart() {
  const { clients, currency } = useAppData()
  const [period, setPeriod] = useState<RevenuePeriod>("12m")
  const [clientId, setClientId] = useState<string>("all")
  const series = useRevenueSeries(period, clientId)
  const comparison = PERIODS.find((p) => p.value === period)?.comparison

  return (
    <Card className="min-w-0 lg:col-span-2">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-sm font-semibold">Revenus</CardTitle>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
            {formatCurrency(series.total, currency)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {series.change !== null && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-medium",
                  series.change >= 0 ? "text-status-good" : "text-status-critical"
                )}
              >
                {series.change >= 0 ? (
                  <TrendingUp className="size-3.5" />
                ) : (
                  <TrendingDown className="size-3.5" />
                )}
                {series.change >= 0 ? "+" : ""}
                {Math.round(series.change * 100)} %
                <span className="font-normal text-muted-foreground">{comparison}</span>
              </span>
            )}
            <span>Moyenne : {formatCurrency(series.averagePerMonth, currency)} / mois</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger size="sm" className="w-44" aria-label="Filtrer par client">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les clients</SelectItem>
              {[...clients]
                .sort((a, b) => a.name.localeCompare(b.name, "fr"))
                .map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as RevenuePeriod)}>
            <TabsList>
              {PERIODS.map((p) => (
                <TabsTrigger key={p.value} value={p.value} className="px-2 text-xs">
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
          <AreaChart data={series.points} margin={{ left: 4, right: 12, top: 8 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.28} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={12}
              className="text-[11px]"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={64}
              className="text-[11px]"
              tickFormatter={(value: number) => formatCompactCurrency(value, currency)}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--border)" }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value) => [formatCurrency(Number(value), currency), " Revenus"]}
                />
              }
            />
            {series.averagePerMonth > 0 && (
              <ReferenceLine
                y={series.averagePerMonth}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
              />
            )}
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#fillRevenue)"
              stroke="var(--color-revenue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
