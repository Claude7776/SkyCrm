import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Users, Briefcase, LayoutDashboard, Wallet, BarChart3, Settings } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useGlobalSearch } from "@/hooks/useGlobalSearch"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const results = useGlobalSearch(query)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  const go = (href: string) => {
    navigate(href)
    onOpenChange(false)
  }

  const clientResults = results.filter((r) => r.type === "client")
  const prestationResults = results.filter((r) => r.type === "prestation")

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Recherche"
      description="Rechercher un client ou une prestation"
    >
      <CommandInput
        placeholder="Rechercher un client, une prestation…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {query.trim() === "" ? (
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => go("/")}>
              <LayoutDashboard /> Tableau de bord
            </CommandItem>
            <CommandItem onSelect={() => go("/clients")}>
              <Users /> Clients
            </CommandItem>
            <CommandItem onSelect={() => go("/prestations")}>
              <Briefcase /> Prestations
            </CommandItem>
            <CommandItem onSelect={() => go("/paiements")}>
              <Wallet /> Paiements
            </CommandItem>
            <CommandItem onSelect={() => go("/finances")}>
              <BarChart3 /> Finances
            </CommandItem>
            <CommandItem onSelect={() => go("/settings")}>
              <Settings /> Paramètres
            </CommandItem>
          </CommandGroup>
        ) : (
          <>
            <CommandEmpty>Aucun résultat.</CommandEmpty>
            {clientResults.length > 0 && (
              <CommandGroup heading="Clients">
                {clientResults.map((r) => (
                  <CommandItem key={r.id} onSelect={() => go(r.href)}>
                    <Users />
                    <div className="flex flex-col">
                      <span>{r.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.subtitle}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {prestationResults.length > 0 && (
              <CommandGroup heading="Prestations">
                {prestationResults.map((r) => (
                  <CommandItem key={r.id} onSelect={() => go(r.href)}>
                    <Briefcase />
                    <div className="flex flex-col">
                      <span>{r.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.subtitle}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
