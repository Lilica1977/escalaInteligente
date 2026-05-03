// === ENUMS ===
export type UserRole = 'admin' | 'manager' | 'supervisor'
export type Gender = 'M' | 'F'
export type ContractType = 'CLT' | 'intermitente' | 'freelancer' | 'folguista' | 'extra'
export type WorkRegimeType = '5x2' | '6x1' | '4x3' | '12x36' | 'personalizado'
export type DayOfWeek = 'domingo' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado'
export type AlertLevel = 'info' | 'warning' | 'critical'
export type AlertType = 'cobertura_insuficiente' | 'violacao_clt' | 'excesso_jornada' | 'falta_equipe' | 'dia_critico' | 'folguista_necessario'
export type ScheduleStatus = 'gerado' | 'publicado' | 'ajustado' | 'cancelado'
export type SkillLevel = 'basico' | 'intermediario' | 'avancado' | 'expert'
export type HolidayType = 'nacional' | 'estadual' | 'municipal' | 'interno' | 'data_comercial'
export type DemandLevel = 'baixo' | 'medio' | 'alto' | 'critico'
export type GenerationStatus = 'pendente' | 'processando' | 'concluido' | 'erro'
export type SchedulePatternType = 'dom_seg' | 'seg_ter' | 'ter_qua' | 'qua_qui' | 'qui_sex' | 'sex_sab' | 'sab_dom'

// === BASE TYPES ===
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

// === COMPANY & UNIT ===
export interface Company extends BaseEntity {
  name: string
  cnpj: string
  logo_url?: string | null
  is_active: boolean
}

export interface Unit extends BaseEntity {
  company_id: string
  name: string
  address?: string | null
  is_active: boolean
}

// === USER ===
export interface User extends BaseEntity {
  auth_user_id: string
  company_id: string
  unit_id?: string | null
  name: string
  email: string
  role: UserRole
  is_active: boolean
}

// === SECTOR ===
export interface Sector extends BaseEntity {
  company_id: string
  unit_id?: string | null
  name: string
  description?: string | null
  min_coverage: number
  color: string
  is_active: boolean
}

// === ROLE ===
export interface Role extends BaseEntity {
  company_id: string
  name: string
  description?: string | null
  is_active: boolean
}

// === WORK REGIME ===
export interface WorkRegime extends BaseEntity {
  company_id: string
  name: string
  type: WorkRegimeType
  weekly_hours: number
  work_days: number
  rest_days: number
  max_consecutive_days: number
  min_rest_between_shifts_hours: number
  requires_sunday_rest: boolean
  description?: string | null
  is_active: boolean
}

// === EMPLOYEE ===
export interface Employee extends BaseEntity {
  company_id: string
  unit_id: string
  role_id: string
  sector_id: string
  work_regime_id: string
  name: string
  nickname?: string | null
  phone?: string | null
  gender: Gender
  contract_type: ContractType
  hire_date: string
  termination_date?: string | null
  can_open_store: boolean
  can_close_store: boolean
  can_work_sundays: boolean
  sunday_days_off_count: number
  max_consecutive_days: number
  notes?: string | null
  is_active: boolean
  // joins
  role?: Role
  sector?: Sector
  work_regime?: WorkRegime
}

// === EMPLOYEE SKILL ===
export interface EmployeeSkill extends BaseEntity {
  employee_id: string
  sector_id: string
  skill_level: SkillLevel
  priority: number
  is_trained: boolean
  // joins
  sector?: Sector
}

// === SHIFT ===
export interface Shift extends BaseEntity {
  company_id: string
  unit_id?: string | null
  name: string
  start_time: string
  end_time: string
  duration_hours: number
  is_overnight: boolean
  is_active: boolean
}

// === HOLIDAY ===
export interface Holiday extends BaseEntity {
  company_id?: string | null
  name: string
  date: string
  type: HolidayType
  is_recurring: boolean
  state?: string | null
  city?: string | null
  affects_operation: boolean
  demand_multiplier: number
}

