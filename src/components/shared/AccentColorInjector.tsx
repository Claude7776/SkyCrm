import { useEffect } from "react"
import { useAppData } from "@/hooks/useAppData"
import { pickForeground } from "@/utils/color"

export function AccentColorInjector() {
  const { settings } = useAppData()

  useEffect(() => {
    const root = document.documentElement
    const accent = settings.accentColor || "#6d5efc"
    const foreground = pickForeground(accent)
    root.style.setProperty("--primary", accent)
    root.style.setProperty("--primary-foreground", foreground)
    root.style.setProperty("--ring", accent)
    root.style.setProperty("--sidebar-primary", accent)
    root.style.setProperty("--sidebar-primary-foreground", foreground)
    root.style.setProperty("--sidebar-ring", accent)
  }, [settings.accentColor])

  return null
}
