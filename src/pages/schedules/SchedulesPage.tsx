import { useState } from 'react'
import {
  ChevronLeft, ChevronRight, CalendarDays, Zap, Loader2,
  RefreshCw, Download, Filter, AlertCircle, CheckCircle2,
  Coffee, Users,
} from 'lucide-react'
import { format, getDaysInMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useMonthlySchedule, useStartGeneration, useGenerationRuns } from '@/hooks/useSchedules'
import { MONTHS_PT } from '@/constants'
import { cn } from '@/lib/utils'
import type { Schedule } from '@/types'

const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function MonthSelector({
  month,
  year,
  onPrev,
  onNext,
}: {
  month: number
  year: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-[140px] text-center">
        <span className="text-sm font-semibold">
          {MONTHS_PT[month - 1]} {year}
        </span>
      </div>
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={onNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

function ScheduleCell({ schedule }: { schedule: Schedule | undefined }) {
  if (!schedule) {
    return <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">—</div>
  }

  if (schedule.is_day_off) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full h-full flex items-center justify-center">
              <div className="rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                F
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>Folga</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full h-full flex items-center justify-center">
            <div
              className="rounded px-1.5 py-0.5 text-[10px] font-bold"
              style={{
                backgroundColor: `${schedule.sector?.color ?? '#3b82f6'}25`,
                color: schedule.sector?.color ?? '#3b82f6',
                border: `1px solid ${schedule.sector?.color ?? '#3b82f6'}50`,
              }}
            >
              {schedule.shift?.name?.slice(0, 3) ?? 'T'}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{schedule.shift?.name}</p>
          <p className="text-xs text-muted-foreground">
            {schedule.shift?.start_time} – {schedule.shift?.end_time}
          </p>
          <p className="text-xs">{schedule.sector?.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function CalendarGrid({ schedules, month, year }: { schedules: Schedule[]; month: number; year: number }) {
  const daysInMonth = getDaysInMonth(new Date(year, month - 1))
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Group by employee
  const byEmployee = schedules.reduce<Record<string, { name: string; schedules: Record<number, Schedule> }>>((acc, s) => {
    const empId = s.employee_id
    const empName = s.employee?.name ?? 'Desconhecido'
    const day = new Date(s.date + 'T12:00:00').getDate()
    if (!acc[empId]) acc[empId] = { name: empName, schedules: {} }
    acc[empId].schedules[day] = s
    return acc
  }, {})

  const employees = Object.entries(byEmployee).sort((a, b) => a[1].name.localeCompare(b[1].name))

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CalendarDays className="h-14 w-14 text-muted-foreground/20 mb-4" />
        <h3 className="text-base font-semibold mb-1">Nenhuma escala gerada</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Clique em "Gerar Escala" para que o motor inteligente processe automaticamente as escalas do mês.
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="w-full">
      <div className="min-w-max">
        {/* Day headers */}
        <div className="flex sticky top-0 z-10 bg-card border-b border-border">
          <div className="w-40 shrink-0 px-3 py-2 text-xs font-semibold text-muted-foreground">
            Funcionário
          </div>
          {days.map((day) => {
            const date = new Date(year, month - 1, day)
            const dayOfWeek = date.getDay()
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
            return (
              <div
                key={day}
                className={cn(
                  'w-10 shrink-0 text-center py-2',
                  isWeekend && 'bg-slate-800/30',
                )}
              >
                <p className="text-[9px] font-medium text-muted-foreground uppercase">
                  {DAY_LABELS[dayOfWeek]}
                </p>
                <p className={cn(
                  'text-xs font-bold mt-0.5',
                  isWeekend ? 'text-primary/70' : 'text-foreground',
                )}>
                  {day}
                </p>
              </div>
            )
          })}
        </div>

        {/* Employee rows */}
        {employees.map(([empId, emp]) => (
          <div key={empId} className="flex border-b border-border hover:bg-muted/20 transition-colors">
            <div className="w-40 shrink-0 px-3 py-2 flex items-center">
              <p className="text-xs font-medium truncate">{emp.name}</p>
            </div>
            {days.map((day) => {
              const date = new Date(year, month - 1, day)
              const isWeekend = date.getDay() === 0 || date.getDay() === 6
              return (
                <div
                  key={day}
                  className={cn(
                    'w-10 h-10 shrink-0 flex items-center justify-center',
                    isWeekend && 'bg-slate-800/20',
                  )}
                >
                  <ScheduleCell schedule={emp.schedules[day]} />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

interface GenerationRun {
  status: string
  total_schedules: number
  conflicts_found: number
  error_message?: string | null
}

function GenerationPanel({ month, year }: { month: number; year: number }) {
  const { data: runsData = [] } = useGenerationRuns(month, year)
  const runs = runsData as GenerationRun[]
  const startGeneration = useStartGeneration()

  const latestRun = runs[0]
  const statusColors: Record<string, string> = {
    pendente: 'text-yellow-400',
    processando: 'text-blue-400',
    concluido: 'text-emerald-400',
    erro: 'text-red-400',
  }
  const statusLabels: Record<string, string> = {
    pendente: 'Pendente',
    processando: 'Processando...',
    concluido: 'Concluído',
    erro: 'Erro',
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Motor de Geração</CardTitle>
        <CardDescription className="text-xs">
          Geração automática com validação CLT
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          className="w-full"
          onClick={() => startGeneration.mutate({ month, year })}
          disabled={startGeneration.isPending || latestRun?.status === 'processando'}
        >
          {startGeneration.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Zap className="h-4 w-4 mr-2" />
          )}
          Gerar Escala
        </Button>

        {latestRun && (
          <div className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Última geração</span>
              <span className={cn('font-semibold', statusColors[latestRun.status])}>
                {statusLabels[latestRun.status]}
              </span>
            </div>
            {latestRun.status === 'concluido' && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Escalas geradas</span>
                  <span className="font-medium">{latestRun.total_schedules}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Conflitos</span>
                  <span className={cn('font-medium', latestRun.conflicts_found > 0 ? 'text-yellow-400' : 'text-emerald-400')}>
                    {latestRun.conflicts_found}
                  </span>
                </div>
              </div>
            )}
            {latestRun.status === 'erro' && latestRun.error_message && (
              <div className="flex gap-2 text-xs text-red-400 bg-red-500/10 rounded p-2">
                <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                <span>{latestRun.error_message}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Legenda</p>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="rounded bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">T</div>
              <span className="text-muted-foreground">Trabalhando</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">F</div>
              <span className="text-muted-foreground">Folga</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SchedulesPage() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())

  const { data: schedules = [], isLoading, refetch } = useMonthlySchedule(month, year)

  const handlePrev = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }

  const handleNext = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  const workingCount = schedules.filter((s) => !s.is_day_off).length
  const offCount = schedules.filter((s) => s.is_day_off).length
  const uniqueEmployees = new Set(schedules.map((s) => s.employee_id)).size

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <MonthSelector month={month} year={year} onPrev={handlePrev} onNext={handleNext} />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Funcionários</p>
              <p className="text-xl font-bold">{uniqueEmployees}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Turnos</p>
              <p className="text-xl font-bold">{workingCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Coffee className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Folgas</p>
              <p className="text-xl font-bold">{offCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Grade de Escalas — {MONTHS_PT[month - 1]} {year}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {format(new Date(year, month - 1, 1), "MMMM 'de' yyyy", { locale: ptBR })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <CalendarGrid schedules={schedules} month={month} year={year} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <GenerationPanel month={month} year={year} />
        </div>
      </div>
    </div>
  )
}
