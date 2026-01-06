-- =====================================================
-- Migration: Add RPC function to get user by ID with teams
-- Description: Creates a secure function to fetch a single user with their teams
-- Date: 2026-01-04
-- =====================================================

-- Function to get user by ID with teams
-- This function safely joins profiles with auth.users and teams
-- Includes RBAC checks: ADMINISTRATOR (all users), HR (active only), EMPLOYEE (self only)
create or replace function get_user_by_id_with_teams(
  p_user_id uuid,
  p_current_user_id uuid,
  p_current_user_role user_role
)
returns table (
  id uuid,
  first_name text,
  last_name text,
  email text,
  role user_role,
  deleted_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  teams jsonb
)
security definer
set search_path = public
language plpgsql
as $$
begin
  return query
  select
    prof.id,
    prof.first_name,
    prof.last_name,
    coalesce(au.email::text, '') as email,
    prof.role,
    prof.deleted_at,
    prof.created_at,
    prof.updated_at,
    coalesce(
      jsonb_agg(
        jsonb_build_object('id', t.id, 'name', t.name)
        order by t.name
      ) filter (where t.id is not null),
      '[]'::jsonb
    ) as teams
  from profiles prof
  left join auth.users au on prof.id = au.id
  left join team_members tm on prof.id = tm.user_id
  left join teams t on tm.team_id = t.id
  where prof.id = p_user_id
    and (
      -- ADMINISTRATOR can view all users
      p_current_user_role = 'ADMINISTRATOR'
      -- HR can view active users only
      or (p_current_user_role = 'HR' and prof.deleted_at is null)
      -- EMPLOYEE can view only themselves (active only)
      or (p_current_user_role = 'EMPLOYEE' and prof.id = p_current_user_id and prof.deleted_at is null)
    )
  group by prof.id, au.email;
end;
$$;

-- Add comment
comment on function get_user_by_id_with_teams is 'Fetches a single user with their teams, includes RBAC checks';

-- Grant execute permission to authenticated users
grant execute on function get_user_by_id_with_teams to authenticated;

