-- Phase 9: harden the role-change audit table created by Phase 4.
-- Apply only after 20260927220000_phase4_roles_and_admin_audit.sql.
-- No data or columns are changed. Role changes remain available through
-- public.set_member_role(), a SECURITY DEFINER function owned by the DB owner.

do $$
begin
  if to_regclass('public.admin_action_logs') is null then
    raise exception 'Apply Phase 4 before Phase 9: public.admin_action_logs is missing.';
  end if;
end;
$$;

alter table public.admin_action_logs enable row level security;
revoke insert, update, delete on public.admin_action_logs from public, anon, authenticated;
grant select on public.admin_action_logs to authenticated;

drop policy if exists "admin_action_logs_select_for_authorized_roles" on public.admin_action_logs;
create policy "admin_action_logs_select_for_authorized_roles"
on public.admin_action_logs for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
  )
);

drop policy if exists "admin_action_logs_insert_for_authorized_roles" on public.admin_action_logs;

drop policy if exists "ida_phase9_admin_action_logs_restrict_select" on public.admin_action_logs;
create policy "ida_phase9_admin_action_logs_restrict_select"
on public.admin_action_logs as restrictive for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
  )
);

drop policy if exists "ida_phase9_admin_action_logs_deny_insert" on public.admin_action_logs;
create policy "ida_phase9_admin_action_logs_deny_insert"
on public.admin_action_logs as restrictive for insert to anon, authenticated
with check (false);

drop policy if exists "ida_phase9_admin_action_logs_deny_update" on public.admin_action_logs;
create policy "ida_phase9_admin_action_logs_deny_update"
on public.admin_action_logs as restrictive for update to anon, authenticated
using (false) with check (false);

drop policy if exists "ida_phase9_admin_action_logs_deny_delete" on public.admin_action_logs;
create policy "ida_phase9_admin_action_logs_deny_delete"
on public.admin_action_logs as restrictive for delete to anon, authenticated
using (false);

notify pgrst, 'reload schema';