// === SCHEDULE PATTERN ===
export interface SchedulePattern extends BaseEntity {
  company_id: string
  name: string
  pattern_type: SchedulePatternType
  off_days: DayOfWeek[]
  is_active: boolean
}

// === EMPLOYEE PATTERN ASSIGNMENT ===
export interface EmployeePatternAssignment extends BaseEntity {
  employee_id: string
  pattern_id: string
  start_date: string
  end_date?: string | null
  priority: number
  is_active: boolean
  // joins
  pattern?: SchedulePattern
  employee?: Employee
}

// === SCHEDULE ===
export interface Schedule extends BaseEntity {
  company_id: string
  unit_id: string
  employee_id: string
  sector_id: string
  shift_id: string
  date: string
  status: ScheduleStatus
  is_day_off: boolean
  is_holiday: boolean
  is_sunday: boolean
  notes?: string | null
  generated_by_run_id?: string | null
  // joins
  employee?: Employee
  sector?: Sector
  shift?: Shift
}

// === STAFFING REQUIREMENT ===
export interface StaffingRequirement extends BaseEntity {
  unit_id: string
  sector_id: string
  day_of_week: DayOfWeek
  shift_id: string
  min_employees: number
  ideal_employees: number
  // joins
  sector?: Sector
  shift?: Shift
}

// === BUSINESS DEMAND ===
export interface BusinessDemand extends BaseEntity {
  unit_id: string
  date: string
  level: DemandLevel
  expected_covers?: number | null
  expected_delivery?: number | null
  notes?: string | null
  is_special_event: boolean
}

// === ALERT ===
export interface Alert extends BaseEntity {
  company_id: string
  unit_id: string
  level: AlertLevel
  type: AlertType
  title: string
  description: string
  date: string
  is_resolved: boolean
  resolved_at?: string | null
  resolved_by?: string | null
  metadata?: Record<string, unknown>
}

// === EMPLOYEE RESTRICTION ===
export interface EmployeeRestriction extends BaseEntity {
  employee_id: string
  restricted_employee_id?: string | null
  restriction_type: 'nao_trabalhar_junto' | 'nao_mesmo_setor' | 'preferencia_setor' | 'restricao_horario'
  description?: string | null
  is_active: boolean
}

// === SCHEDULE GENERATION ===
export interface ScheduleGenerationRun extends BaseEntity {
  company_id: string
  unit_id: string
  month: number
  year: number
  status: GenerationStatus
  started_at?: string | null
  completed_at?: string | null
  error_message?: string | null
  generated_by: string
  total_schedules: number
  conflicts_found: number
}

export interface ScheduleGenerationLog extends BaseEntity {
  run_id: string
  level: AlertLevel
  message: string
  employee_id?: string | null
  date?: string | null
  metadata?: Record<string, unknown>
}

// === AUDIT LOG ===
export interface AuditLog extends BaseEntity {
  company_id: string
  user_id: string
  entity_type: string
  entity_id: string
  action: 'create' | 'update' | 'delete' | 'restore'
  old_values?: Record<string, unknown> | null
  new_values?: Record<string, unknown> | null
  ip_address?: string | null
}

// === DASHBOARD ===
export interface DashboardMetrics {
  working_today: number
  on_leave_today: number
  operational_coverage_pct: number
  critical_alerts: number
  overtime_warnings: number
  critical_days: number
  substitutes_needed: number
  upcoming_holidays: Holiday[]
  sector_coverage: SectorCoverage[]
  alerts_summary: AlertSummary[]
}

export interface SectorCoverage {
  sector_id: string
  sector_name: string
  sector_color: string
  scheduled: number
  required: number
  coverage_pct: number
  status: 'ok' | 'warning' | 'critical'
}

export interface AlertSummary {
  level: AlertLevel
  count: number
}

// === PAGINATION ===
export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
}

export interface PaginationParams {
  page?: number
  per_page?: number
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// === API RESPONSE ===
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}
