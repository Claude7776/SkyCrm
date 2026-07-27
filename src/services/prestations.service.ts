import type { Prestation, PrestationInput } from "@/types"
import { createLocalRepository } from "./repository"

export const prestationsRepository = createLocalRepository<
  Prestation,
  PrestationInput
>("prestations")
