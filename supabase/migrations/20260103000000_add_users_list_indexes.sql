-- =====================================================
-- Migration: Add indexes for users list endpoint
-- Description: Adds indexes to optimize GET /api/users endpoint performance
-- Date: 2026-01-03
-- =====================================================

-- Add index for ordering by created_at (used in users list)
create index if not exists idx_profiles_created_at on profiles(created_at desc);

-- Add composite index for team filtering (used when teamId parameter is provided)
create index if not exists idx_team_members_team_user on team_members(team_id, user_id);

-- Add comment
comment on index idx_profiles_created_at is 'Optimizes ORDER BY created_at DESC queries in users list endpoint';
comment on index idx_team_members_team_user is 'Optimizes team filtering queries in users list endpoint';

