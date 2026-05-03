-- ============================================================
-- MIGRATION 004: Business Logic Functions
-- Restaurant Scheduling SaaS — escalaInteligente
-- ============================================================

-- ============================================================
-- BUSINESS LOGIC FUNCTIONS
-- ============================================================

-- ------------------------------------------------------------
-- get_working_days_count
-- Returns the number of working days (non-folga) scheduled for
-- an employee in a given month/year.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_working_days_count(
  p_employee_id UUID,
  p_month INT,
  p_year INT
) RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM schedules
  WHERE employee_id = p_employee_id
    AND EXTRACT(MONTH FROM date) = p_month
    AND EXTRACT(YEAR FROM date) = p_year
    AND is_day_off = false
    AND deleted_at IS NULL;
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_working_days_count(UUID, INT, INT) IS
  'Returns the count of working days (is_day_off = false) for an employee in the given month and year';

-- ------------------------------------------------------------
-- get_days_off_count
-- Returns the number of folgas (rest days) scheduled for an
-- employee in a given month/year.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_days_off_count(
  p_employee_id UUID,
  p_month INT,
  p_year INT
) RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM schedules
  WHERE employee_id = p_employee_id
    AND EXTRACT(MONTH FROM date) = p_month
    AND EXTRACT(YEAR FROM date) = p_year
    AND is_day_off = true
    AND deleted_at IS NULL;
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_days_off_count(UUID, INT, INT) IS
  'Returns the count of rest days (is_day_off = true) for an employee in the given month and year';

-- ------------------------------------------------------------
-- get_consecutive_working_days
-- Walks backwards from p_up_to_date counting uninterrupted
-- working days. Used by the CLT violation checker.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_consecutive_working_days(
  p_employee_id UUID,
  p_up_to_date DATE
) RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_date DATE := p_up_to_date;
  v_is_working BOOLEAN;
BEGIN
  LOOP
    SELECT NOT is_day_off INTO v_is_working
    FROM schedules
    WHERE employee_id = p_employee_id
      AND date = v_date
      AND deleted_at IS NULL
    LIMIT 1;

    EXIT WHEN NOT FOUND OR NOT v_is_working;
    v_count := v_count + 1;
    v_date := v_date - 1;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_consecutive_working_days(UUID, DATE) IS
  'Counts consecutive working days going backwards from p_up_to_date (inclusive). Returns 0 if the given date is a rest day or unscheduled';

-- ------------------------------------------------------------
-- check_clt_violation
-- Validates whether scheduling a work day on p_date would
-- breach CLT rules for the employee. Returns zero or more
-- violation rows.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_clt_violation(
  p_employee_id UUID,
  p_date DATE
) RETURNS TABLE (
  violation_type TEXT,
  description TEXT,
  severity alert_level
) AS $$
DECLARE
  v_consecutive INT;
  v_max_consecutive INT;
  v_work_regime_rest_hours INT;
  v_prev_schedule_date DATE;
  v_prev_shift_end TIME;
  v_prev_shift_is_overnight BOOLEAN;
  v_candidate_shift_start TIME;
  v_rest_hours NUMERIC;
