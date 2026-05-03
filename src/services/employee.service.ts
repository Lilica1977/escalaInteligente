import { supabase } from '@/lib/supabase'
import type { Employee, PaginationParams, PaginatedResponse } from '@/types'
import type { EmployeeFormData } from '@/validations/employee'

export const employeeService = {
  async list(
    companyId: string,
    unitId: string,
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Employee>> {
    const { page = 1, per_page = 20, search, sort_by = 'name', sort_order = 'asc' } = params
    const from = (page - 1) * per_page
    const to = from + per_page - 1

    let query = supabase
      .from('employees')
      .select(
        `*, role:roles(id,name), sector:sectors(id,name,color), work_regime:work_regimes(id,name,type)`,
        { count: 'exact' },
      )
      .eq('company_id', companyId)
      .eq('unit_id', unitId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(from, to)

    if (search) {
      query = query.or(`name.ilike.%${search}%,nickname.ilike.%${search}%`)
    }

    const { data, count, error } = await query

    if (error) throw new Error(error.message)

    return {
      data: (data ?? []) as Employee[],
      count: count ?? 0,
      page,
      per_page,
      total_pages: Math.ceil((count ?? 0) / per_page),
    }
  },

  async getById(id: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        role:roles(id,name),
        sector:sectors(id,name,color),
        work_regime:work_regimes(id,name,type),
        employee_skills(*, sector:sectors(id,name,color))
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) return null
    return data as Employee
  },

  async create(
    companyId: string,
    unitId: string,
    data: EmployeeFormData,
  ): Promise<Employee> {
    const { data: created, error } = await supabase
      .from('employees')
      .insert({
        ...data,
        company_id: companyId,
        unit_id: unitId,
        nickname: data.nickname || null,
        phone: data.phone || null,
        termination_date: data.termination_date || null,
        notes: data.notes || null,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return created as Employee
  },

  async update(id: string, data: Partial<EmployeeFormData>): Promise<Employee> {
    const { data: updated, error } = await supabase
      .from('employees')
      .update({
        ...data,
        nickname: data.nickname || null,
        phone: data.phone || null,
        termination_date: data.termination_date || null,
        notes: data.notes || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return updated as Employee
  },

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  async listRoles(companyId: string) {
    const { data } = await supabase
      .from('roles')
      .select('id, name')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name')
    return data ?? []
  },

  async listSectors(companyId: string) {
    const { data } = await supabase
      .from('sectors')
      .select('id, name, color')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name')
    return data ?? []
  },

  async listWorkRegimes(companyId: string) {
    const { data } = await supabase
      .from('work_regimes')
      .select('id, name, type, weekly_hours')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name')
    return data ?? []
  },
}
