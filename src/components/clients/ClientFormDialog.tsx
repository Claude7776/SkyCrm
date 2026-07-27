import { useEffect } from "react"
import { useForm } from "react-hook-form"
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useAppData } from "@/hooks/useAppData"
import { clientSchema, type ClientFormValues } from "@/utils/schemas"
import type { Client } from "@/types"

interface ClientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client
}

const EMPTY_VALUES: ClientFormValues = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  notes: "",
}

export function ClientFormDialog({ open, onOpenChange, client }: ClientFormDialogProps) {
  const { addClient, updateClient } = useAppData()
  const isEditing = Boolean(client)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: EMPTY_VALUES,
  })

  useEffect(() => {
    if (open) {
      reset(
        client
          ? {
              name: client.name,
              email: client.email ?? "",
              phone: client.phone ?? "",
              company: client.company ?? "",
              address: client.address ?? "",
              notes: client.notes ?? "",
            }
          : EMPTY_VALUES
      )
    }
  }, [open, client, reset])

  const onSubmit = async (values: ClientFormValues) => {
    try {
      if (isEditing && client) {
        await updateClient(client.id, values)
        toast.success("Client mis à jour")
      } else {
        await addClient(values)
        toast.success("Client ajouté")
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
          <DialogTitle>{isEditing ? "Modifier le client" : "Nouveau client"}</DialogTitle>
          <DialogDescription>
            Renseignez les informations de contact de votre client.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} id="client-form">
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="client-name">Nom *</FieldLabel>
              <Input id="client-name" placeholder="Jeanne Dupont" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="client-email">Email</FieldLabel>
                <Input
                  id="client-email"
                  type="email"
                  placeholder="jeanne@exemple.fr"
                  {...register("email")}
                />
                <FieldError errors={[errors.email]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="client-phone">Téléphone</FieldLabel>
                <Input id="client-phone" placeholder="06 12 34 56 78" {...register("phone")} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="client-company">Entreprise</FieldLabel>
              <Input id="client-company" placeholder="Nom de l'entreprise" {...register("company")} />
            </Field>

            <Field>
              <FieldLabel htmlFor="client-address">Adresse</FieldLabel>
              <Input id="client-address" placeholder="12 rue de Paris, 75000" {...register("address")} />
            </Field>

            <Field>
              <FieldLabel htmlFor="client-notes">Notes</FieldLabel>
              <Textarea
                id="client-notes"
                placeholder="Informations complémentaires…"
                rows={3}
                {...register("notes")}
              />
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form="client-form" disabled={isSubmitting}>
            {isEditing ? "Enregistrer" : "Ajouter le client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
