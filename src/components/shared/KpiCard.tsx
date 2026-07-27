import type { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  label: string
  value: string
  icon: LucideIcon
  hint?: string
  accent?: "default" | "good" | "warning" | "critical"
  index?: number
}

const ACCENT_ICON_CLASS: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  default: "bg-primary/10 text-primary",
  good: "bg-status-good/10 text-status-good",
  warning: "bg-status-warning/10 text-amber-700 dark:text-status-warning",
  critical: "bg-status-critical/10 text-status-critical",
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "default",
  index = 0,
}: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: "easeOut" }}
    >
      <Card className="gap-2 py-4">
        <CardContent className="flex items-start justify-between gap-3 px-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground truncate">
              {label}
            </p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
              {value}
            </p>
            {hint && (
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            )}
          </div>
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              ACCENT_ICON_CLASS[accent]
            )}
          >
            <Icon className="size-[18px]" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
