-- =====================================================
-- Migration: Add RPC function to get users with emails
-- Description: Creates a secure function to fetch users with their emails from auth.users
-- Date: 2026-01-03
-- =====================================================

-- Function to get users with emails
-- This function safely joins profiles with auth.users to include email addresses
-- Can be called from the application via RPC
create or replace function get_users_with_emails(
  p_limit integer default 50,
  p_offset integer default 0,
  p_role user_role default null,
  p_include_deleted boolean default false,
  p_team_id uuid default null
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
  total_count bigint
)
security definer
set search_path = public
language plpgsql
as $$
begin
  -- If team_id is provided, filter by team membership
  if p_team_id is not null then
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
      count(*) over() as total_count
    from profiles prof
    left join auth.users au on prof.id = au.id
    inner join team_members tm on prof.id = tm.user_id
    where tm.team_id = p_team_id
      and (prof.deleted_at is null or p_include_deleted = true)
      and (get_users_with_emails.p_role is null or prof.role = get_users_with_emails.p_role)
    order by prof.created_at desc
    limit p_limit
    offset p_offset;
  else
    -- No team filtering
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
      count(*) over() as total_count
    from profiles prof
    left join auth.users au on prof.id = au.id
    where (prof.deleted_at is null or p_include_deleted = true)
      and (get_users_with_emails.p_role is null or prof.role = get_users_with_emails.p_role)
    order by prof.created_at desc
    limit p_limit
    offset p_offset;
  end if;
end;
$$;

-- Add comment
comment on function get_users_with_emails is 'Fetches users with their emails from auth.users, supports filtering and pagination';

-- Grant execute permission to authenticated users
grant execute on function get_users_with_emails to authenticated;

