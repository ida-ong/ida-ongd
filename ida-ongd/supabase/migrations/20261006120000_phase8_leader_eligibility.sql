-- Phase 8: enforce the 20-person network threshold at the database boundary.
-- Uses the existing profiles.id, profiles.referred_by and profiles.role fields.
-- No table, column, policy, or stored data is created, dropped, or changed.

create or replace function public.enforce_leader_network_eligibility()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_network_count bigint;
begin
  if lower(coalesce(old.role, 'member')) <> 'leader'
    and lower(coalesce(new.role, 'member')) = 'leader' then
    with recursive network(member_id, path) as (
      select p.id, array[p.id]::uuid[]
      from public.profiles p
      where p.referred_by = old.id

      union all

      select child.id, network.path || child.id
      from public.profiles child
      join network on child.referred_by = network.member_id
      where not child.id = any(network.path)
    )
    select count(*) into v_network_count from network;

    if v_network_count < 20 then
      raise exception 'La nomination comme leader nécessite au moins 20 personnes dans le réseau.'
        using errcode = '22023';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_leader_network_eligibility() from public, anon, authenticated;

drop trigger if exists ida_enforce_leader_network_eligibility on public.profiles;
create trigger ida_enforce_leader_network_eligibility
before update of role on public.profiles
for each row execute function public.enforce_leader_network_eligibility();
