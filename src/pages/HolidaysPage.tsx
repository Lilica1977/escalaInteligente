import { useQuery } from '@tanstack/react-query'
import { Star, Loader2, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/utils/date'
import type { Holiday } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  nacional: 'Nacional',
  estadual: 'Estadual',
  municipal: 'Municipal',
  interno: 'Interno',
  data_comercial: 'Data Comercial',
}

const TYPE_BADGE: Record<string, 'default' | 'secondary' | 'outline' | 'warning' | 'info'> = {
  nacional: 'default',
  estadual: 'secondary',
  municipal: 'outline',
  interno: 'info',
  data_comercial: 'warning',
}

export function HolidaysPage() {
  const { user } = useAuth()

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['holidays', user?.company_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('holidays')
        .select('*')
        .or(`company_id.is.null,company_id.eq.${user?.company_id ?? 'none'}`)
        .is('deleted_at', null)
        .order('date', { ascending: true })
      return (data ?? []) as Holiday[]
    },
    enabled: !!user,
  })

  const now = new Date()
  const upcoming = holidays.filter((h) => new Date(h.date + 'T12:00:00') >= now)
  const past = holidays.filter((h) => new Date(h.date + 'T12:00:00') < now)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400" />
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{holidays.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Próximos</p>
              <p className="text-xl font-bold">{upcoming.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Passados</p>
              <p className="text-xl font-bold">{past.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feriados e Datas Especiais</CardTitle>
          <CardDescription>Nacionais, estaduais, municipais e datas comerciais</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : holidays.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Star className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum feriado cadastrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Feriado</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Impacto na Demanda</TableHead>
                  <TableHead>Recorrente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((holiday) => {
                  const isPast = new Date(holiday.date + 'T12:00:00') < now
                  const multiplierDiff = holiday.demand_multiplier - 1
                  const multiplierLabel =
                    multiplierDiff > 0
                      ? `+${Math.round(multiplierDiff * 100)}%`
                      : `${Math.round(multiplierDiff * 100)}%`

                  return (
                    <TableRow key={holiday.id} className={isPast ? 'opacity-50' : ''}>
                      <TableCell className="font-medium tabular-nums">
                        {formatDate(holiday.date)}
                      </TableCell>
                      <TableCell>{holiday.name}</TableCell>
                      <TableCell>
                        <Badge variant={TYPE_BADGE[holiday.type] ?? 'outline'}>
                          {TYPE_LABELS[holiday.type] ?? holiday.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            multiplierDiff > 0.2
                              ? 'text-yellow-400 font-medium'
                              : multiplierDiff < 0
                              ? 'text-muted-foreground'
                              : 'text-foreground'
                          }
                        >
                          {multiplierLabel}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={holiday.is_recurring ? 'success' : 'outline'}>
                          {holiday.is_recurring ? 'Sim' : 'Não'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
