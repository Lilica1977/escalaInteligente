import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Users, Calendar, TrendingUp, AlertTriangle,
  Clock, Star, RefreshCw, CheckCircle2, XCircle,
  MinusCircle, ArrowUpRight, CalendarDays,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useDashboardMetrics } from '@/hooks/useDashboard'
import { useAuth } from '@/contexts/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { SectorCoverage, Holiday } from '@/types'

// Skeleton component inline
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent><Skeleton className="h-48 w-full" /></CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><Skeleton className="h-5 w-28" /></CardHeader>
          <CardContent><Skeleton className="h-48 w-full" /></CardContent>
        </Card>
      </div>
    </div>
  )
}

function KPICard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = 'default',
}: {
  title: string
  value: string | number
  description?: string
  icon: React.ElementType
  trend?: { value: number; label: string }
  variant?: 'default' | 'success' | 'warning' | 'danger'
}) {
  const variantStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-400',
    warning: 'bg-yellow-500/10 text-yellow-400',
    danger: 'bg-red-500/10 text-red-400',
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
              {title}
            </p>
            <p className="text-3xl font-bold mt-1 text-foreground">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                <span className="text-xs text-emerald-400">{trend.value}% {trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn('rounded-xl p-3 shrink-0', variantStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SectorCoverageCard({ sectors }: { sectors: SectorCoverage[] }) {
  const getStatusIcon = (status: SectorCoverage['status']) => {
    if (status === 'ok') return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
    if (status === 'warning') return <MinusCircle className="h-4 w-4 text-yellow-400" />
    return <XCircle className="h-4 w-4 text-red-400" />
  }

  const getProgressColor = (status: SectorCoverage['status']) => {
    if (status === 'ok') return 'bg-emerald-500'
    if (status === 'warning') return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Cobertura por Setor</CardTitle>
          <CardDescription>Situação operacional hoje</CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {sectors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum setor configurado ainda</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Configure setores e turnos para visualizar a cobertura</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sectors.map((sector) => (
              <div key={sector.sector_id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: sector.sector_color }}
                    />
                    <span className="font-medium text-foreground">{sector.sector_name}</span>
                    {getStatusIcon(sector.status)}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{sector.scheduled}/{sector.required} funcionários</span>
                    <Badge
                      variant={
                        sector.status === 'ok'
                          ? 'success'
                          : sector.status === 'warning'
                          ? 'warning'
                          : 'destructive'
                      }
                      className="text-xs"
                    >
                      {Math.round(sector.coverage_pct)}%
                    </Badge>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={Math.min(sector.coverage_pct, 100)} className="h-2" />
                  <div
                    className={cn('absolute inset-0 h-2 rounded-full transition-all', getProgressColor(sector.status))}
                    style={{ width: `${Math.min(sector.coverage_pct, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function UpcomingHolidaysCard({ holidays }: { holidays: Holiday[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Próximos Feriados</CardTitle>
        <CardDescription>30 dias à frente</CardDescription>
      </CardHeader>
      <CardContent>
        {holidays.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <Star className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum feriado próximo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {holidays.map((holiday) => (
              <div key={holiday.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 border border-primary/20 w-10 h-10 shrink-0">
                  <span className="text-xs font-bold text-primary leading-none">
                    {format(new Date(holiday.date + 'T12:00:00'), 'dd', { locale: ptBR })}
                  </span>
                  <span className="text-[9px] text-primary/70 uppercase leading-none mt-0.5">
                    {format(new Date(holiday.date + 'T12:00:00'), 'MMM', { locale: ptBR })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{holiday.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                      {holiday.type}
                    </Badge>
                    <span className={cn('text-xs', holiday.demand_multiplier > 1.5 ? 'text-yellow-400' : 'text-muted-foreground')}>
                      {holiday.demand_multiplier > 1 ? `↑ ${holiday.demand_multiplier}x demanda` : `↓ demanda reduzida`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })
  const { data: metrics, isLoading, error } = useDashboardMetrics()

  if (isLoading) return <DashboardSkeleton />

  if (error || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold mb-2">Erro ao carregar dashboard</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Não foi possível conectar ao servidor. Verifique as configurações do Supabase.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  const coveragePct = metrics.operational_coverage_pct
  const coverageVariant =
    coveragePct >= 90 ? 'success' : coveragePct >= 70 ? 'warning' : 'danger'

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground capitalize">{today}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visão geral da operação — {user?.name}
          </p>
        </div>
        <Button variant="outline" size="sm">
          <CalendarDays className="h-4 w-4 mr-2" />
          Ver Escala
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Trabalhando Hoje"
          value={metrics.working_today}
          description="funcionários em turno"
          icon={Users}
          variant="success"
        />
        <KPICard
          title="De Folga"
          value={metrics.on_leave_today}
          description="folgas programadas"
          icon={Calendar}
          variant="default"
        />
        <KPICard
          title="Cobertura Operacional"
          value={`${coveragePct}%`}
          description="média de todos os setores"
          icon={TrendingUp}
          variant={coverageVariant}
        />
        <KPICard
          title="Alertas Críticos"
          value={metrics.critical_alerts}
          description="requerem atenção imediata"
          icon={AlertTriangle}
          variant={metrics.critical_alerts > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-500/10 p-2">
              <Clock className="h-4 w-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Excesso de Jornada</p>
              <p className="text-xl font-bold">{metrics.overtime_warnings}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dias Críticos</p>
              <p className="text-xl font-bold">{metrics.critical_days}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Folguistas Necessários</p>
              <p className="text-xl font-bold">{metrics.substitutes_needed}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sector Coverage + Holidays */}
      <div className="grid lg:grid-cols-3 gap-6">
        <SectorCoverageCard sectors={metrics.sector_coverage} />
        <UpcomingHolidaysCard holidays={metrics.upcoming_holidays} />
      </div>
    </div>
  )
}
