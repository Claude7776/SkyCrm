import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type {
  BusinessSettings,
  Client,
  ClientInput,
  Expense,
  ExpenseInput,
  Paiement,
  PaiementInput,
  Prestation,
  PrestationInput,
} from "@/types"
import { clientsRepository } from "@/services/clients.service"
import { prestationsRepository } from "@/services/prestations.service"
import { paiementsRepository } from "@/services/paiements.service"
import { expensesRepository } from "@/services/expenses.service"
import { settingsService, DEFAULT_SETTINGS } from "@/services/settings.service"
import { hasAnyData, readBrowserSnapshot, writeSnapshot } from "@/services/dataStore"
import { isRemoteStorage } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import {
  buildSeedClients,
  buildSeedExpenses,
  buildSeedPaiements,
  buildSeedPrestations,
} from "@/data/seed"
import { generateMissingRecurringExpenses } from "@/utils/recurringExpenses"

interface AppDataValue {
  isLoading: boolean
  clients: Client[]
  prestations: Prestation[]
  paiements: Paiement[]
  expenses: Expense[]
  settings: BusinessSettings

  addClient: (input: ClientInput) => Promise<Client>
  updateClient: (id: string, patch: Partial<ClientInput>) => Promise<void>
  removeClient: (id: string) => Promise<void>

  addPrestation: (input: PrestationInput) => Promise<Prestation>
  updatePrestation: (
    id: string,
    patch: Partial<PrestationInput>
  ) => Promise<void>
  removePrestation: (id: string) => Promise<void>

  addPaiement: (input: PaiementInput) => Promise<Paiement>
  removePaiement: (id: string) => Promise<void>

  addExpense: (input: ExpenseInput) => Promise<Expense>
  updateExpense: (id: string, patch: Partial<ExpenseInput>) => Promise<void>
  removeExpense: (id: string) => Promise<void>

  updateSettings: (patch: Partial<BusinessSettings>) => Promise<void>

  reloadAll: () => void
}

export const AppDataContext = createContext<AppDataValue | null>(null)

const MIGRATION_FLAG_PREFIX = "skycrm:migrated:"

/**
 * First run: locally we seed demo data; with Supabase we instead upload what
 * this browser already holds, once per user, so existing data isn't lost.
 */
const initializations = new Map<string, Promise<number>>()

function initializeData(userId: string | undefined): Promise<number> {
  const key = userId ?? "local"
  let pending = initializations.get(key)
  if (!pending) {
    pending = runInitialization(userId)
    initializations.set(key, pending)
    pending.catch(() => initializations.delete(key))
  }
  return pending
}

