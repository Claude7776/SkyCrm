import type { Expense, ExpenseInput } from "@/types"
import { createSimpleLocalRepository } from "./repository"

export const expensesRepository = createSimpleLocalRepository<
  Expense,
  ExpenseInput
>("expenses")
