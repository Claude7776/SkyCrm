import { supabase } from "@/lib/supabase"

/**
 * Emails go through /api/send-email, which only accepts signed-in users,
 * so they are sent only when Supabase is configured.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } }
    const token = data.session?.access_token
    if (!token) return false

    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to, subject, html }),
    })
    return res.ok
  } catch {
    return false
  }
}
