import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { isRemoteStorage } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"

function useIsOnline() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine)
    window.addEventListener("online", update)
    window.addEventListener("offline", update)
    return () => {
      window.removeEventListener("online", update)
      window.removeEventListener("offline", update)
    }
  }, [])
  return isOnline
}

/** Shows at a glance whether data goes to the online database or stays in this browser. */
export function StorageStatus() {
  const { user } = useAuth()
  const isOnline = useIsOnline()

  const status = !isRemoteStorage
    ? { label: "Local", dot: "bg-status-warning", title: "Données stockées uniquement dans ce navigateur" }
    : !isOnline
      ? { label: "Hors ligne", dot: "bg-status-critical", title: "Pas de connexion internet : les modifications ne seront pas enregistrées" }
      : { label: "En ligne", dot: "bg-status-good", title: `Données synchronisées dans la base (${user?.email})` }

  return (
    <Link
      to="/settings"
      title={status.title}
      className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
    >
      <span className={cn("size-2 rounded-full", status.dot)} />
      {status.label}
    </Link>
  )
}
