import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { TopClientPoint } from "@/hooks/useFinanceStats"
import { useAppData } from "@/hooks/useAppData"
import { formatCurrency } from "@/utils/format"
import { EmptyState } from "@/components/shared/EmptyState"
import { Users } from "lucide-react"

const chartConfig = {
  total: { label: "Revenus", color: "var(--chart-1)" },
} satisfies ChartConfig

export function TopClientsChart({ data }: { data: TopClientPoint[] }) {
  const { currency } = useAppData()

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Pas encore de revenus"
        description="Les meilleurs clients apparaîtront une fois des paiements enregistrés."
      />
    )
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 4, right: 24, top: 4, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={100}
          className="text-[11px]"
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value) => [formatCurrency(Number(value), currency), " "]}
            />
          }
        />
        <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} maxBarSize={18} />
      </BarChart>
    </ChartContainer>
  )
}
