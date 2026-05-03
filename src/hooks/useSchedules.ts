import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scheduleService } from '@/services/schedule.service'
import { useAuth } from '@/contexts/AuthContext'

export function useMonthlySchedule(month: number, year: number) {
  const { user } = useAuth()
  const unitId = user?.unit_id ?? ''

  return useQuery({
    queryKey: ['schedules', 'monthly', unitId, month, year],
    queryFn: () => scheduleService.getMonthlySchedule(unitId, month, year),
    enabled: !!unitId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useGenerationRuns(month: number, year: number) {
  const { user } = useAuth()
  const unitId = user?.unit_id ?? ''

  return useQuery({
    queryKey: ['schedule_generation_runs', unitId, month, year],
    queryFn: () => scheduleService.getGenerationRuns(unitId, month, year),
    enabled: !!unitId,
  })
}

export function useStartGeneration() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) =>
      scheduleService.startGeneration(
        user?.company_id ?? '',
        user?.unit_id ?? '',
        month,
        year,
        user?.id ?? '',
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_generation_runs'] })
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
  })
}
