-- Phase 10: repair founder/admin role nomination on the existing profiles table.
-- Verified against PostgREST: profiles.id and profiles.role exist; the current
-- project does not expose set_member_role() or admin_action_logs.
-- Apply in Supabase SQL Editor after confirming the target project.

begin;

create table if not exists public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in (
    'leader_nomination', 'leader_removal', 'admin_nomination', 'admin_removal'
  )),
  old_role text,
  new_role text,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.admin_action_logs enable row level security;
revoke all on public.admin_action_logs from public, anon, authenticated;
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

drop policy if exists "ida_phase10_admin_action_logs_restrict_select" on public.admin_action_logs;
create policy "ida_phase10_admin_action_logs_restrict_select"
on public.admin_action_logs as restrictive for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
  )
);

drop policy if exists "admin_action_logs_insert_for_authorized_roles" on public.admin_action_logs;
on public.admin_action_logs as restrictive for insert to anon, authenticated
with check (false);
drop policy if exists "ida_phase10_admin_action_logs_deny_update" on public.admin_action_logs;
on public.admin_action_logs as restrictive for update to anon, authenticated
using (false) with check (false);
drop policy if exists "ida_phase10_admin_action_logs_deny_delete" on public.admin_action_logs;
on public.admin_action_logs as restrictive for delete to anon, authenticated
using (false);
create or replace function public.set_member_role(
  p_target_id uuid,
  p_new_role text,
  p_reason text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role text;
  v_target public.profiles;
  v_old_role text;
  v_new_role text := lower(trim(coalesce(p_new_role, '')));
  v_action text;
  v_network_count bigint;
begin
  if v_actor_id is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  select lower(coalesce(p.role, 'member'))
    into v_actor_role
  from public.profiles p
  where p.id = v_actor_id;

  if v_actor_role is null or v_actor_role not in ('admin', 'administrator', 'founder', 'fondateur') then
    raise exception 'Seuls un administrateur ou le fondateur peuvent modifier les rôles.' using errcode = '42501';
  end if;
  if p_target_id is null then
    raise exception 'Identifiant du profil cible obligatoire.' using errcode = '22023';
  end if;
  if p_target_id = v_actor_id then
    raise exception 'Vous ne pouvez pas modifier votre propre rôle.' using errcode = '42501';
  end if;
  if v_new_role not in ('member', 'leader', 'admin') then
    raise exception 'Rôle cible invalide.' using errcode = '22023';
  end if;

  select p.* into v_target
  from public.profiles p
  where p.id = p_target_id
  for update;
  if not found then
    raise exception 'Le profil cible est introuvable.' using errcode = 'P0002';
  end if;

  v_old_role := lower(coalesce(v_target.role, 'member'));
  if v_old_role in ('founder', 'fondateur') then
    raise exception 'Le compte fondateur est protégé.' using errcode = '42501';
  end if;
  if v_old_role = v_new_role then
    raise exception 'Le profil possède déjà ce rôle.' using errcode = '22023';
  end if;

  if v_actor_role in ('admin', 'administrator') then
    if v_new_role not in ('leader', 'member') or v_old_role not in ('member', 'leader') then
      raise exception 'Un administrateur ordinaire peut uniquement nommer ou retirer un leader.' using errcode = '42501';
    end if;
  end if;

  if v_new_role = 'leader' then
    with recursive network(member_id, path) as (
      select p.id, array[p.id]::uuid[]
      from public.profiles p
      where p.referred_by = p_target_id
      union all
      select child.id, network.path || child.id
      from public.profiles child
      join network on child.referred_by = network.member_id
      where not child.id = any(network.path)
    )
    select count(*) into v_network_count from network;

    if coalesce(v_network_count, 0) < 20 then
      raise exception 'La nomination comme leader nécessite au moins 20 personnes dans son réseau (actuellement %).', coalesce(v_network_count, 0)
        using errcode = '22023';
    end if;
  end if;

  if v_new_role = 'admin' and v_actor_role in ('founder', 'fondateur') and v_old_role = 'member' then
    v_action := 'admin_nomination';
  elsif v_new_role = 'member' and v_old_role in ('admin', 'administrator') and v_actor_role in ('founder', 'fondateur') then
    v_action := 'admin_removal';
  elsif v_new_role = 'leader' and v_old_role = 'member' then
    v_action := 'leader_nomination';
  elsif v_new_role = 'member' and v_old_role = 'leader' then
    v_action := 'leader_removal';
  else
    raise exception 'Transition de rôle non autorisée.' using errcode = '42501';
  end if;

  -- Allows the existing profile guard trigger to recognize this controlled RPC.
  perform set_config('ida.role_change_authorized', 'on', true);
  update public.profiles set role = v_new_role where id = p_target_id returning * into v_target;

  insert into public.admin_action_logs (actor_id, target_user_id, action, old_role, new_role, reason)
  values (v_actor_id, p_target_id, v_action, v_old_role, v_new_role, nullif(trim(coalesce(p_reason, '')), ''));

  return v_target;
end;
$$;

revoke all on function public.set_member_role(uuid, text, text) from public, anon;
grant execute on function public.set_member_role(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
commit;
