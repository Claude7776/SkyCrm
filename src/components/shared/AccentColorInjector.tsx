import { useEffect } from "react"
import { useAppData } from "@/hooks/useAppData"
import { useTheme } from "next-themes"
import { pickForeground, readableOnDark } from "@/utils/color"

export function AccentColorInjector() {
  const { settings } = useAppData()
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const root = document.documentElement
    const chosen = settings.accentColor || "#6d5efc"
    const accent = resolvedTheme === "dark" ? readableOnDark(chosen) : chosen
    const foreground = pickForeground(accent)
    root.style.setProperty("--primary", accent)
    root.style.setProperty("--primary-foreground", foreground)
    root.style.setProperty("--ring", accent)
    root.style.setProperty("--sidebar-primary", accent)
    root.style.setProperty("--sidebar-primary-foreground", foreground)
    root.style.setProperty("--sidebar-ring", accent)
  }, [settings.accentColor, resolvedTheme])

  return null
}
