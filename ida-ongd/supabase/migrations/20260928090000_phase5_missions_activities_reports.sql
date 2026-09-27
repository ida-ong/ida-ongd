-- Phase 5: missions, community activities and leader reports.
-- Apply this migration in Supabase SQL Editor after the Phase 3 and Phase 4 migrations.
-- It creates no service credentials and keeps RLS enabled on every new table.

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 180),
  description text not null,
  objective text not null,
  location text,
  scheduled_date date,
  scheduled_time time,
  deadline date,
  leader_id uuid references public.profiles(id) on delete set null,
  neighborhood_id uuid references public.neighborhoods(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 180),
  activity_type text not null check (activity_type in ('meeting', 'awareness', 'mobilization', 'community_visit', 'education', 'protection', 'empowerment', 'other')),
  description text not null,
  activity_date date not null,
  location text,
  neighborhood_id uuid references public.neighborhoods(id) on delete set null,
  participants_count integer not null default 0 check (participants_count >= 0),
  mission_id uuid references public.missions(id) on delete set null,
  leader_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete restrict,
  leader_id uuid not null references public.profiles(id) on delete restrict,
  summary text not null,
  activities_done text not null,
  results text not null,
  difficulties text,
  recommendations text,
  participants_count integer not null default 0 check (participants_count >= 0),
  performed_on date not null,
  observations text,
  status text not null default 'submitted' check (status in ('submitted', 'under_review', 'approved', 'rejected', 'needs_revision')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_comment text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists missions_leader_status_idx on public.missions (leader_id, status);
create index if not exists missions_created_by_idx on public.missions (created_by, created_at desc);
create index if not exists activities_leader_date_idx on public.activities (leader_id, activity_date desc);
create index if not exists reports_leader_status_idx on public.reports (leader_id, status);
create index if not exists reports_mission_idx on public.reports (mission_id);

create or replace function public.set_phase5_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_phase5_updated_at() from public, anon, authenticated;

drop trigger if exists ida_missions_updated_at on public.missions;
create trigger ida_missions_updated_at before update on public.missions for each row execute function public.set_phase5_updated_at();
drop trigger if exists ida_activities_updated_at on public.activities;
create trigger ida_activities_updated_at before update on public.activities for each row execute function public.set_phase5_updated_at();
drop trigger if exists ida_reports_updated_at on public.reports;
create trigger ida_reports_updated_at before update on public.reports for each row execute function public.set_phase5_updated_at();

alter table public.missions enable row level security;
alter table public.activities enable row level security;
alter table public.reports enable row level security;

drop policy if exists "missions_select_authorized" on public.missions;
create policy "missions_select_authorized" on public.missions for select using (
  leader_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur'))
);

drop policy if exists "missions_insert_authorized" on public.missions;
create policy "missions_insert_authorized" on public.missions for insert with check (
  created_by = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur'))
);

drop policy if exists "missions_update_authorized" on public.missions;
create policy "missions_update_authorized" on public.missions for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur'))
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur'))
);

drop policy if exists "activities_select_authorized" on public.activities;
create policy "activities_select_authorized" on public.activities for select using (
  leader_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur'))
);

drop policy if exists "activities_insert_leader" on public.activities;
create policy "activities_insert_leader" on public.activities for insert with check (
  leader_id = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('leader', 'admin', 'administrator', 'founder', 'fondateur'))
);

drop policy if exists "activities_update_owner" on public.activities;
create policy "activities_update_owner" on public.activities for update using (leader_id = auth.uid()) with check (leader_id = auth.uid());

drop policy if exists "reports_select_authorized" on public.reports;
create policy "reports_select_authorized" on public.reports for select using (
  leader_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur'))
);

drop policy if exists "reports_insert_leader" on public.reports;
create policy "reports_insert_leader" on public.reports for insert with check (
  leader_id = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('leader', 'admin', 'administrator', 'founder', 'fondateur'))
);

drop policy if exists "reports_update_owner" on public.reports;
create policy "reports_update_owner" on public.reports for update using (leader_id = auth.uid()) with check (leader_id = auth.uid());

