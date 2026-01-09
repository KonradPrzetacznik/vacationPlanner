-- =====================================================
-- Migration: Add RPC function to get user emails by IDs
-- Description: Creates a secure function to fetch user emails from auth.users for specific user IDs
-- Date: 2026-01-07
-- =====================================================

-- Function to get user emails for specific user IDs
-- This function safely fetches emails from auth.users for given user IDs
-- Used to enrich team member information with email addresses
create or replace function get_user_emails(
  user_ids uuid[]
)
returns table (
  id uuid,
  email text
)
security definer
set search_path = public
language plpgsql
as $$
begin
  return query
  select
    au.id,
    coalesce(au.email::text, '') as email
  from auth.users au
  where au.id = any(user_ids);
end;
$$;

-- Add comment
comment on function get_user_emails is 'Fetches emails from auth.users for specific user IDs';

-- Grant execute permission to authenticated users
grant execute on function get_user_emails to authenticated;

