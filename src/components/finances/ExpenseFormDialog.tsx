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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useAppData } from "@/hooks/useAppData"
import { expenseSchema, type ExpenseFormValues } from "@/utils/schemas"

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function ExpenseFormDialog({ open, onOpenChange }: ExpenseFormDialogProps) {
  const { addExpense } = useAppData()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { label: "", amount: 0, date: today(), category: "" },
  })

  useEffect(() => {
    if (open) reset({ label: "", amount: 0, date: today(), category: "" })
  }, [open, reset])

  const onSubmit = async (values: ExpenseFormValues) => {
    try {
      await addExpense({ ...values, date: new Date(values.date).toISOString() })
      toast.success("Dépense ajoutée")
      onOpenChange(false)
    } catch {
      toast.error("Une erreur est survenue")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle dépense</DialogTitle>
          <DialogDescription>Ajoutez une dépense professionnelle.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} id="expense-form">
          <FieldGroup>
            <Field data-invalid={!!errors.label}>
              <FieldLabel htmlFor="expense-label">Libellé *</FieldLabel>
              <Input id="expense-label" placeholder="Abonnement logiciel" {...register("label")} />
              <FieldError errors={[errors.label]} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!errors.amount}>
                <FieldLabel htmlFor="expense-amount">Montant *</FieldLabel>
                <Input id="expense-amount" type="number" step="0.01" min="0" {...register("amount")} />
                <FieldError errors={[errors.amount]} />
              </Field>
              <Field data-invalid={!!errors.date}>
                <FieldLabel htmlFor="expense-date">Date *</FieldLabel>
                <Input id="expense-date" type="date" {...register("date")} />
                <FieldError errors={[errors.date]} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="expense-category">Catégorie</FieldLabel>
              <Input id="expense-category" placeholder="Outils, formation…" {...register("category")} />
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form="expense-form" disabled={isSubmitting}>
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
