-- Migration: Add indexes for vacation_allowances queries
-- Created: 2026-01-11
-- Description: Optimizes vacation allowances queries by adding composite indexes

-- ============================================================================
-- Indexes for vacation_allowances table
-- ============================================================================

-- Composite index for user_id and year lookups (DESC for recent years first)
-- Used by: GET /api/users/:userId/vacation-allowances
-- Used by: GET /api/users/:userId/vacation-allowances/:year
CREATE INDEX IF NOT EXISTS idx_vacation_allowances_user_year
ON vacation_allowances(user_id, year DESC);

-- ============================================================================
-- Additional indexes for vacation_requests (optimized for allowance calculations)
-- ============================================================================

-- Composite index for user_id, status, and date range
-- Used for calculating used vacation days from APPROVED requests
-- Partial index: only indexes APPROVED requests to reduce index size
CREATE INDEX IF NOT EXISTS idx_vacation_requests_user_status_dates
ON vacation_requests(user_id, status, start_date, end_date)
WHERE status = 'APPROVED';

-- Comment on indexes
COMMENT ON INDEX idx_vacation_allowances_user_year IS
'Optimizes vacation allowances queries by user and year';

COMMENT ON INDEX idx_vacation_requests_user_status_dates IS
'Optimizes vacation days calculation from approved requests';

