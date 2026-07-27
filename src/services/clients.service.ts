import type { Client, ClientInput } from "@/types"
import { createLocalRepository } from "./repository"

export const clientsRepository = createLocalRepository<Client, ClientInput>(
  "clients"
)
