import { z } from "zod"

export const clientSchema = z.object({
  name: z.string().min(2, "Le nom est requis (2 caractères minimum)"),
  email: z.union([z.literal(""), z.string().email("Email invalide")]).optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export type ClientFormValues = z.infer<typeof clientSchema>

export const prestationSchema = z.object({
  clientId: z.string().min(1, "Sélectionnez un client"),
  title: z.string().min(2, "Le titre est requis"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Le prix doit être positif"),
  date: z.string().min(1, "La date est requise"),
  dueDate: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]),
})

export type PrestationFormValues = z.input<typeof prestationSchema>
export type PrestationFormOutput = z.output<typeof prestationSchema>

export const paiementSchema = z.object({
  prestationId: z.string().min(1, "Sélectionnez une prestation"),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  date: z.string().min(1, "La date est requise"),
  method: z.string().optional(),
  note: z.string().optional(),
})

export type PaiementFormValues = z.input<typeof paiementSchema>
export type PaiementFormOutput = z.output<typeof paiementSchema>

export const expenseSchema = z.object({
  label: z.string().min(2, "Le libellé est requis"),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  date: z.string().min(1, "La date est requise"),
  category: z.string().optional(),
  recurrence: z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
})

export type ExpenseFormValues = z.input<typeof expenseSchema>
export type ExpenseFormOutput = z.output<typeof expenseSchema>

export const settingsSchema = z.object({
  businessName: z.string().min(1, "Le nom de l'activité est requis"),
  logo: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.literal(""), z.string().email("Email invalide")]).optional(),
  currency: z.string().min(1),
  accentColor: z.string().min(1),
  themeMode: z.enum(["light", "dark", "system"]),
})

export type SettingsFormValues = z.infer<typeof settingsSchema>
