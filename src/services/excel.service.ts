import writeExcelFile from "write-excel-file/browser"
import type { Client, Expense, Paiement, Prestation } from "@/types"
import {
  EXPENSE_RECURRENCE_LABELS,
  PAYMENT_STATUS_LABELS,
  PRESTATION_STATUS_LABELS,
  computePaymentStatus,
} from "@/utils/status"

interface ExcelExportData {
  clients: Client[]
  prestations: Prestation[]
  paiements: Paiement[]
  expenses: Expense[]
}

function header(text: string) {
  return { value: text, fontWeight: "bold" as const }
}

/**
 * Real Date cells (not pre-formatted text) so the export stays sortable
 * in Excel and round-trips cleanly through the Excel import.
 */
function dateCell(iso: string | undefined) {
  if (!iso) return ""
  return { value: new Date(iso), type: Date, format: "dd/mm/yyyy" }
}

export async function exportDataToExcel(data: ExcelExportData): Promise<void> {
  const clientById = new Map(data.clients.map((c) => [c.id, c]))
  const prestationById = new Map(data.prestations.map((p) => [p.id, p]))

  const clientsSheet = [
    [
      header("Nom"),
      header("Email"),
      header("Téléphone"),
      header("Entreprise"),
      header("Adresse"),
      header("Notes"),
      header("Créé le"),
    ],
    ...data.clients.map((c) => [
      c.name,
      c.email || "",
      c.phone || "",
      c.company || "",
      c.address || "",
      c.notes || "",
      dateCell(c.createdAt),
    ]),
  ]

  const prestationsSheet = [
    [
      header("Titre"),
      header("Client"),
      header("Prix"),
      header("Date"),
      header("Échéance"),
      header("Statut"),
      header("Paiement"),
    ],
    ...data.prestations.map((p) => [
      p.title,
      clientById.get(p.clientId)?.name || "",
      p.price,
      dateCell(p.date),
      dateCell(p.dueDate),
      PRESTATION_STATUS_LABELS[p.status],
      PAYMENT_STATUS_LABELS[computePaymentStatus(p, data.paiements)],
    ]),
  ]

  const paiementsSheet = [
    [header("Prestation"), header("Client"), header("Montant"), header("Méthode"), header("Date"), header("Note")],
    ...data.paiements.map((pay) => {
      const prestation = prestationById.get(pay.prestationId)
      const client = prestation ? clientById.get(prestation.clientId) : undefined
      return [
        prestation?.title || "",
        client?.name || "",
        pay.amount,
        pay.method || "",
        dateCell(pay.date),
        pay.note || "",
      ]
    }),
  ]

  const expensesSheet = [
    [header("Libellé"), header("Montant"), header("Date"), header("Catégorie"), header("Récurrence")],
    ...data.expenses.map((e) => [
      e.label,
      e.amount,
      dateCell(e.date),
      e.category || "",
      EXPENSE_RECURRENCE_LABELS[e.recurrence ?? "none"],
    ]),
  ]

  const isoDate = new Date().toISOString().slice(0, 10)

  await writeExcelFile([
    { data: clientsSheet, sheet: "Clients" },
    { data: prestationsSheet, sheet: "Prestations" },
    { data: paiementsSheet, sheet: "Paiements" },
    { data: expensesSheet, sheet: "Dépenses" },
  ]).toFile(`skycrm-export-${isoDate}.xlsx`)
}
