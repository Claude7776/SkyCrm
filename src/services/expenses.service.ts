import type { Expense, ExpenseInput } from "@/types"
import { createRepository } from "./repository"

export const expensesRepository = createRepository<
  Expense,
  ExpenseInput
>("expenses", { trackUpdatedAt: false })
