import { useEffect, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useAppData } from "@/hooks/useAppData"
import { paiementSchema, type PaiementFormValues, type PaiementFormOutput } from "@/utils/schemas"
import { remainingAmount } from "@/utils/status"
import { formatCurrency } from "@/utils/format"
import { sendEmail } from "@/services/email.service"
import { buildPaymentEmail } from "@/utils/emailTemplates"

interface PaiementFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultPrestationId?: string
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function PaiementFormDialog({
  open,
  onOpenChange,
  defaultPrestationId,
}: PaiementFormDialogProps) {
  const { clients, prestations, paiements, settings, addPaiement } = useAppData()

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients])

  const unpaidPrestations = useMemo(
    () =>
      prestations
        .filter((p) => remainingAmount(p, paiements) > 0)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [prestations, paiements]
  )

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaiementFormValues, unknown, PaiementFormOutput>({
    resolver: zodResolver(paiementSchema),
    defaultValues: {
      prestationId: defaultPrestationId ?? "",
      amount: 0,
      date: today(),
      method: "Virement",
      note: "",
    },
  })

  const selectedPrestationId = watch("prestationId")

  useEffect(() => {
    if (open) {
      reset({
        prestationId: defaultPrestationId ?? "",
        amount: 0,
        date: today(),
        method: "Virement",
        note: "",
      })
    }
  }, [open, defaultPrestationId, reset])

  useEffect(() => {
    const prestation = prestations.find((p) => p.id === selectedPrestationId)
    if (prestation) {
      setValue("amount", remainingAmount(prestation, paiements))
    }
  }, [selectedPrestationId, prestations, paiements, setValue])

  const onSubmit = async (values: PaiementFormOutput) => {
    try {
      await addPaiement({ ...values, date: new Date(values.date).toISOString() })
      toast.success("Paiement enregistré")

      const prestation = prestations.find((p) => p.id === values.prestationId)
      const client = prestation ? clientById.get(prestation.clientId) : undefined
      if (prestation && client?.email && settings.sendClientEmails) {
        const { subject, html } = buildPaymentEmail(
          client.name,
          settings.businessName,
          formatCurrency(values.amount, settings.currency),
          prestation.title
        )
        sendEmail(client.email, subject, html).then((ok) => {
          toast[ok ? "success" : "error"](
            ok ? "Email de confirmation envoyé" : "Email de confirmation non envoyé"
          )
        })
      }

      onOpenChange(false)
    } catch {
      toast.error("Une erreur est survenue")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau paiement</DialogTitle>
          <DialogDescription>
            Enregistrez un paiement reçu pour une prestation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} id="paiement-form">
          <FieldGroup>
            <Field data-invalid={!!errors.prestationId}>
              <FieldLabel htmlFor="paiement-prestation">Prestation *</FieldLabel>
              <Controller
                control={control}
                name="prestationId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="paiement-prestation" className="w-full">
                      <SelectValue placeholder="Sélectionner une prestation" />
                    </SelectTrigger>
                    <SelectContent>
                      {unpaidPrestations.length === 0 && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Aucune prestation impayée
                        </div>
                      )}
                      {unpaidPrestations.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title} — {clientById.get(p.clientId)?.name} (reste{" "}
                          {formatCurrency(remainingAmount(p, paiements), settings.currency)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.prestationId]} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!errors.amount}>
                <FieldLabel htmlFor="paiement-amount">Montant *</FieldLabel>
                <Input
                  id="paiement-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("amount")}
                />
                <FieldError errors={[errors.amount]} />
              </Field>
              <Field data-invalid={!!errors.date}>
                <FieldLabel htmlFor="paiement-date">Date *</FieldLabel>
                <Input id="paiement-date" type="date" {...register("date")} />
                <FieldError errors={[errors.date]} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="paiement-method">Méthode</FieldLabel>
              <Controller
                control={control}
                name="method"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="paiement-method" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Virement">Virement</SelectItem>
                      <SelectItem value="Carte">Carte bancaire</SelectItem>
                      <SelectItem value="Espèces">Espèces</SelectItem>
                      <SelectItem value="Chèque">Chèque</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="paiement-note">Note</FieldLabel>
              <Input id="paiement-note" placeholder="Acompte, solde…" {...register("note")} />
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form="paiement-form" disabled={isSubmitting || unpaidPrestations.length === 0}>
            Enregistrer le paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
