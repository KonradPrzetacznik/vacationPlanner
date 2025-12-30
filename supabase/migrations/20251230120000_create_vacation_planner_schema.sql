-- =====================================================
-- Migration: Create Vacation Planner Schema
-- Description: Creates the complete database schema for the Vacation Planner application
-- Tables: profiles, teams, team_members, vacation_requests, vacation_allowances, settings, public_holidays
-- Author: VacationPlanner Team
-- Date: 2025-12-30
-- =====================================================

-- =====================================================
-- 1. ENUM TYPES
-- =====================================================

-- user_role enum: defines user roles in the system
-- ADMINISTRATOR: full access to manage user profiles and system configuration
-- HR: access to manage teams, vacation requests, and allowances
-- EMPLOYEE: basic access to own data and team information
create type user_role as enum ('ADMINISTRATOR', 'HR', 'EMPLOYEE');

-- request_status enum: defines vacation request workflow states
-- SUBMITTED: initial state when request is created
-- APPROVED: request approved by HR
-- REJECTED: request rejected by HR
-- CANCELLED: request cancelled by user or system (e.g., when user is deleted)
create type request_status as enum ('SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- =====================================================
-- 2. TABLES
-- =====================================================

-- -----------------------------------------------------
-- Table: profiles
-- Purpose: Stores user profile information, linked 1-to-1 with auth.users
-- Notes: Uses soft-delete pattern via deleted_at column
-- -----------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  role user_role not null default 'EMPLOYEE',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS must be enabled for security
alter table profiles enable row level security;

-- Add indexes for common queries
create index idx_profiles_role on profiles(role);
-- Partial index for deleted users to speed up filtering
create index idx_profiles_deleted_at on profiles(deleted_at) where deleted_at is not null;

-- Add table comment
comment on table profiles is 'User profiles linked to Supabase Auth users';
comment on column profiles.id is 'User ID, matches auth.users(id)';
comment on column profiles.deleted_at is 'Soft-delete timestamp, NULL means active user';

-- -----------------------------------------------------
-- Table: teams
-- Purpose: Stores team definitions in the organization
-- -----------------------------------------------------
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS must be enabled for security
alter table teams enable row level security;

comment on table teams is 'Team definitions in the organization';

-- -----------------------------------------------------
-- Table: team_members
-- Purpose: Junction table implementing many-to-many relationship between users and teams
-- Notes: Composite unique constraint ensures user can only be assigned to a team once
-- -----------------------------------------------------
create table team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),

  -- Ensure user can be assigned to a team only once
  unique(team_id, user_id)
);

-- RLS must be enabled for security
alter table team_members enable row level security;

-- Add indexes for foreign keys to speed up joins
create index idx_team_members_team_id on team_members(team_id);
create index idx_team_members_user_id on team_members(user_id);

comment on table team_members is 'Junction table for user-team many-to-many relationship';

-- -----------------------------------------------------
-- Table: vacation_requests
-- Purpose: Stores vacation requests submitted by users
-- Notes: Includes business logic constraints to ensure valid date ranges
-- -----------------------------------------------------
create table vacation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  business_days_count integer not null,
  status request_status not null default 'SUBMITTED',
  processed_by_user_id uuid references profiles(id) on delete set null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Ensure start date is before or equal to end date
  constraint check_dates_order check (start_date <= end_date),
  -- Ensure start date is not on weekend (0 = Sunday, 6 = Saturday)
  constraint check_start_date_not_weekend check (extract(dow from start_date) not in (0, 6)),
  -- Ensure end date is not on weekend
  constraint check_end_date_not_weekend check (extract(dow from end_date) not in (0, 6)),
  -- Ensure business days count is positive
  constraint check_business_days_positive check (business_days_count > 0)
);

-- RLS must be enabled for security
alter table vacation_requests enable row level security;

