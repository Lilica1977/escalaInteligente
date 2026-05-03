-- ============================================================
-- MIGRATION 001: Initial Schema
-- Restaurant Scheduling SaaS — escalaInteligente
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'supervisor');
CREATE TYPE gender AS ENUM ('M', 'F');
CREATE TYPE contract_type AS ENUM ('CLT', 'intermitente', 'freelancer', 'folguista', 'extra');
CREATE TYPE work_regime_type AS ENUM ('5x2', '6x1', '4x3', '12x36', 'personalizado');
CREATE TYPE day_of_week AS ENUM ('domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado');
CREATE TYPE alert_level AS ENUM ('info', 'warning', 'critical');
CREATE TYPE alert_type AS ENUM ('cobertura_insuficiente', 'violacao_clt', 'excesso_jornada', 'falta_equipe', 'dia_critico', 'folguista_necessario');
CREATE TYPE schedule_status AS ENUM ('gerado', 'publicado', 'ajustado', 'cancelado');
CREATE TYPE skill_level AS ENUM ('basico', 'intermediario', 'avancado', 'expert');
CREATE TYPE holiday_type AS ENUM ('nacional', 'estadual', 'municipal', 'interno', 'data_comercial');
CREATE TYPE demand_level AS ENUM ('baixo', 'medio', 'alto', 'critico');
CREATE TYPE generation_status AS ENUM ('pendente', 'processando', 'concluido', 'erro');
CREATE TYPE schedule_pattern_type AS ENUM ('dom_seg', 'seg_ter', 'ter_qua', 'qua_qui', 'qui_sex', 'sex_sab', 'sab_dom');
CREATE TYPE restriction_type AS ENUM ('nao_trabalhar_junto', 'nao_mesmo_setor', 'preferencia_setor', 'restricao_horario');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'restore');

-- ============================================================
-- COMPANIES (multi-tenant root)
-- ============================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE companies IS 'Tenant root — one per restaurant group or standalone restaurant';

-- ============================================================
-- UNITS (branches/locations)
-- ============================================================

CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  timezone VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE units IS 'Physical restaurant branches/locations belonging to a company';

-- ============================================================
-- USERS (app users — linked to Supabase Auth)
-- ============================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID NOT NULL UNIQUE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'supervisor',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE users IS 'Application users linked to Supabase Auth; scoped to a company and optionally a unit';
COMMENT ON COLUMN users.auth_user_id IS 'References auth.users(id) in Supabase';

-- ============================================================
-- ROLES (job positions — garcom, cozinheiro, etc.)
-- ============================================================

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (company_id, name)
);

COMMENT ON TABLE roles IS 'Job positions (garcom, cozinheiro, caixa, etc.) scoped to a company';

-- ============================================================
-- SECTORS (operational areas — salao, cozinha, delivery, etc.)
-- ============================================================

CREATE TABLE sectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  min_coverage INT NOT NULL DEFAULT 1,
  color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE sectors IS 'Operational areas within a unit (salao, cozinha, delivery, bar, etc.)';
COMMENT ON COLUMN sectors.min_coverage IS 'Minimum number of employees required to cover this sector on any given shift';
COMMENT ON COLUMN sectors.color IS 'Hex color code used in the UI schedule grid';

-- ============================================================
-- WORK REGIMES (5x2, 6x1, etc.)
-- ============================================================

CREATE TABLE work_regimes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type work_regime_type NOT NULL,
  weekly_hours NUMERIC(5,2) NOT NULL,
  work_days INT NOT NULL,
  rest_days INT NOT NULL,
  max_consecutive_days INT NOT NULL DEFAULT 6,
  min_rest_between_shifts_hours INT NOT NULL DEFAULT 11,
  requires_sunday_rest BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE work_regimes IS 'Work schedule regimes defining weekly hours, work/rest day ratios and CLT constraints';
COMMENT ON COLUMN work_regimes.min_rest_between_shifts_hours IS 'Minimum hours of rest required between consecutive shifts (CLT: 11h)';
COMMENT ON COLUMN work_regimes.requires_sunday_rest IS 'Whether this regime requires at least one Sunday off per month (CLT 6x1)';