create or replace function public.create_mission(
  p_title text,
  p_description text,
  p_objective text,
  p_location text default null,
  p_scheduled_date date default null,
  p_scheduled_time time default null,
  p_deadline date default null,
  p_leader_id uuid default null,
  p_neighborhood_id uuid default null
)
returns public.missions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  result public.missions;
begin
  select lower(coalesce(role, 'member')) into actor_role from public.profiles where id = auth.uid();
  if actor_role not in ('admin', 'administrator', 'founder', 'fondateur') then
    raise exception 'Permissions insuffisantes.' using errcode = '42501';
  end if;
  if p_leader_id is null or not exists (select 1 from public.profiles where id = p_leader_id and lower(coalesce(role, 'member')) = 'leader') then
    raise exception 'Le leader sélectionné est invalide.' using errcode = '42501';
  end if;
  if p_deadline is not null and p_scheduled_date is not null and p_deadline < p_scheduled_date then
    raise exception 'La date limite doit être postérieure ou égale à la date prévue.' using errcode = '22023';
  end if;
  insert into public.missions (title, description, objective, location, scheduled_date, scheduled_time, deadline, leader_id, neighborhood_id, status, created_by)
  values (btrim(p_title), p_description, p_objective, nullif(btrim(coalesce(p_location, '')), ''), p_scheduled_date, p_scheduled_time, p_deadline, p_leader_id, p_neighborhood_id, 'assigned', auth.uid())
  returning * into result;
  return result;
end;
$$;

create or replace function public.update_mission_status(p_mission_id uuid, p_status text)
returns public.missions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_mission public.missions;
  result public.missions;
  actor_role text;
begin
  select lower(coalesce(role, 'member')) into actor_role from public.profiles where id = auth.uid();
  select * into current_mission from public.missions where id = p_mission_id and leader_id = auth.uid();
  if current_mission.id is null or actor_role <> 'leader' then raise exception 'Mission inaccessible.' using errcode = '42501'; end if;
  if p_status not in ('assigned', 'in_progress', 'completed') then raise exception 'Transition non autorisée.' using errcode = '42501'; end if;
  if p_status = 'in_progress' and current_mission.status <> 'assigned' then raise exception 'La mission doit être assignée avant de commencer.' using errcode = '42501'; end if;
  if p_status = 'completed' and current_mission.status <> 'in_progress' then raise exception 'La mission doit être en cours avant d’être réalisée.' using errcode = '42501'; end if;
  update public.missions set status = p_status, accepted_at = case when p_status = 'assigned' then coalesce(accepted_at, now()) else accepted_at end, completed_at = case when p_status = 'completed' then now() else completed_at end where id = p_mission_id returning * into result;
  return result;
end;
$$;

create or replace function public.create_activity(
  p_title text,
  p_activity_type text,
  p_description text,
  p_activity_date date,
  p_location text default null,
  p_neighborhood_id uuid default null,
  p_participants_count integer default 0,
  p_mission_id uuid default null
)
returns public.activities
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  result public.activities;
begin
  select lower(coalesce(role, 'member')) into actor_role from public.profiles where id = auth.uid();
  if actor_role not in ('leader', 'admin', 'administrator', 'founder', 'fondateur') then raise exception 'Permissions insuffisantes.' using errcode = '42501'; end if;
  if p_participants_count < 0 then raise exception 'Le nombre de participants ne peut pas être négatif.' using errcode = '22023'; end if;
  if p_mission_id is not null and not exists (select 1 from public.missions where id = p_mission_id and leader_id = auth.uid()) then raise exception 'Mission inaccessible.' using errcode = '42501'; end if;
  insert into public.activities (title, activity_type, description, activity_date, location, neighborhood_id, participants_count, mission_id, leader_id)
  values (btrim(p_title), p_activity_type, p_description, p_activity_date, nullif(btrim(coalesce(p_location, '')), ''), p_neighborhood_id, p_participants_count, p_mission_id, auth.uid())
  returning * into result;
  return result;
end;
$$;

create or replace function public.create_report(
  p_mission_id uuid,
  p_summary text,
  p_activities_done text,
  p_results text,
  p_difficulties text default null,
  p_recommendations text default null,
  p_participants_count integer default 0,
  p_performed_on date default current_date,
  p_observations text default null
)
returns public.reports
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  mission_record public.missions;
  result public.reports;
begin
  select lower(coalesce(role, 'member')) into actor_role from public.profiles where id = auth.uid();
  if actor_role <> 'leader' then raise exception 'Seul le leader peut envoyer un rapport.' using errcode = '42501'; end if;
  select * into mission_record from public.missions where id = p_mission_id and leader_id = auth.uid();
  if mission_record.id is null then raise exception 'Mission inaccessible.' using errcode = '42501'; end if;
  if mission_record.status <> 'completed' then raise exception 'La mission doit être réalisée avant l’envoi du rapport.' using errcode = '22023'; end if;
  if p_participants_count < 0 then raise exception 'Le nombre de participants ne peut pas être négatif.' using errcode = '22023'; end if;
  insert into public.reports (mission_id, leader_id, summary, activities_done, results, difficulties, recommendations, participants_count, performed_on, observations)
  values (p_mission_id, auth.uid(), p_summary, p_activities_done, p_results, p_difficulties, p_recommendations, p_participants_count, p_performed_on, p_observations)
  returning * into result;
  return result;