-- Add indexes for common query patterns
create index idx_vacation_requests_user_id on vacation_requests(user_id);
create index idx_vacation_requests_status on vacation_requests(status);
create index idx_vacation_requests_dates on vacation_requests(start_date, end_date);
create index idx_vacation_requests_processed_by on vacation_requests(processed_by_user_id);

comment on table vacation_requests is 'Vacation requests submitted by users';
comment on column vacation_requests.business_days_count is 'Number of business days (excluding weekends) in the vacation period';
comment on column vacation_requests.processed_by_user_id is 'ID of HR user who processed the request, preserved even if user is deleted';

-- -----------------------------------------------------
-- Table: vacation_allowances
-- Purpose: Stores annual vacation day pools for users
-- Notes: One record per user per year, includes carryover days from previous year
-- -----------------------------------------------------
create table vacation_allowances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  year integer not null,
  total_days integer not null,
  carryover_days integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Ensure one record per user per year
  unique(user_id, year),
  -- Validate total days is non-negative
  constraint check_total_days_non_negative check (total_days >= 0),
  -- Validate carryover days is non-negative
  constraint check_carryover_days_non_negative check (carryover_days >= 0),
  -- Validate year is within reasonable range
  constraint check_year_range check (year >= 2000 and year <= 2100)
);

-- RLS must be enabled for security
alter table vacation_allowances enable row level security;

-- Add indexes for common queries
create index idx_vacation_allowances_user_id on vacation_allowances(user_id);
create index idx_vacation_allowances_year on vacation_allowances(year);

comment on table vacation_allowances is 'Annual vacation day pools for users';
comment on column vacation_allowances.total_days is 'Total vacation days available for the year';
comment on column vacation_allowances.carryover_days is 'Days carried over from previous year, reset to 0 on April 1st';

