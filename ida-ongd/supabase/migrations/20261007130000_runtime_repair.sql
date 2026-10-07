-- ONGD IDA runtime repair for the React application.
-- Paste into Supabase SQL Editor and run as the database owner.
-- Idempotent for the structures managed here; does not drop tables or rows.
-- Payment note: this creates/repairs a private donation register only. It does
-- not create a payment provider, endpoint, webhook, or proof-of-payment flow.

begin;

-- Required existing identity table. We cannot safely manufacture identity IDs.
do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'public.profiles is missing. Restore/apply the project base profile migration before this repair.';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'id'
  ) then
    raise exception 'public.profiles.id is missing; refusing to guess or rewrite profile identities.';
  end if;
end;
$$;

-- Neighborhoods are queried by registration and mission assignment. An empty
-- table is safe: registration remains optional until official neighborhoods
-- are entered by the organization.
create table if not exists public.neighborhoods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.neighborhoods add column if not exists name text;
alter table public.neighborhoods add column if not exists is_active boolean not null default true;
alter table public.neighborhoods add column if not exists created_at timestamptz not null default now();
alter table public.neighborhoods add column if not exists updated_at timestamptz not null default now();

-- Profiles are keyed by the matching auth.users.id. Add only missing app fields.
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists whatsapp text;
alter table public.profiles add column if not exists role text not null default 'member';
alter table public.profiles add column if not exists member_number text;
alter table public.profiles add column if not exists affiliate_code text;
alter table public.profiles add column if not exists referred_by uuid;
alter table public.profiles add column if not exists neighborhood_id uuid;
alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists created_at timestamptz not null default now();

-- Add profile foreign keys only when compatible and not already present.
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and conname = 'profiles_referred_by_fkey') then
    alter table public.profiles add constraint profiles_referred_by_fkey
      foreign key (referred_by) references public.profiles(id) on delete set null not valid;
  end if;
  if to_regclass('public.neighborhoods') is not null
    and not exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and conname = 'profiles_neighborhood_id_fkey') then
    alter table public.profiles add constraint profiles_neighborhood_id_fkey
      foreign key (neighborhood_id) references public.neighborhoods(id) on delete set null not valid;
  end if;
end;
$$;
create index if not exists profiles_referred_by_idx on public.profiles (referred_by);
create index if not exists profiles_role_idx on public.profiles (role);

-- Role helper: SECURITY DEFINER avoids recursive profile-policy evaluation.
create or replace function public.ida_current_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select lower(coalesce(p.role::text, 'member')) from public.profiles p where p.id = auth.uid()
$$;
revoke all on function public.ida_current_role() from public;
grant execute on function public.ida_current_role() to anon, authenticated;

