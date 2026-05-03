import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/date'
import type { DashboardMetrics, SectorCoverage, Alert } from '@/types'

export const dashboardService = {
  async getMetrics(unitId: string, date?: string): Promise<DashboardMetrics> {
    const targetDate = date ?? formatDate(new Date(), 'yyyy-MM-dd')

    const [working, onLeave, criticalAlerts, sectorCoverage, upcomingHolidays] = await Promise.all([
      supabase
        .from('schedules')
        .select('id', { count: 'exact', head: true })
        .eq('unit_id', unitId)
        .eq('date', targetDate)
        .eq('is_day_off', false)
        .is('deleted_at', null),

      supabase
        .from('schedules')
        .select('id', { count: 'exact', head: true })
        .eq('unit_id', unitId)
        .eq('date', targetDate)
        .eq('is_day_off', true)
        .is('deleted_at', null),

      supabase
        .from('alerts')
        .select('id', { count: 'exact', head: true })
        .eq('unit_id', unitId)
        .eq('is_resolved', false)
        .eq('level', 'critical')
        .is('deleted_at', null),

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).rpc('get_sector_coverage', {
        p_unit_id: unitId,
        p_date: targetDate,
      }),

      supabase
        .from('holidays')
        .select('*')
        .gte('date', targetDate)
        .lte('date', formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'))
        .eq('affects_operation', true)
        .is('deleted_at', null)
        .order('date', { ascending: true })
        .limit(5),
    ])

    const workingCount = working.count ?? 0
    const onLeaveCount = onLeave.count ?? 0

    const coverage = (sectorCoverage.data as unknown as SectorCoverage[]) ?? []
    const avgCoverage = coverage.length
      ? Math.round(coverage.reduce((sum, s) => sum + s.coverage_pct, 0) / coverage.length)
      : 0

    return {
      working_today: workingCount,
      on_leave_today: onLeaveCount,
      operational_coverage_pct: avgCoverage,
      critical_alerts: criticalAlerts.count ?? 0,
      overtime_warnings: 0,
      critical_days: coverage.filter((s) => s.status === 'critical').length,
      substitutes_needed: 0,
      upcoming_holidays: upcomingHolidays.data ?? [],
      sector_coverage: coverage,
      alerts_summary: [
        { level: 'critical' as const, count: criticalAlerts.count ?? 0 },
        { level: 'warning' as const, count: 0 },
        { level: 'info' as const, count: 0 },
      ],
    }
  },

  async getRecentAlerts(unitId: string, limit = 5): Promise<Alert[]> {
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .eq('unit_id', unitId)
      .eq('is_resolved', false)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)
    return (data ?? []) as Alert[]
  },
}
