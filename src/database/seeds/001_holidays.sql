-- ============================================================
-- SEED 001: Brazilian National and Commercial Holidays
-- Restaurant Scheduling SaaS — escalaInteligente
-- ============================================================
-- company_id = NULL means the holiday applies to ALL tenants.
-- demand_multiplier: 1.0 = baseline, >1.0 = above average demand,
--                    <1.0 = below average demand.
-- ============================================================

-- National holidays (company_id = NULL means applies to all)
INSERT INTO holidays (name, date, type, is_recurring, affects_operation, demand_multiplier) VALUES

  -- ============================================================
  -- 2025 — Feriados Nacionais
  -- ============================================================
  ('Confraternização Universal',  '2025-01-01', 'nacional',       true,  true, 0.40),
  ('Carnaval',                    '2025-03-03', 'nacional',       false, true, 1.80),
  ('Carnaval',                    '2025-03-04', 'nacional',       false, true, 1.80),
  ('Quarta-feira de Cinzas',      '2025-03-05', 'nacional',       false, true, 1.20),
  ('Sexta-feira Santa',           '2025-04-18', 'nacional',       false, true, 0.80),
  ('Tiradentes',                  '2025-04-21', 'nacional',       true,  true, 1.30),
  ('Dia do Trabalho',             '2025-05-01', 'nacional',       true,  true, 1.20),
  ('Corpus Christi',              '2025-06-19', 'nacional',       false, true, 1.10),
  ('Independência do Brasil',     '2025-09-07', 'nacional',       true,  true, 1.20),
  ('Nossa Sra. Aparecida',        '2025-10-12', 'nacional',       true,  true, 1.30),
  ('Finados',                     '2025-11-02', 'nacional',       true,  true, 0.70),
  ('Proclamação da República',    '2025-11-15', 'nacional',       true,  true, 1.00),
  ('Natal',                       '2025-12-25', 'nacional',       true,  true, 0.50),

  -- ============================================================
  -- 2025 — Datas Comerciais (peak demand events)
  -- ============================================================
  ('Véspera de Natal',            '2025-12-24', 'data_comercial', true,  true, 1.50),
  ('Réveillon',                   '2025-12-31', 'data_comercial', true,  true, 2.00),
  ('Dia das Mães',                '2025-05-11', 'data_comercial', false, true, 2.50),
  ('Dia dos Pais',                '2025-08-10', 'data_comercial', false, true, 2.00),
  ('Dia dos Namorados',           '2025-06-12', 'data_comercial', true,  true, 1.80),
  ('Black Friday',                '2025-11-28', 'data_comercial', false, true, 1.60),

  -- ============================================================
  -- 2024 — Feriados Nacionais
  -- ============================================================
  ('Confraternização Universal',  '2024-01-01', 'nacional',       true,  true, 0.40),
  ('Carnaval',                    '2024-02-12', 'nacional',       false, true, 1.80),
  ('Carnaval',                    '2024-02-13', 'nacional',       false, true, 1.80),
  ('Quarta-feira de Cinzas',      '2024-02-14', 'nacional',       false, true, 1.20),
  ('Sexta-feira Santa',           '2024-03-29', 'nacional',       false, true, 0.80),
  ('Tiradentes',                  '2024-04-21', 'nacional',       true,  true, 1.30),
  ('Dia do Trabalho',             '2024-05-01', 'nacional',       true,  true, 1.20),
  ('Corpus Christi',              '2024-05-30', 'nacional',       false, true, 1.10),
  ('Independência do Brasil',     '2024-09-07', 'nacional',       true,  true, 1.20),
  ('Nossa Sra. Aparecida',        '2024-10-12', 'nacional',       true,  true, 1.30),
  ('Finados',                     '2024-11-02', 'nacional',       true,  true, 0.70),
  ('Proclamação da República',    '2024-11-15', 'nacional',       true,  true, 1.00),
  ('Natal',                       '2024-12-25', 'nacional',       true,  true, 0.50),

  -- ============================================================
  -- 2024 — Datas Comerciais
  -- ============================================================
  ('Véspera de Natal',            '2024-12-24', 'data_comercial', true,  true, 1.50),
  ('Véspera de Ano Novo',         '2024-12-31', 'data_comercial', true,  true, 2.00),
  ('Dia das Mães',                '2024-05-12', 'data_comercial', false, true, 2.50),
  ('Dia dos Pais',                '2024-08-11', 'data_comercial', false, true, 2.00),
  ('Dia dos Namorados',           '2024-06-12', 'data_comercial', true,  true, 1.80),
  ('Black Friday',                '2024-11-29', 'data_comercial', false, true, 1.60)

ON CONFLICT DO NOTHING;