async function runInitialization(userId: string | undefined): Promise<number> {
  if (!isRemoteStorage) {
    if (await hasAnyData()) return 0
    const clients = buildSeedClients()
    const prestations = buildSeedPrestations(clients)
    await writeSnapshot({
      clients,
      prestations,
      paiements: buildSeedPaiements(prestations),
      expenses: buildSeedExpenses(),
      settings: DEFAULT_SETTINGS,
    })
    return 0
  }

  const flag = MIGRATION_FLAG_PREFIX + userId
  if (window.localStorage.getItem(flag)) return 0
  const local = readBrowserSnapshot()
  let migrated = 0
  if (local && !(await hasAnyData())) {
    await writeSnapshot(local)
    migrated = (local.clients?.length ?? 0) + (local.prestations?.length ?? 0)
  }
  window.localStorage.setItem(flag, new Date().toISOString())
  return migrated
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [prestations, setPrestations] = useState<Prestation[]>([])
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS)
  const { user } = useAuth()
  const userId = user?.id

  const syncRecurringExpenses = useCallback(async (currentExpenses: Expense[]) => {
    const missing = generateMissingRecurringExpenses(currentExpenses)
    if (missing.length === 0) return currentExpenses
    const created = await Promise.all(missing.map((m) => expensesRepository.create(m)))
    return [...currentExpenses, ...created]
  }, [])

  const inFlightLoad = useRef<Promise<void> | null>(null)

  const fetchAll = useCallback(async () => {
    const [c, p, pay, exp, s] = await Promise.all([
      clientsRepository.list(),
      prestationsRepository.list(),
      paiementsRepository.list(),
      expensesRepository.list(),
      settingsService.get(),
    ])
    setClients(c)
    setPrestations(p)
    setPaiements(pay)
    setExpenses(await syncRecurringExpenses(exp))
    setSettings(s)
    setIsLoading(false)
  }, [syncRecurringExpenses])

  // Overlapping loads would each create the same missing recurring expenses.
  const loadAll = useCallback(() => {
    inFlightLoad.current ??= fetchAll().finally(() => {
      inFlightLoad.current = null
    })
    return inFlightLoad.current
  }, [fetchAll])

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      try {
        const migrated = await initializeData(userId)
        if (cancelled) return
        if (migrated > 0) {
          toast.success("Vos données de ce navigateur ont été transférées dans la base")
        }
        await loadAll()
      } catch (error) {
        console.error(error)
        toast.error("Impossible de charger les données. Vérifiez votre connexion.")
        setIsLoading(false)
      }
    }
    void init()
    return () => {
      cancelled = true
    }
  }, [loadAll, userId])

  // Pick up changes made from another device when coming back to the app.
  useEffect(() => {
    if (!isRemoteStorage) return
    const handler = () => {
      if (document.visibilityState === "visible") loadAll().catch(console.error)
    }
    document.addEventListener("visibilitychange", handler)
    return () => document.removeEventListener("visibilitychange", handler)
  }, [loadAll])

  const addClient = useCallback(async (input: ClientInput) => {
    const created = await clientsRepository.create(input)
    setClients((prev) => [...prev, created])
    return created
  }, [])

  const updateClient = useCallback(
    async (id: string, patch: Partial<ClientInput>) => {
      const updated = await clientsRepository.update(id, patch)
      setClients((prev) => prev.map((c) => (c.id === id ? updated : c)))
    },
    []
  )

  const removeClient = useCallback(async (id: string) => {
    await clientsRepository.remove(id)
    setClients((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const addPrestation = useCallback(async (input: PrestationInput) => {
    const created = await prestationsRepository.create(input)
    setPrestations((prev) => [...prev, created])
    return created
  }, [])

  const updatePrestation = useCallback(
    async (id: string, patch: Partial<PrestationInput>) => {
      const updated = await prestationsRepository.update(id, patch)
      setPrestations((prev) => prev.map((p) => (p.id === id ? updated : p)))
    },
    []
  )

  const removePrestation = useCallback(async (id: string) => {
    await prestationsRepository.remove(id)
    setPrestations((prev) => prev.filter((p) => p.id !== id))
    const linkedPaiements = await paiementsRepository.list()
    await Promise.all(
      linkedPaiements
        .filter((p) => p.prestationId === id)
        .map((p) => paiementsRepository.remove(p.id))
    )
    setPaiements((prev) => prev.filter((p) => p.prestationId !== id))
  }, [])

  const addPaiement = useCallback(async (input: PaiementInput) => {
    const created = await paiementsRepository.create(input)
    setPaiements((prev) => [...prev, created])
    return created
  }, [])

  const removePaiement = useCallback(async (id: string) => {
    await paiementsRepository.remove(id)
    setPaiements((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const addExpense = useCallback(
    async (input: ExpenseInput) => {
      const created = await expensesRepository.create(input)
      setExpenses((prev) => [...prev, created])
      if (created.recurrence && created.recurrence !== "none") {
        const all = await expensesRepository.list()
        setExpenses(await syncRecurringExpenses(all))
      }
      return created
    },
    [syncRecurringExpenses]
  )

  const updateExpense = useCallback(
    async (id: string, patch: Partial<ExpenseInput>) => {
      const updated = await expensesRepository.update(id, patch)
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)))
      if (updated.recurrence && updated.recurrence !== "none") {
        const all = await expensesRepository.list()
        setExpenses(await syncRecurringExpenses(all))
      }
    },
    [syncRecurringExpenses]
  )

  const removeExpense = useCallback(async (id: string) => {
    await expensesRepository.remove(id)
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const updateSettings = useCallback(async (patch: Partial<BusinessSettings>) => {
    const updated = await settingsService.update(patch)
    setSettings(updated)
  }, [])

  const value = useMemo<AppDataValue>(
    () => ({
      isLoading,
      clients,
      prestations,
      paiements,
      expenses,
      settings,
      addClient,
      updateClient,
      removeClient,
      addPrestation,
      updatePrestation,
      removePrestation,
      addPaiement,
      removePaiement,
      addExpense,
      updateExpense,
      removeExpense,
      updateSettings,
      reloadAll: () => {
        void loadAll()
      },
    }),
    [
      isLoading,
      clients,
      prestations,
      paiements,
      expenses,
      settings,
      addClient,
      updateClient,
      removeClient,
      addPrestation,
      updatePrestation,
      removePrestation,
      addPaiement,
      removePaiement,
      addExpense,
      updateExpense,
      removeExpense,
      updateSettings,
      loadAll,
    ]
  )

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  )
}
