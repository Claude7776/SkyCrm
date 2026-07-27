import { motion } from "framer-motion"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { useAppData } from "@/hooks/useAppData"
import { Button } from "@/components/ui/button"
import { SidebarNav } from "./SidebarNav"
import { initials } from "@/utils/format"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { settings } = useAppData()

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 248 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="hidden md:flex h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar sticky top-0"
    >
      <div className="flex h-14 items-center gap-2 px-3 border-b border-sidebar-border">
        {settings.logo ? (
          <img
            src={settings.logo}
            alt=""
            className="size-8 rounded-md object-cover shrink-0"
          />
        ) : (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-[13px] font-semibold text-primary-foreground">
            {initials(settings.businessName || "CRM")}
          </div>
        )}
        {!collapsed && (
          <span className="truncate text-sm font-semibold text-sidebar-foreground">
            {settings.businessName || "Mon Activité"}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        <SidebarNav collapsed={collapsed} />
      </div>

      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="icon"
          className="w-full text-sidebar-foreground/70 hover:text-sidebar-foreground"
          onClick={onToggle}
          aria-label={collapsed ? "Déplier le menu" : "Réduire le menu"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-[18px]" />
          ) : (
            <PanelLeftClose className="size-[18px]" />
          )}
        </Button>
      </div>
    </motion.aside>
  )
}
