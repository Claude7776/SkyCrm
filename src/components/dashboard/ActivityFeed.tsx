import { Link } from "react-router-dom"
import { UserPlus, Briefcase, Wallet } from "lucide-react"
import { useActivityFeed } from "@/hooks/useActivityFeed"
import { formatRelativeTime } from "@/utils/format"
import { EmptyState } from "@/components/shared/EmptyState"

const ICONS = {
  client: UserPlus,
  prestation: Briefcase,
  paiement: Wallet,
}

const ICON_STYLES = {
  client: "bg-chart-1/10 text-chart-1",
  prestation: "bg-chart-2/10 text-chart-2",
  paiement: "bg-status-good/10 text-status-good",
}

export function ActivityFeed() {
  const items = useActivityFeed(8)

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="Aucune activité récente"
        description="Vos derniers clients, prestations et paiements apparaîtront ici."
      />
    )
  }

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = ICONS[item.type]
        return (
          <li key={item.id}>
            <Link
              to={item.href ?? "#"}
              className="flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 hover:bg-muted/60 transition-colors"
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${ICON_STYLES[item.type]}`}
              >
                <Icon className="size-[15px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {item.label}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {item.description}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatRelativeTime(item.date)}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