-- -----------------------------------------------------
-- Table: settings
-- Purpose: Stores global application settings in key-value format
-- Notes: Values stored as JSONB for flexibility
-- -----------------------------------------------------
create table settings (
  key text primary key,
  value jsonb not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS must be enabled for security
alter table settings enable row level security;

comment on table settings is 'Global application settings in key-value format';

-- Insert initial settings
insert into settings (key, value, description) values
  ('default_vacation_days', '26', 'Default number of vacation days per year'),
  ('team_occupancy_threshold', '50', 'Percentage threshold (0-100) for maximum team members on vacation simultaneously');

-- -----------------------------------------------------
-- Table: public_holidays (optional - prepared for future use)
-- Purpose: Stores public holidays for vacation day calculations
-- Notes: Currently unused, prepared for future enhancement
--        Only accessible by administrators
-- -----------------------------------------------------
create table public_holidays (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

-- RLS must be enabled for security
-- Only administrators can access this table
alter table public_holidays enable row level security;

comment on table public_holidays is 'Public holidays (prepared for future use, admin-only access)';

-- =====================================================
-- 3. FUNCTIONS
-- =====================================================

-- -----------------------------------------------------
-- Function: calculate_business_days
-- Purpose: Calculates number of business days between two dates
-- Parameters:
--   p_start_date: Start date (inclusive)
--   p_end_date: End date (inclusive)
-- Returns: Number of business days (excluding weekends)
-- Notes: Prepared for future enhancement to exclude public holidays
-- -----------------------------------------------------
create or replace function calculate_business_days(
  p_start_date date,
  p_end_date date
) returns integer as $$
declare
  v_business_days integer := 0;
  v_current_date date;
begin
  -- Validate dates: if start is after end, return 0
  if p_start_date > p_end_date then
    return 0;
  end if;

  v_current_date := p_start_date;

  -- Loop through all dates in range
  while v_current_date <= p_end_date loop
    -- Check if day is not weekend (0 = Sunday, 6 = Saturday)
    if extract(dow from v_current_date) not in (0, 6) then
      -- Optional: check if day is not a public holiday (prepared for future)
      -- if not exists (select 1 from public_holidays where date = v_current_date) then
        v_business_days := v_business_days + 1;
      -- end if;
    end if;

    v_current_date := v_current_date + 1;
  end loop;

  return v_business_days;
end;
$$ language plpgsql immutable;

comment on function calculate_business_days is 'Calculates number of business days (excluding weekends) between two dates';

-- -----------------------------------------------------
-- Function: get_team_occupancy
-- Purpose: Calculates team occupancy (percentage of members on vacation) during a period
-- Parameters:
--   p_team_id: Team UUID
--   p_start_date: Period start date
--   p_end_date: Period end date
-- Returns: Percentage (0-100) of team members on approved vacation during the period
-- Notes: Only counts active (non-deleted) users, only approved vacations
-- -----------------------------------------------------
create or replace function get_team_occupancy(
  p_team_id uuid,
  p_start_date date,
  p_end_date date
) returns numeric as $$
declare
  v_total_members integer;
  v_members_on_vacation integer;
  v_occupancy_percent numeric;
begin
  -- Count active team members (not soft-deleted)
  select count(*)
  into v_total_members
  from team_members tm
  inner join profiles p on tm.user_id = p.id
  where tm.team_id = p_team_id
    and p.deleted_at is null;

  -- If team is empty, return 0
  if v_total_members = 0 then
    return 0;
  end if;

  -- Count unique team members who have approved vacation
  -- overlapping with the specified period
  select count(distinct vr.user_id)
  into v_members_on_vacation
  from vacation_requests vr
  inner join team_members tm on vr.user_id = tm.user_id
  inner join profiles p on vr.user_id = p.id
  where tm.team_id = p_team_id
    and vr.status = 'APPROVED'
    and p.deleted_at is null
    -- Check for date range overlap
    and vr.start_date <= p_end_date
    and vr.end_date >= p_start_date;

  -- Calculate occupancy percentage
  v_occupancy_percent := (v_members_on_vacation::numeric / v_total_members::numeric) * 100;

  return round(v_occupancy_percent, 2);
end;
$$ language plpgsql stable;

comment on function get_team_occupancy is 'Calculates percentage of team members on vacation during specified period';

-- -----------------------------------------------------
-- Function: cancel_future_vacations_on_user_delete
-- Purpose: Automatically cancels future vacations when user is soft-deleted
-- Trigger: AFTER UPDATE on profiles
-- Notes: Only cancels SUBMITTED and APPROVED vacations with start_date in the future
-- -----------------------------------------------------
create or replace function cancel_future_vacations_on_user_delete()
returns trigger as $$
begin
  -- Check if this is a soft-delete (deleted_at changed from NULL to a value)
  if old.deleted_at is null and new.deleted_at is not null then
    -- Cancel all future vacations for this user
    -- Only cancel SUBMITTED or APPROVED requests that haven't started yet
    update vacation_requests
    set
      status = 'CANCELLED',
      updated_at = now()
    where user_id = new.id
      and status in ('SUBMITTED', 'APPROVED')
      and start_date > current_date;
  end if;

  return new;
end;
$$ language plpgsql;

comment on function cancel_future_vacations_on_user_delete is 'Cancels future vacations when user is soft-deleted';

-- -----------------------------------------------------
-- Function: update_updated_at_column
-- Purpose: Helper function to automatically update the updated_at column
-- Trigger: BEFORE UPDATE on multiple tables
-- Notes: Standard pattern for timestamp tracking
-- -----------------------------------------------------
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

comment on function update_updated_at_column is 'Automatically updates the updated_at timestamp on row updates';

-- =====================================================
-- 4. TRIGGERS
-- =====================================================

-- Trigger to cancel vacations when user is soft-deleted
create trigger trigger_cancel_vacations_on_user_delete
  after update on profiles
  for each row
  when (old.deleted_at is null and new.deleted_at is not null)
  execute function cancel_future_vacations_on_user_delete();

-- Triggers to automatically update updated_at column
create trigger trigger_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

create trigger trigger_teams_updated_at
  before update on teams
  for each row
  execute function update_updated_at_column();

create trigger trigger_vacation_requests_updated_at
  before update on vacation_requests
  for each row
  execute function update_updated_at_column();

create trigger trigger_vacation_allowances_updated_at
  before update on vacation_allowances
  for each row
  execute function update_updated_at_column();

create trigger trigger_settings_updated_at
  before update on settings
  for each row
  execute function update_updated_at_column();

-- =====================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- -----------------------------------------------------
-- RLS Policies for: profiles
-- Access rules:
-- - ADMINISTRATOR: full access to all profiles (including deleted)
-- - HR: read access to active profiles only
-- - EMPLOYEE: read own profile and team members' profiles
-- -----------------------------------------------------

-- ADMINISTRATOR policies: full CRUD access to all profiles
create policy "Administrators can view all profiles including deleted"
  on profiles for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'ADMINISTRATOR'
    )
  );

