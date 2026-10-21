import type { Prestation, PrestationInput } from "@/types"
import { createRepository } from "./repository"

export const prestationsRepository = createRepository<
  Prestation,
  PrestationInput
>("prestations", { trackUpdatedAt: true })
