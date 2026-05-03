import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeService } from '@/services/employee.service'
import { useAuth } from '@/contexts/AuthContext'
import type { PaginationParams } from '@/types'
import type { EmployeeFormData } from '@/validations/employee'

export function useEmployees(params: PaginationParams = {}) {
  const { user } = useAuth()
  const companyId = user?.company_id ?? ''
  const unitId = user?.unit_id ?? ''

  return useQuery({
    queryKey: ['employees', companyId, unitId, params],
    queryFn: () => employeeService.list(companyId, unitId, params),
    enabled: !!companyId && !!unitId,
  })
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => employeeService.getById(id!),
    enabled: !!id,
  })
}

export function useCreateEmployee() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: EmployeeFormData) =>
      employeeService.create(user?.company_id ?? '', user?.unit_id ?? '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<EmployeeFormData>) => employeeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['employees', id] })
    },
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => employeeService.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export function useRoles() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['roles', user?.company_id],
    queryFn: () => employeeService.listRoles(user?.company_id ?? ''),
    enabled: !!user?.company_id,
    staleTime: 1000 * 60 * 10,
  })
}

export function useSectors() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['sectors', user?.company_id],
    queryFn: () => employeeService.listSectors(user?.company_id ?? ''),
    enabled: !!user?.company_id,
    staleTime: 1000 * 60 * 10,
  })
}

export function useWorkRegimes() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['work_regimes', user?.company_id],
    queryFn: () => employeeService.listWorkRegimes(user?.company_id ?? ''),
    enabled: !!user?.company_id,
    staleTime: 1000 * 60 * 10,
  })
}
