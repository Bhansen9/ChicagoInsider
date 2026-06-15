create extension if not exists pgcrypto;

create table if not exists public.users (id uuid primary key);
create table if not exists public.places (id uuid primary key default gen_random_uuid());
create table if not exists public.collections (id uuid primary key default gen_random_uuid());
create table if not exists public.collection_places (id uuid primary key default gen_random_uuid());
create table if not exists public.outings (id uuid primary key default gen_random_uuid());
create table if not exists public.outing_places (id uuid primary key default gen_random_uuid());
create table if not exists public.outing_contributors (id uuid primary key default gen_random_uuid());
create table if not exists public.playbooks (id uuid primary key default gen_random_uuid());
create table if not exists public.playbook_places (id uuid primary key default gen_random_uuid());
create table if not exists public.place_search_cache (id uuid primary key default gen_random_uuid());
create table if not exists public.reviews (id uuid primary key default gen_random_uuid());
create table if not exists public.trending_places (id uuid primary key default gen_random_uuid());

alter table public.users add column if not exists email text;
alter table public.users add column if not exists display_name text;
alter table public.users add column if not exists avatar_url text;
alter table public.users add column if not exists bio text;
alter table public.users add column if not exists home_neighborhood text;
alter table public.users add column if not exists created_at timestamptz not null default now();
alter table public.users add column if not exists updated_at timestamptz not null default now();

alter table public.places add column if not exists google_place_id text;
alter table public.places add column if not exists name text;
alter table public.places add column if not exists formatted_address text;
alter table public.places add column if not exists category text;
alter table public.places add column if not exists primary_type text;
alter table public.places add column if not exists price_level text;
alter table public.places add column if not exists latitude numeric(9, 6);
alter table public.places add column if not exists longitude numeric(9, 6);
alter table public.places add column if not exists geohash text;
alter table public.places add column if not exists website_url text;
alter table public.places add column if not exists google_maps_url text;
alter table public.places add column if not exists photo_references jsonb not null default '[]'::jsonb;
alter table public.places add column if not exists raw_google_payload jsonb not null default '{}'::jsonb;
alter table public.places add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.places add column if not exists rating_average numeric(3, 2) not null default 0;
alter table public.places add column if not exists rating_count integer not null default 0;
alter table public.places add column if not exists review_count integer not null default 0;
alter table public.places add column if not exists search_count integer not null default 0;
alter table public.places add column if not exists save_count integer not null default 0;
alter table public.places add column if not exists outing_usage_count integer not null default 0;
alter table public.places add column if not exists created_at timestamptz not null default now();
alter table public.places add column if not exists updated_at timestamptz not null default now();

alter table public.collections add column if not exists owner_id uuid;
alter table public.collections add column if not exists name text;
alter table public.collections add column if not exists description text;
alter table public.collections add column if not exists visibility text not null default 'private';
alter table public.collections add column if not exists created_at timestamptz not null default now();
alter table public.collections add column if not exists updated_at timestamptz not null default now();

alter table public.collection_places add column if not exists collection_id uuid;
alter table public.collection_places add column if not exists place_id uuid;
alter table public.collection_places add column if not exists added_by uuid;
alter table public.collection_places add column if not exists position integer not null default 0;
alter table public.collection_places add column if not exists notes text;
alter table public.collection_places add column if not exists created_at timestamptz not null default now();
alter table public.collection_places add column if not exists updated_at timestamptz not null default now();

alter table public.outings add column if not exists owner_id uuid;
alter table public.outings add column if not exists title text;
alter table public.outings add column if not exists description text;
alter table public.outings add column if not exists starts_at timestamptz;
alter table public.outings add column if not exists ends_at timestamptz;
alter table public.outings add column if not exists status text not null default 'draft';
alter table public.outings add column if not exists created_at timestamptz not null default now();
alter table public.outings add column if not exists updated_at timestamptz not null default now();

alter table public.outing_places add column if not exists outing_id uuid;
alter table public.outing_places add column if not exists place_id uuid;
alter table public.outing_places add column if not exists added_by uuid;
alter table public.outing_places add column if not exists position integer not null default 0;
alter table public.outing_places add column if not exists estimated_duration_minutes integer;
alter table public.outing_places add column if not exists notes text;
alter table public.outing_places add column if not exists planned_time timestamptz;
alter table public.outing_places add column if not exists created_at timestamptz not null default now();
alter table public.outing_places add column if not exists updated_at timestamptz not null default now();

alter table public.outing_contributors add column if not exists outing_id uuid;
alter table public.outing_contributors add column if not exists user_id uuid;
alter table public.outing_contributors add column if not exists permission text;
alter table public.outing_contributors add column if not exists invited_by uuid;
alter table public.outing_contributors add column if not exists created_at timestamptz not null default now();
alter table public.outing_contributors add column if not exists updated_at timestamptz not null default now();

