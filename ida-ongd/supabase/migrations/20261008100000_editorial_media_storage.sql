-- Editorial media upload support (run after the runtime repair migration).
-- Creates a public-read bucket for published images/videos and permits uploads
-- only to authenticated admin/founder profiles. Existing rows are preserved.

begin;

do $$
begin
  if to_regprocedure('public.ida_current_role()') is null then
    raise exception 'Run 20261007130000_runtime_repair.sql first (public.ida_current_role() is missing).';
  end if;
  if to_regclass('public.news') is null or to_regclass('public.public_actions') is null
    or to_regclass('public.important_information') is null then
    raise exception 'Run the editorial/runtime repair first; one or more public content tables are missing.';
  end if;
end;
$$;

alter table public.news add column if not exists image_url text;
alter table public.news add column if not exists video_url text;
alter table public.public_actions add column if not exists image_url text;
alter table public.public_actions add column if not exists video_url text;
alter table public.important_information add column if not exists image_url text;
alter table public.important_information add column if not exists video_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ida-editorial-media',
  'ida-editorial-media',
  true,
  52428800,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Public can only fetch objects in this public media bucket. Writes are never
-- granted to anon and are limited to administrator/founder profiles.
drop policy if exists ida_editorial_media_public_read on storage.objects;
create policy ida_editorial_media_public_read
on storage.objects for select to anon, authenticated
using (bucket_id = 'ida-editorial-media');

drop policy if exists ida_editorial_media_admin_insert on storage.objects;
create policy ida_editorial_media_admin_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'ida-editorial-media'
  and auth.uid() is not null
  and public.ida_current_role() in ('admin','administrator','founder','fondateur')
);

drop policy if exists ida_editorial_media_admin_update on storage.objects;
create policy ida_editorial_media_admin_update
on storage.objects for update to authenticated
using (
  bucket_id = 'ida-editorial-media'
  and auth.uid() is not null
  and public.ida_current_role() in ('admin','administrator','founder','fondateur')
)
with check (
  bucket_id = 'ida-editorial-media'
  and auth.uid() is not null
  and public.ida_current_role() in ('admin','administrator','founder','fondateur')
);

drop policy if exists ida_editorial_media_admin_delete on storage.objects;
create policy ida_editorial_media_admin_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'ida-editorial-media'
  and auth.uid() is not null
  and public.ida_current_role() in ('admin','administrator','founder','fondateur')
);

notify pgrst, 'reload schema';
commit;
