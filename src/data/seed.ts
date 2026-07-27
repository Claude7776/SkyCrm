import { subDays, subMonths } from "date-fns"
import type { Client, Expense, Paiement, Prestation } from "@/types"

function iso(date: Date): string {
  return date.toISOString()
}

const now = new Date()

const clientDefs = [
  { name: "Claire Dubois", company: "Atelier Dubois", email: "claire@atelier-dubois.fr", phone: "06 12 34 56 78" },
  { name: "Marc Lefevre", company: "Lefevre & Co", email: "marc@lefevre.co", phone: "06 98 76 54 32" },
  { name: "Sophie Martin", company: "Studio Martin", email: "sophie@studiomartin.fr", phone: "07 11 22 33 44" },
  { name: "Julien Petit", company: "Petit Digital", email: "julien@petitdigital.fr", phone: "06 55 44 33 22" },
  { name: "Amélie Rousseau", company: "Rousseau Conseil", email: "amelie@rousseau-conseil.fr", phone: "07 66 77 88 99" },
]

export function buildSeedClients(): Client[] {
  return clientDefs.map((def, index) => {
    const createdAt = iso(subMonths(now, 8 - index))
    return {
      id: crypto.randomUUID(),
      name: def.name,
      company: def.company,
      email: def.email,
      phone: def.phone,
      address: "",
      notes: "",
      createdAt,
      updatedAt: createdAt,
    }
  })
}

export function buildSeedPrestations(clients: Client[]): Prestation[] {
  const templates: Array<{
    title: string
    price: number
    monthsAgo: number
    status: Prestation["status"]
  }> = [
    { title: "Refonte site vitrine", price: 2400, monthsAgo: 6, status: "done" },
    { title: "Identité visuelle", price: 1200, monthsAgo: 5, status: "done" },
    { title: "Landing page produit", price: 950, monthsAgo: 4, status: "done" },
    { title: "Maintenance mensuelle", price: 300, monthsAgo: 3, status: "done" },
    { title: "Boutique en ligne", price: 3200, monthsAgo: 3, status: "in_progress" },
    { title: "Application interne", price: 4800, monthsAgo: 2, status: "in_progress" },
    { title: "Audit UX", price: 650, monthsAgo: 2, status: "done" },
    { title: "Refonte logo", price: 480, monthsAgo: 1, status: "done" },
    { title: "Newsletter design", price: 350, monthsAgo: 1, status: "todo" },
    { title: "Formation équipe", price: 800, monthsAgo: 0, status: "todo" },
    { title: "Support ponctuel", price: 220, monthsAgo: 0, status: "in_progress" },
  ]

  return templates.map((tpl, index) => {
    const client = clients[index % clients.length]
    const date = subMonths(now, tpl.monthsAgo)
    const createdAt = iso(date)
    return {
      id: crypto.randomUUID(),
      clientId: client.id,
      title: tpl.title,
      description: "",
      price: tpl.price,
      date: createdAt,
      dueDate: iso(subDays(date, -14)),
      status: tpl.status,
      createdAt,
      updatedAt: createdAt,
    }
  })
}

export function buildSeedPaiements(prestations: Prestation[]): Paiement[] {
  const paiements: Paiement[] = []
  prestations.forEach((prestation, index) => {
    const isFullyPaid = prestation.status === "done" && index % 3 !== 0
    const isPartial = prestation.status === "in_progress" && index % 2 === 0

    if (isFullyPaid) {
      paiements.push({
        id: crypto.randomUUID(),
        prestationId: prestation.id,
        amount: prestation.price,
        date: prestation.date,
        method: "Virement",
        note: "",
        createdAt: prestation.date,
      })
    } else if (isPartial) {
      paiements.push({
        id: crypto.randomUUID(),
        prestationId: prestation.id,
        amount: Math.round(prestation.price * 0.4),
        date: prestation.date,
        method: "Virement",
        note: "Acompte",
        createdAt: prestation.date,
      })
    }
  })
  return paiements
}

export function buildSeedExpenses(): Expense[] {
  const defs = [
    { label: "Abonnement logiciels", amount: 49, monthsAgo: 0, category: "Outils" },
    { label: "Hébergement", amount: 25, monthsAgo: 0, category: "Outils" },
    { label: "Matériel bureau", amount: 180, monthsAgo: 1, category: "Équipement" },
    { label: "Abonnement logiciels", amount: 49, monthsAgo: 1, category: "Outils" },
    { label: "Formation en ligne", amount: 120, monthsAgo: 2, category: "Formation" },
    { label: "Abonnement logiciels", amount: 49, monthsAgo: 2, category: "Outils" },
  ]
  return defs.map((def) => {
    const createdAt = iso(subMonths(now, def.monthsAgo))
    return {
      id: crypto.randomUUID(),
      label: def.label,
      amount: def.amount,
      date: createdAt,
      category: def.category,
      createdAt,
    }
  })
}
