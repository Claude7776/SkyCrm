function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
  )
}

function emailShell(businessName: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
      <p style="margin:0 0 24px;font-size:13px;letter-spacing:.02em;text-transform:uppercase;color:#7e14ff;font-weight:600;">${escapeHtml(businessName)}</p>
      ${bodyHtml}
    </div>
  </body>
</html>`
}

export function buildWelcomeEmail(clientName: string, businessName: string) {
  const subject = `Bienvenue chez ${businessName}`
  const html = emailShell(
    businessName,
    `<h1 style="margin:0 0 16px;font-size:20px;">Bonjour ${escapeHtml(clientName)},</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
      Merci de votre confiance&nbsp;! Vous êtes désormais enregistré(e) chez <strong>${escapeHtml(businessName)}</strong>.
    </p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#71717a;">
      Nous reviendrons vers vous prochainement au sujet de vos prestations.
    </p>`
  )
  return { subject, html }
}

export function buildPaymentEmail(
  clientName: string,
  businessName: string,
  amount: string,
  prestationTitle: string
) {
  const subject = `Confirmation de paiement — ${businessName}`
  const html = emailShell(
    businessName,
    `<h1 style="margin:0 0 16px;font-size:20px;">Merci ${escapeHtml(clientName)}&nbsp;!</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
      Nous confirmons la bonne réception de votre paiement de <strong>${escapeHtml(amount)}</strong>
      pour la prestation « ${escapeHtml(prestationTitle)} ».
    </p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#71717a;">
      ${escapeHtml(businessName)}
    </p>`
  )
  return { subject, html }
}
