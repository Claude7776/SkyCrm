import type { VercelRequest, VercelResponse } from "@vercel/node"

const EMAIL_PATTERN = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/
const MAX_HTML_LENGTH = 100_000

/**
 * Only signed-in SkyCRM users may send: the caller's Supabase access token
 * is checked against Supabase Auth. Without this, anyone knowing the URL
 * could use the Resend account to send spam.
 */
async function isSignedIn(req: VercelRequest): Promise<boolean> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "")
  if (!supabaseUrl || !supabaseKey || !token) return false

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${token}` },
  })
  return response.ok
}

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

  if (!(await isSignedIn(req))) {
    res.status(401).json({ error: "Sign-in required" })
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

  // One recipient per call, and a bounded body, to limit abuse.
  if (!EMAIL_PATTERN.test(to) || subject.length > 200 || html.length > MAX_HTML_LENGTH) {
    res.status(400).json({ error: "Invalid recipient, subject or body" })
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
