import { Menu } from "lucide-react"
import { useAppData } from "@/hooks/useAppData"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SidebarNav } from "./SidebarNav"
import { initials } from "@/utils/format"
import { useState } from "react"

export function MobileSidebar() {
  const { settings } = useAppData()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b border-sidebar-border">
          <SheetTitle className="flex items-center gap-2 text-left">
            {settings.logo ? (
              <img
                src={settings.logo}
                alt=""
                className="size-8 rounded-md object-cover"
              />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-md bg-primary text-[13px] font-semibold text-primary-foreground">
                {initials(settings.businessName || "CRM")}
              </span>
            )}
            <span className="truncate">
              {settings.businessName || "Mon Activité"}
            </span>
          </SheetTitle>
        </SheetHeader>
        <div className="py-3">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
