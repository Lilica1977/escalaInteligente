import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { EmployeesPage } from '@/pages/employees/EmployeesPage'
import { EmployeeFormPage } from '@/pages/employees/EmployeeFormPage'
import { SchedulesPage } from '@/pages/schedules/SchedulesPage'
import { SectorsPage } from '@/pages/SectorsPage'
import { ShiftsPage } from '@/pages/ShiftsPage'
import { HolidaysPage } from '@/pages/HolidaysPage'
import { AlertsPage } from '@/pages/AlertsPage'
import { SettingsPage } from '@/pages/SettingsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>

            {/* Protected app routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/employees/new" element={<EmployeeFormPage />} />
                <Route path="/employees/:id/edit" element={<EmployeeFormPage />} />
                <Route path="/schedules" element={<SchedulesPage />} />
                <Route path="/sectors" element={<SectorsPage />} />
                <Route path="/shifts" element={<ShiftsPage />} />
                <Route path="/holidays" element={<HolidaysPage />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
