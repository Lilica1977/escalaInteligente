import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Settings, User, Database } from 'lucide-react'
import { getInitials } from '@/utils/format'
import { USER_ROLES } from '@/constants'

export function SettingsPage() {
  const { user } = useAuth()
  const roleLabel = USER_ROLES.find((r) => r.value === user?.role)?.label ?? user?.role

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Perfil do Usuário</CardTitle>
          </div>
          <CardDescription>Informações da sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg font-bold bg-primary/20 text-primary">
                {user?.name ? getInitials(user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-base font-semibold">{user?.name ?? '—'}</p>
              <p className="text-sm text-muted-foreground">{user?.email ?? '—'}</p>
              <Badge variant="secondary" className="mt-1.5 text-xs">{roleLabel}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Informações do Sistema</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-0">
          {[
            { label: 'Empresa ID', value: user?.company_id ?? '—' },
            { label: 'Unidade ID', value: user?.unit_id ?? 'Todas as unidades' },
            { label: 'Perfil de acesso', value: roleLabel ?? '—' },
            { label: 'Versão do sistema', value: '1.0.0' },
          ].map(({ label, value }, i, arr) => (
            <div key={label}>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-mono text-foreground truncate max-w-[220px] text-right">
                  {value}
                </span>
              </div>
              {i < arr.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Coming soon */}
      <Card className="border-dashed border-muted">
        <CardContent className="flex flex-col items-center py-10 text-center">
          <Settings className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium mb-1">Mais configurações em breve</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Configurações avançadas de empresa, notificações e integrações com Ahgora e TOTVS RM estarão disponíveis na próxima versão.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
