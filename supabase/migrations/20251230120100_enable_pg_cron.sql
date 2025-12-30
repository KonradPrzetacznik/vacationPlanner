-- =====================================================
-- Migration: Enable pg_cron Extension
-- Description: Enables the pg_cron extension for scheduled jobs
-- Notes: This must be run before scheduling cron jobs
-- =====================================================

-- Enable pg_cron extension for job scheduling
create extension if not exists pg_cron;

-- Verify installation
select
  extname as "Extension Name",
  extversion as "Version"
from pg_extension
where extname = 'pg_cron';

