-- ONGD IDA geographic hierarchy + initial Haut-Katanga data.
-- Run in Supabase SQL Editor after profiles exists. No existing table or rows are deleted.
-- Data provenance: province/city/territory/commune names and per-commune sample quarter
-- lists were supplied in the project request. Quarter-to-commune assignments are marked
-- unverified pending administrative confirmation. Named roads are stored as import
-- candidates unless their exact quarter has a trustworthy source; no guessed road FK.
-- OpenStreetMap (ODbL) was queried 2026-10-08 for named road/administrative objects in
-- the Lubumbashi area. OSM objects are candidates, not treated as official boundaries.

begin;

do $$ begin
  if to_regclass('public.profiles') is null then
    raise exception 'public.profiles is required; apply the existing profile/base migration first.';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='id') then
    raise exception 'public.profiles.id is missing; refusing to create profile location relations.';
  end if;
end $$;

create table if not exists public.ida_geo_provinces (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  country_code char(2) not null default 'CD',
  source text not null default 'user-provided; review required',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ida_geo_localities (
  id uuid primary key default gen_random_uuid(),
  province_id uuid not null references public.ida_geo_provinces(id) on delete restrict,
  name text not null,
  locality_type text not null check (locality_type in ('city','territory')),
  source text not null default 'user-provided; review required',
  is_active boolean not null default true,
  unique (province_id, locality_type, name),
  unique (id, province_id)
);

create table if not exists public.ida_geo_communes (
  id uuid primary key default gen_random_uuid(),
  locality_id uuid not null references public.ida_geo_localities(id) on delete restrict,
  name text not null,
  source text not null default 'user-provided; review required',
  is_active boolean not null default true,
  unique (locality_id, name),
  unique (id, locality_id)
);

create table if not exists public.ida_geo_quartiers (
  id uuid primary key default gen_random_uuid(),
  commune_id uuid not null references public.ida_geo_communes(id) on delete restrict,
  name text not null,
  verification_status text not null default 'needs_review' check (verification_status in ('verified','needs_review','rejected')),
  source text not null default 'user-provided; administrative parent/name requires review',
  source_reference text,
  aliases text[] not null default '{}',
  is_active boolean not null default true,
  unique (commune_id, name),
  unique (id, commune_id)
);

create table if not exists public.ida_geo_roads (
  id uuid primary key default gen_random_uuid(),
  quartier_id uuid not null references public.ida_geo_quartiers(id) on delete restrict,
  name text not null,
  verification_status text not null default 'needs_review' check (verification_status in ('verified','needs_review','rejected')),
  source text not null default 'requires local/admin confirmation',
  source_reference text,
  is_active boolean not null default true,
  unique (quartier_id, name)
);

create table if not exists public.ida_geo_rural_units (
  id uuid primary key default gen_random_uuid(),
  territory_id uuid not null references public.ida_geo_localities(id) on delete restrict,
  name text not null,
  unit_type text not null check (unit_type in ('secteur','chefferie')),
  verification_status text not null default 'needs_review' check (verification_status in ('verified','needs_review','rejected')),
  source text not null default 'requires administrative verification',
  is_active boolean not null default true,
  unique (territory_id, unit_type, name),
  unique (id, territory_id)
);

create table if not exists public.ida_geo_groupements (
  id uuid primary key default gen_random_uuid(),
  rural_unit_id uuid not null references public.ida_geo_rural_units(id) on delete restrict,
  name text not null,
  verification_status text not null default 'needs_review' check (verification_status in ('verified','needs_review','rejected')),
  source text not null default 'requires administrative verification',
  is_active boolean not null default true,
  unique (rural_unit_id, name),
  unique (id, rural_unit_id)
);

create table if not exists public.ida_geo_villages (
  id uuid primary key default gen_random_uuid(),
  groupement_id uuid not null references public.ida_geo_groupements(id) on delete restrict,
  name text not null,
  verification_status text not null default 'needs_review' check (verification_status in ('verified','needs_review','rejected')),
  source text not null default 'requires administrative verification',
  is_active boolean not null default true,
  unique (groupement_id, name)
);

-- OSM/user-supplied objects whose parent geography has not been validated.
-- These rows are deliberately not attached to a quartier/commune by guesswork.
create table if not exists public.ida_geo_import_candidates (
  id uuid primary key default gen_random_uuid(),
  candidate_type text not null check (candidate_type in ('commune','quartier','avenue','rue','secteur','chefferie','groupement','village')),
  name text not null,
  parent_hint text,
  admin_level text,
  source text not null,
  source_reference text,
  source_object_type text,
  source_object_id text,
  verification_status text not null default 'needs_review' check (verification_status in ('needs_review','verified','rejected')),
  notes text,
  created_at timestamptz not null default now(),
  unique (source, source_object_type, source_object_id, candidate_type, name)
);

-- Add normalized foreign keys to profiles, preserving neighborhood_id compatibility.
alter table public.profiles add column if not exists geo_province_id uuid;
alter table public.profiles add column if not exists geo_locality_id uuid;
alter table public.profiles add column if not exists geo_commune_id uuid;
alter table public.profiles add column if not exists geo_quartier_id uuid;
alter table public.profiles add column if not exists geo_road_id uuid;
alter table public.profiles add column if not exists geo_rural_unit_id uuid;
alter table public.profiles add column if not exists geo_groupement_id uuid;
alter table public.profiles add column if not exists geo_village_id uuid;

do $$ begin
  if not exists(select 1 from pg_constraint where conrelid='public.profiles'::regclass and conname='profiles_ida_geo_province_fkey') then
    alter table public.profiles add constraint profiles_ida_geo_province_fkey foreign key(geo_province_id) references public.ida_geo_provinces(id) not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.profiles'::regclass and conname='profiles_ida_geo_locality_fkey') then
    alter table public.profiles add constraint profiles_ida_geo_locality_fkey foreign key(geo_locality_id) references public.ida_geo_localities(id) not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.profiles'::regclass and conname='profiles_ida_geo_commune_fkey') then
    alter table public.profiles add constraint profiles_ida_geo_commune_fkey foreign key(geo_commune_id) references public.ida_geo_communes(id) not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.profiles'::regclass and conname='profiles_ida_geo_quartier_fkey') then
    alter table public.profiles add constraint profiles_ida_geo_quartier_fkey foreign key(geo_quartier_id) references public.ida_geo_quartiers(id) not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.profiles'::regclass and conname='profiles_ida_geo_road_fkey') then
    alter table public.profiles add constraint profiles_ida_geo_road_fkey foreign key(geo_road_id) references public.ida_geo_roads(id) not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.profiles'::regclass and conname='profiles_ida_geo_rural_unit_fkey') then
    alter table public.profiles add constraint profiles_ida_geo_rural_unit_fkey foreign key(geo_rural_unit_id) references public.ida_geo_rural_units(id) not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.profiles'::regclass and conname='profiles_ida_geo_groupement_fkey') then
    alter table public.profiles add constraint profiles_ida_geo_groupement_fkey foreign key(geo_groupement_id) references public.ida_geo_groupements(id) not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.profiles'::regclass and conname='profiles_ida_geo_village_fkey') then
    alter table public.profiles add constraint profiles_ida_geo_village_fkey foreign key(geo_village_id) references public.ida_geo_villages(id) not valid;
  end if;
end $$;

-- Auth signup metadata is untrusted input. Copy only UUIDs that form one valid
-- geographic path; invalid/incomplete combinations become NULL, never guessed.
create or replace function public.ida_apply_signup_geography()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  m jsonb;
  v_province uuid;
  v_locality uuid;
  v_commune uuid;
  v_quartier uuid;
  v_road uuid;
  v_unit uuid;
  v_grouping uuid;
  v_village uuid;
  v_locality_type text;
begin
  select u.raw_user_meta_data into m from auth.users u where u.id = new.id;
  if m is null then return new; end if;

  begin v_province := nullif(m->>'geo_province_id','')::uuid; exception when others then v_province := null; end;
  begin v_locality := nullif(m->>'geo_locality_id','')::uuid; exception when others then v_locality := null; end;
  begin v_commune := nullif(m->>'geo_commune_id','')::uuid; exception when others then v_commune := null; end;
  begin v_quartier := nullif(m->>'geo_quartier_id','')::uuid; exception when others then v_quartier := null; end;
  begin v_road := nullif(m->>'geo_road_id','')::uuid; exception when others then v_road := null; end;
  begin v_unit := nullif(m->>'geo_rural_unit_id','')::uuid; exception when others then v_unit := null; end;
  begin v_grouping := nullif(m->>'geo_groupement_id','')::uuid; exception when others then v_grouping := null; end;
  begin v_village := nullif(m->>'geo_village_id','')::uuid; exception when others then v_village := null; end;

  if v_province is not null and v_locality is not null
     and exists(select 1 from public.ida_geo_localities l where l.id=v_locality and l.province_id=v_province and l.is_active) then
    select l.locality_type into v_locality_type from public.ida_geo_localities l where l.id=v_locality;
    if v_locality_type='city' then
      if v_commune is not null and exists(select 1 from public.ida_geo_communes c where c.id=v_commune and c.locality_id=v_locality and c.is_active) then
        if v_quartier is not null and exists(select 1 from public.ida_geo_quartiers q where q.id=v_quartier and q.commune_id=v_commune and q.is_active and q.verification_status<>'rejected') then
          if v_road is not null and not exists(select 1 from public.ida_geo_roads r where r.id=v_road and r.quartier_id=v_quartier and r.is_active and r.verification_status='verified') then v_road := null; end if;
        else v_quartier := null; v_road := null;
        end if;
      else v_commune := null; v_quartier := null; v_road := null;
      end if;
      v_unit := null; v_grouping := null; v_village := null;
    elsif v_locality_type='territory' then
      if v_unit is not null and exists(select 1 from public.ida_geo_rural_units u where u.id=v_unit and u.territory_id=v_locality and u.is_active and u.verification_status<>'rejected') then
        if v_grouping is not null and exists(select 1 from public.ida_geo_groupements g where g.id=v_grouping and g.rural_unit_id=v_unit and g.is_active and g.verification_status<>'rejected') then
          if v_village is not null and not exists(select 1 from public.ida_geo_villages v where v.id=v_village and v.groupement_id=v_grouping and v.is_active and v.verification_status<>'rejected') then v_village := null; end if;
        else v_grouping := null; v_village := null;
        end if;
      end if;
      v_commune := null; v_quartier := null; v_road := null;
    else
      v_province := null; v_locality := null; v_commune := null; v_quartier := null; v_road := null; v_unit := null; v_grouping := null; v_village := null;
    end if;
  else
    v_province := null; v_locality := null; v_commune := null; v_quartier := null; v_road := null; v_unit := null; v_grouping := null; v_village := null;
  end if;

  new.geo_province_id := v_province;
  new.geo_locality_id := v_locality;
  new.geo_commune_id := v_commune;
  new.geo_quartier_id := v_quartier;
  new.geo_road_id := v_road;
  new.geo_rural_unit_id := v_unit;
  new.geo_groupement_id := v_grouping;
  new.geo_village_id := v_village;
  return new;
end;
$$;
revoke all on function public.ida_apply_signup_geography() from public,anon,authenticated;
drop trigger if exists ida_apply_signup_geography on public.profiles;
create trigger ida_apply_signup_geography before insert on public.profiles
  for each row execute function public.ida_apply_signup_geography();

create or replace function public.ida_guard_geo_profile_updates()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or auth.role()='service_role' or current_user in ('postgres','supabase_admin') then return new; end if;
  if new.geo_province_id is distinct from old.geo_province_id
    or new.geo_locality_id is distinct from old.geo_locality_id
    or new.geo_commune_id is distinct from old.geo_commune_id
    or new.geo_quartier_id is distinct from old.geo_quartier_id
    or new.geo_road_id is distinct from old.geo_road_id
    or new.geo_rural_unit_id is distinct from old.geo_rural_unit_id
    or new.geo_groupement_id is distinct from old.geo_groupement_id
    or new.geo_village_id is distinct from old.geo_village_id then
    if public.ida_current_role() not in ('admin','administrator','founder','fondateur') then
      raise exception 'La localisation du profil doit être modifiée depuis un parcours autorisé.' using errcode='42501';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.ida_guard_geo_profile_updates() from public,anon,authenticated;
drop trigger if exists ida_guard_geo_profile_updates on public.profiles;
create trigger ida_guard_geo_profile_updates before update of geo_province_id,geo_locality_id,geo_commune_id,geo_quartier_id,geo_road_id,geo_rural_unit_id,geo_groupement_id,geo_village_id on public.profiles
  for each row execute function public.ida_guard_geo_profile_updates();

create index if not exists profiles_geo_province_idx on public.profiles(geo_province_id);
create index if not exists profiles_geo_locality_idx on public.profiles(geo_locality_id);
create index if not exists profiles_geo_commune_idx on public.profiles(geo_commune_id);
create index if not exists profiles_geo_quartier_idx on public.profiles(geo_quartier_id);
create index if not exists profiles_geo_road_idx on public.profiles(geo_road_id);
create index if not exists profiles_geo_rural_unit_idx on public.profiles(geo_rural_unit_id);
create index if not exists profiles_geo_groupement_idx on public.profiles(geo_groupement_id);
create index if not exists profiles_geo_village_idx on public.profiles(geo_village_id);
create index if not exists ida_geo_localities_parent_idx on public.ida_geo_localities(province_id, locality_type, name);
create index if not exists ida_geo_communes_parent_idx on public.ida_geo_communes(locality_id, name);
create index if not exists ida_geo_quartiers_parent_idx on public.ida_geo_quartiers(commune_id, name);
create index if not exists ida_geo_roads_parent_idx on public.ida_geo_roads(quartier_id, name);
create index if not exists ida_geo_rural_units_parent_idx on public.ida_geo_rural_units(territory_id, name);
create index if not exists ida_geo_groupements_parent_idx on public.ida_geo_groupements(rural_unit_id, name);
create index if not exists ida_geo_villages_parent_idx on public.ida_geo_villages(groupement_id, name);

-- Catalogs are public reference data (read only); no anonymous writes.
do $$ declare t text; begin
  foreach t in array array['ida_geo_provinces','ida_geo_localities','ida_geo_communes','ida_geo_quartiers','ida_geo_roads','ida_geo_rural_units','ida_geo_groupements','ida_geo_villages'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    execute format('grant select on public.%I to anon,authenticated',t);
    execute format('grant insert,update,delete on public.%I to authenticated',t);
    execute format('drop policy if exists ida_geo_public_active_read on public.%I',t);
    execute format('create policy ida_geo_public_active_read on public.%I for select to anon,authenticated using (is_active)',t);
    execute format('drop policy if exists ida_geo_admin_manage on public.%I',t);
    execute format('create policy ida_geo_admin_manage on public.%I for all to authenticated using (public.ida_current_role() in (''admin'',''administrator'',''founder'',''fondateur'')) with check (public.ida_current_role() in (''admin'',''administrator'',''founder'',''fondateur''))',t);
  end loop;
end $$;
alter table public.ida_geo_import_candidates enable row level security;
revoke all on public.ida_geo_import_candidates from public,anon,authenticated;
grant select,insert,update,delete on public.ida_geo_import_candidates to authenticated;
drop policy if exists ida_geo_candidate_admin_all on public.ida_geo_import_candidates;
create policy ida_geo_candidate_admin_all on public.ida_geo_import_candidates for all to authenticated
  using (public.ida_current_role() in ('admin','administrator','founder','fondateur'))
  with check (public.ida_current_role() in ('admin','administrator','founder','fondateur'));

-- Core user-supplied administrative names. Keep the source explicit; no fictitious
-- sector/grouping/village data is seeded below.
insert into public.ida_geo_provinces(name,source) values
  ('Haut-Katanga','Nomenclature fournie dans la demande ONGD IDA; validation administrative recommandée')
on conflict(name) do nothing;

insert into public.ida_geo_localities(province_id,name,locality_type,source)
select p.id,v.name,v.kind,'Nomenclature fournie dans la demande ONGD IDA; validation administrative recommandée'
from public.ida_geo_provinces p
cross join (values
  ('Lubumbashi','city'),('Likasi','city'),
  ('Kambove','territory'),('Kasenga','territory'),('Kipushi','territory'),
  ('Mitwaba','territory'),('Pweto','territory'),('Sakania','territory')
) as v(name,kind)
where p.name='Haut-Katanga'
on conflict(province_id,locality_type,name) do nothing;

insert into public.ida_geo_communes(locality_id,name,source)
select l.id,v.name,'Liste fournie dans la demande ONGD IDA; validation communale recommandée'
from public.ida_geo_localities l
cross join (values
 ('Commune Annexe'),('Kamalondo'),('Kampemba'),('Katuba'),('Kenya'),('Lubumbashi'),('Ruashi')
) as v(name)
where l.name='Lubumbashi' and l.locality_type='city'
on conflict(locality_id,name) do nothing;

insert into public.ida_geo_communes(locality_id,name,source)
select l.id,v.name,'Liste fournie dans la demande ONGD IDA; validation communale recommandée'
from public.ida_geo_localities l
cross join (values ('Likasi'),('Kikula'),('Panda'),('Shituru')) as v(name)
where l.name='Likasi' and l.locality_type='city'
on conflict(locality_id,name) do nothing;

-- Quarter-to-commune parent hints were explicitly grouped by the requester, but
-- their complete official status and current subdivision are not independently
-- verified. Store with needs_review so they are labelled as such in the app.
insert into public.ida_geo_quartiers(commune_id,name,verification_status,source,source_reference)
select c.id, v.name, 'needs_review', 'Exemples groupés par commune dans la demande ONGD IDA; statut/parent à valider', 'User-provided list, received 2026-10-08'
from public.ida_geo_communes c
join public.ida_geo_localities l on l.id=c.locality_id and l.name='Lubumbashi' and l.locality_type='city'
join public.ida_geo_provinces p on p.id=l.province_id and p.name='Haut-Katanga'
join (values
 ('Commune Annexe','Kalebuka'),('Commune Annexe','Kasapa'),('Commune Annexe','Kasungami'),('Commune Annexe','Kimbembe'),('Commune Annexe','Kisanga'),('Commune Annexe','Luwowoshi'),('Commune Annexe','Munua'),('Commune Annexe','Naviundu'),('Commune Annexe','Kilobelobe'),('Commune Annexe','Kamisepe'),('Commune Annexe','Joli-Site'),('Commune Annexe','Munama'),('Commune Annexe','Kashamata'),('Commune Annexe','Kasamba'),('Commune Annexe','Kanyaka'),('Commune Annexe','Katwatwa'),('Commune Annexe','Makwatsha'),('Commune Annexe','Kafubu Village'),('Commune Annexe','Kamasaka'),('Commune Annexe','Zambia'),('Commune Annexe','CRAA'),
 ('Kamalondo','Kitumaini'),('Kamalondo','Njanja'),
 ('Kampemba','Bel-Air I'),('Kampemba','Bel-Air II'),('Kampemba','Bongonga'),('Kampemba','Quartier Industriel'),('Kampemba','Kafubu'),('Kampemba','Kampemba'),('Kampemba','Kigoma / Cadastre'),('Kampemba','Hewa-Bora'),('Kampemba','Megastore'),
 ('Katuba','Bukama'),('Katuba','Kaponda'),('Katuba','Kaponda Nord'),('Katuba','Kaponda Sud'),('Katuba','Kinyama'),('Katuba','Kimilolo'),('Katuba','Kisale'),('Katuba','Lufira'),('Katuba','Musumba'),('Katuba','Mwana-Shaba'),('Katuba','Nsele'),('Katuba','Upemba'),('Katuba','Matete'),
 ('Kenya','Lualaba'),('Kenya','Luapula'),('Kenya','Luvua'),('Kenya','Brondo'),
 ('Lubumbashi','Gambela I'),('Lubumbashi','Gambela II'),('Lubumbashi','Gambela III'),('Lubumbashi','Kalubwe'),('Lubumbashi','Kiwele'),('Lubumbashi','Lido-Golf'),('Lubumbashi','Lumumba'),('Lubumbashi','Makutano'),('Lubumbashi','Mampala'),('Lubumbashi','Météo'),('Lubumbashi','Salama'),('Lubumbashi','Baudoin'),('Lubumbashi','Makomeno'),('Lubumbashi','Golf-Malela'),('Lubumbashi','Golf-Tshiamalale'),('Lubumbashi','Golf-Plateau'),('Lubumbashi','Golf-Faustin'),
 ('Ruashi','Bendera'),('Ruashi','Kalukuluku'),('Ruashi','Matoleo'),('Ruashi','Shindaika'),('Ruashi','Congo'),('Ruashi','Radem'),('Ruashi','Luano')
) as v(commune_name,name) on v.commune_name=c.name
on conflict(commune_id,name) do nothing;

-- Staging rows from OSM: road names and administrative-level-8 neighborhood
-- names were observed around Lubumbashi; no parent quarter is asserted where OSM
-- does not establish it. OSM is community-maintained, not an official gazetteer.
insert into public.ida_geo_import_candidates(candidate_type,name,parent_hint,admin_level,source,source_reference,source_object_type,source_object_id,verification_status,notes)
values
 ('avenue','Avenue de Lubutu',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/460108658','way','460108658','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('rue','Rue Muzuzu',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/460110930','way','460110930','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('rue','Rue Baraka',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/460110933','way','460110933','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Avenue de la Luano',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/460110939','way','460110939','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Avenue Malemba Nkulu',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/460590047','way','460590047','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Avenue Nana Banza',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/460590049','way','460590049','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Avenue Saint Pierre',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/460590050','way','460590050','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Avenue de la Révolution',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/460590139','way','460590139','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Avenue Lupembe',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/460590140','way','460590140','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Avenue Jason Sendwe',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/460590146','way','460590146','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Avenue Moero',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/460590148','way','460590148','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Avenue de Méthodiste',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/460610425','way','460610425','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Route Kasumbalesa',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/460668034','way','460668034','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Avenue Kapenda',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/460774958','way','460774958','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Avenue Biayi',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/460774959','way','460774959','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Avenue Bukama',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/463490064','way','463490064','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Avenue du Cuivre',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/463490066','way','463490066','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Boulevard de la Katuba',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/574075034','way','574075034','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Avenue de la Paix',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/573021524','way','573021524','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Avenue de la Victoire',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/462647013','way','462647013','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Avenue Kasavubu',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/573021530','way','573021530','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Avenue du 30 Juin',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/573369382','way','573369382','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Avenue Lulua',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/463911538','way','463911538','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('avenue','Avenue Aru',null,null,'OpenStreetMap','https://www.openstreetmap.org/way/463911539','way','463911539','needs_review','Observed in Lubumbashi bbox; exact quartier not independently established.'),
 ('quartier','Lualaba',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5387804','relation','5387804','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Luapula',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5387805','relation','5387805','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Luvua',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5387806','relation','5387806','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Kiwele',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5387897','relation','5387897','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Lumumba',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5387898','relation','5387898','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Bendera',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5387971','relation','5387971','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Luano',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5387973','relation','5387973','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Matoleo',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5387974','relation','5387974','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Shindaika',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5387975','relation','5387975','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Congo',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5388019','relation','5388019','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Lido-Golf',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5388069','relation','5388069','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Bel-Air 1',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5388070','relation','5388070','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Industriel',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5388071','relation','5388071','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Kalubwe',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5388072','relation','5388072','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Kasapa',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5392567','relation','5392567','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Kasungami',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5392568','relation','5392568','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Kimbembe',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5392569','relation','5392569','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Kisanga',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5392570','relation','5392570','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Luwowoshi',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5392571','relation','5392571','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Munua',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5392572','relation','5392572','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Bel-Air 2',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5399817','relation','5399817','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Kalebuka',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5399818','relation','5399818','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Kalukuluku',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5399819','relation','5399819','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Kisale',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5399821','relation','5399821','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Lufira',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5399822','relation','5399822','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Musumba',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5399823','relation','5399823','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Naviundu',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5399825','relation','5399825','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Upemba',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5399826','relation','5399826','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Kaponda Nord',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5411287','relation','5411287','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Kaponda Sud',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5411466','relation','5411466','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Megastore',null,'9','OpenStreetMap','https://www.openstreetmap.org/relation/5502453','relation','5502453','needs_review','OSM administrative level 9; subdivision level and parent commune require validation.'),
 ('quartier','Munama',null,'9','OpenStreetMap','https://www.openstreetmap.org/relation/5502454','relation','5502454','needs_review','OSM administrative level 9; subdivision level and parent commune require validation.'),
 ('quartier','Kafubu',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5399840','relation','5399840','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Kampemba',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5399841','relation','5399841','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Mampala',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5400765','relation','5400765','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Kigoma',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5400830','relation','5400830','needs_review','OSM administrative level 8; parent commune requires validation.'),
 ('quartier','Nsele',null,'8','OpenStreetMap','https://www.openstreetmap.org/relation/5400833','relation','5400833','needs_review','OSM administrative level 8; parent commune requires validation.')
on conflict(source,source_object_type,source_object_id,candidate_type,name) do nothing;

notify pgrst, 'reload schema';
commit;
