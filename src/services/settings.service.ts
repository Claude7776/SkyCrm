import type { BusinessSettings } from "@/types"
import { currentUserId, isRemoteStorage, requireSupabase } from "@/lib/supabase"
import { readCollection, writeCollection } from "./storage"

export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: "Mon Activité",
  logo: undefined,
  phone: "",
  email: "",
  currency: "EUR",
  accentColor: "#6d5efc",
  themeMode: "system",
  sendClientEmails: true,
}

export const settingsService = {
  async get(): Promise<BusinessSettings> {
    if (!isRemoteStorage) {
      return readCollection<BusinessSettings>("settings", DEFAULT_SETTINGS)
    }
    const { data, error } = await requireSupabase()
      .from("settings")
      .select("data")
      .maybeSingle()
    if (error) throw error
    return { ...DEFAULT_SETTINGS, ...(data?.data as Partial<BusinessSettings>) }
  },
  async update(patch: Partial<BusinessSettings>): Promise<BusinessSettings> {
    const current = await this.get()
    const next = { ...current, ...patch }
    await this.replace(next)
    return next
  },
  async replace(settings: BusinessSettings): Promise<void> {
    if (!isRemoteStorage) {
      writeCollection("settings", settings)
      return
    }
    const { error } = await requireSupabase()
      .from("settings")
      .upsert({ user_id: await currentUserId(), data: settings })
    if (error) throw error
  },
}
