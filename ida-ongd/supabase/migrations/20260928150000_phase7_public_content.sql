-- Phase 7: public editorial content and human-interest actions.
-- `news` and `important_information` already exist in the linked Supabase
-- project. This migration adapts them in place. Phase 5 `activities` remains
-- the operational log entered by leaders; public_actions is separate content.

-- Existing news columns reused: id, title, slug, excerpt (public summary),
-- content, author_id (author), status, published_at, created_at, updated_at.
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt text not null check (char_length(btrim(excerpt)) between 3 and 600),
  content text not null check (char_length(btrim(content)) >= 3),
  image_url text,
  author_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.news add column if not exists image_url text;
create index if not exists news_publication_idx
  on public.news (published_at desc)
  where status = 'published';

-- These are curated, public-facing actions. They are not the Phase 5
-- activities table, which records operational work by leaders.
create table if not exists public.public_actions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 180),
  description text not null check (char_length(btrim(description)) >= 3),
  objective text not null check (char_length(btrim(objective)) >= 3),
  location text,
  date_action date,
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists public_actions_publication_idx
  on public.public_actions (published_at desc)
  where status = 'published';

-- Reuse the existing important_information table and its existing priority,
-- is_active, published_at, created_by, created_at and updated_at columns.
create table if not exists public.important_information (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 180),
  content text not null check (char_length(btrim(content)) >= 3),
  priority text not null default 'normal',
  is_active boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.important_information add column if not exists status text not null default 'draft';
alter table public.important_information add column if not exists priority text not null default 'normal';
alter table public.important_information add column if not exists is_active boolean not null default false;
alter table public.important_information add column if not exists published_at timestamptz;
alter table public.important_information add column if not exists created_by uuid references public.profiles(id) on delete restrict;
alter table public.important_information add column if not exists created_at timestamptz not null default now();
alter table public.important_information add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.important_information'::regclass
      and conname = 'important_information_status_check'
  ) then
    alter table public.important_information
      add constraint important_information_status_check
      check (status in ('draft', 'published', 'archived'));
  end if;
end;
$$;

-- Preserve existing active announcements as published when introducing status.
update public.important_information
set status = 'published',
    published_at = coalesce(published_at, created_at, now())
where is_active is true and status = 'draft';

create index if not exists important_information_publication_idx
  on public.important_information (published_at desc)
  where status = 'published';

create or replace function public.set_phase7_news_timestamps()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.author_id := old.author_id;
  end if;
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create or replace function public.set_phase7_created_content_timestamps()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.created_by := old.created_by;
  end if;
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create or replace function public.set_phase7_information_timestamps()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.created_by := old.created_by;
  end if;
  new.is_active := (new.status = 'published');
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := now();
  end if;
  return new;
end;
$$;

revoke all on function public.set_phase7_news_timestamps() from public, anon, authenticated;
revoke all on function public.set_phase7_created_content_timestamps() from public, anon, authenticated;
revoke all on function public.set_phase7_information_timestamps() from public, anon, authenticated;

drop trigger if exists ida_phase7_news_timestamps on public.news;
create trigger ida_phase7_news_timestamps before insert or update on public.news
for each row execute function public.set_phase7_news_timestamps();

drop trigger if exists ida_phase7_public_actions_timestamps on public.public_actions;
create trigger ida_phase7_public_actions_timestamps before insert or update on public.public_actions
for each row execute function public.set_phase7_created_content_timestamps();

drop trigger if exists ida_phase7_important_information_timestamps on public.important_information;
create trigger ida_phase7_important_information_timestamps before insert or update on public.important_information
for each row execute function public.set_phase7_information_timestamps();

alter table public.news enable row level security;
alter table public.public_actions enable row level security;
alter table public.important_information enable row level security;

grant select on public.news, public.public_actions, public.important_information to anon, authenticated;
grant insert, update, delete on public.news, public.public_actions, public.important_information to authenticated;

-- Published content is public; editors can also read drafts and archived items.
drop policy if exists "ida_phase7_news_read_published" on public.news;
create policy "ida_phase7_news_read_published" on public.news for select to anon, authenticated
using (status = 'published');
drop policy if exists "ida_phase7_news_read_admin" on public.news;
create policy "ida_phase7_news_read_admin" on public.news for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')));

