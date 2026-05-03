import { supabase } from '@/lib/supabase'
import type { Schedule, GenerationStatus } from '@/types'

export const scheduleService = {
  async getMonthlySchedule(
    unitId: string,
    month: number,
    year: number,
  ): Promise<Schedule[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        employee:employees(id, name, nickname),
        sector:sectors(id, name, color),
        shift:shifts(id, name, start_time, end_time)
      `)
      .eq('unit_id', unitId)
      .gte('date', startDate)
      .lte('date', endDate)
      .is('deleted_at', null)
      .order('date', { ascending: true })
      .order('employee(name)', { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []) as Schedule[]
  },

  async getGenerationRuns(unitId: string, month: number, year: number) {
    const { data } = await supabase
      .from('schedule_generation_runs')
      .select('*')
      .eq('unit_id', unitId)
      .eq('month', month)
      .eq('year', year)
      .order('created_at', { ascending: false })
      .limit(5)
    return data ?? []
  },

  async startGeneration(
    companyId: string,
    unitId: string,
    month: number,
    year: number,
    userId: string,
  ) {
    const { data, error } = await supabase
      .from('schedule_generation_runs')
      .insert({
        company_id: companyId,
        unit_id: unitId,
        month,
        year,
        status: 'pendente' as GenerationStatus,
        generated_by: userId,
        total_schedules: 0,
        conflicts_found: 0,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async updateScheduleStatus(id: string, status: Schedule['status'], notes?: string) {
    const { error } = await supabase
      .from('schedules')
      .update({ status, notes })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async markDayOff(employeeId: string, date: string, unitId: string) {
    const { error } = await supabase
      .from('schedules')
      .update({ is_day_off: true, status: 'ajustado' })
      .eq('employee_id', employeeId)
      .eq('date', date)
      .eq('unit_id', unitId)
    if (error) throw new Error(error.message)
  },
}
