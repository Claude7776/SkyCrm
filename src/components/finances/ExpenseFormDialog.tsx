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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useAppData } from "@/hooks/useAppData"
import { expenseSchema, type ExpenseFormValues, type ExpenseFormOutput } from "@/utils/schemas"
import { EXPENSE_RECURRENCE_LABELS } from "@/utils/status"
import type { Expense } from "@/types"

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

const EMPTY_VALUES: ExpenseFormValues = {
  label: "",
  amount: 0,
  date: today(),
  category: "",
  recurrence: "none",
}

export function ExpenseFormDialog({ open, onOpenChange, expense }: ExpenseFormDialogProps) {
  const { addExpense, updateExpense } = useAppData()
  const isEditing = Boolean(expense)
  const isGeneratedInstance = Boolean(expense?.recurringSourceId)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues, unknown, ExpenseFormOutput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: EMPTY_VALUES,
  })

  useEffect(() => {
    if (open) {
      reset(
        expense
          ? {
              label: expense.label,
              amount: expense.amount,
              date: expense.date.slice(0, 10),
              category: expense.category ?? "",
              recurrence: expense.recurrence ?? "none",
            }
          : EMPTY_VALUES
      )
    }
  }, [open, expense, reset])

  const onSubmit = async (values: ExpenseFormOutput) => {
    try {
      const payload = { ...values, date: new Date(values.date).toISOString() }
      if (isEditing && expense) {
        await updateExpense(expense.id, payload)
        toast.success("Dépense mise à jour")
      } else {
        await addExpense(payload)
        toast.success("Dépense ajoutée")
      }
      onOpenChange(false)
    } catch {
      toast.error("Une erreur est survenue")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier la dépense" : "Nouvelle dépense"}</DialogTitle>
          <DialogDescription>
            {isGeneratedInstance
              ? "Cette occurrence a été générée automatiquement par une dépense récurrente."
              : "Ajoutez une dépense professionnelle, ponctuelle ou récurrente."}
          </DialogDescription>
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
            <Field>
              <FieldLabel htmlFor="expense-recurrence">Répétition</FieldLabel>
              <Controller
                control={control}
                name="recurrence"
                render={({ field }) => (
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={field.onChange}
                    disabled={isGeneratedInstance}
                  >
                    <SelectTrigger id="expense-recurrence" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EXPENSE_RECURRENCE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {!isGeneratedInstance && (
                <p className="text-xs text-muted-foreground">
                  Une dépense récurrente se recrée automatiquement à chaque échéance.
                </p>
              )}
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form="expense-form" disabled={isSubmitting}>
            {isEditing ? "Enregistrer" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
