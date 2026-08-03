import { useEffect, useRef, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Download, Upload, Trash2, ImagePlus, FileSpreadsheet } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldError, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { useAppData } from "@/hooks/useAppData"
import { settingsSchema, type SettingsFormValues, type SettingsFormOutput } from "@/utils/schemas"
import { exportBackupToFile, importBackupFromFile } from "@/services/backup.service"
import { exportDataToExcel } from "@/services/excel.service"
import { importExcelFile } from "@/services/excelImport.service"
import { initials } from "@/utils/format"

const CURRENCIES = [
  { value: "EUR", label: "Euro (€)" },
  { value: "USD", label: "Dollar US ($)" },
  { value: "GBP", label: "Livre sterling (£)" },
  { value: "CHF", label: "Franc suisse (CHF)" },
  { value: "CAD", label: "Dollar canadien (CAD)" },
]

const ACCENT_PRESETS = [
  "#6d5efc",
  "#2a78d6",
  "#1baf7a",
  "#eb6834",
  "#e34948",
  "#e87ba4",
  "#0f172a",
]

export function SettingsPage() {
  const {
    settings,
    updateSettings,
    reloadAll,
    clients,
    prestations,
    paiements,
    expenses,
    addClient,
    updateClient,
    addPrestation,
    addPaiement,
    addExpense,
  } = useAppData()
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isImportingExcel, setIsImportingExcel] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const importExcelInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | undefined>(settings.logo)

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsFormValues, unknown, SettingsFormOutput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  })

  useEffect(() => {
    reset(settings)
    setLogoPreview(settings.logo)
  }, [settings, reset])

  const accentColor = watch("accentColor")
  const businessName = watch("businessName")

  const onSubmit = async (values: SettingsFormOutput) => {
    try {
      await updateSettings(values)
      toast.success("Paramètres enregistrés")
    } catch {
      toast.error("Une erreur est survenue")
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setLogoPreview(dataUrl)
      setValue("logo", dataUrl, { shouldDirty: true })
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setLogoPreview(undefined)
    setValue("logo", undefined, { shouldDirty: true })
  }

  const handleExportExcel = async () => {
    setIsExportingExcel(true)
    try {
      await exportDataToExcel({ clients, prestations, paiements, expenses })
    } catch {
      toast.error("Impossible de générer le fichier Excel")
    } finally {
      setIsExportingExcel(false)
    }
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImportingExcel(true)
    try {
      const summary = await importExcelFile(
        file,
        { clients, prestations },
        { addClient, updateClient, addPrestation, addPaiement, addExpense }
      )
      const parts = [
        summary.clientsCreated && `${summary.clientsCreated} client(s) ajouté(s)`,
        summary.clientsUpdated && `${summary.clientsUpdated} client(s) mis à jour`,
        summary.prestationsCreated && `${summary.prestationsCreated} prestation(s) ajoutée(s)`,
        summary.paiementsCreated && `${summary.paiementsCreated} paiement(s) ajouté(s)`,
        summary.expensesCreated && `${summary.expensesCreated} dépense(s) ajoutée(s)`,
      ].filter(Boolean)
      const skipped = summary.prestationsSkipped + summary.paiementsSkipped
      if (parts.length === 0) {
        toast.error("Aucune ligne reconnue dans ce fichier")
      } else {
        toast.success(parts.join(", "))
        if (skipped > 0) {
          toast.warning(`${skipped} ligne(s) ignorée(s) (client ou prestation introuvable)`)
        }
        if (summary.sheetsIgnored.length > 0) {
          toast.warning(`Feuille(s) non reconnue(s) : ${summary.sheetsIgnored.join(", ")}`)
        }
      }
    } catch {
      toast.error("Fichier Excel invalide")
    } finally {
      setIsImportingExcel(false)
      e.target.value = ""
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await importBackupFromFile(file)
      reloadAll()
      toast.success("Sauvegarde importée avec succès")
    } catch {
      toast.error("Fichier de sauvegarde invalide")
    } finally {
      e.target.value = ""
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Paramètres" description="Configurez votre activité et vos préférences" />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Mon activité</CardTitle>
            <CardDescription>Ces informations apparaissent dans l'application.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="flex items-center gap-4">
                <Avatar className="size-16 rounded-lg">
                  <AvatarImage src={logoPreview} className="object-cover" />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-lg font-semibold">
                    {initials(businessName || "CRM")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <ImagePlus /> Changer le logo
                  </Button>
                  {logoPreview && (
                    <Button type="button" variant="ghost" size="sm" onClick={removeLogo}>
                      Retirer
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </div>
              </div>

              <Field data-invalid={!!errors.businessName}>
                <FieldLabel htmlFor="business-name">Nom de l'activité *</FieldLabel>
                <Input id="business-name" {...register("businessName")} />
                <FieldError errors={[errors.businessName]} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field data-invalid={!!errors.phone}>
                  <FieldLabel htmlFor="business-phone">Téléphone</FieldLabel>
                  <Input id="business-phone" {...register("phone")} />
                </Field>
                <Field data-invalid={!!errors.email}>
                  <FieldLabel htmlFor="business-email">Email</FieldLabel>
                  <Input id="business-email" type="email" {...register("email")} />
                  <FieldError errors={[errors.email]} />
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Apparence</CardTitle>
            <CardDescription>Personnalisez la devise et la couleur d'accent.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="currency">Devise</FieldLabel>
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="currency" className="w-full sm:w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <Field>
                <FieldLabel>Couleur d'accent</FieldLabel>
                <div className="flex flex-wrap items-center gap-2">
                  {ACCENT_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setValue("accentColor", color, { shouldDirty: true })}
                      className="size-8 rounded-full ring-offset-2 ring-offset-background transition-shadow"
                      style={{
                        backgroundColor: color,
                        boxShadow: accentColor === color ? `0 0 0 2px ${color}` : undefined,
                      }}
                      aria-label={color}
                    />
                  ))}
                  <Controller
                    control={control}
                    name="accentColor"
                    render={({ field }) => (
                      <input
                        type="color"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="size-8 cursor-pointer rounded-full border border-border bg-transparent p-0"
                      />
                    )}
                  />
                </div>
                <FieldDescription>Utilisée pour la barre latérale et les accents.</FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Emails automatiques</CardTitle>
            <CardDescription>
              Envoie un email de bienvenue à l'inscription d'un client, et un email de
              confirmation à chaque paiement reçu. Nécessite une clé Resend configurée côté
              serveur (variable d'environnement RESEND_API_KEY).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="send-client-emails">
                Envoyer les emails de bienvenue et de paiement
              </FieldLabel>
              <Controller
                control={control}
                name="sendClientEmails"
                render={({ field }) => (
                  <Switch
                    id="send-client-emails"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            Enregistrer les modifications
          </Button>
        </div>
      </form>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Sauvegarde des données</CardTitle>
          <CardDescription>
            Vos données sont stockées localement dans ce navigateur. Exportez-les régulièrement.
            L'import Excel reconnaît les colonnes par leur en-tête (Nom, Email, Titre, Montant…) —
            les colonnes non reconnues sont ignorées.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={exportBackupToFile}>
            <Download /> Exporter en JSON
          </Button>
          <Button type="button" variant="outline" onClick={() => importInputRef.current?.click()}>
            <Upload /> Importer un fichier JSON
          </Button>
          <Button type="button" variant="outline" onClick={handleExportExcel} disabled={isExportingExcel}>
            <FileSpreadsheet /> Exporter en Excel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => importExcelInputRef.current?.click()}
            disabled={isImportingExcel}
          >
            <Upload /> Importer un fichier Excel
          </Button>
          <input
            ref={importExcelInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handleImportExcel}
          />
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImport}
          />
        </CardContent>
      </Card>

      <Card className="mt-4 border-status-critical/20">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-status-critical">Zone sensible</CardTitle>
          <CardDescription>Réinitialise toutes les données de l'application.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetAllButton />
        </CardContent>
      </Card>
    </div>
  )
}

function ResetAllButton() {
  const { reloadAll } = useAppData()
  const [confirming, setConfirming] = useState(false)

  const handleReset = () => {
    window.localStorage.clear()
    reloadAll()
    window.location.reload()
  }

  return confirming ? (
    <div className="flex items-center gap-2">
      <Button variant="destructive" size="sm" onClick={handleReset}>
        <Trash2 /> Confirmer la suppression
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Annuler
      </Button>
    </div>
  ) : (
    <Button variant="outline" size="sm" className="text-status-critical hover:text-status-critical" onClick={() => setConfirming(true)}>
      <Trash2 /> Réinitialiser toutes les données
    </Button>
  )
}
