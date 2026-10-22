import { useState } from "react"
import { LogIn } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useAuth } from "@/hooks/useAuth"

function loginErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code
  if (code === "invalid_credentials") {
    return "Email ou mot de passe incorrect. Le compte doit d'abord être créé dans Supabase (Authentication → Users)."
  }
  if (code === "email_not_confirmed") {
    return "Email non confirmé. Dans Supabase, confirmez l'utilisateur ou recréez-le en cochant « Auto Confirm User »."
  }
  if (err instanceof TypeError) {
    return "Impossible de joindre la base. Vérifiez votre connexion et l'URL Supabase."
  }
  return (err as Error)?.message || "Connexion impossible"
}

export function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setError(loginErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <img src="/favicon.svg" alt="" className="mx-auto mb-2 size-10" />
          <CardTitle>SkyCRM</CardTitle>
          <CardDescription>Connectez-vous pour accéder à vos données.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="login-email">Email</FieldLabel>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field data-invalid={!!error}>
                <FieldLabel htmlFor="login-password">Mot de passe</FieldLabel>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <FieldError>{error}</FieldError>
              </Field>
              <Button type="submit" disabled={isSubmitting}>
                <LogIn /> Se connecter
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
