import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { MonthlyRevenuePoint } from "@/hooks/useDashboardStats"
import { useAppData } from "@/hooks/useAppData"
import { formatCurrency } from "@/utils/format"

const chartConfig = {
  revenue: {
    label: "Revenus",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function RevenueChart({ data }: { data: MonthlyRevenuePoint[] }) {
  const { settings } = useAppData()

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
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
          className="text-[11px]"
        />
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
          cursor={{ stroke: "var(--border)" }}
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={(value) => [
                formatCurrency(Number(value), settings.currency),
                " Revenus",
              ]}
            />
          }
        />
        <Area
          dataKey="revenue"
          type="monotone"
          fill="url(#fillRevenue)"
          stroke="var(--color-revenue)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