-- Minimal neighborhood read access; only authorized editors can manage rows.
alter table public.neighborhoods enable row level security;
revoke all on public.neighborhoods from public, anon, authenticated;
grant select on public.neighborhoods to anon, authenticated;
grant insert, update, delete on public.neighborhoods to authenticated;
drop policy if exists ida_runtime_neighborhoods_read_active on public.neighborhoods;
create policy ida_runtime_neighborhoods_read_active on public.neighborhoods
  for select to anon, authenticated using (is_active or public.ida_current_role() in ('admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_neighborhoods_manage on public.neighborhoods;
create policy ida_runtime_neighborhoods_manage on public.neighborhoods
  for all to authenticated
  using (public.ida_current_role() in ('admin','administrator','founder','fondateur'))
  with check (public.ida_current_role() in ('admin','administrator','founder','fondateur'));

-- Protect profile reads. Members can read their own profile; admin/founder can
-- read organization profiles. Profile role changes remain RPC-only below.
alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
drop policy if exists ida_runtime_profiles_read_authorized on public.profiles;
create policy ida_runtime_profiles_read_authorized on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.ida_current_role() in ('admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_profiles_restrict_read on public.profiles;
create policy ida_runtime_profiles_restrict_read on public.profiles as restrictive
  for select to authenticated
  using (id = auth.uid() or public.ida_current_role() in ('admin','administrator','founder','fondateur'));

-- Role transition audit.
create table if not exists public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  old_role text,
  new_role text,
  reason text,
  created_at timestamptz not null default now(),
  constraint admin_action_logs_action_check check (action in ('leader_nomination','leader_removal','admin_nomination','admin_removal'))
);
alter table public.admin_action_logs enable row level security;
revoke all on public.admin_action_logs from public, anon, authenticated;
grant select on public.admin_action_logs to authenticated;
drop policy if exists ida_runtime_admin_logs_read on public.admin_action_logs;
create policy ida_runtime_admin_logs_read on public.admin_action_logs
  for select to authenticated using (public.ida_current_role() in ('admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_admin_logs_restrict_read on public.admin_action_logs;
create policy ida_runtime_admin_logs_restrict_read on public.admin_action_logs as restrictive
  for select to authenticated using (public.ida_current_role() in ('admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_admin_logs_deny_insert on public.admin_action_logs;
create policy ida_runtime_admin_logs_deny_insert on public.admin_action_logs as restrictive
  for insert to anon, authenticated with check (false);
drop policy if exists ida_runtime_admin_logs_deny_update on public.admin_action_logs;
create policy ida_runtime_admin_logs_deny_update on public.admin_action_logs as restrictive
  for update to anon, authenticated using (false) with check (false);
drop policy if exists ida_runtime_admin_logs_deny_delete on public.admin_action_logs;
create policy ida_runtime_admin_logs_deny_delete on public.admin_action_logs as restrictive
  for delete to anon, authenticated using (false);

-- A controlled role RPC is the only browser-facing route to change roles.
create or replace function public.ida_guard_profile_managed_fields()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if current_setting('ida.role_change_authorized', true) = 'on'
    or auth.role() = 'service_role'
    or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;
  if new.role is distinct from old.role
    or new.referred_by is distinct from old.referred_by
    or new.affiliate_code is distinct from old.affiliate_code
    or new.member_number is distinct from old.member_number
    or new.neighborhood_id is distinct from old.neighborhood_id then
    raise exception 'Les champs de rôle, de réseau et d’identification sont gérés par IDA.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.ida_guard_profile_managed_fields() from public, anon, authenticated;
drop trigger if exists ida_runtime_guard_profile_fields on public.profiles;
create trigger ida_runtime_guard_profile_fields before update on public.profiles
  for each row execute function public.ida_guard_profile_managed_fields();

-- Earlier project phases may have installed this trigger function. Replace its
-- body so controlled RPC updates are allowed while direct client edits remain blocked.
create or replace function public.guard_role_fields()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if current_setting('ida.role_change_authorized', true) = 'on'
    or auth.role() = 'service_role'
    or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;
  if new.role is distinct from old.role
    or new.referred_by is distinct from old.referred_by
    or new.affiliate_code is distinct from old.affiliate_code
    or new.member_number is distinct from old.member_number then
    raise exception 'Ces champs sont protégés et ne peuvent pas être modifiés directement.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_role_fields() from public, anon, authenticated;

create or replace function public.set_member_role(p_target_id uuid, p_new_role text, p_reason text default null)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_role text;
  v_old_role text;
  v_new_role text := lower(trim(coalesce(p_new_role, '')));
  v_role_value text;
  v_action text;
  v_network_count bigint;
  v_role_type text;
  v_role_type_oid oid;
  v_target public.profiles;
begin
  if v_actor is null then raise exception 'Authentification requise.' using errcode = '42501'; end if;
  v_actor_role := public.ida_current_role();
  if v_actor_role not in ('admin','administrator','founder','fondateur') then
    raise exception 'Permissions insuffisantes.' using errcode = '42501';
  end if;
  if p_target_id is null or p_target_id = v_actor then
    raise exception 'Profil cible invalide; un utilisateur ne peut pas modifier son propre rôle.' using errcode = '42501';
  end if;
  if v_new_role not in ('member','leader','admin') then raise exception 'Rôle cible invalide.' using errcode = '22023'; end if;
  select p.* into v_target from public.profiles p where p.id = p_target_id for update;
  if not found then raise exception 'Profil cible introuvable.' using errcode = 'P0002'; end if;
  v_old_role := lower(coalesce(v_target.role::text, 'member'));
  if v_old_role in ('founder','fondateur') then raise exception 'Le compte fondateur est protégé.' using errcode = '42501'; end if;
  if v_old_role = v_new_role then raise exception 'Le profil possède déjà ce rôle.' using errcode = '22023'; end if;

  if v_actor_role in ('admin','administrator') then
    if v_new_role not in ('leader','member') or v_old_role not in ('member','leader') then
      raise exception 'Un administrateur ordinaire ne peut que nommer ou retirer un leader.' using errcode = '42501';
    end if;
  end if;

  if v_new_role = 'leader' then
    with recursive network(member_id, path) as (
      select p.id, array[p.id]::uuid[] from public.profiles p where p.referred_by = p_target_id
      union all
      select child.id, network.path || child.id from public.profiles child
      join network on child.referred_by = network.member_id
      where not child.id = any(network.path)
    ) select count(*) into v_network_count from network;
    if coalesce(v_network_count, 0) < 20 then
      raise exception 'La nomination comme leader nécessite au moins 20 personnes dans son réseau (actuellement %).', coalesce(v_network_count,0) using errcode = '22023';
    end if;
  end if;

  if v_actor_role in ('founder','fondateur') and v_new_role = 'admin' and v_old_role = 'member' then
    v_action := 'admin_nomination';
  elsif v_actor_role in ('founder','fondateur') and v_new_role = 'member' and v_old_role in ('admin','administrator') then
    v_action := 'admin_removal';
  elsif v_new_role = 'leader' and v_old_role = 'member' then
    v_action := 'leader_nomination';
  elsif v_new_role = 'member' and v_old_role = 'leader' then
    v_action := 'leader_removal';
  else
    raise exception 'Transition de rôle non autorisée.' using errcode = '42501';
  end if;

  perform set_config('ida.role_change_authorized', 'on', true);
  select format_type(a.atttypid, a.atttypmod), a.atttypid
    into v_role_type, v_role_type_oid
  from pg_attribute a
  where a.attrelid = 'public.profiles'::regclass
    and a.attname = 'role'
    and not a.attisdropped;
  if v_role_type is null then
    raise exception 'La colonne profiles.role est introuvable.' using errcode = '42703';
  end if;
  v_role_value := v_new_role;
  if exists (select 1 from pg_type t where t.oid = v_role_type_oid and t.typtype = 'e') then
    if not exists (select 1 from pg_enum e where e.enumtypid = v_role_type_oid and e.enumlabel = v_role_value) then
      if v_new_role = 'admin' and exists (select 1 from pg_enum e where e.enumtypid = v_role_type_oid and e.enumlabel = 'administrator') then
        v_role_value := 'administrator';
      else
        raise exception 'Le rôle « % » n’est pas défini dans le type enum de profiles.role.', v_new_role using errcode = '22023';
      end if;
    end if;
  end if;
  execute format('update public.profiles set role = $1::%s where id = $2 returning *', v_role_type)
    into v_target using v_role_value, p_target_id;
  insert into public.admin_action_logs(actor_id,target_user_id,action,old_role,new_role,reason)
  values (v_actor,p_target_id,v_action,v_old_role,v_new_role,nullif(trim(coalesce(p_reason,'')),''));
  return v_target;
end;
$$;
revoke all on function public.set_member_role(uuid,text,text) from public, anon;
grant execute on function public.set_member_role(uuid,text,text) to authenticated;

-- Public editorial tables. news and important_information may pre-exist with
-- legacy columns; add missing fields without deleting or replacing old data.
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(), title text not null default '',
  slug text, excerpt text not null default '', content text not null default '',
  image_url text, category text, author_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft', published_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.news add column if not exists title text not null default '';
alter table public.news add column if not exists slug text;
alter table public.news add column if not exists excerpt text not null default '';
alter table public.news add column if not exists content text not null default '';
alter table public.news add column if not exists image_url text;
alter table public.news add column if not exists category text;
alter table public.news add column if not exists author_id uuid;
alter table public.news add column if not exists status text not null default 'draft';
alter table public.news add column if not exists published_at timestamptz;
alter table public.news add column if not exists created_at timestamptz not null default now();
alter table public.news add column if not exists updated_at timestamptz not null default now();
update public.news set slug = 'news-' || id::text where slug is null or btrim(slug) = '';
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.news'::regclass and conname='ida_runtime_news_status_check') then
    alter table public.news add constraint ida_runtime_news_status_check check (status in ('draft','published','archived')) not valid;
  end if;
end $$;
do $$ begin
  if not exists (select slug from public.news group by slug having count(*) > 1) then
    create unique index if not exists ida_runtime_news_slug_uidx on public.news(slug);
  end if;
end $$;
create index if not exists ida_runtime_news_published_idx on public.news(published_at desc) where status='published';

create table if not exists public.public_actions (
  id uuid primary key default gen_random_uuid(), title text not null,
  description text not null, objective text not null, location text,
  date_action date, image_url text, status text not null default 'draft',
  published_at timestamptz, created_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.public_actions add column if not exists title text not null default '';
alter table public.public_actions add column if not exists description text not null default '';
alter table public.public_actions add column if not exists objective text not null default '';
alter table public.public_actions add column if not exists location text;
alter table public.public_actions add column if not exists date_action date;
alter table public.public_actions add column if not exists image_url text;
alter table public.public_actions add column if not exists status text not null default 'draft';
alter table public.public_actions add column if not exists published_at timestamptz;
alter table public.public_actions add column if not exists created_by uuid;
alter table public.public_actions add column if not exists created_at timestamptz not null default now();
alter table public.public_actions add column if not exists updated_at timestamptz not null default now();
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.public_actions'::regclass and conname='ida_runtime_public_actions_status_check') then
    alter table public.public_actions add constraint ida_runtime_public_actions_status_check check (status in ('draft','published','archived')) not valid;
  end if;
end $$;
create index if not exists ida_runtime_public_actions_published_idx on public.public_actions(published_at desc) where status='published';

create table if not exists public.important_information (
  id uuid primary key default gen_random_uuid(), title text not null,
  content text not null, priority text not null default 'normal', is_active boolean not null default false,
  status text not null default 'draft', published_at timestamptz,
  created_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.important_information add column if not exists title text not null default '';
alter table public.important_information add column if not exists content text not null default '';
alter table public.important_information add column if not exists priority text not null default 'normal';
alter table public.important_information add column if not exists is_active boolean not null default false;
alter table public.important_information add column if not exists status text not null default 'draft';
alter table public.important_information add column if not exists published_at timestamptz;
alter table public.important_information add column if not exists created_by uuid;
alter table public.important_information add column if not exists created_at timestamptz not null default now();
alter table public.important_information add column if not exists updated_at timestamptz not null default now();
update public.important_information set status='published', published_at=coalesce(published_at,created_at,now()) where is_active is true and status='draft';
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.important_information'::regclass and conname='ida_runtime_information_status_check') then
    alter table public.important_information add constraint ida_runtime_information_status_check check (status in ('draft','published','archived')) not valid;
  end if;
end $$;
create index if not exists ida_runtime_information_published_idx on public.important_information(published_at desc) where status='published';

create or replace function public.ida_touch_editorial_row()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
  new.updated_at := now();
  if tg_table_name='news' then
    if tg_op='UPDATE' then new.author_id := old.author_id; end if;
  else
    if tg_op='UPDATE' then new.created_by := old.created_by; end if;
    if tg_table_name='important_information' then new.is_active := (new.status='published'); end if;
  end if;
  if new.status='published' and (tg_op='INSERT' or old.status is distinct from 'published') then new.published_at := now(); end if;
  return new;
end;
$$;
revoke all on function public.ida_touch_editorial_row() from public,anon,authenticated;
drop trigger if exists ida_runtime_news_touch on public.news;
create trigger ida_runtime_news_touch before insert or update on public.news for each row execute function public.ida_touch_editorial_row();
drop trigger if exists ida_runtime_public_actions_touch on public.public_actions;
create trigger ida_runtime_public_actions_touch before insert or update on public.public_actions for each row execute function public.ida_touch_editorial_row();
drop trigger if exists ida_runtime_information_touch on public.important_information;
create trigger ida_runtime_information_touch before insert or update on public.important_information for each row execute function public.ida_touch_editorial_row();

-- Restrictive editorial policies prevent legacy permissive policies from
-- exposing drafts or granting anonymous writes. No anon write grant is made.
do $$ declare t text; policy_name text; begin
  foreach t in array array['news','public_actions','important_information'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public, anon, authenticated',t);
    execute format('grant select on public.%I to anon, authenticated',t);
    execute format('grant insert,update,delete on public.%I to authenticated',t);
    policy_name := 'ida_runtime_' || t || '_read';
    execute format('drop policy if exists %I on public.%I',policy_name,t);
    execute format('create policy %I on public.%I for select to anon,authenticated using (status=''published'' or (auth.uid() is not null and public.ida_current_role() in (''admin'',''administrator'',''founder'',''fondateur'')))',policy_name,t);
    policy_name := 'ida_runtime_' || t || '_restrict_read';
    execute format('drop policy if exists %I on public.%I',policy_name,t);
    execute format('create policy %I on public.%I as restrictive for select to anon,authenticated using (status=''published'' or (auth.uid() is not null and public.ida_current_role() in (''admin'',''administrator'',''founder'',''fondateur'')))',policy_name,t);
    policy_name := 'ida_runtime_' || t || '_insert';
    execute format('drop policy if exists %I on public.%I',policy_name,t);
    if t='news' then
      execute format('create policy %I on public.%I for insert to authenticated with check (author_id=auth.uid() and public.ida_current_role() in (''admin'',''administrator'',''founder'',''fondateur''))',policy_name,t);
    else
      execute format('create policy %I on public.%I for insert to authenticated with check ((created_by is null or created_by=auth.uid()) and public.ida_current_role() in (''admin'',''administrator'',''founder'',''fondateur''))',policy_name,t);
    end if;
    policy_name := 'ida_runtime_' || t || '_restrict_insert';
    execute format('drop policy if exists %I on public.%I',policy_name,t);
    if t='news' then
      execute format('create policy %I on public.%I as restrictive for insert to authenticated with check (author_id=auth.uid() and public.ida_current_role() in (''admin'',''administrator'',''founder'',''fondateur''))',policy_name,t);
    else
      execute format('create policy %I on public.%I as restrictive for insert to authenticated with check ((created_by is null or created_by=auth.uid()) and public.ida_current_role() in (''admin'',''administrator'',''founder'',''fondateur''))',policy_name,t);
    end if;
    policy_name := 'ida_runtime_' || t || '_update';
    execute format('drop policy if exists %I on public.%I',policy_name,t);
    execute format('create policy %I on public.%I for update to authenticated using (public.ida_current_role() in (''admin'',''administrator'',''founder'',''fondateur'')) with check (public.ida_current_role() in (''admin'',''administrator'',''founder'',''fondateur''))',policy_name,t);
    policy_name := 'ida_runtime_' || t || '_restrict_update';
    execute format('drop policy if exists %I on public.%I',policy_name,t);
    execute format('create policy %I on public.%I as restrictive for update to authenticated using (public.ida_current_role() in (''admin'',''administrator'',''founder'',''fondateur'')) with check (public.ida_current_role() in (''admin'',''administrator'',''founder'',''fondateur''))',policy_name,t);
    policy_name := 'ida_runtime_' || t || '_delete';
    execute format('drop policy if exists %I on public.%I',policy_name,t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.ida_current_role() in (''admin'',''administrator'',''founder'',''fondateur''))',policy_name,t);
    policy_name := 'ida_runtime_' || t || '_restrict_delete';
    execute format('drop policy if exists %I on public.%I',policy_name,t);
    execute format('create policy %I on public.%I as restrictive for delete to authenticated using (public.ida_current_role() in (''admin'',''administrator'',''founder'',''fondateur''))',policy_name,t);
  end loop;
end $$;

-- Missions and operational records used by dashboard/RPC calls.
create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(), title text not null,
  description text not null, objective text not null, location text,
  scheduled_date date, scheduled_time time, deadline date,
  leader_id uuid references public.profiles(id) on delete set null,
  neighborhood_id uuid references public.neighborhoods(id) on delete set null,
  status text not null default 'pending', created_by uuid not null references public.profiles(id) on delete restrict,
  accepted_at timestamptz, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(), title text not null,
  activity_type text not null, description text not null, activity_date date not null,
  location text, neighborhood_id uuid references public.neighborhoods(id) on delete set null,
  participants_count integer not null default 0, mission_id uuid references public.missions(id) on delete set null,
  leader_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(), mission_id uuid not null references public.missions(id) on delete restrict,
  leader_id uuid not null references public.profiles(id) on delete restrict,
  summary text not null, activities_done text not null, results text not null, difficulties text, recommendations text,
  participants_count integer not null default 0, performed_on date not null, observations text,
  status text not null default 'submitted', reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz, review_comment text, submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.report_history (
  id uuid primary key default gen_random_uuid(), report_id uuid not null references public.reports(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  action text not null, comment text, created_at timestamptz not null default now()
);

-- Repair partially-created operational tables without deleting existing rows.
alter table public.missions add column if not exists title text not null default '';
alter table public.missions add column if not exists description text not null default '';
alter table public.missions add column if not exists objective text not null default '';
alter table public.missions add column if not exists location text;
alter table public.missions add column if not exists scheduled_date date;
alter table public.missions add column if not exists scheduled_time time;
alter table public.missions add column if not exists deadline date;
alter table public.missions add column if not exists leader_id uuid;
alter table public.missions add column if not exists neighborhood_id uuid;
alter table public.missions add column if not exists status text not null default 'pending';
alter table public.missions add column if not exists created_by uuid;
alter table public.missions add column if not exists accepted_at timestamptz;
alter table public.missions add column if not exists completed_at timestamptz;
alter table public.missions add column if not exists created_at timestamptz not null default now();
alter table public.missions add column if not exists updated_at timestamptz not null default now();
alter table public.activities add column if not exists title text not null default '';
alter table public.activities add column if not exists activity_type text not null default 'other';
alter table public.activities add column if not exists description text not null default '';
alter table public.activities add column if not exists activity_date date not null default current_date;
alter table public.activities add column if not exists location text;
alter table public.activities add column if not exists neighborhood_id uuid;
alter table public.activities add column if not exists participants_count integer not null default 0;
alter table public.activities add column if not exists mission_id uuid;
alter table public.activities add column if not exists leader_id uuid;
alter table public.activities add column if not exists created_at timestamptz not null default now();
alter table public.activities add column if not exists updated_at timestamptz not null default now();
alter table public.reports add column if not exists mission_id uuid;
alter table public.reports add column if not exists leader_id uuid;
alter table public.reports add column if not exists summary text not null default '';
alter table public.reports add column if not exists activities_done text not null default '';
alter table public.reports add column if not exists results text not null default '';
alter table public.reports add column if not exists difficulties text;
alter table public.reports add column if not exists recommendations text;
alter table public.reports add column if not exists participants_count integer not null default 0;
alter table public.reports add column if not exists performed_on date not null default current_date;
alter table public.reports add column if not exists observations text;
alter table public.reports add column if not exists status text not null default 'submitted';
alter table public.reports add column if not exists reviewed_by uuid;
alter table public.reports add column if not exists reviewed_at timestamptz;
alter table public.reports add column if not exists review_comment text;
alter table public.reports add column if not exists submitted_at timestamptz not null default now();
alter table public.reports add column if not exists created_at timestamptz not null default now();
alter table public.reports add column if not exists updated_at timestamptz not null default now();
alter table public.report_history add column if not exists report_id uuid;
alter table public.report_history add column if not exists actor_id uuid;
alter table public.report_history add column if not exists action text not null default 'event';
alter table public.report_history add column if not exists comment text;
alter table public.report_history add column if not exists created_at timestamptz not null default now();

-- Named foreign keys are required by the embedded PostgREST selects.
do $$ begin
  if not exists(select 1 from pg_constraint where conrelid='public.missions'::regclass and conname='missions_leader_id_fkey') then
    alter table public.missions add constraint missions_leader_id_fkey foreign key(leader_id) references public.profiles(id) on delete set null not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.missions'::regclass and conname='missions_created_by_fkey') then
    alter table public.missions add constraint missions_created_by_fkey foreign key(created_by) references public.profiles(id) on delete restrict not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.missions'::regclass and conname='missions_neighborhood_id_fkey') then
    alter table public.missions add constraint missions_neighborhood_id_fkey foreign key(neighborhood_id) references public.neighborhoods(id) on delete set null not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.activities'::regclass and conname='activities_leader_id_fkey') then
    alter table public.activities add constraint activities_leader_id_fkey foreign key(leader_id) references public.profiles(id) on delete restrict not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.activities'::regclass and conname='activities_mission_id_fkey') then
    alter table public.activities add constraint activities_mission_id_fkey foreign key(mission_id) references public.missions(id) on delete set null not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.activities'::regclass and conname='activities_neighborhood_id_fkey') then
    alter table public.activities add constraint activities_neighborhood_id_fkey foreign key(neighborhood_id) references public.neighborhoods(id) on delete set null not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.reports'::regclass and conname='reports_leader_id_fkey') then
    alter table public.reports add constraint reports_leader_id_fkey foreign key(leader_id) references public.profiles(id) on delete restrict not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.reports'::regclass and conname='reports_reviewed_by_fkey') then
    alter table public.reports add constraint reports_reviewed_by_fkey foreign key(reviewed_by) references public.profiles(id) on delete set null not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.reports'::regclass and conname='reports_mission_id_fkey') then
    alter table public.reports add constraint reports_mission_id_fkey foreign key(mission_id) references public.missions(id) on delete restrict not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.report_history'::regclass and conname='report_history_actor_id_fkey') then
    alter table public.report_history add constraint report_history_actor_id_fkey foreign key(actor_id) references public.profiles(id) on delete restrict not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.report_history'::regclass and conname='report_history_report_id_fkey') then
    alter table public.report_history add constraint report_history_report_id_fkey foreign key(report_id) references public.reports(id) on delete cascade not valid;
  end if;
end $$;

create index if not exists ida_runtime_missions_leader_idx on public.missions(leader_id,status);
create index if not exists ida_runtime_activities_leader_idx on public.activities(leader_id,activity_date desc);
create index if not exists ida_runtime_reports_leader_idx on public.reports(leader_id,status);
create index if not exists ida_runtime_reports_mission_idx on public.reports(mission_id);
create index if not exists ida_runtime_report_history_report_idx on public.report_history(report_id,created_at desc);

create or replace function public.ida_touch_updated_at()
returns trigger language plpgsql set search_path=public,pg_temp as $$ begin new.updated_at:=now(); return new; end $$;
revoke all on function public.ida_touch_updated_at() from public,anon,authenticated;
drop trigger if exists ida_runtime_missions_touch on public.missions;
create trigger ida_runtime_missions_touch before update on public.missions for each row execute function public.ida_touch_updated_at();
drop trigger if exists ida_runtime_activities_touch on public.activities;
create trigger ida_runtime_activities_touch before update on public.activities for each row execute function public.ida_touch_updated_at();
drop trigger if exists ida_runtime_reports_touch on public.reports;
create trigger ida_runtime_reports_touch before update on public.reports for each row execute function public.ida_touch_updated_at();

-- Keep privileges narrow; RPCs perform writes after checking the actor role.
do $$ declare t text; begin
  foreach t in array array['missions','activities','reports','report_history'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
  end loop;
  grant insert,update on public.missions to authenticated;
  grant insert,update on public.activities to authenticated;
  grant insert,update on public.reports to authenticated;
end $$;

drop policy if exists ida_runtime_missions_read on public.missions;
create policy ida_runtime_missions_read on public.missions for select to authenticated
  using (leader_id=auth.uid() or public.ida_current_role() in ('admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_missions_restrict_read on public.missions;
create policy ida_runtime_missions_restrict_read on public.missions as restrictive for select to authenticated
  using (leader_id=auth.uid() or public.ida_current_role() in ('admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_missions_admin_write on public.missions;
create policy ida_runtime_missions_admin_write on public.missions for all to authenticated
  using (public.ida_current_role() in ('admin','administrator','founder','fondateur'))
  with check (public.ida_current_role() in ('admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_missions_restrict_write on public.missions;
create policy ida_runtime_missions_restrict_write on public.missions as restrictive for insert to authenticated
  with check (public.ida_current_role() in ('admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_missions_restrict_update on public.missions;
create policy ida_runtime_missions_restrict_update on public.missions as restrictive for update to authenticated
  using (public.ida_current_role() in ('admin','administrator','founder','fondateur'))
  with check (public.ida_current_role() in ('admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_missions_restrict_delete on public.missions;
create policy ida_runtime_missions_restrict_delete on public.missions as restrictive for delete to authenticated
  using (public.ida_current_role() in ('admin','administrator','founder','fondateur'));

drop policy if exists ida_runtime_activities_read on public.activities;
create policy ida_runtime_activities_read on public.activities for select to authenticated
  using (leader_id=auth.uid() or public.ida_current_role() in ('admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_activities_restrict_read on public.activities;
create policy ida_runtime_activities_restrict_read on public.activities as restrictive for select to authenticated
  using (leader_id=auth.uid() or public.ida_current_role() in ('admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_activities_insert on public.activities;
create policy ida_runtime_activities_insert on public.activities for insert to authenticated
  with check (leader_id=auth.uid() and public.ida_current_role() in ('leader','admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_activities_update on public.activities;
create policy ida_runtime_activities_update on public.activities for update to authenticated
  using (leader_id=auth.uid() or public.ida_current_role() in ('admin','administrator','founder','fondateur'))
  with check (leader_id=auth.uid() or public.ida_current_role() in ('admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_activities_restrict_insert on public.activities;
create policy ida_runtime_activities_restrict_insert on public.activities as restrictive for insert to authenticated
  with check (leader_id=auth.uid() and public.ida_current_role() in ('leader','admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_activities_restrict_update on public.activities;
create policy ida_runtime_activities_restrict_update on public.activities as restrictive for update to authenticated
  using (leader_id=auth.uid() or public.ida_current_role() in ('admin','administrator','founder','fondateur'))
  with check (leader_id=auth.uid() or public.ida_current_role() in ('admin','administrator','founder','fondateur'));

drop policy if exists ida_runtime_reports_read on public.reports;
create policy ida_runtime_reports_read on public.reports for select to authenticated
  using (leader_id=auth.uid() or public.ida_current_role() in ('admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_reports_restrict_read on public.reports;
create policy ida_runtime_reports_restrict_read on public.reports as restrictive for select to authenticated
  using (leader_id=auth.uid() or public.ida_current_role() in ('admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_reports_insert on public.reports;
create policy ida_runtime_reports_insert on public.reports for insert to authenticated
  with check (leader_id=auth.uid() and public.ida_current_role() in ('leader','admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_reports_update on public.reports;
create policy ida_runtime_reports_update on public.reports for update to authenticated
  using ((leader_id=auth.uid() and status::text in ('submitted','correction_requested','rejected','resubmitted')) or public.ida_current_role() in ('admin','administrator','founder','fondateur'))
  with check ((leader_id=auth.uid() and status::text in ('submitted','correction_requested','rejected','resubmitted')) or public.ida_current_role() in ('admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_reports_restrict_insert on public.reports;
create policy ida_runtime_reports_restrict_insert on public.reports as restrictive for insert to authenticated
  with check (leader_id=auth.uid() and public.ida_current_role() in ('leader','admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_reports_restrict_update on public.reports;
create policy ida_runtime_reports_restrict_update on public.reports as restrictive for update to authenticated
  using ((leader_id=auth.uid() and status::text in ('submitted','correction_requested','rejected','resubmitted')) or public.ida_current_role() in ('admin','administrator','founder','fondateur'))
  with check ((leader_id=auth.uid() and status::text in ('submitted','correction_requested','rejected','resubmitted')) or public.ida_current_role() in ('admin','administrator','founder','fondateur'));

drop policy if exists ida_runtime_history_read on public.report_history;
create policy ida_runtime_history_read on public.report_history for select to authenticated
  using (exists(select 1 from public.reports r where r.id=report_history.report_id and (r.leader_id=auth.uid() or public.ida_current_role() in ('admin','administrator','founder','fondateur'))));
drop policy if exists ida_runtime_history_restrict_read on public.report_history;
create policy ida_runtime_history_restrict_read on public.report_history as restrictive for select to authenticated
  using (exists(select 1 from public.reports r where r.id=report_history.report_id and (r.leader_id=auth.uid() or public.ida_current_role() in ('admin','administrator','founder','fondateur'))));
drop policy if exists ida_runtime_history_deny_client_write on public.report_history;
create policy ida_runtime_history_deny_client_write on public.report_history as restrictive for insert to anon,authenticated with check(false);

create or replace function public.create_mission(
  p_title text, p_description text, p_objective text,
  p_location text default null, p_scheduled_date date default null,
  p_scheduled_time time default null, p_deadline date default null,
  p_leader_id uuid default null, p_neighborhood_id uuid default null
) returns public.missions
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_result public.missions;
begin
  if auth.uid() is null or public.ida_current_role() not in ('admin','administrator','founder','fondateur') then
    raise exception 'Permissions insuffisantes.' using errcode='42501';
  end if;
  if p_leader_id is null or not exists(select 1 from public.profiles p where p.id=p_leader_id and lower(coalesce(p.role::text,'member'))='leader') then
    raise exception 'Le leader sélectionné est invalide.' using errcode='22023';
  end if;
  if p_deadline is not null and p_scheduled_date is not null and p_deadline < p_scheduled_date then
    raise exception 'La date limite doit être postérieure ou égale à la date prévue.' using errcode='22023';
  end if;
  insert into public.missions(title,description,objective,location,scheduled_date,scheduled_time,deadline,leader_id,neighborhood_id,status,created_by)
  values(btrim(p_title),p_description,p_objective,nullif(btrim(coalesce(p_location,'')),''),p_scheduled_date,p_scheduled_time,p_deadline,p_leader_id,p_neighborhood_id,'assigned',auth.uid())
  returning * into v_result;
  return v_result;
end $$;
revoke all on function public.create_mission(text,text,text,text,date,time,date,uuid,uuid) from public,anon;
grant execute on function public.create_mission(text,text,text,text,date,time,date,uuid,uuid) to authenticated;

create or replace function public.update_mission_status(p_mission_id uuid,p_status text)
returns public.missions language plpgsql security definer set search_path=public,pg_temp as $$
declare v_mission public.missions; v_result public.missions;
begin
  if public.ida_current_role()<>'leader' then raise exception 'Permissions insuffisantes.' using errcode='42501'; end if;
  select * into v_mission from public.missions where id=p_mission_id and leader_id=auth.uid() for update;
  if not found then raise exception 'Mission inaccessible.' using errcode='42501'; end if;
  if p_status not in ('in_progress','completed') then raise exception 'Transition non autorisée.' using errcode='42501'; end if;
  if p_status='in_progress' and v_mission.status<>'assigned' then raise exception 'La mission doit être assignée avant de commencer.' using errcode='22023'; end if;
  if p_status='completed' and v_mission.status<>'in_progress' then raise exception 'La mission doit être en cours avant d’être réalisée.' using errcode='22023'; end if;
  update public.missions set status=p_status,accepted_at=coalesce(accepted_at,now()),completed_at=case when p_status='completed' then now() else completed_at end where id=p_mission_id returning * into v_result;
  return v_result;
end $$;
revoke all on function public.update_mission_status(uuid,text) from public,anon;
grant execute on function public.update_mission_status(uuid,text) to authenticated;

-- Private donation register for records entered by a future trusted server.
-- Existing rows are retained; client/anon roles receive read-only denial.
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'USD',
  status text not null default 'pending',
  donor_name text,
  payment_method text,
  created_at timestamptz not null default now()
);
alter table public.donations add column if not exists amount numeric(12,2);
alter table public.donations add column if not exists currency text not null default 'USD';
alter table public.donations add column if not exists status text not null default 'pending';
alter table public.donations add column if not exists donor_name text;
alter table public.donations add column if not exists payment_method text;
alter table public.donations add column if not exists created_at timestamptz not null default now();
alter table public.donations enable row level security;
revoke all on public.donations from public,anon,authenticated;
grant select on public.donations to authenticated;
drop policy if exists ida_runtime_donations_admin_read on public.donations;
create policy ida_runtime_donations_admin_read on public.donations for select to authenticated
  using (public.ida_current_role() in ('admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_donations_admin_restrict_read on public.donations;
create policy ida_runtime_donations_admin_restrict_read on public.donations as restrictive for select to authenticated
  using (public.ida_current_role() in ('admin','administrator','founder','fondateur'));
drop policy if exists ida_runtime_donations_deny_client_insert on public.donations;
create policy ida_runtime_donations_deny_client_insert on public.donations as restrictive for insert to anon,authenticated with check(false);
drop policy if exists ida_runtime_donations_deny_client_update on public.donations;
create policy ida_runtime_donations_deny_client_update on public.donations as restrictive for update to anon,authenticated using(false) with check(false);
drop policy if exists ida_runtime_donations_deny_client_delete on public.donations;
create policy ida_runtime_donations_deny_client_delete on public.donations as restrictive for delete to anon,authenticated using(false);

notify pgrst, 'reload schema';
commit;