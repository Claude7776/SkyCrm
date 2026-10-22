import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { Search } from "lucide-react"
import { MobileSidebar } from "./MobileSidebar"
import { CommandPalette } from "./CommandPalette"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { StorageStatus } from "@/components/shared/StorageStatus"
import { Button } from "@/components/ui/button"
import { NAV_ITEMS } from "./nav-items"

const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent)

export function Header() {
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)

  const current = NAV_ITEMS.find((item) =>
    item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
      <MobileSidebar />
      <h1 className="text-sm font-semibold text-foreground">
        {current?.label ?? "SkyCRM"}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        <StorageStatus />
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex text-muted-foreground font-normal w-56 justify-start gap-2"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="size-4" />
          Rechercher…
          <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {isMac ? "⌘K" : "Ctrl K"}
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={() => setSearchOpen(true)}
          aria-label="Rechercher"
        >
          <Search className="size-[18px]" />
        </Button>
        <ThemeToggle />
      </div>

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}
