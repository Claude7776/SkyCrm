import readExcelFile from "read-excel-file/browser"
import type {
  Client,
  ClientInput,
  ExpenseInput,
  PaiementInput,
  Prestation,
  PrestationInput,
} from "@/types"
import {
  ENTITY_ALIASES,
  detectEntityType,
  getCellRaw,
  getCellText,
  isEmptyRow,
  mapRecurrence,
  mapStatus,
  matchColumns,
  normalizeHeader,
  toISODate,
  toNumber,
  type ImportEntityType,
} from "@/utils/excelImportMapping"

export interface ExcelImportActions {
  addClient: (input: ClientInput) => Promise<Client>
  updateClient: (id: string, patch: Partial<ClientInput>) => Promise<void>
  addPrestation: (input: PrestationInput) => Promise<Prestation>
  addPaiement: (input: PaiementInput) => Promise<unknown>
  addExpense: (input: ExpenseInput) => Promise<unknown>
}

export interface ExcelImportSummary {
  clientsCreated: number
  clientsUpdated: number
  prestationsCreated: number
  prestationsSkipped: number
  paiementsCreated: number
  paiementsSkipped: number
  expensesCreated: number
  sheetsIgnored: string[]
}

const SHEET_ORDER: Record<ImportEntityType, number> = {
  clients: 0,
  prestations: 1,
  paiements: 2,
  expenses: 3,
}

function findByName<T extends { name?: string }>(items: T[], name: string): T | undefined {
  const target = normalizeHeader(name)
  return items.find((item) => item.name && normalizeHeader(item.name) === target)
}

export async function importExcelFile(
  file: File,
  initial: { clients: Client[]; prestations: Prestation[] },
  actions: ExcelImportActions
): Promise<ExcelImportSummary> {
  const sheets = await readExcelFile(file)

  const summary: ExcelImportSummary = {
    clientsCreated: 0,
    clientsUpdated: 0,
    prestationsCreated: 0,
    prestationsSkipped: 0,
    paiementsCreated: 0,
    paiementsSkipped: 0,
    expensesCreated: 0,
    sheetsIgnored: [],
  }

  const clients = [...initial.clients]
  const prestations = [...initial.prestations]

  const detected = sheets
    .map((s) => ({ ...s, type: detectEntityType(s.data[0] ?? []) }))
    .filter((s): s is typeof s & { type: ImportEntityType } => {
      if (!s.type) summary.sheetsIgnored.push(s.sheet)
      return s.type !== null
    })
    .sort((a, b) => SHEET_ORDER[a.type] - SHEET_ORDER[b.type])

  for (const sheet of detected) {
    const [headerRow, ...rows] = sheet.data

    if (sheet.type === "clients") {
      const cols = matchColumns(headerRow, ENTITY_ALIASES.clients)
      for (const row of rows) {
        if (isEmptyRow(row)) continue
        const name = getCellText(row, cols.name)
        if (!name) continue
        const patch: ClientInput = {
          name,
          email: getCellText(row, cols.email) || undefined,
          phone: getCellText(row, cols.phone) || undefined,
          company: getCellText(row, cols.company) || undefined,
          address: getCellText(row, cols.address) || undefined,
          notes: getCellText(row, cols.notes) || undefined,
        }
        const email = patch.email
        const existing = email
          ? clients.find((c) => c.email && normalizeHeader(c.email) === normalizeHeader(email))
          : undefined
        if (existing) {
          await actions.updateClient(existing.id, patch)
          Object.assign(existing, patch)
          summary.clientsUpdated++
        } else {
          const created = await actions.addClient(patch)
          clients.push(created)
          summary.clientsCreated++
        }
      }
    } else if (sheet.type === "prestations") {
      const cols = matchColumns(headerRow, ENTITY_ALIASES.prestations)
      for (const row of rows) {
        if (isEmptyRow(row)) continue
        const title = getCellText(row, cols.title)
        const clientName = getCellText(row, cols.clientName)
        const client = clientName ? findByName(clients, clientName) : undefined
        if (!title || !client) {
          summary.prestationsSkipped++
          continue
        }
        const created = await actions.addPrestation({
          clientId: client.id,
          title,
          description: getCellText(row, cols.description) || undefined,
          price: toNumber(getCellRaw(row, cols.price)) ?? 0,
          date: toISODate(getCellRaw(row, cols.date)) ?? new Date().toISOString(),
          dueDate: toISODate(getCellRaw(row, cols.dueDate)),
          status: mapStatus(getCellText(row, cols.status)),
        })
        prestations.push(created)
        summary.prestationsCreated++
      }
    } else if (sheet.type === "paiements") {
      const cols = matchColumns(headerRow, ENTITY_ALIASES.paiements)
      for (const row of rows) {
        if (isEmptyRow(row)) continue
        const prestationTitle = getCellText(row, cols.prestationTitle)
        const clientName = getCellText(row, cols.clientName)
        const client = clientName ? findByName(clients, clientName) : undefined
        const prestation = prestationTitle
          ? prestations.find(
              (p) =>
                normalizeHeader(p.title) === normalizeHeader(prestationTitle) &&
                (!client || p.clientId === client.id)
            )
          : undefined
        if (!prestation) {
          summary.paiementsSkipped++
          continue
        }
        await actions.addPaiement({
          prestationId: prestation.id,
          amount: toNumber(getCellRaw(row, cols.amount)) ?? 0,
          date: toISODate(getCellRaw(row, cols.date)) ?? new Date().toISOString(),
          method: getCellText(row, cols.method) || undefined,
          note: getCellText(row, cols.note) || undefined,
        })
        summary.paiementsCreated++
      }
    } else if (sheet.type === "expenses") {
      const cols = matchColumns(headerRow, ENTITY_ALIASES.expenses)
      for (const row of rows) {
        if (isEmptyRow(row)) continue
        const label = getCellText(row, cols.label)
        if (!label) continue
        await actions.addExpense({
          label,
          amount: toNumber(getCellRaw(row, cols.amount)) ?? 0,
          date: toISODate(getCellRaw(row, cols.date)) ?? new Date().toISOString(),
          category: getCellText(row, cols.category) || undefined,
          recurrence: mapRecurrence(getCellText(row, cols.recurrence)),
        })
        summary.expensesCreated++
      }
    }
  }

  return summary
}
