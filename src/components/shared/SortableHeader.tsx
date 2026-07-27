import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { SortDirection } from "@/hooks/useSortableData"

interface SortableHeaderProps {
  label: string
  sortKey: string
  activeKey: string
  direction: SortDirection
  onSort: (key: string) => void
  className?: string
}

export function SortableHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = sortKey === activeKey
  const Icon = !isActive ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors",
          isActive && "text-foreground"
        )}
      >
        {label}
        <Icon className="size-3" />
      </button>
    </TableHead>
  )
}
