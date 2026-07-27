import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/shared/theme-provider"
import { AppDataProvider } from "@/context/AppDataContext"
import { AccentColorInjector } from "@/components/shared/AccentColorInjector"
import { AppLayout } from "@/layouts/AppLayout"
import { DashboardPage } from "@/pages/DashboardPage"
import { ClientsPage } from "@/pages/ClientsPage"
import { PrestationsPage } from "@/pages/PrestationsPage"
import { PaiementsPage } from "@/pages/PaiementsPage"
import { FinancesPage } from "@/pages/FinancesPage"
import { SettingsPage } from "@/pages/SettingsPage"

function App() {
  return (
    <ThemeProvider>
      <AppDataProvider>
        <AccentColorInjector />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="prestations" element={<PrestationsPage />} />
              <Route path="paiements" element={<PaiementsPage />} />
              <Route path="finances" element={<FinancesPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AppDataProvider>
    </ThemeProvider>
  )
}

export default App