BEGIN
  -- Get employee-level max consecutive days and work regime rest hours
  SELECT
    e.max_consecutive_days,
    wr.min_rest_between_shifts_hours
  INTO v_max_consecutive, v_work_regime_rest_hours
  FROM employees e
  JOIN work_regimes wr ON wr.id = e.work_regime_id
  WHERE e.id = p_employee_id;

  -- ---- Check 1: max consecutive working days ----
  v_consecutive := get_consecutive_working_days(p_employee_id, p_date - 1);
  IF v_consecutive >= COALESCE(v_max_consecutive, 6) THEN
    RETURN QUERY SELECT
      'max_consecutive_days'::TEXT,
      format(
        'Funcionário já acumula %s dias consecutivos de trabalho. Limite: %s dias.',
        v_consecutive,
        COALESCE(v_max_consecutive, 6)
      ),
      'critical'::alert_level;
  END IF;

  -- ---- Check 2: minimum inter-shift rest (11h CLT default) ----
  -- Find the most recent prior working schedule for this employee
  SELECT
    sc.date,
    sh.end_time,
    sh.is_overnight
  INTO v_prev_schedule_date, v_prev_shift_end, v_prev_shift_is_overnight
  FROM schedules sc
  JOIN shifts sh ON sh.id = sc.shift_id
  WHERE sc.employee_id = p_employee_id
    AND sc.date < p_date
    AND sc.is_day_off = false
    AND sc.deleted_at IS NULL
  ORDER BY sc.date DESC
  LIMIT 1;

  IF FOUND THEN
    -- Compute rest gap using the candidate date's most common shift start
    -- (use earliest shift for the unit on that date as a proxy)
    SELECT sh.start_time INTO v_candidate_shift_start
    FROM schedules sc
    JOIN shifts sh ON sh.id = sc.shift_id
    WHERE sc.date = p_date
      AND sc.deleted_at IS NULL
    ORDER BY sh.start_time
    LIMIT 1;

    IF v_candidate_shift_start IS NOT NULL THEN
      -- Build full timestamps for the gap calculation
      DECLARE
        v_prev_end_ts TIMESTAMPTZ;
        v_next_start_ts TIMESTAMPTZ;
      BEGIN
        IF v_prev_shift_is_overnight THEN
          -- Previous shift ended on the day after its schedule date
          v_prev_end_ts := (v_prev_schedule_date + 1)::TIMESTAMPTZ + v_prev_shift_end::INTERVAL;
        ELSE
          v_prev_end_ts := v_prev_schedule_date::TIMESTAMPTZ + v_prev_shift_end::INTERVAL;
        END IF;

        v_next_start_ts := p_date::TIMESTAMPTZ + v_candidate_shift_start::INTERVAL;
        v_rest_hours := EXTRACT(EPOCH FROM (v_next_start_ts - v_prev_end_ts)) / 3600.0;

        IF v_rest_hours < COALESCE(v_work_regime_rest_hours, 11) THEN
          RETURN QUERY SELECT
            'min_rest_between_shifts'::TEXT,
            format(
              'Intervalo entre turnos de %.1f horas está abaixo do mínimo de %s horas exigido.',
              v_rest_hours,
              COALESCE(v_work_regime_rest_hours, 11)
            ),
            CASE
              WHEN v_rest_hours < 8 THEN 'critical'::alert_level
              ELSE 'warning'::alert_level
            END;
        END IF;
      END;
    END IF;
  END IF;

  -- ---- Check 3: working on a Sunday when not allowed ----
  IF EXTRACT(DOW FROM p_date) = 0 THEN
    DECLARE
      v_can_work_sunday BOOLEAN;
    BEGIN
      SELECT can_work_sundays INTO v_can_work_sunday
      FROM employees WHERE id = p_employee_id;

      IF NOT v_can_work_sunday THEN
        RETURN QUERY SELECT
          'sunday_restriction'::TEXT,
          'Funcionário não está autorizado a trabalhar aos domingos.',
          'critical'::alert_level;
      END IF;
    END;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_clt_violation(UUID, DATE) IS
  'Validates CLT constraints for scheduling an employee on a given date. Returns one row per violation with type, description and severity';

