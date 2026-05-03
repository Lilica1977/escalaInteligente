-- ============================================================
-- MIGRATION 003: Row Level Security Policies
-- Restaurant Scheduling SaaS — escalaInteligente
-- ============================================================

-- ============================================================
-- ROW LEVEL SECURITY — Multi-tenant isolation
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_regimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_pattern_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffing_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_demand ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_generation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Helper function to get current user's company_id
CREATE OR REPLACE FUNCTION get_current_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM users
  WHERE auth_user_id = auth.uid()
    AND deleted_at IS NULL
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM users
  WHERE auth_user_id = auth.uid()
    AND deleted_at IS NULL
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- COMPANIES — users can only see their own company
-- ============================================================

CREATE POLICY "companies_select" ON companies
  FOR SELECT USING (id = get_current_user_company_id());

CREATE POLICY "companies_admin_all" ON companies
  FOR ALL USING (
    id = get_current_user_company_id()
    AND get_current_user_role() = 'admin'
  );

-- ============================================================
-- UNITS — scoped to company
-- ============================================================

CREATE POLICY "units_select" ON units
  FOR SELECT USING (company_id = get_current_user_company_id());

CREATE POLICY "units_admin_manager_write" ON units
  FOR ALL USING (
    company_id = get_current_user_company_id()
    AND get_current_user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- USERS — scoped to company
-- ============================================================

CREATE POLICY "users_select_own_company" ON users
  FOR SELECT USING (company_id = get_current_user_company_id());

CREATE POLICY "users_admin_write" ON users
  FOR ALL USING (
    company_id = get_current_user_company_id()
    AND get_current_user_role() = 'admin'
  );

-- ============================================================
-- ROLES — scoped to company
-- ============================================================

CREATE POLICY "roles_select" ON roles
  FOR SELECT USING (company_id = get_current_user_company_id());

CREATE POLICY "roles_write" ON roles
  FOR ALL USING (
    company_id = get_current_user_company_id()
    AND get_current_user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- SECTORS — scoped to company
-- ============================================================

CREATE POLICY "sectors_select" ON sectors
  FOR SELECT USING (company_id = get_current_user_company_id());

CREATE POLICY "sectors_write" ON sectors
  FOR ALL USING (
    company_id = get_current_user_company_id()
    AND get_current_user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- WORK REGIMES — scoped to company
-- ============================================================

CREATE POLICY "work_regimes_select" ON work_regimes
  FOR SELECT USING (company_id = get_current_user_company_id());

CREATE POLICY "work_regimes_write" ON work_regimes
  FOR ALL USING (
    company_id = get_current_user_company_id()
    AND get_current_user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- EMPLOYEES — scoped to company
-- ============================================================

CREATE POLICY "employees_select" ON employees
  FOR SELECT USING (company_id = get_current_user_company_id());

CREATE POLICY "employees_write" ON employees
  FOR ALL USING (
    company_id = get_current_user_company_id()
    AND get_current_user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- EMPLOYEE SKILLS — via employee's company
-- ============================================================

CREATE POLICY "employee_skills_select" ON employee_skills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = employee_id
        AND e.company_id = get_current_user_company_id()
    )
  );

CREATE POLICY "employee_skills_write" ON employee_skills
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = employee_id
        AND e.company_id = get_current_user_company_id()
    )
    AND get_current_user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- SHIFTS — scoped to company
-- ============================================================

CREATE POLICY "shifts_select" ON shifts
  FOR SELECT USING (company_id = get_current_user_company_id());

CREATE POLICY "shifts_write" ON shifts
  FOR ALL USING (
    company_id = get_current_user_company_id()
    AND get_current_user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- HOLIDAYS — national holidays (NULL company_id) visible to all
-- ============================================================

CREATE POLICY "holidays_select" ON holidays
  FOR SELECT USING (
    company_id IS NULL
    OR company_id = get_current_user_company_id()
  );

CREATE POLICY "holidays_write" ON holidays
  FOR ALL USING (
    company_id = get_current_user_company_id()
    AND get_current_user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- SCHEDULE PATTERNS — scoped to company
-- ============================================================

CREATE POLICY "schedule_patterns_select" ON schedule_patterns
  FOR SELECT USING (company_id = get_current_user_company_id());

CREATE POLICY "schedule_patterns_write" ON schedule_patterns
  FOR ALL USING (
    company_id = get_current_user_company_id()
    AND get_current_user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- EMPLOYEE PATTERN ASSIGNMENTS — via employee's company
-- ============================================================

CREATE POLICY "epa_select" ON employee_pattern_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = employee_id
        AND e.company_id = get_current_user_company_id()
    )
  );

CREATE POLICY "epa_write" ON employee_pattern_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = employee_id
        AND e.company_id = get_current_user_company_id()
    )
    AND get_current_user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- EMPLOYEE RESTRICTIONS — via employee's company
-- ============================================================

CREATE POLICY "restrictions_select" ON employee_restrictions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = employee_id
        AND e.company_id = get_current_user_company_id()
    )
  );

