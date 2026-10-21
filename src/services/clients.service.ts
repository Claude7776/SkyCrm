import type { Client, ClientInput } from "@/types"
import { createRepository } from "./repository"

export const clientsRepository = createRepository<Client, ClientInput>(
  "clients",
  { trackUpdatedAt: true }
)
