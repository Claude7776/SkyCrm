import { callApi } from "./api"

/**
 * Emails go through /api/send-email, which only accepts signed-in users,
 * so they are sent only when Supabase is configured.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    await callApi("/api/send-email", { to, subject, html })
    return true
  } catch {
    return false
  }
}