CREATE POLICY "restrictions_write" ON employee_restrictions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = employee_id
        AND e.company_id = get_current_user_company_id()
    )
    AND get_current_user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- STAFFING REQUIREMENTS — via unit's company
-- ============================================================

CREATE POLICY "staffing_select" ON staffing_requirements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM units u
      WHERE u.id = unit_id
        AND u.company_id = get_current_user_company_id()
    )
  );

CREATE POLICY "staffing_write" ON staffing_requirements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM units u
      WHERE u.id = unit_id
        AND u.company_id = get_current_user_company_id()
    )
    AND get_current_user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- BUSINESS DEMAND — via unit's company
-- ============================================================

CREATE POLICY "demand_select" ON business_demand
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM units u
      WHERE u.id = unit_id
        AND u.company_id = get_current_user_company_id()
    )
  );

CREATE POLICY "demand_write" ON business_demand
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM units u
      WHERE u.id = unit_id
        AND u.company_id = get_current_user_company_id()
    )
    AND get_current_user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- SCHEDULES — scoped to company
-- ============================================================

CREATE POLICY "schedules_select" ON schedules
  FOR SELECT USING (company_id = get_current_user_company_id());

CREATE POLICY "schedules_write" ON schedules
  FOR ALL USING (
    company_id = get_current_user_company_id()
    AND get_current_user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- ALERTS — supervisors can mark resolved; managers/admins can write
-- ============================================================

CREATE POLICY "alerts_select" ON alerts
  FOR SELECT USING (company_id = get_current_user_company_id());

CREATE POLICY "alerts_write" ON alerts
  FOR ALL USING (
    company_id = get_current_user_company_id()
    AND get_current_user_role() IN ('admin', 'manager', 'supervisor')
  );

-- ============================================================
-- SCHEDULE GENERATION RUNS — scoped to company
-- ============================================================

CREATE POLICY "gen_runs_select" ON schedule_generation_runs
  FOR SELECT USING (company_id = get_current_user_company_id());

CREATE POLICY "gen_runs_write" ON schedule_generation_runs
  FOR ALL USING (
    company_id = get_current_user_company_id()
    AND get_current_user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- SCHEDULE GENERATION LOGS — via parent run's company
-- ============================================================

CREATE POLICY "gen_logs_select" ON schedule_generation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM schedule_generation_runs r
      WHERE r.id = run_id
        AND r.company_id = get_current_user_company_id()
    )
  );

-- ============================================================
-- AUDIT LOGS — admin read-only; system insert
-- ============================================================

CREATE POLICY "audit_select" ON audit_logs
  FOR SELECT USING (
    company_id = get_current_user_company_id()
    AND get_current_user_role() = 'admin'
  );

CREATE POLICY "audit_insert" ON audit_logs
  FOR INSERT WITH CHECK (company_id = get_current_user_company_id());
