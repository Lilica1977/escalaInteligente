export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

export interface Database {
  public: {
    Tables: {
      companies: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      units: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      users: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      employees: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      employee_skills: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      roles: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      sectors: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      shifts: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      schedules: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      holidays: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      work_regimes: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      schedule_patterns: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      employee_pattern_assignments: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      employee_restrictions: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      staffing_requirements: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      business_demand: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      alerts: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      audit_logs: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      schedule_generation_runs: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      schedule_generation_logs: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
    }
    Views: Record<string, never>
    Functions: {
      get_sector_coverage: {
        Args: { p_unit_id: string; p_date: string }
        Returns: AnyRecord[]
      }
      get_working_days_count: {
        Args: { p_employee_id: string; p_month: number; p_year: number }
        Returns: number
      }
      get_days_off_count: {
        Args: { p_employee_id: string; p_month: number; p_year: number }
        Returns: number
      }
      get_consecutive_working_days: {
        Args: { p_employee_id: string; p_up_to_date: string }
        Returns: number
      }
    }
    Enums: Record<string, never>
  }
}
