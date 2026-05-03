import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboard.service'
import { useAuth } from '@/contexts/AuthContext'

export function useDashboardMetrics(date?: string) {
  const { user } = useAuth()
  const unitId = user?.unit_id ?? ''

  return useQuery({
    queryKey: ['dashboard', 'metrics', unitId, date],
    queryFn: () => dashboardService.getMetrics(unitId, date),
    enabled: !!unitId,
    refetchInterval: 1000 * 60 * 5,
  })
}

export function useRecentAlerts() {
  const { user } = useAuth()
  const unitId = user?.unit_id ?? ''

  return useQuery({
    queryKey: ['dashboard', 'alerts', unitId],
    queryFn: () => dashboardService.getRecentAlerts(unitId),
    enabled: !!unitId,
  })
}
