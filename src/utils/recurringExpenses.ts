import type { Expense, ExpenseInput, ExpenseRecurrence } from "@/types"

function nextOccurrence(date: Date, recurrence: ExpenseRecurrence): Date {
  const next = new Date(date)
  if (recurrence === "daily") next.setDate(next.getDate() + 1)
  else if (recurrence === "weekly") next.setDate(next.getDate() + 7)
  else if (recurrence === "monthly") next.setMonth(next.getMonth() + 1)
  return next
}

/**
 * Recurring expenses are stored as a single template row (recurrence !== "none").
 * This fills in the occurrences that should exist between the template's last
 * generated instance and today, so opening the app "recreates" today's/this
 * month's expense automatically. Capped at 1000 iterations as a safety net
 * against a corrupted template (e.g. a date far in the past).
 */
export function generateMissingRecurringExpenses(
  expenses: Expense[],
  today: Date = new Date()
): ExpenseInput[] {
  const templates = expenses.filter(
    (e) => e.recurrence && e.recurrence !== "none" && !e.recurringSourceId
  )

  const missing: ExpenseInput[] = []

  for (const template of templates) {
    const instances = expenses.filter((e) => e.recurringSourceId === template.id)
    const lastDate =
      instances.length > 0
        ? new Date(Math.max(...instances.map((i) => new Date(i.date).getTime())))
        : new Date(template.date)

    let cursor = nextOccurrence(lastDate, template.recurrence!)
    let guard = 0
    while (cursor <= today && guard < 1000) {
      missing.push({
        label: template.label,
        amount: template.amount,
        date: cursor.toISOString(),
        category: template.category,
        recurrence: "none",
        recurringSourceId: template.id,
      })
      cursor = nextOccurrence(cursor, template.recurrence!)
      guard++
    }
  }

  return missing
}
