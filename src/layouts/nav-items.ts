import {
  LayoutDashboard,
  Users,
  Briefcase,
  Wallet,
  CreditCard,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", to: "/", icon: LayoutDashboard },
  { label: "Clients", to: "/clients", icon: Users },
  { label: "Prestations", to: "/prestations", icon: Briefcase },
  { label: "Paiements", to: "/paiements", icon: Wallet },
  { label: "PayPal", to: "/paypal", icon: CreditCard },
  { label: "Finances", to: "/finances", icon: BarChart3 },
  { label: "Paramètres", to: "/settings", icon: Settings },
]