-- ============================================================
-- EMPLOYEES
-- ============================================================

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id),
  sector_id UUID NOT NULL REFERENCES sectors(id),
  work_regime_id UUID NOT NULL REFERENCES work_regimes(id),
  name VARCHAR(255) NOT NULL,
  nickname VARCHAR(100),
  phone VARCHAR(20),
  gender gender NOT NULL,
  contract_type contract_type NOT NULL DEFAULT 'CLT',
  hire_date DATE NOT NULL,
  termination_date DATE,
  can_open_store BOOLEAN NOT NULL DEFAULT false,
  can_close_store BOOLEAN NOT NULL DEFAULT false,
  can_work_sundays BOOLEAN NOT NULL DEFAULT true,
  sunday_days_off_count INT NOT NULL DEFAULT 1,
  max_consecutive_days INT NOT NULL DEFAULT 6,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE employees IS 'Restaurant employees with scheduling constraints and contract details';
COMMENT ON COLUMN employees.sector_id IS 'Primary sector assignment; multi-sector capability defined in employee_skills';
COMMENT ON COLUMN employees.can_open_store IS 'Employee is authorized to open the restaurant (trusted key holder)';
COMMENT ON COLUMN employees.can_close_store IS 'Employee is authorized to close the restaurant (trusted key holder)';
COMMENT ON COLUMN employees.sunday_days_off_count IS 'Number of Sundays per month this employee is entitled to off';
COMMENT ON COLUMN employees.max_consecutive_days IS 'Override for work_regime max_consecutive_days at employee level';

-- ============================================================
-- EMPLOYEE SKILLS (multi-sector capability matrix)
-- ============================================================

CREATE TABLE employee_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  sector_id UUID NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  skill_level skill_level NOT NULL DEFAULT 'basico',
  priority INT NOT NULL DEFAULT 1,
  is_trained BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (employee_id, sector_id)
);

COMMENT ON TABLE employee_skills IS 'Cross-sector competency matrix: which sectors an employee can cover and at what level';
COMMENT ON COLUMN employee_skills.priority IS 'Scheduling priority for this sector (1 = highest). Used by the allocation engine';
COMMENT ON COLUMN employee_skills.is_trained IS 'Whether the employee has completed formal training for this sector';

-- ============================================================
-- SHIFTS (turno definitions)
-- ============================================================

CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours NUMERIC(4,2) NOT NULL,
  is_overnight BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE shifts IS 'Named shift templates (e.g. "Abertura 07:00-15:00", "Fechamento 15:00-23:00")';
COMMENT ON COLUMN shifts.is_overnight IS 'True when end_time is on the following calendar day (e.g. 22:00-06:00)';

-- ============================================================
-- HOLIDAYS
-- ============================================================

CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  type holiday_type NOT NULL DEFAULT 'nacional',
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  state VARCHAR(2),
  city VARCHAR(255),
  affects_operation BOOLEAN NOT NULL DEFAULT true,
  demand_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE holidays IS 'National, state, municipal and internal holidays plus commercial peak dates';
COMMENT ON COLUMN holidays.company_id IS 'NULL for national holidays visible to all tenants; set for company-specific dates';
COMMENT ON COLUMN holidays.demand_multiplier IS 'Multiplier applied to baseline staffing demand (e.g. 1.5 = 50% more staff needed)';
COMMENT ON COLUMN holidays.is_recurring IS 'True for fixed-date annual holidays (e.g. Christmas); false for moveable feasts';

-- ============================================================
-- SCHEDULE PATTERNS (folga patterns: Dom/Seg, Seg/Ter, etc.)
-- ============================================================

CREATE TABLE schedule_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  pattern_type schedule_pattern_type NOT NULL,
  off_days day_of_week[] NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE schedule_patterns IS 'Recurring weekly day-off patterns used to assign predictable folgas to employees';
COMMENT ON COLUMN schedule_patterns.off_days IS 'Array of days off in this pattern (e.g. {domingo, segunda} for Dom/Seg)';

-- ============================================================
-- EMPLOYEE PATTERN ASSIGNMENTS
-- ============================================================

CREATE TABLE employee_pattern_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  pattern_id UUID NOT NULL REFERENCES schedule_patterns(id),
  start_date DATE NOT NULL,
  end_date DATE,
  priority INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE employee_pattern_assignments IS 'Links employees to their day-off patterns with effective date ranges';
COMMENT ON COLUMN employee_pattern_assignments.end_date IS 'NULL means the pattern is open-ended (currently active)';