end;
$$;

create or replace function public.review_report(p_report_id uuid, p_status text, p_comment text default null)
returns public.reports
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  result public.reports;
begin
  select lower(coalesce(role, 'member')) into actor_role from public.profiles where id = auth.uid();
  if actor_role not in ('admin', 'administrator', 'founder', 'fondateur') then raise exception 'Permissions insuffisantes.' using errcode = '42501'; end if;
  if p_status not in ('under_review', 'approved', 'rejected', 'needs_revision') then raise exception 'Statut de rapport invalide.' using errcode = '22023'; end if;
  update public.reports set status = p_status, reviewed_by = auth.uid(), reviewed_at = now(), review_comment = p_comment where id = p_report_id returning * into result;
  if result.id is null then raise exception 'Rapport introuvable.' using errcode = 'P0002'; end if;
  return result;
end;
$$;

revoke all on function public.create_mission(text, text, text, text, date, time, date, uuid, uuid) from public;
revoke all on function public.update_mission_status(uuid, text) from public;
revoke all on function public.create_activity(text, text, text, date, text, uuid, integer, uuid) from public;
revoke all on function public.create_report(uuid, text, text, text, text, text, integer, date, text) from public;
revoke all on function public.review_report(uuid, text, text) from public;
grant execute on function public.create_mission(text, text, text, text, date, time, date, uuid, uuid) to authenticated;
grant execute on function public.update_mission_status(uuid, text) to authenticated;
grant execute on function public.create_activity(text, text, text, date, text, uuid, integer, uuid) to authenticated;
grant execute on function public.create_report(uuid, text, text, text, text, text, integer, date, text) to authenticated;
grant execute on function public.review_report(uuid, text, text) to authenticated;

-- Allow the Phase 4 secure role RPC to pass its own controlled update through the guard trigger.
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
  actor_role text;
  target_role text;
  new_role text;
  action_name text;
  result public.profiles;
begin
  select lower(coalesce(role, 'member')) into actor_role from public.profiles where id = auth.uid();
  select lower(coalesce(role, 'member')) into target_role from public.profiles where id = p_target_id;
  new_role := lower(trim(coalesce(p_new_role, 'member')));
  if actor_role not in ('admin', 'administrator', 'founder', 'fondateur') then raise exception 'Permissions insuffisantes.' using errcode = '42501'; end if;
  if target_role is null or new_role not in ('member', 'leader', 'admin', 'founder') then raise exception 'Rôle ou membre invalide.' using errcode = '42501'; end if;
  if p_target_id = auth.uid() or target_role in ('founder', 'fondateur') then raise exception 'Le compte cible est protégé.' using errcode = '42501'; end if;
  if actor_role in ('admin', 'administrator') and (new_role in ('admin', 'founder') or target_role not in ('member', 'leader')) then raise exception 'Un administrateur ne peut gérer que les membres et les leaders.' using errcode = '42501'; end if;
  if actor_role in ('admin', 'administrator') and target_role = 'member' and new_role = 'leader' then action_name := 'leader_nomination';
  elsif actor_role in ('admin', 'administrator') and target_role = 'leader' and new_role = 'member' then action_name := 'leader_removal';
  elsif actor_role in ('founder', 'fondateur') and target_role = 'member' and new_role = 'admin' then action_name := 'admin_nomination';
  elsif actor_role in ('founder', 'fondateur') and target_role = 'admin' and new_role = 'member' then action_name := 'admin_removal';
  else raise exception 'Transition de rôle non autorisée.' using errcode = '42501';
  end if;
  perform set_config('ida.role_change_authorized', 'on', true);
  update public.profiles set role = new_role where id = p_target_id returning * into result;
  insert into public.admin_action_logs (actor_id, target_user_id, action, old_role, new_role, reason) values (auth.uid(), p_target_id, action_name, target_role, new_role, p_reason);
  return result;
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
  actor_role text;
begin
  if current_setting('ida.role_change_authorized', true) = 'on' then return new; end if;
  select lower(coalesce(role, 'member')) into actor_role from public.profiles where id = auth.uid();
  if actor_role not in ('founder', 'fondateur') and (new.role is distinct from old.role or new.referred_by is distinct from old.referred_by or new.affiliate_code is distinct from old.affiliate_code or new.member_number is distinct from old.member_number) then
    raise exception 'Les champs sensibles sont gérés par IDA.' using errcode = '42501';
  end if;
  return new;
end;
$$;
