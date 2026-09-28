-- Phase 7: public editorial content and human-interest actions.
-- Existing activities, missions and reports remain unchanged: activities are
-- operational records authored by leaders, while public_actions are curated
-- communications published by IDA administration.

create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  summary text not null check (char_length(btrim(summary)) between 3 and 600),
  content text not null check (char_length(btrim(content)) >= 3),
  image_url text,
  author text not null default 'Équipe IDA',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_articles_publication_idx
  on public.news_articles (published_at desc)
  where status = 'published';

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

create table if not exists public.important_information (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 180),
  content text not null check (char_length(btrim(content)) >= 3),
  priority text not null default 'normal' check (priority in ('normal', 'important', 'urgent')),
  is_active boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The live project already has important_information with legacy is_active.
-- Extend it in place and keep that column synchronized for older consumers.
alter table public.important_information
  add column if not exists status text not null default 'draft';
alter table public.important_information
  add column if not exists priority text not null default 'normal';
alter table public.important_information
  add column if not exists is_active boolean not null default false;
alter table public.important_information
  add column if not exists published_at timestamptz;
alter table public.important_information
  add column if not exists created_by uuid references public.profiles(id) on delete restrict;
alter table public.important_information
  add column if not exists created_at timestamptz not null default now();
alter table public.important_information
  add column if not exists updated_at timestamptz not null default now();

update public.important_information
set status = 'published',
    published_at = coalesce(published_at, created_at, now())
where is_active is true and status = 'draft';

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

create index if not exists important_information_publication_idx
  on public.important_information (published_at desc)
  where status = 'published';

create or replace function public.set_phase7_content_timestamps()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.created_by := old.created_by;
  end if;
  if tg_table_name = 'important_information' then
    new.is_active := (new.status = 'published');
  end if;
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := now();
  end if;
  return new;
end;
$$;

revoke all on function public.set_phase7_content_timestamps() from public, anon, authenticated;

drop trigger if exists ida_news_articles_timestamps on public.news_articles;
create trigger ida_news_articles_timestamps
before insert or update on public.news_articles
for each row execute function public.set_phase7_content_timestamps();

drop trigger if exists ida_public_actions_timestamps on public.public_actions;
create trigger ida_public_actions_timestamps
before insert or update on public.public_actions
for each row execute function public.set_phase7_content_timestamps();

drop trigger if exists ida_important_information_timestamps on public.important_information;
create trigger ida_important_information_timestamps
before insert or update on public.important_information
for each row execute function public.set_phase7_content_timestamps();

alter table public.news_articles enable row level security;
alter table public.public_actions enable row level security;
alter table public.important_information enable row level security;

grant select on public.news_articles, public.public_actions, public.important_information to anon, authenticated;
grant insert, update, delete on public.news_articles, public.public_actions, public.important_information to authenticated;

-- Public visitors and signed-in users can read only published content.
drop policy if exists "news_articles_read_published" on public.news_articles;
create policy "news_articles_read_published"
on public.news_articles for select to anon, authenticated
using (status = 'published');
drop policy if exists "news_articles_read_admin" on public.news_articles;
create policy "news_articles_read_admin" on public.news_articles for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur'))
);

drop policy if exists "public_actions_read_published" on public.public_actions;
create policy "public_actions_read_published"
on public.public_actions for select to anon, authenticated
using (status = 'published');
drop policy if exists "public_actions_read_admin" on public.public_actions;
create policy "public_actions_read_admin" on public.public_actions for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur'))
);

drop policy if exists "important_information_read_published" on public.important_information;
create policy "important_information_read_published"
on public.important_information for select to anon, authenticated
using (status = 'published');
drop policy if exists "important_information_read_admin" on public.important_information;
create policy "important_information_read_admin" on public.important_information for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur'))
);

-- Only existing administrators and founders can manage editorial content.
-- Leaders deliberately receive no content-management privileges.
drop policy if exists "news_articles_manage_admin" on public.news_articles;
drop policy if exists "news_articles_insert_admin" on public.news_articles;
create policy "news_articles_insert_admin"
on public.news_articles for insert to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
  )
);

drop policy if exists "news_articles_update_admin" on public.news_articles;
create policy "news_articles_update_admin"
on public.news_articles for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
  )
);

drop policy if exists "public_actions_manage_admin" on public.public_actions;
drop policy if exists "public_actions_insert_admin" on public.public_actions;
create policy "public_actions_insert_admin"
on public.public_actions for insert to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
  )
);

drop policy if exists "public_actions_update_admin" on public.public_actions;
create policy "public_actions_update_admin"
on public.public_actions for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
  )
);

drop policy if exists "important_information_manage_admin" on public.important_information;
drop policy if exists "important_information_insert_admin" on public.important_information;
create policy "important_information_insert_admin"
on public.important_information for insert to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
  )
);

drop policy if exists "important_information_update_admin" on public.important_information;
create policy "important_information_update_admin"
on public.important_information for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
  )
);

drop policy if exists "news_articles_delete_admin" on public.news_articles;
create policy "news_articles_delete_admin" on public.news_articles for delete to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur'))
);
drop policy if exists "public_actions_delete_admin" on public.public_actions;
create policy "public_actions_delete_admin" on public.public_actions for delete to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur'))
);
drop policy if exists "important_information_delete_admin" on public.important_information;
create policy "important_information_delete_admin" on public.important_information for delete to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur'))
);

-- Clamp any legacy permissive policies already attached to the pre-existing
-- important_information table without dropping or disabling those policies.
drop policy if exists "important_information_phase7_restrict_select" on public.important_information;
create policy "important_information_phase7_restrict_select"
on public.important_information as restrictive for select to anon, authenticated
using (
  status = 'published'
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
  )
);

drop policy if exists "important_information_phase7_restrict_insert" on public.important_information;
create policy "important_information_phase7_restrict_insert"
on public.important_information as restrictive for insert to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
  )
);

drop policy if exists "important_information_phase7_restrict_update" on public.important_information;
create policy "important_information_phase7_restrict_update"
on public.important_information as restrictive for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
  )
);

drop policy if exists "important_information_phase7_restrict_delete" on public.important_information;
create policy "important_information_phase7_restrict_delete"
on public.important_information as restrictive for delete to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, 'member')) in ('admin', 'administrator', 'founder', 'fondateur')
  )
);
