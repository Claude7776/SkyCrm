import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle, Home, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Shows a recovery screen instead of a blank page when a component throws
 * while rendering. Data is stored outside React, so reloading loses nothing.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-status-critical/10 text-status-critical">
              <AlertTriangle className="size-5" />
            </div>
            <CardTitle>Une erreur est survenue</CardTitle>
            <CardDescription>
              Cet écran a rencontré un problème. Vos données ne sont pas perdues :
              rechargez la page pour reprendre.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => window.location.reload()}>
                <RotateCw /> Recharger
              </Button>
              <Button variant="outline" onClick={() => window.location.assign("/")}>
                <Home /> Tableau de bord
              </Button>
            </div>
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer select-none">Détails techniques</summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-2">
                {error.message}
              </pre>
            </details>
          </CardContent>
        </Card>
      </div>
    )
  }
}
