import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { MonthlyFinancePoint } from "@/hooks/useFinanceStats"
import { useAppData } from "@/hooks/useAppData"
import { formatCurrency } from "@/utils/format"

const chartConfig = {
  revenue: { label: "Revenus", color: "var(--chart-1)" },
  expenses: { label: "Dépenses", color: "var(--chart-2)" },
} satisfies ChartConfig

export function RevenueExpenseChart({ data }: { data: MonthlyFinancePoint[] }) {
  const { settings } = useAppData()

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
      <BarChart data={data} margin={{ left: 4, right: 12, top: 8 }} barGap={4}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} className="text-[11px]" />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={56}
          className="text-[11px]"
          tickFormatter={(value: number) =>
            formatCurrency(value, settings.currency).replace(/\s?,00\s?/, "")
          }
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              formatter={(value, name) => [
                formatCurrency(Number(value), settings.currency),
                name === "revenue" ? " Revenus" : " Dépenses",
              ]}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[3, 3, 0, 0]} maxBarSize={22} />
        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[3, 3, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ChartContainer>
  )
}
