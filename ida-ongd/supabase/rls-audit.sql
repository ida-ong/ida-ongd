-- Read-only verification queries to run in Supabase SQL Editor after migrations.
-- These queries inspect schema, constraints and policies only; they return no
-- member, report, donation or publication records.

-- 1) Tables, RLS state and FORCE RLS state.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and c.relname in (
    'profiles', 'neighborhoods', 'news', 'public_actions', 'important_information',
    'activities', 'missions', 'reports', 'report_history', 'admin_action_logs', 'donations'
  )
order by c.relname;

-- 2) Policies for the same application tables.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles', 'neighborhoods', 'news', 'public_actions', 'important_information',
    'activities', 'missions', 'reports', 'report_history', 'admin_action_logs', 'donations'
  )
order by tablename, cmd, policyname;

-- 3) Column names/types/nullability on the public-content and donation tables.
select table_name, ordinal_position, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'profiles', 'neighborhoods', 'missions', 'mission_assignments', 'activities',
    'reports', 'report_history', 'admin_action_logs', 'news', 'public_actions',
    'important_information', 'donations'
  )
order by table_name, ordinal_position;

-- 4) Foreign keys and other table constraints (including assignment relations).
select
  conrelid::regclass as table_name,
  conname,
  contype,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where connamespace = 'public'::regnamespace
  and conrelid in (
    to_regclass('public.profiles'), to_regclass('public.missions'),
    to_regclass('public.mission_assignments'), to_regclass('public.activities'),
    to_regclass('public.reports'), to_regclass('public.report_history'),
    to_regclass('public.admin_action_logs'), to_regclass('public.news'),
    to_regclass('public.public_actions'), to_regclass('public.important_information'),
    to_regclass('public.donations')
  )
order by conrelid::regclass::text, conname;

-- 5) Check constraints that define content and payment state values.
select
  conrelid::regclass as table_name,
  conname,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where connamespace = 'public'::regnamespace
  and conrelid in (
    to_regclass('public.news'),
    to_regclass('public.public_actions'),
    to_regclass('public.important_information'),
    to_regclass('public.donations')
  )
order by conrelid::regclass::text, conname;

-- 6) Triggers attached to the application tables.
select
  event_object_table as table_name,
  trigger_name,
  event_manipulation,
  action_timing,
  action_orientation,
  action_statement
from information_schema.triggers
where trigger_schema = 'public'
  and event_object_table in (
    'profiles', 'missions', 'mission_assignments', 'activities', 'reports',
    'report_history', 'admin_action_logs', 'news', 'public_actions',
    'important_information', 'donations'
  )
order by event_object_table, trigger_name, event_manipulation;

-- 7) Security and EXECUTE grants for application RPCs.
select
  p.oid::regprocedure as function_name,
  p.prosecdef as security_definer,
  p.proconfig as function_settings,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'get_referral_inviter', 'get_network_member_count', 'get_my_network_stats',
    'get_my_network_members', 'set_member_role', 'create_mission', 'update_mission_status',
    'create_activity', 'create_report', 'review_report', 'validate_report',
    'request_report_correction', 'reject_report', 'resubmit_report', 'record_report_history'
  )
order by p.proname;
