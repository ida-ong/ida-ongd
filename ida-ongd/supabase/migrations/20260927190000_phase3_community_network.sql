-- Phase 3: secure referral attribution and member-scoped community network.
-- Existing tables and RLS policies remain in place; this migration adds only
-- functions and triggers around the existing public.profiles table.

create or replace function public.get_referral_inviter(p_affiliate_code text)
returns table (first_name text, last_name text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.first_name::text, p.last_name::text
  from public.profiles as p
  where auth.role() in ('anon', 'authenticated')
    and p.affiliate_code = trim(p_affiliate_code)
    and p.id is distinct from auth.uid()
  limit 1;
$$;

revoke all on function public.get_referral_inviter(text) from public;
grant execute on function public.get_referral_inviter(text) to anon, authenticated;

create or replace function public.get_network_member_count()
returns bigint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with recursive network(member_id, path) as (
    select p.id, array[p.id]::uuid[]
    from public.profiles as p
    where auth.uid() is not null
      and p.referred_by = auth.uid()

    union all

    select child.id, network.path || child.id
    from public.profiles as child
    join network on child.referred_by = network.member_id
    where not child.id = any(network.path)
  )
  select count(*)::bigint from network;
$$;

revoke all on function public.get_network_member_count() from public;
grant execute on function public.get_network_member_count() to authenticated;

create or replace function public.get_my_network_stats()
returns table (
  network_count bigint,
  direct_count bigint,
  active_count bigint,
  neighborhood_count bigint,
  neighborhood_name text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with recursive network(member_id, depth, path) as (
    select p.id, 1, array[p.id]::uuid[]
    from public.profiles as p
    where auth.uid() is not null
      and p.referred_by = auth.uid()

    union all

    select child.id, network.depth + 1, network.path || child.id
    from public.profiles as child
    join network on child.referred_by = network.member_id
    where not child.id = any(network.path)
  ), stats as (
    select
      count(*)::bigint as network_count,
      count(*) filter (where network.depth = 1)::bigint as direct_count,
      count(*) filter (where p.is_active is true)::bigint as active_count,
      count(distinct p.neighborhood_id)::bigint as neighborhood_count
    from network
    join public.profiles as p on p.id = network.member_id
  )
  select
    stats.network_count,
    stats.direct_count,
    stats.active_count,
    stats.neighborhood_count,
    neighborhood.name::text
  from stats
  left join public.profiles as owner on owner.id = auth.uid()
  left join public.neighborhoods as neighborhood on neighborhood.id = owner.neighborhood_id;
$$;

revoke all on function public.get_my_network_stats() from public;
grant execute on function public.get_my_network_stats() to authenticated;

create or replace function public.get_my_network_members()
returns table (
  id uuid,
  referred_by uuid,
  first_name text,
  last_name text,
  neighborhood_name text,
  created_at timestamptz,
  is_active boolean,
  depth integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with recursive network(member_id, parent_id, depth, path) as (
    select p.id, p.referred_by, 1, array[p.id]::uuid[]
    from public.profiles as p
    where auth.uid() is not null
      and p.referred_by = auth.uid()

    union all

    select child.id, child.referred_by, network.depth + 1, network.path || child.id
    from public.profiles as child
    join network on child.referred_by = network.member_id
    where not child.id = any(network.path)
  )
  select
    p.id,
    p.referred_by,
    p.first_name::text,
    p.last_name::text,
    neighborhood.name::text,
    p.created_at,
    p.is_active,
    network.depth
  from network
  join public.profiles as p on p.id = network.member_id
  left join public.neighborhoods as neighborhood on neighborhood.id = p.neighborhood_id
  order by network.depth, p.created_at desc;
$$;

revoke all on function public.get_my_network_members() from public;
grant execute on function public.get_my_network_members() to authenticated;

-- Referral is accepted only from auth signup metadata, looked up against a
-- real affiliate code, and written to the initial profile row by this server-
-- side trigger. The browser never supplies a referred_by UUID.
create or replace function public.assign_initial_referrer_from_signup()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  requested_code text;
  inviter_id uuid;
begin
  select u.raw_user_meta_data ->> 'referral_code'
    into requested_code
  from auth.users as u
  where u.id = new.id;

  if requested_code is not null and btrim(requested_code) <> '' then
    select p.id
      into inviter_id
    from public.profiles as p
    where p.affiliate_code = btrim(requested_code)
      and p.id <> new.id
    limit 1;
  end if;

  -- Never trust a client-supplied referred_by metadata value. Only the
  -- inviter resolved from an existing affiliate_code is persisted.
  new.referred_by := inviter_id;

  return new;
end;
$$;

revoke all on function public.assign_initial_referrer_from_signup() from public, anon, authenticated;
drop trigger if exists ida_assign_initial_referrer on public.profiles;
create trigger ida_assign_initial_referrer
before insert on public.profiles
for each row execute function public.assign_initial_referrer_from_signup();

-- Keep role, referrer, affiliate code, member number, and assigned neighborhood
-- server-controlled, while allowing existing administrative workflows.
create or replace function public.guard_member_managed_profile_fields()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  actor_role text;
begin
  if auth.role() = 'service_role' or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  select lower(coalesce(p.role, 'member'))
    into actor_role
  from public.profiles as p
  where p.id = auth.uid();

  if coalesce(actor_role, 'member') not in ('admin', 'administrator', 'founder', 'fondateur') then
    if new.role is distinct from old.role
      or new.referred_by is distinct from old.referred_by
      or new.affiliate_code is distinct from old.affiliate_code
      or new.member_number is distinct from old.member_number
      or new.neighborhood_id is distinct from old.neighborhood_id then
      raise exception 'Les champs de rôle, de réseau et d’identification sont gérés par IDA.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.guard_member_managed_profile_fields() from public, anon, authenticated;
drop trigger if exists ida_guard_member_managed_profile_fields on public.profiles;
create trigger ida_guard_member_managed_profile_fields
before update of role, referred_by, affiliate_code, member_number, neighborhood_id
on public.profiles
for each row execute function public.guard_member_managed_profile_fields();

notify pgrst, 'reload schema';
