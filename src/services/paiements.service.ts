import type { Paiement, PaiementInput } from "@/types"
import { createSimpleLocalRepository } from "./repository"

export const paiementsRepository = createSimpleLocalRepository<
  Paiement,
  PaiementInput
>("paiements")