alter table public.playbooks add column if not exists owner_id uuid;
alter table public.playbooks add column if not exists title text;
alter table public.playbooks add column if not exists description text;
alter table public.playbooks add column if not exists visibility text not null default 'private';
alter table public.playbooks add column if not exists created_at timestamptz not null default now();
alter table public.playbooks add column if not exists updated_at timestamptz not null default now();

alter table public.playbook_places add column if not exists playbook_id uuid;
alter table public.playbook_places add column if not exists place_id uuid;
alter table public.playbook_places add column if not exists position integer not null default 0;
alter table public.playbook_places add column if not exists notes text;
alter table public.playbook_places add column if not exists created_at timestamptz not null default now();
alter table public.playbook_places add column if not exists updated_at timestamptz not null default now();

alter table public.place_search_cache add column if not exists cache_key text;
alter table public.place_search_cache add column if not exists query text;
alter table public.place_search_cache add column if not exists category text;
alter table public.place_search_cache add column if not exists location_geohash text;
alter table public.place_search_cache add column if not exists request_hash text;
alter table public.place_search_cache add column if not exists results jsonb not null default '[]'::jsonb;
alter table public.place_search_cache add column if not exists expires_at timestamptz;
alter table public.place_search_cache add column if not exists hit_count integer not null default 0;
alter table public.place_search_cache add column if not exists last_hit_at timestamptz;
alter table public.place_search_cache add column if not exists created_at timestamptz not null default now();
alter table public.place_search_cache add column if not exists updated_at timestamptz not null default now();

alter table public.reviews add column if not exists place_id uuid;
alter table public.reviews add column if not exists user_id uuid;
alter table public.reviews add column if not exists rating integer;
alter table public.reviews add column if not exists comment text;
alter table public.reviews add column if not exists created_at timestamptz not null default now();
alter table public.reviews add column if not exists updated_at timestamptz not null default now();

alter table public.trending_places add column if not exists place_id uuid;
alter table public.trending_places add column if not exists week_start date;
alter table public.trending_places add column if not exists search_count integer not null default 0;
alter table public.trending_places add column if not exists saves integer not null default 0;
alter table public.trending_places add column if not exists outing_usage integer not null default 0;
alter table public.trending_places add column if not exists reviews integer not null default 0;
alter table public.trending_places add column if not exists trend_score numeric(12, 4) not null default 0;
alter table public.trending_places add column if not exists calculated_at timestamptz not null default now();
alter table public.trending_places add column if not exists created_at timestamptz not null default now();
alter table public.trending_places add column if not exists updated_at timestamptz not null default now();

update public.places set google_place_id = id::text where google_place_id is null;
update public.places set name = coalesce(name, 'Unnamed Chicago place') where name is null;
update public.collections set name = coalesce(name, 'Untitled Collection') where name is null;
update public.outings set title = coalesce(title, 'Untitled Outing') where title is null;
update public.playbooks set title = coalesce(title, 'Untitled Playbook') where title is null;
update public.place_search_cache set cache_key = id::text where cache_key is null;
update public.place_search_cache set query = coalesce(query, '') where query is null;
update public.place_search_cache set request_hash = coalesce(request_hash, id::text) where request_hash is null;
update public.place_search_cache set expires_at = coalesce(expires_at, now()) where expires_at is null;
update public.outing_contributors set permission = coalesce(permission, 'read') where permission is null;
update public.reviews set rating = 1 where rating is null;
update public.trending_places set week_start = current_date where week_start is null;

alter table public.places alter column google_place_id set not null;
alter table public.places alter column name set not null;
alter table public.collections alter column name set not null;
alter table public.outings alter column title set not null;
alter table public.playbooks alter column title set not null;
alter table public.place_search_cache alter column cache_key set not null;
alter table public.place_search_cache alter column query set not null;
alter table public.place_search_cache alter column request_hash set not null;
alter table public.place_search_cache alter column expires_at set not null;
alter table public.outing_contributors alter column permission set not null;
alter table public.reviews alter column rating set not null;
alter table public.trending_places alter column week_start set not null;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users',
    'places',
    'collections',
    'collection_places',
    'outings',
    'outing_places',
    'outing_contributors',
    'playbooks',
    'playbook_places',
    'place_search_cache',
    'reviews',
    'trending_places'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.touch_updated_at()',
      table_name
    );
  end loop;
end;
$$;

create unique index if not exists idx_places_google_place_id_unique on public.places(google_place_id);
create unique index if not exists idx_search_cache_cache_key_unique on public.place_search_cache(cache_key);
create index if not exists idx_collection_places_collection_position on public.collection_places(collection_id, position);
create index if not exists idx_outing_places_outing_position on public.outing_places(outing_id, position);
create index if not exists idx_playbook_places_playbook_position on public.playbook_places(playbook_id, position);
create index if not exists idx_trending_places_week_score on public.trending_places(week_start, trend_score desc);
