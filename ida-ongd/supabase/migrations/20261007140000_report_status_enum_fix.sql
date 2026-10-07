-- Extend the existing report_status enum with a state required by Phase 6.
-- Run this file by itself and let it finish before running the runtime repair
-- migration; PostgreSQL requires a commit before the new enum label is used.
ALTER TYPE public.report_status
  ADD VALUE IF NOT EXISTS 'correction_requested';

NOTIFY pgrst, 'reload schema';