create policy "Administrators can insert profiles"
  on profiles for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'ADMINISTRATOR'
    )
  );

create policy "Administrators can update profiles"
  on profiles for update
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'ADMINISTRATOR'
    )
  );

-- Note: No delete policy as we use soft-delete pattern (update deleted_at)

-- HR policies: read access to active profiles
create policy "HR can view active profiles"
  on profiles for select
  to authenticated
  using (
    -- HR can view active profiles OR their own profile
    (
      exists (
        select 1 from profiles
        where id = auth.uid() and role = 'HR'
      )
      and deleted_at is null
    )
    or id = auth.uid()
  );

-- EMPLOYEE policies: read own profile and team members, update own profile
create policy "Employees can view their own profile and team members"
  on profiles for select
  to authenticated
  using (
    -- Can view own profile
    id = auth.uid()
    or (
      -- Or view active team members
      deleted_at is null
      and exists (
        select 1 from team_members tm1
        inner join team_members tm2 on tm1.team_id = tm2.team_id
        where tm1.user_id = auth.uid()
          and tm2.user_id = profiles.id
      )
    )
  );

create policy "Employees can update their own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- -----------------------------------------------------
-- RLS Policies for: teams
-- Access rules:
-- - ADMINISTRATOR: no access (not their domain)
-- - HR: full CRUD access
-- - EMPLOYEE: read access to their teams only
-- -----------------------------------------------------

-- HR policies: full CRUD access to all teams
create policy "HR can select teams"
  on teams for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'HR'
    )
  );

create policy "HR can insert teams"
  on teams for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'HR'
    )
  );

create policy "HR can update teams"
  on teams for update
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'HR'
    )
  );

create policy "HR can delete teams"
  on teams for delete
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'HR'
    )
  );

-- EMPLOYEE policies: read access to their teams
create policy "Employees can view their teams"
  on teams for select
  to authenticated
  using (
    exists (
      select 1 from team_members
      where team_id = teams.id and user_id = auth.uid()
    )
  );

-- -----------------------------------------------------
-- RLS Policies for: team_members
-- Access rules:
-- - ADMINISTRATOR: no access (not their domain)
-- - HR: full CRUD access
-- - EMPLOYEE: read access to members of their teams
-- -----------------------------------------------------

-- HR policies: full CRUD access to all team memberships
create policy "HR can select team members"
  on team_members for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'HR'
    )
  );

create policy "HR can insert team members"
  on team_members for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'HR'
    )
  );

create policy "HR can update team members"
  on team_members for update
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'HR'
    )
  );

create policy "HR can delete team members"
  on team_members for delete
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'HR'
    )
  );

-- EMPLOYEE policies: read access to members of their teams
create policy "Employees can view their team members"
  on team_members for select
  to authenticated
  using (
    -- Can view members of teams they belong to
    exists (
      select 1 from team_members tm
      where tm.team_id = team_members.team_id
        and tm.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------
-- RLS Policies for: vacation_requests
-- Access rules:
-- - ADMINISTRATOR: no access (not their domain)
-- - HR: full CRUD access to all requests
-- - EMPLOYEE: full CRUD on own requests, read access to team members' requests
-- -----------------------------------------------------

-- HR policies: full CRUD access to all vacation requests
create policy "HR can select all vacation requests"
  on vacation_requests for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'HR'
    )
  );

