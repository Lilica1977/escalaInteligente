export const APP_NAME = 'Escala Inteligente'
export const APP_VERSION = '1.0.0'

export const DAYS_OF_WEEK = [
  { value: 'domingo', label: 'Domingo', short: 'Dom', index: 0 },
  { value: 'segunda', label: 'Segunda-feira', short: 'Seg', index: 1 },
  { value: 'terca', label: 'Terça-feira', short: 'Ter', index: 2 },
  { value: 'quarta', label: 'Quarta-feira', short: 'Qua', index: 3 },
  { value: 'quinta', label: 'Quinta-feira', short: 'Qui', index: 4 },
  { value: 'sexta', label: 'Sexta-feira', short: 'Sex', index: 5 },
  { value: 'sabado', label: 'Sábado', short: 'Sáb', index: 6 },
] as const

export const CONTRACT_TYPES = [
  { value: 'CLT', label: 'CLT' },
  { value: 'intermitente', label: 'Intermitente' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'folguista', label: 'Folguista' },
  { value: 'extra', label: 'Extra' },
] as const

export const WORK_REGIME_TYPES = [
  { value: '5x2', label: '5x2 (Segunda a Sexta)' },
  { value: '6x1', label: '6x1 (Seis dias, uma folga)' },
  { value: '4x3', label: '4x3 (Quatro dias, três folgas)' },
  { value: '12x36', label: '12x36 (Doze horas, trinta e seis de descanso)' },
  { value: 'personalizado', label: 'Personalizado' },
] as const

export const ALERT_LEVELS = [
  { value: 'info', label: 'Informação', color: 'blue' },
  { value: 'warning', label: 'Atenção', color: 'yellow' },
  { value: 'critical', label: 'Crítico', color: 'red' },
] as const

export const SKILL_LEVELS = [
  { value: 'basico', label: 'Básico', priority: 1 },
  { value: 'intermediario', label: 'Intermediário', priority: 2 },
  { value: 'avancado', label: 'Avançado', priority: 3 },
  { value: 'expert', label: 'Expert', priority: 4 },
] as const

export const SCHEDULE_PATTERNS = [
  { value: 'dom_seg', label: 'Domingo / Segunda', off_days: ['domingo', 'segunda'] },
  { value: 'seg_ter', label: 'Segunda / Terça', off_days: ['segunda', 'terca'] },
  { value: 'ter_qua', label: 'Terça / Quarta', off_days: ['terca', 'quarta'] },
  { value: 'qua_qui', label: 'Quarta / Quinta', off_days: ['quarta', 'quinta'] },
  { value: 'qui_sex', label: 'Quinta / Sexta', off_days: ['quinta', 'sexta'] },
  { value: 'sex_sab', label: 'Sexta / Sábado', off_days: ['sexta', 'sabado'] },
  { value: 'sab_dom', label: 'Sábado / Domingo', off_days: ['sabado', 'domingo'] },
] as const

export const DEMAND_LEVELS = [
  { value: 'baixo', label: 'Baixo', color: '#22c55e' },
  { value: 'medio', label: 'Médio', color: '#f59e0b' },
  { value: 'alto', label: 'Alto', color: '#f97316' },
  { value: 'critico', label: 'Crítico', color: '#ef4444' },
] as const

export const SECTOR_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
] as const

export const CLT_RULES = {
  MAX_DAILY_HOURS: 8,
  MAX_WEEKLY_HOURS: 44,
  MAX_CONSECUTIVE_DAYS: 6,
  MIN_REST_BETWEEN_SHIFTS_HOURS: 11,
  MIN_WEEKLY_REST_HOURS: 24,
  SUNDAY_REST_FREQUENCY: 7,
} as const

export const PAGINATION_DEFAULT = {
  page: 1,
  per_page: 20,
} as const

export const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const

export const USER_ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'manager', label: 'Gerente' },
  { value: 'supervisor', label: 'Supervisor' },
] as const