-- ============================================================
-- EMPLOYEE RESTRICTIONS
-- ============================================================

CREATE TABLE employee_restrictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  restricted_employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  restriction_type restriction_type NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE employee_restrictions IS 'Interpersonal and scheduling constraints between or for employees';
COMMENT ON COLUMN employee_restrictions.restricted_employee_id IS 'Target employee for interpersonal restrictions (NULL for individual constraints like restricao_horario)';

-- ============================================================
-- STAFFING REQUIREMENTS (per sector/shift/day coverage targets)
-- ============================================================

CREATE TABLE staffing_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  sector_id UUID NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  day_of_week day_of_week NOT NULL,
  shift_id UUID NOT NULL REFERENCES shifts(id),
  min_employees INT NOT NULL DEFAULT 1,
  ideal_employees INT NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (unit_id, sector_id, day_of_week, shift_id)
);

COMMENT ON TABLE staffing_requirements IS 'Minimum and ideal headcount targets per sector, shift and day of week';

-- ============================================================
-- BUSINESS DEMAND (demand forecast per day)
-- ============================================================

CREATE TABLE business_demand (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  level demand_level NOT NULL DEFAULT 'medio',
  expected_covers INT,
  expected_delivery INT,
  notes TEXT,
  is_special_event BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (unit_id, date)
);

COMMENT ON TABLE business_demand IS 'Daily demand forecast used by the scheduling engine to adjust staffing levels';
COMMENT ON COLUMN business_demand.expected_covers IS 'Projected number of table covers (dine-in)';
COMMENT ON COLUMN business_demand.expected_delivery IS 'Projected number of delivery orders';

-- ============================================================
-- SCHEDULES (the actual schedule entries)
-- ============================================================

CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  sector_id UUID NOT NULL REFERENCES sectors(id),
  shift_id UUID NOT NULL REFERENCES shifts(id),
  date DATE NOT NULL,
  status schedule_status NOT NULL DEFAULT 'gerado',
  is_day_off BOOLEAN NOT NULL DEFAULT false,
  is_holiday BOOLEAN NOT NULL DEFAULT false,
  is_sunday BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  generated_by_run_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (unit_id, employee_id, date)
);

COMMENT ON TABLE schedules IS 'Individual schedule entries: one row per employee per calendar day';
COMMENT ON COLUMN schedules.is_day_off IS 'True for folgas (rest days) — employee is NOT working this day';
COMMENT ON COLUMN schedules.generated_by_run_id IS 'References schedule_generation_runs(id) when created by the auto-scheduler';

-- ============================================================
-- ALERTS
-- ============================================================

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  level alert_level NOT NULL,
  type alert_type NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE alerts IS 'Scheduling alerts generated by the engine or business rules (CLT violations, coverage gaps, etc.)';
COMMENT ON COLUMN alerts.metadata IS 'Free-form JSON with context: affected employees, sector IDs, shift details, etc.';

-- ============================================================
-- SCHEDULE GENERATION RUNS
-- ============================================================

CREATE TABLE schedule_generation_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL CHECK (year >= 2020),
  status generation_status NOT NULL DEFAULT 'pendente',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  generated_by UUID NOT NULL REFERENCES users(id),
  total_schedules INT NOT NULL DEFAULT 0,
  conflicts_found INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE schedule_generation_runs IS 'Tracks each automated schedule generation job per unit per month';

-- ============================================================
-- SCHEDULE GENERATION LOGS
-- ============================================================

CREATE TABLE schedule_generation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES schedule_generation_runs(id) ON DELETE CASCADE,
  level alert_level NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  employee_id UUID REFERENCES employees(id),
  date DATE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE schedule_generation_logs IS 'Detailed per-step logs for a schedule generation run (decisions, conflicts, resolutions)';

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  action audit_action NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all create/update/delete operations across the system';
COMMENT ON COLUMN audit_logs.entity_type IS 'Table name of the affected record (e.g. employees, schedules, users)';

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies', 'units', 'users', 'roles', 'sectors',
    'work_regimes', 'employees', 'employee_skills', 'shifts',
    'holidays', 'schedule_patterns', 'employee_pattern_assignments',
    'employee_restrictions', 'staffing_requirements', 'business_demand',
    'schedules', 'alerts', 'schedule_generation_runs'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t, t
    );
  END LOOP;
END;
$$;
