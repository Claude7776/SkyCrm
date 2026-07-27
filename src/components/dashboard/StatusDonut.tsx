import { Cell, Pie, PieChart } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface StatusDonutProps {
  data: { name: string; value: number }[]
}

const chartConfig = {
  "À faire": { label: "À faire", color: "var(--chart-1)" },
  "En cours": { label: "En cours", color: "var(--chart-2)" },
  Terminé: { label: "Terminé", color: "var(--chart-3)" },
} satisfies ChartConfig

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"]

export function StatusDonut({ data }: StatusDonutProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        Aucune prestation pour le moment
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <ChartContainer config={chartConfig} className="aspect-square h-[200px] w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={54}
            outerRadius={80}
            paddingAngle={2}
            strokeWidth={2}
            stroke="var(--card)"
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs">
            <span
              className="size-2 rounded-[2px]"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="font-medium text-foreground tabular-nums">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
