-- Migration: Add indexes for vacation_requests to optimize calendar queries
-- Created: 2026-01-09
-- Description: Adds composite and single-column indexes for efficient vacation calendar queries

-- Composite index for user_id and date range queries
-- Used by team calendar to fetch vacations for team members within a date range
CREATE INDEX IF NOT EXISTS idx_vacation_requests_user_dates
ON vacation_requests(user_id, start_date, end_date);

-- Add comments for documentation
COMMENT ON INDEX idx_vacation_requests_user_dates IS
'Composite index for efficient user vacation lookups by date range';

COMMENT ON INDEX idx_vacation_requests_status IS
'Index for filtering vacation requests by status';

COMMENT ON INDEX idx_vacation_requests_dates IS
'Index for efficient date range overlap queries';

