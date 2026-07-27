import { Outlet, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { useLocalStorageState } from "@/hooks/useLocalStorageState"
import { useAppData } from "@/hooks/useAppData"

export function AppLayout() {
  const [collapsed, setCollapsed] = useLocalStorageState(
    "skycrm:ui:sidebarCollapsed",
    false
  )
  const { isLoading } = useAppData()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-svh w-full items-center justify-center bg-background text-sm text-muted-foreground">
        Chargement…
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div className="flex min-h-svh flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
