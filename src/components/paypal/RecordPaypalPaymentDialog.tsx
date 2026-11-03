import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useAppData } from "@/hooks/useAppData"
import { convertAmount } from "@/services/exchangeRates.service"
import { paypalService } from "@/services/paypal.service"
import { currencySymbol } from "@/utils/currency"
import { formatCurrency, formatDate } from "@/utils/format"
import { remainingAmount } from "@/utils/status"
import type { Client, PaypalTransaction } from "@/types"

interface RecordPaypalPaymentDialogProps {
  transaction: PaypalTransaction | undefined
  /** Client whose email matches the payer, if any. */
  client: Client | undefined
  onOpenChange: (open: boolean) => void
  onRecorded: (transactionId: string, paiementId: string) => void
}

/** Records a PayPal payment as a SkyCRM payment on one of the unpaid services. */
export function RecordPaypalPaymentDialog({
  transaction,
  client,
  onOpenChange,
  onRecorded,
}: RecordPaypalPaymentDialogProps) {
  const { clients, prestations, paiements, addPaiement, currency } = useAppData()
  const [prestationId, setPrestationId] = useState("")
  const [amount, setAmount] = useState("")
  /** Transaction amount in the displayed currency, null while converting. */
  const [converted, setConverted] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const isConverting = Boolean(transaction) && converted === null

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients])
  const unpaid = useMemo(
    () =>
      prestations
        .filter((p) => remainingAmount(p, paiements) > 0)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [prestations, paiements]
  )
  const clientPrestations = client ? unpaid.filter((p) => p.clientId === client.id) : []
  const otherPrestations = client ? unpaid.filter((p) => p.clientId !== client.id) : unpaid

  // When a transaction is opened, prefill the amount in the displayed currency.
  useEffect(() => {
    if (!transaction) return
    let cancelled = false
    setConverted(null)
    setPrestationId("")
    convertAmount(transaction.amount, transaction.currency, currency)
      .catch(() => transaction.amount)
      .then((value) => {
        if (cancelled) return
        setConverted(value)
        setAmount(String(value))
      })
    return () => {
      cancelled = true
    }
  }, [transaction, currency])

  // Then suggest the matched client's service whose balance equals that
  // amount (or their latest one), unless one is already chosen.
  useEffect(() => {
    if (converted === null || prestationId || !client) return
    const candidates = unpaid.filter((p) => p.clientId === client.id)
    const exact = candidates.find((p) => Math.abs(remainingAmount(p, paiements) - converted) < 0.01)
    const suggestion = (exact ?? candidates[0])?.id
    if (suggestion) setPrestationId(suggestion)
  }, [converted, prestationId, client, unpaid, paiements])

  const parsedAmount = Number.parseFloat(amount.replace(",", "."))
  const canSave = Boolean(prestationId) && parsedAmount > 0 && !isConverting && !isSaving

  const handleSave = async () => {
    if (!transaction || !canSave) return
    setIsSaving(true)
    try {
      const created = await addPaiement({
        prestationId,
        amount: parsedAmount,
        date: new Date(transaction.date).toISOString(),
        method: "PayPal",
        note: `Transaction PayPal ${transaction.id}`,
      })
      await paypalService.update(transaction.id, { paiementId: created.id })
      onRecorded(transaction.id, created.id)
      toast.success("Paiement enregistré")
      onOpenChange(false)
    } catch {
      toast.error("Une erreur est survenue")
    } finally {
      setIsSaving(false)
    }
  }

  const prestationLabel = (p: (typeof unpaid)[number]) =>
    `${p.title} — ${clientById.get(p.clientId)?.name ?? "?"} (reste ${formatCurrency(
      remainingAmount(p, paiements),
      currency
    )})`

  return (
    <Dialog open={Boolean(transaction)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enregistrer comme paiement</DialogTitle>
          <DialogDescription>
            Rattachez ce paiement PayPal à une prestation pour mettre à jour son statut.
          </DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-foreground truncate">
                {transaction.payerName || transaction.payerEmail || "Payeur inconnu"}
              </span>
              <span className="font-medium tabular-nums text-status-good">
                +{formatCurrency(transaction.amount, transaction.currency)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span className="truncate">
                {formatDate(transaction.date)}
                {transaction.description ? ` · ${transaction.description}` : ""}
              </span>
              {transaction.fee !== 0 && (
                <span className="tabular-nums shrink-0">
                  frais {formatCurrency(transaction.fee, transaction.currency)}
                </span>
              )}
            </div>
          </div>
        )}

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="paypal-prestation">Prestation *</FieldLabel>
            <Select value={prestationId} onValueChange={setPrestationId}>
              <SelectTrigger id="paypal-prestation" className="w-full">
                <SelectValue placeholder="Sélectionner une prestation" />
              </SelectTrigger>
              <SelectContent>
                {unpaid.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    Aucune prestation impayée
                  </div>
                )}
                {clientPrestations.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>{client?.name}</SelectLabel>
                    {clientPrestations.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {prestationLabel(p)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {otherPrestations.length > 0 && (
                  <SelectGroup>
                    {client && <SelectLabel>Autres clients</SelectLabel>}
                    {otherPrestations.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {prestationLabel(p)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
            {unpaid.length === 0 && (
              <FieldDescription>
                Créez d'abord la prestation correspondante dans{" "}
                <Link to="/prestations" className="underline underline-offset-2">
                  Prestations
                </Link>
                .
              </FieldDescription>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="paypal-amount">Montant ({currencySymbol(currency)}) *</FieldLabel>
            <Input
              id="paypal-amount"
              type="number"
              step="0.01"
              min="0"
              value={isConverting ? "" : amount}
              placeholder={isConverting ? "Conversion…" : undefined}
              onChange={(e) => setAmount(e.target.value)}
            />
            {transaction && transaction.currency !== currency && (
              <FieldDescription>
                Converti depuis {formatCurrency(transaction.amount, transaction.currency)} au taux du jour.
              </FieldDescription>
            )}
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Enregistrer le paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
