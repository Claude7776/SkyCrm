import { useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useAppData } from "@/hooks/useAppData"
import { currencySymbol } from "@/utils/currency"
import { prestationSchema, type PrestationFormValues, type PrestationFormOutput } from "@/utils/schemas"
import { PRESTATION_STATUS_LABELS } from "@/utils/status"
import type { Prestation } from "@/types"

interface PrestationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prestation?: Prestation
  defaultClientId?: string
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

const EMPTY_VALUES: PrestationFormValues = {
  clientId: "",
  title: "",
  description: "",
  price: 0,
  date: today(),
  dueDate: "",
  status: "todo",
}

export function PrestationFormDialog({
  open,
  onOpenChange,
  prestation,
  defaultClientId,
}: PrestationFormDialogProps) {
  const { clients, addPrestation, updatePrestation, currency } = useAppData()
  const isEditing = Boolean(prestation)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PrestationFormValues, unknown, PrestationFormOutput>({
    resolver: zodResolver(prestationSchema),
    defaultValues: EMPTY_VALUES,
  })

  useEffect(() => {
    if (open) {
      reset(
        prestation
          ? {
              clientId: prestation.clientId,
              title: prestation.title,
              description: prestation.description ?? "",
              price: prestation.price,
              date: prestation.date.slice(0, 10),
              dueDate: prestation.dueDate?.slice(0, 10) ?? "",
              status: prestation.status,
            }
          : { ...EMPTY_VALUES, clientId: defaultClientId ?? "" }
      )
    }
  }, [open, prestation, defaultClientId, reset])

  const onSubmit = async (values: PrestationFormOutput) => {
    try {
      const payload = {
        ...values,
        date: new Date(values.date).toISOString(),
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
      }
      if (isEditing && prestation) {
        await updatePrestation(prestation.id, payload)
        toast.success("Prestation mise à jour")
      } else {
        await addPrestation(payload)
        toast.success("Prestation ajoutée")
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
          <DialogTitle>{isEditing ? "Modifier la prestation" : "Nouvelle prestation"}</DialogTitle>
          <DialogDescription>
            Renseignez les détails de la prestation à réaliser.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} id="prestation-form">
          <FieldGroup>
            <Field data-invalid={!!errors.clientId}>
              <FieldLabel htmlFor="prestation-client">Client *</FieldLabel>
              <Controller
                control={control}
                name="clientId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="prestation-client" className="w-full">
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.clientId]} />
            </Field>

            <Field data-invalid={!!errors.title}>
              <FieldLabel htmlFor="prestation-title">Titre *</FieldLabel>
              <Input id="prestation-title" placeholder="Refonte site web" {...register("title")} />
              <FieldError errors={[errors.title]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="prestation-description">Description</FieldLabel>
              <Textarea id="prestation-description" rows={3} {...register("description")} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!errors.price}>
                <FieldLabel htmlFor="prestation-price">Prix ({currencySymbol(currency)}) *</FieldLabel>
                <Input
                  id="prestation-price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("price")}
                />
                <FieldError errors={[errors.price]} />
              </Field>
              <Field data-invalid={!!errors.status}>
                <FieldLabel htmlFor="prestation-status">Statut *</FieldLabel>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="prestation-status" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRESTATION_STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!errors.date}>
                <FieldLabel htmlFor="prestation-date">Date *</FieldLabel>
                <Input id="prestation-date" type="date" {...register("date")} />
                <FieldError errors={[errors.date]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="prestation-due">Date limite</FieldLabel>
                <Input id="prestation-due" type="date" {...register("dueDate")} />
              </Field>
            </div>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form="prestation-form" disabled={isSubmitting || clients.length === 0}>
            {isEditing ? "Enregistrer" : "Ajouter la prestation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