-- ------------------------------------------------------------
-- get_sector_coverage
-- Returns real-time headcount vs. requirements for every
-- active sector in a unit on a given date.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_sector_coverage(
  p_unit_id UUID,
  p_date DATE
) RETURNS TABLE (
  sector_id UUID,
  sector_name TEXT,
  sector_color TEXT,
  scheduled_count INT,
  min_required INT,
  ideal_required INT,
  coverage_pct NUMERIC,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS sector_id,
    s.name::TEXT AS sector_name,
    s.color::TEXT AS sector_color,
    COUNT(sc.id)::INT AS scheduled_count,
    s.min_coverage AS min_required,
    COALESCE(MAX(sr.ideal_employees), s.min_coverage) AS ideal_required,
    CASE
      WHEN s.min_coverage = 0 THEN 100.0
      ELSE ROUND((COUNT(sc.id)::NUMERIC / s.min_coverage) * 100, 1)
    END AS coverage_pct,
    CASE
      WHEN COUNT(sc.id) >= COALESCE(MAX(sr.ideal_employees), s.min_coverage) THEN 'ok'
      WHEN COUNT(sc.id) >= s.min_coverage THEN 'warning'
      ELSE 'critical'
    END::TEXT AS status
  FROM sectors s
  LEFT JOIN schedules sc
    ON sc.sector_id = s.id
    AND sc.date = p_date
    AND sc.is_day_off = false
    AND sc.deleted_at IS NULL
  LEFT JOIN staffing_requirements sr
    ON sr.sector_id = s.id
    AND sr.unit_id = p_unit_id
  WHERE s.deleted_at IS NULL
    AND s.is_active = true
    AND (s.unit_id = p_unit_id OR s.unit_id IS NULL)
  GROUP BY s.id, s.name, s.color, s.min_coverage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_sector_coverage(UUID, DATE) IS
  'Returns headcount coverage statistics per sector for a unit on a given date. status: ok | warning | critical';

-- ------------------------------------------------------------
-- get_monthly_coverage_summary
-- Aggregates sector coverage status across all days of a month
-- for a unit. Useful for the monthly overview dashboard.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_monthly_coverage_summary(
  p_unit_id UUID,
  p_month INT,
  p_year INT
) RETURNS TABLE (
  date DATE,
  total_sectors INT,
  ok_count INT,
  warning_count INT,
  critical_count INT,
  overall_status TEXT
) AS $$
DECLARE
  v_start DATE;
  v_end DATE;
  v_current DATE;
BEGIN
  v_start := make_date(p_year, p_month, 1);
  v_end := (v_start + INTERVAL '1 month - 1 day')::DATE;
  v_current := v_start;

  WHILE v_current <= v_end LOOP
    RETURN QUERY
    SELECT
      v_current AS date,
      COUNT(*)::INT AS total_sectors,
      COUNT(*) FILTER (WHERE cov.status = 'ok')::INT AS ok_count,
      COUNT(*) FILTER (WHERE cov.status = 'warning')::INT AS warning_count,
      COUNT(*) FILTER (WHERE cov.status = 'critical')::INT AS critical_count,
      CASE
        WHEN COUNT(*) FILTER (WHERE cov.status = 'critical') > 0 THEN 'critical'
        WHEN COUNT(*) FILTER (WHERE cov.status = 'warning') > 0 THEN 'warning'
        ELSE 'ok'
      END::TEXT AS overall_status
    FROM get_sector_coverage(p_unit_id, v_current) cov;

    v_current := v_current + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_monthly_coverage_summary(UUID, INT, INT) IS
  'Aggregates daily sector coverage into a per-day summary for an entire month. Used by the calendar heatmap dashboard widget';

-- ------------------------------------------------------------
-- get_employee_month_summary
-- Returns key scheduling metrics for an employee for a given
-- month: working days, folgas, sunday folgas, total hours.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_employee_month_summary(
  p_employee_id UUID,
  p_month INT,
  p_year INT
) RETURNS TABLE (
  employee_id UUID,
  working_days INT,
  days_off INT,
  sunday_days_off INT,
  total_hours NUMERIC,
  expected_hours NUMERIC,
  hour_balance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_employee_id AS employee_id,
    COUNT(*) FILTER (WHERE NOT sc.is_day_off)::INT AS working_days,
    COUNT(*) FILTER (WHERE sc.is_day_off)::INT AS days_off,
    COUNT(*) FILTER (WHERE sc.is_day_off AND sc.is_sunday)::INT AS sunday_days_off,
    COALESCE(SUM(sh.duration_hours) FILTER (WHERE NOT sc.is_day_off), 0) AS total_hours,
    wr.weekly_hours * 4.33 AS expected_hours,
    COALESCE(SUM(sh.duration_hours) FILTER (WHERE NOT sc.is_day_off), 0)
      - (wr.weekly_hours * 4.33) AS hour_balance
  FROM schedules sc
  JOIN shifts sh ON sh.id = sc.shift_id
  JOIN employees e ON e.id = sc.employee_id
  JOIN work_regimes wr ON wr.id = e.work_regime_id
  WHERE sc.employee_id = p_employee_id
    AND EXTRACT(MONTH FROM sc.date) = p_month
    AND EXTRACT(YEAR FROM sc.date) = p_year
    AND sc.deleted_at IS NULL
  GROUP BY wr.weekly_hours;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_employee_month_summary(UUID, INT, INT) IS
  'Returns working day count, folga count, total hours worked and hour balance vs. contract for an employee in a given month';

-- ------------------------------------------------------------
-- log_audit
-- Convenience wrapper for inserting into audit_logs.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_audit(
  p_company_id UUID,
  p_user_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action audit_action,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (
    company_id,
    user_id,
    entity_type,
    entity_id,
    action,
    old_values,
    new_values
  ) VALUES (
    p_company_id,
    p_user_id,
    p_entity_type,
    p_entity_id,
    p_action,
    p_old_values,
    p_new_values
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_audit(UUID, UUID, TEXT, UUID, audit_action, JSONB, JSONB) IS
  'Inserts a row into audit_logs. Call from application code or other functions to record all data mutations';

-- ------------------------------------------------------------
-- resolve_alert
-- Marks an alert as resolved and records who resolved it.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION resolve_alert(
  p_alert_id UUID,
  p_user_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE alerts
  SET
    is_resolved = true,
    resolved_at = NOW(),
    resolved_by = p_user_id
  WHERE id = p_alert_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alert % not found or already deleted', p_alert_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION resolve_alert(UUID, UUID) IS
  'Marks an alert as resolved, recording the resolver user ID and resolution timestamp';
