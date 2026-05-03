import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null)
    const result = await resetPassword(data.email)
    if (result.error) {
      setError(result.error)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">E-mail enviado!</h1>
          <p className="text-sm text-muted-foreground">
            Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao login
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2 text-center">
        <div className="flex justify-center mb-2">
          <div className="rounded-full bg-primary/10 p-3">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Redefinir senha</h1>
        <p className="text-sm text-muted-foreground">
          Informe seu e-mail e enviaremos as instruções para redefinir sua senha
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {isSubmitting ? 'Enviando...' : 'Enviar instruções'}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => navigate('/login')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao login
        </Button>
      </form>
    </div>
  )
}
