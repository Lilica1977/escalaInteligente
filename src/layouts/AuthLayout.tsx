import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { CalendarClock } from 'lucide-react'

export function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-r border-border">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/20 border border-primary/30 p-2.5">
            <CalendarClock className="h-6 w-6 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground">Escala Inteligente</span>
        </div>

        <div className="space-y-6">
          <blockquote className="space-y-3">
            <p className="text-xl font-medium leading-relaxed text-foreground/90">
              "Gestão inteligente de equipes para restaurantes modernos. Escalas automáticas, conformidade CLT e cobertura operacional em um só lugar."
            </p>
          </blockquote>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Funcionários', value: 'Até 500+' },
              { label: 'Conformidade', value: '100% CLT' },
              { label: 'Automação', value: 'Total' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                <p className="text-lg font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Escala Inteligente. Todos os direitos reservados.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center justify-center lg:hidden mb-8">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/20 border border-primary/30 p-2">
                <CalendarClock className="h-5 w-5 text-primary" />
              </div>
              <span className="text-base font-bold">Escala Inteligente</span>
            </div>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
