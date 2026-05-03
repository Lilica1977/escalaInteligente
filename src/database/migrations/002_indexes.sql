-- ============================================================
-- MIGRATION 002: Performance Indexes
-- Restaurant Scheduling SaaS — escalaInteligente
-- ============================================================

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

-- Employees
CREATE INDEX idx_employees_company_unit ON employees(company_id, unit_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_sector ON employees(sector_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_role ON employees(role_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_work_regime ON employees(work_regime_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_active ON employees(company_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_contract_type ON employees(company_id, contract_type) WHERE deleted_at IS NULL;

-- Employee Skills
CREATE INDEX idx_employee_skills_employee ON employee_skills(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employee_skills_sector ON employee_skills(sector_id) WHERE deleted_at IS NULL;

-- Schedules (most critical — queried very frequently)
CREATE INDEX idx_schedules_date ON schedules(date) WHERE deleted_at IS NULL;
CREATE INDEX idx_schedules_unit_date ON schedules(unit_id, date) WHERE deleted_at IS NULL;
CREATE INDEX idx_schedules_employee_date ON schedules(employee_id, date) WHERE deleted_at IS NULL;
CREATE INDEX idx_schedules_employee_month ON schedules(employee_id, date) WHERE deleted_at IS NULL;
CREATE INDEX idx_schedules_sector_date ON schedules(sector_id, date) WHERE deleted_at IS NULL;
CREATE INDEX idx_schedules_status ON schedules(status, unit_id) WHERE deleted_at IS NULL;

-- Alerts
CREATE INDEX idx_alerts_unit_date ON alerts(unit_id, date) WHERE deleted_at IS NULL;
CREATE INDEX idx_alerts_unresolved ON alerts(unit_id, is_resolved, level) WHERE deleted_at IS NULL AND is_resolved = false;
CREATE INDEX idx_alerts_company ON alerts(company_id, created_at DESC) WHERE deleted_at IS NULL;

-- Business Demand
CREATE INDEX idx_business_demand_unit_date ON business_demand(unit_id, date) WHERE deleted_at IS NULL;

-- Holidays
CREATE INDEX idx_holidays_date ON holidays(date) WHERE deleted_at IS NULL;
CREATE INDEX idx_holidays_company_date ON holidays(company_id, date) WHERE deleted_at IS NULL;

-- Employee Pattern Assignments
CREATE INDEX idx_pattern_assignments_employee ON employee_pattern_assignments(employee_id) WHERE deleted_at IS NULL AND is_active = true;

-- Schedule Generation
CREATE INDEX idx_gen_runs_unit_month ON schedule_generation_runs(unit_id, year, month);
CREATE INDEX idx_gen_logs_run ON schedule_generation_logs(run_id, created_at);

-- Audit Logs
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_logs_company ON audit_logs(company_id, created_at DESC);

-- Users
CREATE INDEX idx_users_auth_user ON users(auth_user_id);
CREATE INDEX idx_users_company ON users(company_id) WHERE deleted_at IS NULL;
