import type { BusinessSettings } from "@/types"
import { readCollection, writeCollection } from "./storage"

export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: "Mon Activité",
  logo: undefined,
  phone: "",
  email: "",
  currency: "EUR",
  accentColor: "#6d5efc",
  themeMode: "system",
}

export const settingsService = {
  async get(): Promise<BusinessSettings> {
    return readCollection<BusinessSettings>("settings", DEFAULT_SETTINGS)
  },
  async update(patch: Partial<BusinessSettings>): Promise<BusinessSettings> {
    const current = await this.get()
    const next = { ...current, ...patch }
    writeCollection("settings", next)
    return next
  },
}
