-- =====================================================
-- Seed File: Sample Data for Vacation Planner
-- Description: Populates database with test data for development
-- Data includes:
--   - 1 Administrator
--   - 2 HR employees
--   - 10 Regular employees
--   - 2 Teams
--   - Team assignments (1 employee in both teams)
--   - Vacation requests (overlapping vacations at end of December)
-- =====================================================

-- =====================================================
-- 1. CREATE USERS IN AUTH.USERS
-- =====================================================
-- Note: In real Supabase, auth.users is managed by Auth API
-- For local development, we can insert directly
-- All passwords: test123

insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) values
  -- Administrator
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'admin.user@vacationplanner.pl', crypt('test123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Admin User"}', false, 'authenticated'),
  -- HR Employees
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'ferdynand.kiepski@vacationplanner.pl', crypt('test123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Ferdynand Kiepski"}', false, 'authenticated'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'halina.kiepska@vacationplanner.pl', crypt('test123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Halina Kiepska"}', false, 'authenticated'),
  -- Regular Employees
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'kazimierz.pawlak@vacationplanner.pl', crypt('test123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Kazimierz Pawlak"}', false, 'authenticated'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'jacek.kwiatkowski@vacationplanner.pl', crypt('test123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Jacek Kwiatkowski"}', false, 'authenticated'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'wladyslaw.kargul@vacationplanner.pl', crypt('test123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Władysław Kargul"}', false, 'authenticated'),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000000', 'marian.pazdzioch@vacationplanner.pl', crypt('test123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Marian Paździoch"}', false, 'authenticated'),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000000', 'grzegorz.brzeczyszczykiewicz@vacationplanner.pl', crypt('test123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Grzegorz Brzęczyszczykiewicz"}', false, 'authenticated'),
  ('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000000', 'adas.miauczynski@vacationplanner.pl', crypt('test123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Adaś Miauczyński"}', false, 'authenticated'),
  ('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000000', 'waldus.kiepski@vacationplanner.pl', crypt('test123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Walduś Kiepski"}', false, 'authenticated'),
  ('00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000000', 'siara.siarzewski@vacationplanner.pl', crypt('test123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Siara Siarzewski"}', false, 'authenticated'),
  ('00000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000000', 'arnold.boczek@vacationplanner.pl', crypt('test123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Arnold Boczek"}', false, 'authenticated'),
  ('00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000000', 'jurek.kiler@vacationplanner.pl', crypt('test123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Jurek Kiler"}', false, 'authenticated');

-- =====================================================
-- 2. CREATE PROFILES
-- =====================================================
-- Surnames contain role abbreviations: ADM (Administrator), HR (HR), EMP (Employee)

-- Administrator profile
insert into profiles (id, first_name, last_name, role) values
  ('00000000-0000-0000-0000-000000000001', 'Admin', 'User-ADM', 'ADMINISTRATOR');

-- HR profiles
insert into profiles (id, first_name, last_name, role) values
  ('00000000-0000-0000-0000-000000000002', 'Ferdynand', 'Kiepski-HR', 'HR'),
  ('00000000-0000-0000-0000-000000000003', 'Halina', 'Kiepska-HR', 'HR');

-- Employee profiles
insert into profiles (id, first_name, last_name, role) values
  ('00000000-0000-0000-0000-000000000010', 'Kazimierz', 'Pawlak-EMP', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-000000000011', 'Jacek', 'Kwiatkowski-EMP', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-000000000012', 'Władysław', 'Kargul-EMP', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-000000000013', 'Marian', 'Paździoch-EMP', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-000000000014', 'Grzegorz', 'Brzęczyszczykiewicz-EMP', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-000000000015', 'Adaś', 'Miauczyński-EMP', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-000000000016', 'Walduś', 'Kiepski-EMP', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-000000000017', 'Siara', 'Siarzewski-EMP', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-000000000018', 'Arnold', 'Boczek-EMP', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-000000000019', 'Jurek', 'Kiler-EMP', 'EMPLOYEE');

-- =====================================================
-- 3. CREATE TEAMS
-- =====================================================

insert into teams (id, name) values
  ('10000000-0000-0000-0000-000000000001', 'Green Team'),
  ('10000000-0000-0000-0000-000000000002', 'Red Team');

-- =====================================================
-- 4. ASSIGN TEAM MEMBERS
-- =====================================================

-- Kazimierz Pawlak (employee1) - assigned to BOTH teams
insert into team_members (team_id, user_id) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000010');

-- Development Team members
insert into team_members (team_id, user_id) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000014');

-- Marketing Team members
insert into team_members (team_id, user_id) values
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000015'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000016'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000017'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000018');


-- =====================================================
-- 5. CREATE VACATION ALLOWANCES FOR CURRENT YEAR
-- =====================================================

-- Create vacation allowances for all employees for 2025
insert into vacation_allowances (user_id, year, total_days, carryover_days)
select
  id,
  2025,
  26, -- default vacation days
  0   -- no carryover for this example
from profiles;

-- Create vacation allowances for all employees for 2026
insert into vacation_allowances (user_id, year, total_days, carryover_days)
select
  id,
  2026,
  26, -- default vacation days
  0   -- no carryover for this example
from profiles;

-- =====================================================
-- 6. CREATE VACATION REQUESTS
-- =====================================================

-- Kazimierz Pawlak (employee in both teams) - 10 business days at end of December 2025
-- Start: Monday, December 15, 2025
-- End: Friday, December 26, 2025
-- This gives us 10 business days (excluding weekends: 20-21 Dec, 27-28 Dec are excluded)
insert into vacation_requests (
  id,
  user_id,
  start_date,
  end_date,
  business_days_count,
  status,
  processed_by_user_id,
  processed_at
) values (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000010', -- Kazimierz Pawlak
  '2025-12-15', -- Monday
  '2025-12-26', -- Friday
  calculate_business_days('2025-12-15', '2025-12-26'),
  'APPROVED',
  '00000000-0000-0000-0000-000000000002', -- Approved by HR1 (Ferdynand Kiepski)
  now()
);

-- Jacek Kwiatkowski (employee2) - 50% overlap with Kazimierz Pawlak's vacation
-- Start: Friday, December 19, 2025
-- End: Tuesday, December 30, 2025
-- This overlaps with Kazimierz's vacation from Dec 19-26 (about 50% of his vacation period)
insert into vacation_requests (
  id,
  user_id,
  start_date,
  end_date,
  business_days_count,
  status,
  processed_by_user_id,
  processed_at
) values (
  '20000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000011', -- Jacek Kwiatkowski
  '2025-12-19', -- Friday
  '2025-12-30', -- Tuesday
  calculate_business_days('2025-12-19', '2025-12-30'),
  'APPROVED',
  '00000000-0000-0000-0000-000000000002', -- Approved by HR1 (Ferdynand Kiepski)
  now()
);

-- Additional example: Władysław Kargul - submitted request (not yet processed)
insert into vacation_requests (
  id,
  user_id,
  start_date,
  end_date,
  business_days_count,
  status
) values (
  '20000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000012', -- Władysław Kargul
  '2025-07-07', -- Monday
  '2025-07-18', -- Friday
  calculate_business_days('2025-07-07', '2025-07-18'),
  'SUBMITTED'
);

-- Additional example: Marian Paździoch - rejected request
insert into vacation_requests (
  id,
  user_id,
  start_date,
  end_date,
  business_days_count,
  status,
  processed_by_user_id,
  processed_at
) values (
  '20000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000013', -- Marian Paździoch
  '2025-08-04', -- Monday
  '2025-08-15', -- Friday
  calculate_business_days('2025-08-04', '2025-08-15'),
  'REJECTED',
  '00000000-0000-0000-0000-000000000003', -- Rejected by HR2 (Halina Kiepska)
  now()
);

-- Admin User (DEFAULT_USER_ID) - submitted request for testing
insert into vacation_requests (
  id,
  user_id,
  start_date,
  end_date,
  business_days_count,
  status
) values (
  '20000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001', -- Admin User
  '2026-03-02', -- Monday
  '2026-03-06', -- Friday
  calculate_business_days('2026-03-02', '2026-03-06'),
  'SUBMITTED'
);

-- Admin User - approved request for testing cancellation
insert into vacation_requests (
  id,
  user_id,
  start_date,
  end_date,
  business_days_count,
  status,
  processed_by_user_id,
  processed_at
) values (
  '20000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000001', -- Admin User
  '2026-04-07', -- Monday
  '2026-04-10', -- Friday (was Saturday, fixed)
  calculate_business_days('2026-04-07', '2026-04-10'),
  'APPROVED',
  '00000000-0000-0000-0000-000000000002', -- Approved by HR1 (Ferdynand Kiepski)
  now()
);

-- Admin User - past approved request (cannot be cancelled)
insert into vacation_requests (
  id,
  user_id,
  start_date,
  end_date,
  business_days_count,
  status,
  processed_by_user_id,
  processed_at
) values (
  '20000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000001', -- Admin User
  '2026-01-05', -- Monday (in the past)
  '2026-01-09', -- Friday
  calculate_business_days('2026-01-05', '2026-01-09'),
  'APPROVED',
  '00000000-0000-0000-0000-000000000002', -- Approved by HR1
  now()
);

-- =====================================================
-- 7. CREATE SAMPLE PUBLIC HOLIDAYS (for future use)
-- =====================================================

insert into public_holidays (date, name) values
  -- 2025
  ('2025-01-01', 'Nowy Rok'),
  ('2025-01-06', 'Święto Trzech Króli'),
  ('2025-04-20', 'Wielkanoc'),
  ('2025-04-21', 'Poniedziałek Wielkanocny'),
  ('2025-05-01', 'Święto Pracy'),
  ('2025-05-03', 'Święto Konstytucji 3 Maja'),
  ('2025-06-08', 'Zielone Świątki'),
  ('2025-06-19', 'Boże Ciało'),
  ('2025-08-15', 'Wniebowzięcie Najświętszej Maryi Panny'),
  ('2025-11-01', 'Wszystkich Świętych'),
  ('2025-11-11', 'Narodowe Święto Niepodległości'),
  ('2025-12-24', 'Wigilia'),
  ('2025-12-25', 'Boże Narodzenie (pierwszy dzień)'),
  ('2025-12-26', 'Boże Narodzenie (drugi dzień)'),
  -- 2026
  ('2026-01-01', 'Nowy Rok'),
  ('2026-01-06', 'Święto Trzech Króli'),
  ('2026-04-05', 'Wielkanoc'),
  ('2026-04-06', 'Poniedziałek Wielkanocny'),
  ('2026-05-01', 'Święto Pracy'),
  ('2026-05-03', 'Święto Konstytucji 3 Maja'),
  ('2026-05-24', 'Zielone Świątki'),
  ('2026-06-04', 'Boże Ciało'),
  ('2026-08-15', 'Wniebowzięcie Najświętszej Maryi Panny'),
  ('2026-11-01', 'Wszystkich Świętych'),
  ('2026-11-11', 'Narodowe Święto Niepodległości'),
  ('2026-12-24', 'Wigilia'),
  ('2026-12-25', 'Boże Narodzenie (pierwszy dzień)'),
  ('2026-12-26', 'Boże Narodzenie (drugi dzień)');

-- =====================================================
-- END OF SEED FILE
-- =====================================================

