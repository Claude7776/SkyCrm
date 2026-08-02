import type { VercelRequest, VercelResponse } from "@vercel/node"

/**
 * Relays transactional emails (client welcome / payment confirmation) to
 * Resend. The API key must stay server-side — this function is the only
 * place it's read from, never bundled into the browser build.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  const { to, subject, html } = (req.body ?? {}) as {
    to?: string
    subject?: string
    html?: string
  }

  if (!to || !subject || !html) {
    res.status(400).json({ error: "Missing to, subject or html" })
    return
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: "RESEND_API_KEY is not configured" })
    return
  }

  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!resendResponse.ok) {
    const detail = await resendResponse.text()
    res.status(502).json({ error: detail })
    return
  }

  res.status(200).json({ ok: true })
}
