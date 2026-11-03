import { supabase } from "@/lib/supabase"

/**
 * POSTs to one of our /api functions with the user's Supabase session, which
 * those functions require. Throws with the server's (French) error message.
 */
export async function callApi<T>(path: string, body: unknown): Promise<T> {
  const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } }
  const token = data.session?.access_token
  if (!token) throw new Error("Connectez-vous pour utiliser cette fonction")

  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  const result = (await response.json().catch(() => ({}))) as T & { error?: string }
  if (!response.ok) throw new Error(result.error || `Erreur ${response.status}`)
  return result
}
