-- =====================================================
-- Migration: Disable All RLS Policies
-- Description: Drops all Row Level Security policies defined in previous migrations
-- Date: 2025-12-30
-- @todo remove this migration before deploying to production
-- =====================================================

-- =====================================================
-- Drop RLS Policies for: profiles
-- =====================================================

-- Drop ADMINISTRATOR policies
drop policy if exists "Administrators can view all profiles including deleted" on profiles;
drop policy if exists "Administrators can insert profiles" on profiles;
drop policy if exists "Administrators can update profiles" on profiles;

-- Drop HR policies
drop policy if exists "HR can view active profiles" on profiles;

-- Drop EMPLOYEE policies
drop policy if exists "Employees can view their own profile and team members" on profiles;
drop policy if exists "Employees can update their own profile" on profiles;

-- =====================================================
-- Drop RLS Policies for: teams
-- =====================================================

-- Drop HR policies
drop policy if exists "HR can select teams" on teams;
drop policy if exists "HR can insert teams" on teams;
drop policy if exists "HR can update teams" on teams;
drop policy if exists "HR can delete teams" on teams;

-- Drop EMPLOYEE policies
drop policy if exists "Employees can view their teams" on teams;

-- =====================================================
-- Drop RLS Policies for: team_members
-- =====================================================

-- Drop HR policies
drop policy if exists "HR can select team members" on team_members;
drop policy if exists "HR can insert team members" on team_members;
drop policy if exists "HR can update team members" on team_members;
drop policy if exists "HR can delete team members" on team_members;

-- Drop EMPLOYEE policies
drop policy if exists "Employees can view their team members" on team_members;

-- =====================================================
-- Drop RLS Policies for: vacation_requests
-- =====================================================

-- Drop HR policies
drop policy if exists "HR can select all vacation requests" on vacation_requests;
drop policy if exists "HR can insert vacation requests" on vacation_requests;
drop policy if exists "HR can update vacation requests" on vacation_requests;
drop policy if exists "HR can delete vacation requests" on vacation_requests;

-- Drop EMPLOYEE policies for own requests
drop policy if exists "Employees can select their own requests" on vacation_requests;
drop policy if exists "Employees can insert their own requests" on vacation_requests;
drop policy if exists "Employees can update their own requests" on vacation_requests;
drop policy if exists "Employees can delete their own requests" on vacation_requests;

-- Drop EMPLOYEE policies for team members' requests
drop policy if exists "Employees can view team members requests" on vacation_requests;

-- =====================================================
-- Drop RLS Policies for: vacation_allowances
-- =====================================================

-- Drop HR policies
drop policy if exists "HR can select all vacation allowances" on vacation_allowances;
drop policy if exists "HR can insert vacation allowances" on vacation_allowances;
drop policy if exists "HR can update vacation allowances" on vacation_allowances;
drop policy if exists "HR can delete vacation allowances" on vacation_allowances;

-- Drop EMPLOYEE policies
drop policy if exists "Employees can view their own allowances" on vacation_allowances;

-- =====================================================
-- Drop RLS Policies for: settings
-- =====================================================

-- Drop ADMINISTRATOR policies
drop policy if exists "Administrators can select settings" on settings;
drop policy if exists "Administrators can insert settings" on settings;
drop policy if exists "Administrators can update settings" on settings;
drop policy if exists "Administrators can delete settings" on settings;

-- Drop HR policies
drop policy if exists "HR can view settings" on settings;

-- =====================================================
-- Drop RLS Policies for: public_holidays
-- =====================================================

-- Drop ADMINISTRATOR policies
drop policy if exists "Administrators can select public holidays" on public_holidays;
drop policy if exists "Administrators can insert public holidays" on public_holidays;
drop policy if exists "Administrators can update public holidays" on public_holidays;
drop policy if exists "Administrators can delete public holidays" on public_holidays;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

