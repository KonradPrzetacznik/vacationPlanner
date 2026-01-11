-- Migration: Add helper functions for vacation requests
-- Created: 2026-01-11
-- Description: Adds RPC functions for vacation request operations

-- ============================================================================
-- Function: check_common_team
-- Description: Check if two users share at least one common team
-- Used by: RBAC validation in vacation requests service (HR role)
-- ============================================================================
CREATE OR REPLACE FUNCTION check_common_team(
  user1_id UUID,
  user2_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM team_members tm1
    INNER JOIN team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = user1_id
      AND tm2.user_id = user2_id
  );
END;
$$;

COMMENT ON FUNCTION check_common_team IS 'Check if two users are members of at least one common team';

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION check_common_team TO authenticated;

