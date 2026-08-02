export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html }),
    })
    return res.ok
  } catch {
    return false
  }
}
