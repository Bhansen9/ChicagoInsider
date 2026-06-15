create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext unique,
  display_name text,
  avatar_url text,
  bio text,
  home_neighborhood text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  google_place_id text not null unique,
  name text not null,
  formatted_address text,
  category text,
  primary_type text,
  price_level integer,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  geohash text,
  website_url text,
  google_maps_url text,
  photo_references jsonb not null default '[]'::jsonb,
  raw_google_payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  rating_average numeric(3, 2) not null default 0 check (rating_average >= 0 and rating_average <= 5),
  rating_count integer not null default 0 check (rating_count >= 0),
  review_count integer not null default 0 check (review_count >= 0),
  search_count integer not null default 0 check (search_count >= 0),
  save_count integer not null default 0 check (save_count >= 0),
  outing_usage_count integer not null default 0 check (outing_usage_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  visibility text not null default 'private' check (visibility in ('private', 'shared', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_places (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  added_by uuid references public.users(id) on delete set null,
  position integer not null default 0 check (position >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection_id, place_id)
);

create table if not exists public.outings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'planned', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outing_places (
  id uuid primary key default gen_random_uuid(),
  outing_id uuid not null references public.outings(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  added_by uuid references public.users(id) on delete set null,
  position integer not null default 0 check (position >= 0),
  estimated_duration_minutes integer check (estimated_duration_minutes is null or estimated_duration_minutes > 0),
  notes text,
  planned_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (outing_id, place_id)
);

create table if not exists public.outing_contributors (
  id uuid primary key default gen_random_uuid(),
  outing_id uuid not null references public.outings(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  permission text not null check (permission in ('owner', 'write', 'suggest', 'read')),
  invited_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (outing_id, user_id)
);

create table if not exists public.playbooks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  visibility text not null default 'private' check (visibility in ('private', 'shared', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playbook_places (
  id uuid primary key default gen_random_uuid(),
  playbook_id uuid not null references public.playbooks(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (playbook_id, place_id)
);

create table if not exists public.place_search_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  query text not null,
  category text,
  location_geohash text,
  request_hash text not null,
  results jsonb not null default '[]'::jsonb,
  expires_at timestamptz not null,
  hit_count integer not null default 0 check (hit_count >= 0),
  last_hit_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (place_id, user_id)
);

create table if not exists public.trending_places (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  week_start date not null,
  search_count integer not null default 0 check (search_count >= 0),
  saves integer not null default 0 check (saves >= 0),
  outing_usage integer not null default 0 check (outing_usage >= 0),
  reviews integer not null default 0 check (reviews >= 0),
  trend_score numeric(12, 4) not null default 0,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (place_id, week_start)
);

create index if not exists idx_users_email on public.users(email);
create index if not exists idx_places_google_place_id on public.places(google_place_id);
create index if not exists idx_places_category on public.places(category);
create index if not exists idx_places_geohash on public.places(geohash);
create index if not exists idx_places_location on public.places(latitude, longitude);
create index if not exists idx_places_raw_google_payload on public.places using gin(raw_google_payload);
create index if not exists idx_collections_owner on public.collections(owner_id);
create index if not exists idx_collection_places_collection_position on public.collection_places(collection_id, position);
create index if not exists idx_collection_places_place on public.collection_places(place_id);
create index if not exists idx_outings_owner on public.outings(owner_id);
create index if not exists idx_outing_places_outing_position on public.outing_places(outing_id, position);
create index if not exists idx_outing_places_place on public.outing_places(place_id);
create index if not exists idx_outing_contributors_outing on public.outing_contributors(outing_id);
create index if not exists idx_outing_contributors_user on public.outing_contributors(user_id);
create index if not exists idx_playbooks_owner on public.playbooks(owner_id);
create index if not exists idx_playbook_places_playbook_position on public.playbook_places(playbook_id, position);
create index if not exists idx_search_cache_lookup on public.place_search_cache(cache_key, expires_at);
create index if not exists idx_reviews_place on public.reviews(place_id);
create index if not exists idx_reviews_user on public.reviews(user_id);
create index if not exists idx_trending_places_week_score on public.trending_places(week_start, trend_score desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.refresh_place_review_stats(target_place_id uuid)
returns void
language plpgsql
as $$
begin
  update public.places p
  set
    review_count = coalesce(stats.review_count, 0),
    rating_count = coalesce(stats.review_count, 0),
    rating_average = coalesce(stats.rating_average, 0),
    updated_at = now()
  from (
    select
      target_place_id as place_id,
      count(*)::integer as review_count,
      round(avg(rating)::numeric, 2) as rating_average
    from public.reviews
    where place_id = target_place_id
  ) stats
  where p.id = target_place_id;
end;
$$;

create or replace function public.refresh_place_save_count(target_place_id uuid)
returns void
language plpgsql
as $$
begin
  update public.places
  set
    save_count = (
      select count(*)::integer
      from public.collection_places
      where place_id = target_place_id
    ),
    updated_at = now()
  where id = target_place_id;
end;
$$;

create or replace function public.refresh_place_outing_usage_count(target_place_id uuid)
returns void
language plpgsql
as $$
begin
  update public.places
  set
    outing_usage_count = (
      select count(*)::integer
      from public.outing_places
      where place_id = target_place_id
    ),
    updated_at = now()
  where id = target_place_id;
end;
$$;

create or replace function public.on_review_stats_changed()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_place_review_stats(old.place_id);
    return old;
  end if;

  perform public.refresh_place_review_stats(new.place_id);
  if tg_op = 'UPDATE' and old.place_id <> new.place_id then
    perform public.refresh_place_review_stats(old.place_id);
  end if;
  return new;
end;
$$;

create or replace function public.on_collection_place_stats_changed()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_place_save_count(old.place_id);
    return old;
  end if;

  perform public.refresh_place_save_count(new.place_id);
  return new;
end;
$$;

create or replace function public.on_outing_place_stats_changed()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_place_outing_usage_count(old.place_id);
    return old;
  end if;

  perform public.refresh_place_outing_usage_count(new.place_id);
  return new;
end;
$$;

create or replace function public.refresh_weekly_trending(target_week_start date default date_trunc('week', now())::date)
returns void
language plpgsql
as $$
begin
  insert into public.trending_places (
    place_id,
    week_start,
    search_count,
    saves,
    outing_usage,
    reviews,
    trend_score,
    calculated_at
  )
  select
    p.id,
    target_week_start,
    p.search_count,
    p.save_count,
    p.outing_usage_count,
    p.review_count,
    round((
      (p.search_count * 0.35) +
      (p.save_count * 2.0) +
      (p.outing_usage_count * 3.0) +
      (p.review_count * 1.5) +
      (p.rating_average * 2.0)
    )::numeric, 4),
    now()
  from public.places p
  where (p.search_count + p.save_count + p.outing_usage_count + p.review_count) > 0
  on conflict (place_id, week_start) do update
  set
    search_count = excluded.search_count,
    saves = excluded.saves,
    outing_usage = excluded.outing_usage,
    reviews = excluded.reviews,
    trend_score = excluded.trend_score,
    calculated_at = now(),
    updated_at = now();
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

drop trigger if exists review_stats_changed on public.reviews;
create trigger review_stats_changed
after insert or update or delete on public.reviews
for each row execute function public.on_review_stats_changed();

drop trigger if exists collection_place_stats_changed on public.collection_places;
create trigger collection_place_stats_changed
after insert or delete on public.collection_places
for each row execute function public.on_collection_place_stats_changed();

drop trigger if exists outing_place_stats_changed on public.outing_places;
create trigger outing_place_stats_changed
after insert or delete on public.outing_places
for each row execute function public.on_outing_place_stats_changed();

alter table public.users enable row level security;
alter table public.places enable row level security;
alter table public.collections enable row level security;
alter table public.collection_places enable row level security;
alter table public.outings enable row level security;
alter table public.outing_places enable row level security;
alter table public.outing_contributors enable row level security;
alter table public.playbooks enable row level security;
alter table public.playbook_places enable row level security;
alter table public.place_search_cache enable row level security;
alter table public.reviews enable row level security;
alter table public.trending_places enable row level security;

create policy users_select_own on public.users
for select using (id = auth.uid());

create policy users_insert_own on public.users
for insert with check (id = auth.uid());

create policy users_update_own on public.users
for update using (id = auth.uid()) with check (id = auth.uid());

create policy places_select_all on public.places
for select using (true);

create policy collections_select_visible on public.collections
for select using (owner_id = auth.uid() or visibility = 'public');

create policy collections_insert_own on public.collections
for insert with check (owner_id = auth.uid());

create policy collections_update_own on public.collections
for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy collections_delete_own on public.collections
for delete using (owner_id = auth.uid());

create policy collection_places_select_visible on public.collection_places
for select using (
  exists (
    select 1 from public.collections c
    where c.id = collection_id and (c.owner_id = auth.uid() or c.visibility = 'public')
  )
);

create policy collection_places_insert_own_collection on public.collection_places
for insert with check (
  exists (
    select 1 from public.collections c
    where c.id = collection_id and c.owner_id = auth.uid()
  )
);

create policy collection_places_delete_own_collection on public.collection_places
for delete using (
  exists (
    select 1 from public.collections c
    where c.id = collection_id and c.owner_id = auth.uid()
  )
);

create policy outings_select_allowed on public.outings
for select using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.outing_contributors oc
    where oc.outing_id = id and oc.user_id = auth.uid()
  )
);

create policy outings_insert_own on public.outings
for insert with check (owner_id = auth.uid());

create policy outings_update_write on public.outings
for update using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.outing_contributors oc
    where oc.outing_id = id and oc.user_id = auth.uid() and oc.permission in ('owner', 'write')
  )
) with check (
  owner_id = auth.uid()
  or exists (
    select 1 from public.outing_contributors oc
    where oc.outing_id = id and oc.user_id = auth.uid() and oc.permission in ('owner', 'write')
  )
);

create policy outings_delete_owner on public.outings
for delete using (owner_id = auth.uid());

create policy outing_places_select_allowed on public.outing_places
for select using (
  exists (
    select 1 from public.outings o
    where o.id = outing_id and (
      o.owner_id = auth.uid()
      or exists (
        select 1 from public.outing_contributors oc
        where oc.outing_id = o.id and oc.user_id = auth.uid()
      )
    )
  )
);

create policy outing_places_insert_suggest_or_write on public.outing_places
for insert with check (
  exists (
    select 1 from public.outings o
    where o.id = outing_id and (
      o.owner_id = auth.uid()
      or exists (
        select 1 from public.outing_contributors oc
        where oc.outing_id = o.id
          and oc.user_id = auth.uid()
          and oc.permission in ('owner', 'write', 'suggest')
      )
    )
  )
);

create policy outing_places_update_write on public.outing_places
for update using (
  exists (
    select 1 from public.outings o
    where o.id = outing_id and (
      o.owner_id = auth.uid()
      or exists (
        select 1 from public.outing_contributors oc
        where oc.outing_id = o.id
          and oc.user_id = auth.uid()
          and oc.permission in ('owner', 'write')
      )
    )
  )
);

create policy outing_places_delete_write on public.outing_places
for delete using (
  exists (
    select 1 from public.outings o
    where o.id = outing_id and (
      o.owner_id = auth.uid()
      or exists (
        select 1 from public.outing_contributors oc
        where oc.outing_id = o.id
          and oc.user_id = auth.uid()
          and oc.permission in ('owner', 'write')
      )
    )
  )
);

create policy outing_contributors_select_related on public.outing_contributors
for select using (
  user_id = auth.uid()
  or exists (
    select 1 from public.outings o
    where o.id = outing_id and o.owner_id = auth.uid()
  )
);

create policy outing_contributors_owner_write on public.outing_contributors
for all using (
  exists (
    select 1 from public.outings o
    where o.id = outing_id and o.owner_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.outings o
    where o.id = outing_id and o.owner_id = auth.uid()
  )
);

create policy playbooks_select_visible on public.playbooks
for select using (owner_id = auth.uid() or visibility = 'public');

create policy playbooks_insert_own on public.playbooks
for insert with check (owner_id = auth.uid());

create policy playbooks_update_own on public.playbooks
for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy playbooks_delete_own on public.playbooks
for delete using (owner_id = auth.uid());

create policy playbook_places_select_visible on public.playbook_places
for select using (
  exists (
    select 1 from public.playbooks p
    where p.id = playbook_id and (p.owner_id = auth.uid() or p.visibility = 'public')
  )
);

create policy playbook_places_write_own on public.playbook_places
for all using (
  exists (
    select 1 from public.playbooks p
    where p.id = playbook_id and p.owner_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.playbooks p
    where p.id = playbook_id and p.owner_id = auth.uid()
  )
);

create policy reviews_select_all on public.reviews
for select using (true);

create policy reviews_insert_own on public.reviews
for insert with check (user_id = auth.uid());

create policy reviews_update_own on public.reviews
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy reviews_delete_own on public.reviews
for delete using (user_id = auth.uid());

create policy trending_places_select_all on public.trending_places
for select using (true);

comment on table public.place_search_cache is
  'Server-managed Google Places cache. RLS is enabled with no client policies so app clients cannot forge cache entries.';

comment on function public.refresh_weekly_trending(date) is
  'Snapshots weekly trend scores from search_count, collection saves, outing usage, reviews, and rating average.';
