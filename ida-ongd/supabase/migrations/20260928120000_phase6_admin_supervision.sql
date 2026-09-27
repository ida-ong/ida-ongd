-- Phase 6: supervision administrative, validation des rapports et traçabilité.
-- This migration is intentionally minimal: it reuses public.reports, public.profiles,
-- public.missions and public.activities and keeps RLS enabled.

create table if not exists public.report_history (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  action text not null,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists report_history_report_idx on public.report_history (report_id, created_at desc);
create index if not exists report_history_actor_idx on public.report_history (actor_id, created_at desc);

alter table public.report_history enable row level security;

drop policy if exists "report_history_select_authorized" on public.report_history;
create policy "report_history_select_authorized" on public.report_history for select using (
  exists (
    select 1
    from public.reports r
    where r.id = report_history.report_id
      and (
        r.leader_id = auth.uid()
        or exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
        )
      )
  )
);

drop policy if exists "report_history_insert_admin" on public.report_history;
create policy "report_history_insert_admin" on public.report_history for insert with check (
  actor_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
  )
);

-- Expand the report lifecycle to support validation and administrative corrections.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reports'
      and column_name = 'status'
  ) then
    alter table public.reports drop constraint if exists reports_status_check;
    alter table public.reports add constraint reports_status_check
      check (status in (
        'submitted',
        'under_review',
        'approved',
        'validated',
        'rejected',
        'needs_revision',
        'correction_requested',
        'resubmitted'
      ));
  end if;
end $$;

create or replace function public.record_report_history(
  p_report_id uuid,
  p_action text,
  p_comment text default null
)
returns public.report_history
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result public.report_history;
begin
  insert into public.report_history (report_id, actor_id, action, comment)
  values (p_report_id, auth.uid(), p_action, p_comment)
  returning * into result;
  return result;
end;
$$;

create or replace function public.validate_report(
  p_report_id uuid,
  p_comment text default null
)
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
  if actor_role not in ('admin', 'administrator', 'founder', 'fondateur') then
    raise exception 'Permissions insuffisantes.' using errcode = '42501';
  end if;

  update public.reports
  set status = 'validated',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_comment = p_comment,
      updated_at = now()
  where id = p_report_id
  returning * into result;

  if result.id is null then
    raise exception 'Rapport introuvable.' using errcode = 'P0002';
  end if;

  perform public.record_report_history(p_report_id, 'validated', p_comment);
  return result;
end;
$$;

create or replace function public.request_report_correction(
  p_report_id uuid,
  p_comment text default null
)
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
  if actor_role not in ('admin', 'administrator', 'founder', 'fondateur') then
    raise exception 'Permissions insuffisantes.' using errcode = '42501';
  end if;
  if coalesce(p_comment, '') = '' then
    raise exception 'Le commentaire de correction est obligatoire.' using errcode = '22023';
  end if;

  update public.reports
  set status = 'correction_requested',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_comment = p_comment,
      updated_at = now()
  where id = p_report_id
  returning * into result;

  if result.id is null then
    raise exception 'Rapport introuvable.' using errcode = 'P0002';
  end if;

  perform public.record_report_history(p_report_id, 'correction_requested', p_comment);
  return result;
end;
$$;

create or replace function public.reject_report(
  p_report_id uuid,
  p_comment text default null
)
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
  if actor_role not in ('admin', 'administrator', 'founder', 'fondateur') then
    raise exception 'Permissions insuffisantes.' using errcode = '42501';
  end if;
  if coalesce(p_comment, '') = '' then
    raise exception 'La justification du rejet est obligatoire.' using errcode = '22023';
  end if;

  update public.reports
  set status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_comment = p_comment,
      updated_at = now()
  where id = p_report_id
  returning * into result;

  if result.id is null then
    raise exception 'Rapport introuvable.' using errcode = 'P0002';
  end if;

  perform public.record_report_history(p_report_id, 'rejected', p_comment);
  return result;
end;
$$;

create or replace function public.resubmit_report(
  p_report_id uuid,
  p_summary text,
  p_activities_done text,
  p_results text,
  p_difficulties text default null,
  p_recommendations text default null,
  p_participants_count integer default 0,
  p_performed_on date default current_date,
  p_observations text default null,
  p_comment text default null
)
returns public.reports
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  current_report public.reports;
  result public.reports;
begin
  select lower(coalesce(role, 'member')) into actor_role from public.profiles where id = auth.uid();
  if actor_role <> 'leader' then
    raise exception 'Seul un leader peut renvoyer un rapport.' using errcode = '42501';
  end if;

  select * into current_report
  from public.reports
  where id = p_report_id and leader_id = auth.uid();

  if current_report.id is null then
    raise exception 'Rapport inaccessible.' using errcode = '42501';
  end if;

  if current_report.status not in ('correction_requested', 'rejected') then
    raise exception 'Ce rapport ne peut pas être renvoyé dans son état actuel.' using errcode = '22023';
  end if;

  if p_participants_count < 0 then
    raise exception 'Le nombre de participants ne peut pas être négatif.' using errcode = '22023';
  end if;

  update public.reports
  set summary = p_summary,
      activities_done = p_activities_done,
      results = p_results,
      difficulties = p_difficulties,
      recommendations = p_recommendations,
      participants_count = p_participants_count,
      performed_on = p_performed_on,
      observations = p_observations,
      status = 'resubmitted',
      review_comment = p_comment,
      reviewed_by = null,
      reviewed_at = null,
      updated_at = now()
  where id = p_report_id
  returning * into result;

  perform public.record_report_history(p_report_id, 'resubmitted', p_comment);
  return result;
end;
$$;

revoke all on function public.record_report_history(uuid, text, text) from public;
revoke all on function public.validate_report(uuid, text) from public;
revoke all on function public.request_report_correction(uuid, text) from public;
revoke all on function public.reject_report(uuid, text) from public;
revoke all on function public.resubmit_report(uuid, text, text, text, text, text, integer, date, text, text) from public;

grant execute on function public.record_report_history(uuid, text, text) to authenticated;
grant execute on function public.validate_report(uuid, text) to authenticated;
grant execute on function public.request_report_correction(uuid, text) to authenticated;
grant execute on function public.reject_report(uuid, text) to authenticated;
grant execute on function public.resubmit_report(uuid, text, text, text, text, text, integer, date, text, text) to authenticated;

-- RLS guard: a leader can only edit their own report in valid correction/resubmission states.
drop policy if exists "reports_update_owner" on public.reports;
create policy "reports_update_owner" on public.reports for update using (
  leader_id = auth.uid()
  and status in ('submitted', 'correction_requested', 'rejected', 'resubmitted')
) with check (
  leader_id = auth.uid()
  and status in ('submitted', 'correction_requested', 'rejected', 'resubmitted')
);

-- Keep a readable audit trail for reporting actions.
drop policy if exists "reports_select_authorized" on public.reports;
create policy "reports_select_authorized" on public.reports for select using (
  leader_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
  )
);
