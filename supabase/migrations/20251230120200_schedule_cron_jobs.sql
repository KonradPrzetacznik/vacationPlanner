-- =====================================================
-- Migration: Schedule pg_cron Jobs
-- Description: Creates scheduled jobs for vacation management automation
-- Jobs:
--   1. reset-carryover-days: Resets carryover days on April 1st
--   2. create-yearly-allowances: Creates allowances on January 1st
-- Dependencies: Requires pg_cron extension
-- =====================================================

-- =====================================================
-- Job 1: Reset carryover days on April 1st
-- =====================================================
-- Schedule: Every April 1st at 00:00 UTC
-- Purpose: Zero out carryover_days for the current year as per business rules
-- Cron format: '0 0 1 4 *' = minute 0, hour 0, day 1, month 4 (April), any day of week

select cron.schedule(
  'reset-carryover-days',
  '0 0 1 4 *',
  $$
    update vacation_allowances
    set carryover_days = 0,
        updated_at = now()
    where year = extract(year from current_date)::integer;
  $$
);

-- =====================================================
-- Job 2: Create new vacation allowances on January 1st
-- =====================================================
-- Schedule: Every January 1st at 00:00 UTC
-- Purpose: Auto-create vacation allowances for all active users for the new year
-- Cron format: '0 0 1 1 *' = minute 0, hour 0, day 1, month 1 (January), any day of week

select cron.schedule(
  'create-yearly-allowances',
  '0 0 1 1 *',
  $$
    insert into vacation_allowances (user_id, year, total_days, carryover_days)
    select
      p.id,
      extract(year from current_date)::integer,
      (select (value::text)::integer from settings where key = 'default_vacation_days'),
      0
    from profiles p
    where p.deleted_at is null
      and not exists (
        select 1
        from vacation_allowances va
        where va.user_id = p.id
          and va.year = extract(year from current_date)::integer
      );
  $$
);


