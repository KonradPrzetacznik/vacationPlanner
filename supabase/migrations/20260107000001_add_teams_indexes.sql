-- =====================================================
-- Migration: Add indexes for teams table for better query performance
-- Description: Adds indexes on teams.name and teams.created_at for improved lookup and sorting
-- Date: 2026-01-07
-- =====================================================

-- Index on teams.name for fast name lookups and uniqueness checks
-- Note: UNIQUE constraint already creates an index, but we ensure it's explicit
-- This supports fast lookups when checking for duplicate names
create index if not exists idx_teams_name on teams(name);

-- Index on teams.created_at for sorting teams by creation date
create index if not exists idx_teams_created_at on teams(created_at desc);

-- Composite index on team_members for faster JOIN operations
-- This is useful when we need to check if a specific user is in a specific team
create index if not exists idx_team_members_user_team on team_members(user_id, team_id);

-- Add comments
comment on index idx_teams_name is 'Index for fast team name lookups and duplicate checking';
comment on index idx_teams_created_at is 'Index for sorting teams by creation date';
comment on index idx_team_members_user_team is 'Composite index for user-team membership lookups';

