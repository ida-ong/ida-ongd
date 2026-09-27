-- Phase 4: protected role transitions and minimal audit log
-- Execute this SQL in the Supabase SQL editor.

create table if not exists public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in (
    'leader_nomination',
    'leader_removal',
    'admin_nomination',
    'admin_removal'
  )),
  old_role text,
  new_role text,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.admin_action_logs enable row level security;

create policy "admin_action_logs_select_for_authorized_roles"
on public.admin_action_logs for select
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('leader', 'admin', 'administrator', 'founder', 'fondateur')
  )
);

create policy "admin_action_logs_insert_for_authorized_roles"
on public.admin_action_logs for insert
with check (
  actor_id = auth.uid()
  and exists (
    select 1
    from public.profiles as p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
  )
);

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
  v_actor_role text;
  v_target_role text;
  v_action text;
  v_old_role text;
  v_new_role text;
  v_target public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  select lower(coalesce(role, 'member'))
    into v_actor_role
  from public.profiles
  where id = auth.uid();

  if v_actor_role is null then
    raise exception 'Compte utilisateur introuvable.' using errcode = '42501';
  end if;

  if p_target_id is null then
    raise exception 'Identifiant du membre obligatoire.' using errcode = '42501';
  end if;

  select lower(coalesce(role, 'member'))
    into v_target_role
  from public.profiles
  where id = p_target_id;

  if v_target_role is null then
    raise exception 'Membre cible introuvable.' using errcode = '42501';
  end if;

  v_new_role := lower(trim(coalesce(p_new_role, 'member')));
  if v_new_role not in ('member', 'leader', 'admin', 'founder') then
    raise exception 'Rôle non autorisé.' using errcode = '42501';
  end if;

  if p_target_id = auth.uid() then
    raise exception 'Un utilisateur ne peut pas modifier son propre rôle.' using errcode = '42501';
  end if;

  if v_target_role = 'founder' or v_target_role = 'fondateur' then
    raise exception 'Le compte fondateur est protégé.' using errcode = '42501';
  end if;

  if v_actor_role in ('admin', 'administrator') then
    if v_new_role in ('admin', 'founder') then
      raise exception 'Les administrateurs ne peuvent pas promouvoir un autre administrateur ni se promouvoir fondateur.' using errcode = '42501';
    end if;

    if v_target_role not in ('member', 'leader') then
      raise exception 'Un administrateur ne peut gérer que les membres et les leaders.' using errcode = '42501';
    end if;
  end if;

  if v_actor_role not in ('founder', 'fondateur', 'admin', 'administrator') then
    raise exception 'Permissions insuffisantes pour modifier un rôle.' using errcode = '42501';
  end if;

  if v_actor_role in ('admin', 'administrator') and v_new_role = 'leader' and v_target_role = 'member' then
    v_action := 'leader_nomination';
  elsif v_actor_role in ('admin', 'administrator') and v_new_role = 'member' and v_target_role = 'leader' then
    v_action := 'leader_removal';
  elsif v_actor_role in ('founder', 'fondateur') and v_new_role = 'admin' and v_target_role = 'member' then
    v_action := 'admin_nomination';
  elsif v_actor_role in ('founder', 'fondateur') and v_new_role = 'member' and v_target_role = 'admin' then
    v_action := 'admin_removal';
  else
    v_action := 'leader_nomination';
  end if;

  perform set_config('ida.role_change_authorized', 'on', true);
  update public.profiles
    set role = v_new_role
  where id = p_target_id
  returning *
    into v_target;

  v_old_role := lower(coalesce(v_target_role, 'member'));

  insert into public.admin_action_logs (
    actor_id,
    target_user_id,
    action,
    old_role,
    new_role,
    reason
  ) values (
    auth.uid(),
    p_target_id,
    v_action,
    v_old_role,
    v_new_role,
    p_reason
  );

  return v_target;
end;
$$;

revoke all on function public.set_member_role(uuid, text, text) from public;
grant execute on function public.set_member_role(uuid, text, text) to authenticated;

create or replace function public.guard_role_fields()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_role text;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  select lower(coalesce(role, 'member'))
    into v_actor_role
  from public.profiles
  where id = auth.uid();

  if v_actor_role is null or v_actor_role not in ('member', 'leader', 'admin', 'administrator', 'founder', 'fondateur') then
    raise exception 'Profil utilisateur non autorisé.' using errcode = '42501';
  end if;

  if v_actor_role not in ('founder', 'fondateur') then
    if new.role is distinct from old.role
      or new.referred_by is distinct from old.referred_by
      or new.affiliate_code is distinct from old.affiliate_code
      or new.member_number is distinct from old.member_number then
      raise exception 'Ces champs sont protégés et ne peuvent pas être modifiés par le frontend.' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.guard_role_fields() from public, anon, authenticated;

drop trigger if exists ida_guard_role_fields on public.profiles;
create trigger ida_guard_role_fields
before update on public.profiles
for each row
when (old.role is distinct from new.role or old.referred_by is distinct from new.referred_by or old.affiliate_code is distinct from new.affiliate_code or old.member_number is distinct from new.member_number)
execute function public.guard_role_fields();