create policy "HR can insert vacation requests"
  on vacation_requests for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'HR'
    )
  );

create policy "HR can update vacation requests"
  on vacation_requests for update
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'HR'
    )
  );

create policy "HR can delete vacation requests"
  on vacation_requests for delete
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'HR'
    )
  );

-- EMPLOYEE policies: full access to own requests
create policy "Employees can select their own requests"
  on vacation_requests for select
  to authenticated
  using (user_id = auth.uid());

create policy "Employees can insert their own requests"
  on vacation_requests for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Employees can update their own requests"
  on vacation_requests for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Employees can delete their own requests"
  on vacation_requests for delete
  to authenticated
  using (user_id = auth.uid());

-- EMPLOYEE policies: read access to team members' requests
create policy "Employees can view team members requests"
  on vacation_requests for select
  to authenticated
  using (
    -- Can view requests from team members
    exists (
      select 1 from team_members tm1
      inner join team_members tm2 on tm1.team_id = tm2.team_id
      where tm1.user_id = auth.uid()
        and tm2.user_id = vacation_requests.user_id
    )
  );

-- -----------------------------------------------------
-- RLS Policies for: vacation_allowances
-- Access rules:
-- - ADMINISTRATOR: no access (not their domain)
-- - HR: full CRUD access to all allowances
-- - EMPLOYEE: read access to own allowances only
-- -----------------------------------------------------

-- HR policies: full CRUD access to all vacation allowances
create policy "HR can select all vacation allowances"
  on vacation_allowances for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'HR'
    )
  );

create policy "HR can insert vacation allowances"
  on vacation_allowances for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'HR'
    )
  );

create policy "HR can update vacation allowances"
  on vacation_allowances for update
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'HR'
    )
  );

create policy "HR can delete vacation allowances"
  on vacation_allowances for delete
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'HR'
    )
  );

-- EMPLOYEE policies: read access to own allowances
create policy "Employees can view their own allowances"
  on vacation_allowances for select
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------
-- RLS Policies for: settings
-- Access rules:
-- - ADMINISTRATOR: full CRUD access (only admins can modify settings)
-- - HR: read access only
-- - EMPLOYEE: no access
-- - ANON: no access
-- -----------------------------------------------------

-- ADMINISTRATOR policies: full CRUD access to settings
create policy "Administrators can select settings"
  on settings for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'ADMINISTRATOR'
    )
  );

create policy "Administrators can insert settings"
  on settings for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'ADMINISTRATOR'
    )
  );

create policy "Administrators can update settings"
  on settings for update
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'ADMINISTRATOR'
    )
  );

create policy "Administrators can delete settings"
  on settings for delete
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'ADMINISTRATOR'
    )
  );

-- HR can read settings (but not modify)
create policy "HR can view settings"
  on settings for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'HR'
    )
  );

-- -----------------------------------------------------
-- RLS Policies for: public_holidays
-- Access rules:
-- - ADMINISTRATOR: full CRUD access (only admins can see and manage holidays)
-- - HR: no access
-- - EMPLOYEE: no access
-- - ANON: no access
-- -----------------------------------------------------

-- ADMINISTRATOR policies: full CRUD access to public holidays
create policy "Administrators can select public holidays"
  on public_holidays for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'ADMINISTRATOR'
    )
  );

create policy "Administrators can insert public holidays"
  on public_holidays for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'ADMINISTRATOR'
    )
  );

create policy "Administrators can update public holidays"
  on public_holidays for update
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'ADMINISTRATOR'
    )
  );

create policy "Administrators can delete public holidays"
  on public_holidays for delete
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'ADMINISTRATOR'
    )
  );

-- =====================================================
-- END OF MIGRATION
-- =====================================================

