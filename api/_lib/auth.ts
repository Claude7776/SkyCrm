import type { VercelRequest } from "@vercel/node"

/**
 * Checks the caller's Supabase access token against Supabase Auth, so only
 * signed-in SkyCRM users can reach functions that use server-side secrets.
 * Files under api/_lib are not deployed as endpoints.
 */
export async function isSignedIn(req: VercelRequest): Promise<boolean> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "")
  if (!supabaseUrl || !supabaseKey || !token) return false

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${token}` },
  })
  return response.ok
}
