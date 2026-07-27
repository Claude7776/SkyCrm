import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { NAV_ITEMS } from "./nav-items"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidebarNavProps {
  collapsed?: boolean
  onNavigate?: () => void
}

export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  return (
    <nav className="flex flex-col gap-1 px-2">
      {NAV_ITEMS.map((item) => {
        const link = (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-sidebar-primary/10 text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )
            }
          >
            <item.icon className="size-[18px] shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        )

        if (!collapsed) return link

        return (
          <Tooltip key={item.to} delayDuration={200}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        )
      })}
    </nav>
  )
}
