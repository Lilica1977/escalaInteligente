import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Bell, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/utils/date'
import type { Alert, AlertLevel } from '@/types'

const LEVEL_CONFIG: Record<
  AlertLevel,
  { badgeVariant: 'destructive' | 'warning' | 'info'; icon: typeof AlertTriangle; color: string; borderColor: string }
> = {
  critical: { badgeVariant: 'destructive', icon: AlertTriangle, color: 'text-red-400', borderColor: 'border-l-red-500' },
  warning: { badgeVariant: 'warning', icon: AlertTriangle, color: 'text-yellow-400', borderColor: 'border-l-yellow-500' },
  info: { badgeVariant: 'info', icon: Bell, color: 'text-blue-400', borderColor: 'border-l-blue-500' },
}

const LEVEL_LABELS: Record<AlertLevel, string> = {
  critical: 'Crítico',
  warning: 'Atenção',
  info: 'Informação',
}

function AlertCard({ alert, onResolve }: { alert: Alert; onResolve: (id: string) => void }) {
  const config = LEVEL_CONFIG[alert.level]
  const Icon = config.icon

  return (
    <Card className={`border-l-4 ${config.borderColor}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium">{alert.title}</p>
                <Badge variant={config.badgeVariant} className="text-xs">
                  {LEVEL_LABELS[alert.level]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.description}</p>
              <p className="text-xs text-muted-foreground/50 mt-1">{formatDate(alert.date)}</p>
            </div>
          </div>
          {!alert.is_resolved && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-emerald-400 shrink-0"
              onClick={() => onResolve(alert.id)}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Resolver
            </Button>
          )}
          {alert.is_resolved && (
            <Badge variant="success" className="shrink-0 text-xs">Resolvido</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function AlertsPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('unresolved')
  const queryClient = useQueryClient()

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', user?.unit_id, tab],
    queryFn: async () => {
      let query = supabase
        .from('alerts')
        .select('*')
        .eq('unit_id', user?.unit_id ?? '')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (tab === 'unresolved') query = query.eq('is_resolved', false)
      else if (tab === 'resolved') query = query.eq('is_resolved', true)

      const { data } = await query
      return (data ?? []) as Alert[]
    },
    enabled: !!user?.unit_id,
  })

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from('alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  })

  const unresolvedAlerts = alerts.filter((a) => !a.is_resolved)
  const criticalCount = unresolvedAlerts.filter((a) => a.level === 'critical').length
  const warningCount = unresolvedAlerts.filter((a) => a.level === 'warning').length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-red-500/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <div>
              <p className="text-xs text-muted-foreground">Críticos</p>
              <p className="text-xl font-bold text-red-400">{criticalCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-yellow-500/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <div>
              <p className="text-xs text-muted-foreground">Atenção</p>
              <p className="text-xl font-bold text-yellow-400">{warningCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total Pendentes</p>
              <p className="text-xl font-bold">{unresolvedAlerts.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="unresolved">Pendentes</TabsTrigger>
          <TabsTrigger value="resolved">Resolvidos</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : alerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-400/30 mb-3" />
                <h3 className="text-sm font-medium mb-1">Nenhum alerta</h3>
                <p className="text-xs text-muted-foreground">
                  {tab === 'unresolved'
                    ? 'Todos os alertas foram resolvidos!'
                    : 'Nenhum alerta encontrado nesta categoria'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onResolve={(id) => resolveMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
