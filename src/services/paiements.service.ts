import type { Paiement, PaiementInput } from "@/types"
import { createRepository } from "./repository"

export const paiementsRepository = createRepository<
  Paiement,
  PaiementInput
>("paiements", { trackUpdatedAt: false })
