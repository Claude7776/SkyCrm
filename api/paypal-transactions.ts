import type { VercelRequest, VercelResponse } from "@vercel/node"
import { isSignedIn } from "./_lib/auth.js"

/** Same shape as PaypalTransactionData in src/types (kept separate: api/ is bundled on its own). */
export interface PaypalTransactionData {
  id: string
  date: string
  eventCode: string
  status: string
  amount: number
  fee: number
  currency: string
  payerEmail?: string
  payerName?: string
  description?: string
  invoiceId?: string
}

interface PaypalMoney {
  currency_code?: string
  value?: string
}

interface PaypalTransactionDetail {
  transaction_info?: {
    transaction_id?: string
    transaction_event_code?: string
    transaction_initiation_date?: string
    transaction_amount?: PaypalMoney
    fee_amount?: PaypalMoney
    transaction_status?: string
    transaction_subject?: string
    transaction_note?: string
    invoice_id?: string
  }
  payer_info?: {
    email_address?: string
    payer_name?: { alternate_full_name?: string; full_name?: string; given_name?: string; surname?: string }
  }
  cart_info?: { item_details?: { item_name?: string }[] }
}

const API_BASE =
  process.env.PAYPAL_ENV === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com"
// PayPal's Transaction Search accepts at most 31 days per request.
const MAX_RANGE_MS = 31 * 24 * 60 * 60 * 1000
const PAGE_SIZE = 500
const MAX_PAGES = 20

class PaypalError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(clientId: string, secret: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value

  const response = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })
  if (!response.ok) {
    throw new PaypalError(
      502,
      "PayPal a refusé les identifiants : vérifiez PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET et PAYPAL_ENV (live ou sandbox)."
    )
  }
  const body = (await response.json()) as { access_token: string; expires_in: number }
  cachedToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 }
  return body.access_token
}

const toNumber = (money?: PaypalMoney) => Number.parseFloat(money?.value ?? "0") || 0

/** PayPal sends "2026-10-01T09:15:00+0000", which Safari can't parse; store standard ISO. */
function toIsoDate(paypalDate: string): string | null {
  const date = new Date(paypalDate.replace(/([+-]\d{2})(\d{2})$/, "$1:$2"))
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function normalizeTransaction(detail: PaypalTransactionDetail): PaypalTransactionData | null {
  const info = detail.transaction_info
  const date = info?.transaction_initiation_date && toIsoDate(info.transaction_initiation_date)
  if (!info?.transaction_id || !date) return null

  const name = detail.payer_info?.payer_name
  const payerName =
    name?.alternate_full_name ||
    name?.full_name ||
    [name?.given_name, name?.surname].filter(Boolean).join(" ") ||
    undefined

  return {
    id: info.transaction_id,
    date,
    eventCode: info.transaction_event_code ?? "",
    status: info.transaction_status ?? "",
    amount: toNumber(info.transaction_amount),
    fee: toNumber(info.fee_amount),
    currency: info.transaction_amount?.currency_code ?? "EUR",
    payerEmail: detail.payer_info?.email_address,
    payerName,
    description:
      info.transaction_subject ||
      info.transaction_note ||
      detail.cart_info?.item_details?.[0]?.item_name ||
      undefined,
    invoiceId: info.invoice_id,
  }
}

/** PayPal wants RFC 3339 with seconds and no milliseconds. */
const toPaypalDate = (date: Date) => date.toISOString().replace(/\.\d{3}Z$/, "Z")

async function fetchTransactions(token: string, start: Date, end: Date) {
  const transactions: PaypalTransactionData[] = []
  let lastRefreshed: string | undefined

  for (let page = 1; page <= MAX_PAGES; page++) {
    const params = new URLSearchParams({
      start_date: toPaypalDate(start),
      end_date: toPaypalDate(end),
      fields: "transaction_info,payer_info,cart_info",
      page_size: String(PAGE_SIZE),
      page: String(page),
    })
    const response = await fetch(`${API_BASE}/v1/reporting/transactions?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.status === 403) {
      throw new PaypalError(
        403,
        "Accès refusé par PayPal : activez l'option « Transaction Search » sur votre app PayPal (developer.paypal.com). L'activation peut prendre quelques heures."
      )
    }
    if (!response.ok) {
      const detail = (await response.json().catch(() => ({}))) as { message?: string }
      throw new PaypalError(502, `Erreur PayPal (${response.status}) : ${detail.message ?? "réponse inattendue"}`)
    }

    const body = (await response.json()) as {
      transaction_details?: PaypalTransactionDetail[]
      total_pages?: number
      last_refreshed_datetime?: string
    }
    lastRefreshed = body.last_refreshed_datetime
    for (const detail of body.transaction_details ?? []) {
      const transaction = normalizeTransaction(detail)
      if (transaction) transactions.push(transaction)
    }
    if (page >= (body.total_pages ?? 1)) break
  }

  return { transactions, lastRefreshed }
}

/**
 * Returns the PayPal Business transactions between `startDate` and
 * `endDate` (31 days max). The browser saves them; PayPal credentials
 * never leave the server. Only signed-in users may call it.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  if (!(await isSignedIn(req))) {
    res.status(401).json({ error: "Connexion requise" })
    return
  }

  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !secret) {
    res.status(503).json({
      error: "PayPal n'est pas configuré : ajoutez PAYPAL_CLIENT_ID et PAYPAL_CLIENT_SECRET dans les variables d'environnement Vercel.",
    })
    return
  }

  const { startDate, endDate } = (req.body ?? {}) as { startDate?: string; endDate?: string }
  const start = new Date(startDate ?? "")
  const end = new Date(endDate ?? "")
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start ||
    end.getTime() - start.getTime() > MAX_RANGE_MS
  ) {
    res.status(400).json({ error: "Période invalide (31 jours maximum)" })
    return
  }

  try {
    const token = await getAccessToken(clientId, secret)
    res.status(200).json(await fetchTransactions(token, start, end))
  } catch (error) {
    if (error instanceof PaypalError) {
      res.status(error.status).json({ error: error.message })
      return
    }
    res.status(502).json({ error: "Impossible de joindre PayPal" })
  }
}