drop policy if exists "ida_phase7_public_actions_read_published" on public.public_actions;
create policy "ida_phase7_public_actions_read_published" on public.public_actions for select to anon, authenticated
using (status = 'published');
drop policy if exists "ida_phase7_public_actions_read_admin" on public.public_actions;
create policy "ida_phase7_public_actions_read_admin" on public.public_actions for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')));

drop policy if exists "ida_phase7_important_information_read_published" on public.important_information;
create policy "ida_phase7_important_information_read_published" on public.important_information for select to anon, authenticated
using (status = 'published');
drop policy if exists "ida_phase7_important_information_read_admin" on public.important_information;
create policy "ida_phase7_important_information_read_admin" on public.important_information for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')));

-- INSERT verifies the current author; UPDATE and DELETE are limited to editors.
drop policy if exists "ida_phase7_news_insert_admin" on public.news;
create policy "ida_phase7_news_insert_admin" on public.news for insert to authenticated
with check (author_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')));
drop policy if exists "ida_phase7_news_update_admin" on public.news;
create policy "ida_phase7_news_update_admin" on public.news for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')));
drop policy if exists "ida_phase7_news_delete_admin" on public.news;
create policy "ida_phase7_news_delete_admin" on public.news for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')));

drop policy if exists "ida_phase7_public_actions_insert_admin" on public.public_actions;
create policy "ida_phase7_public_actions_insert_admin" on public.public_actions for insert to authenticated
with check (created_by = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')));
drop policy if exists "ida_phase7_public_actions_update_admin" on public.public_actions;
create policy "ida_phase7_public_actions_update_admin" on public.public_actions for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')));
drop policy if exists "ida_phase7_public_actions_delete_admin" on public.public_actions;
create policy "ida_phase7_public_actions_delete_admin" on public.public_actions for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')));

drop policy if exists "ida_phase7_important_information_insert_admin" on public.important_information;
create policy "ida_phase7_important_information_insert_admin" on public.important_information for insert to authenticated
with check (created_by = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')));
drop policy if exists "ida_phase7_important_information_update_admin" on public.important_information;
create policy "ida_phase7_important_information_update_admin" on public.important_information for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')));
drop policy if exists "ida_phase7_important_information_delete_admin" on public.important_information;
create policy "ida_phase7_important_information_delete_admin" on public.important_information for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')));

-- Restrictive policies intersect (rather than replace) legacy policies on the
-- two pre-existing content tables, ensuring that old broad policies cannot
-- expose drafts or grant write access to members and leaders.
drop policy if exists "ida_phase7_news_restrict_select" on public.news;
create policy "ida_phase7_news_restrict_select" on public.news as restrictive for select to anon, authenticated
using (status = 'published' or exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')));
drop policy if exists "ida_phase7_news_restrict_insert" on public.news;
create policy "ida_phase7_news_restrict_insert" on public.news as restrictive for insert to authenticated
with check (author_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')));
drop policy if exists "ida_phase7_news_restrict_update" on public.news;
create policy "ida_phase7_news_restrict_update" on public.news as restrictive for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')));
drop policy if exists "ida_phase7_news_restrict_delete" on public.news;
create policy "ida_phase7_news_restrict_delete" on public.news as restrictive for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')));

drop policy if exists "ida_phase7_information_restrict_select" on public.important_information;
create policy "ida_phase7_information_restrict_select" on public.important_information as restrictive for select to anon, authenticated
using (status = 'published' or exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')));
drop policy if exists "ida_phase7_information_restrict_insert" on public.important_information;
create policy "ida_phase7_information_restrict_insert" on public.important_information as restrictive for insert to authenticated
with check (created_by = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')));
drop policy if exists "ida_phase7_information_restrict_update" on public.important_information;
create policy "ida_phase7_information_restrict_update" on public.important_information as restrictive for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')));
drop policy if exists "ida_phase7_information_restrict_delete" on public.important_information;
create policy "ida_phase7_information_restrict_delete" on public.important_information as restrictive for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')));

-- Refresh PostgREST's schema cache after the new columns/tables are committed.
notify pgrst, 'reload schema';
