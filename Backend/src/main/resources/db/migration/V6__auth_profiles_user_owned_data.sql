create extension if not exists pgcrypto;
create extension if not exists citext;

alter table public.users add column if not exists username text;
alter table public.users add column if not exists profile_photo text;

update public.users u
set
  email = coalesce(nullif(u.email::text, ''), au.email, concat('user+', u.id::text, '@chicagoinsider.local'))::citext,
  profile_photo = coalesce(u.profile_photo, u.avatar_url)
from auth.users au
where u.id = au.id
  and (u.email is null or nullif(u.email::text, '') is null or u.profile_photo is null);

update public.users
set email = concat('user+', id::text, '@chicagoinsider.local')::citext
where email is null or nullif(email::text, '') is null;

with username_candidates as (
  select
    id,
    left(
      trim(both '-' from regexp_replace(
        lower(coalesce(nullif(username, ''), nullif(display_name, ''), split_part(email::text, '@', 1), concat('user_', left(id::text, 8)))),
        '[^a-z0-9_-]+',
        '-',
        'g'
      )),
      32
    ) as base_username
  from public.users
),
ranked_usernames as (
  select
    id,
    case
      when length(base_username) >= 3 then base_username
      else concat('user_', replace(left(id::text, 8), '-', ''))
    end as base_username,
    row_number() over (
      partition by case
        when length(base_username) >= 3 then base_username
        else concat('user_', replace(left(id::text, 8), '-', ''))
      end
      order by id
    ) as duplicate_rank
  from username_candidates
)
update public.users u
set username = case
  when r.duplicate_rank = 1 then r.base_username
  else left(r.base_username, 23) || '_' || r.duplicate_rank::text || '_' || left(replace(u.id::text, '-', ''), 6)
end
from ranked_usernames r
where u.id = r.id
  and (u.username is null or nullif(u.username, '') is null);

with ranked_existing_usernames as (
  select
    id,
    username,
    row_number() over (partition by username order by id) as duplicate_rank
  from public.users
)
update public.users u
set username = left(r.username, 23) || '_' || r.duplicate_rank::text || '_' || left(replace(u.id::text, '-', ''), 6)
from ranked_existing_usernames r
where u.id = r.id
  and r.duplicate_rank > 1;

alter table public.users alter column username set not null;
alter table public.users alter column email set not null;

create unique index if not exists idx_users_username_unique on public.users(username);
create unique index if not exists idx_users_email_unique on public.users(email);

alter table public.collections add column if not exists user_id uuid references public.users(id) on delete cascade;
alter table public.playbooks add column if not exists user_id uuid references public.users(id) on delete cascade;
alter table public.outings add column if not exists user_id uuid references public.users(id) on delete cascade;
alter table public.outings add column if not exists creator_user_id uuid references public.users(id) on delete cascade;

update public.collections set user_id = owner_id where user_id is null and owner_id is not null;
update public.playbooks set user_id = owner_id where user_id is null and owner_id is not null;
update public.outings set user_id = owner_id where user_id is null and owner_id is not null;
update public.outings set creator_user_id = coalesce(creator_user_id, owner_id, user_id) where creator_user_id is null;

create table if not exists public.saved_spots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, place_id)
);

create index if not exists idx_saved_spots_user on public.saved_spots(user_id);
create index if not exists idx_saved_spots_place on public.saved_spots(place_id);
create index if not exists idx_collections_user on public.collections(user_id);
create index if not exists idx_playbooks_user on public.playbooks(user_id);
create index if not exists idx_outings_user on public.outings(user_id);
create index if not exists idx_outings_creator_user on public.outings(creator_user_id);

drop trigger if exists set_updated_at on public.saved_spots;
create trigger set_updated_at
before update on public.saved_spots
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
  final_username text;
begin
  requested_username := left(
    trim(both '-' from regexp_replace(
      lower(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1), concat('user_', left(new.id::text, 8)))),
      '[^a-z0-9_-]+',
      '-',
      'g'
    )),
    32
  );

  if requested_username is null or length(requested_username) < 3 then
    requested_username := concat('user_', replace(left(new.id::text, 8), '-', ''));
  end if;

  final_username := requested_username;

  while exists (
    select 1 from public.users
    where username = final_username and id <> new.id
  ) loop
    final_username := left(requested_username, 22) || '_' || left(replace(new.id::text, '-', ''), 8);
  end loop;

  insert into public.users (
    id,
    username,
    email,
    profile_photo,
    avatar_url,
    display_name
  )
  values (
    new.id,
    final_username,
    lower(new.email)::citext,
    new.raw_user_meta_data->>'profile_photo',
    new.raw_user_meta_data->>'profile_photo',
    final_username
  )
  on conflict (id) do update
  set
    email = excluded.email,
    profile_photo = coalesce(public.users.profile_photo, excluded.profile_photo),
    avatar_url = coalesce(public.users.avatar_url, excluded.avatar_url),
    display_name = coalesce(public.users.display_name, excluded.display_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.outing_creator_id(target_outing_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(o.creator_user_id, o.user_id, o.owner_id)
  from public.outings o
  where o.id = target_outing_id
$$;

create or replace function public.can_read_outing(target_outing_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.outings o
    where o.id = target_outing_id
      and coalesce(o.creator_user_id, o.user_id, o.owner_id) = target_user_id
  )
  or exists (
    select 1
    from public.outing_contributors oc
    where oc.outing_id = target_outing_id
      and oc.user_id = target_user_id
      and oc.permission in ('read', 'suggest', 'write')
  )
$$;

create or replace function public.can_suggest_outing(target_outing_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.outings o
    where o.id = target_outing_id
      and coalesce(o.creator_user_id, o.user_id, o.owner_id) = target_user_id
  )
  or exists (
    select 1
    from public.outing_contributors oc
    where oc.outing_id = target_outing_id
      and oc.user_id = target_user_id
      and oc.permission in ('suggest', 'write')
  )
$$;

create or replace function public.can_write_outing(target_outing_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.outings o
    where o.id = target_outing_id
      and coalesce(o.creator_user_id, o.user_id, o.owner_id) = target_user_id
  )
  or exists (
    select 1
    from public.outing_contributors oc
    where oc.outing_id = target_outing_id
      and oc.user_id = target_user_id
      and oc.permission = 'write'
  )
$$;

alter table public.saved_spots enable row level security;
alter table public.users enable row level security;
alter table public.places enable row level security;
alter table public.collections enable row level security;
alter table public.collection_places enable row level security;
alter table public.outings enable row level security;
alter table public.outing_places enable row level security;
alter table public.outing_contributors enable row level security;
alter table public.playbooks enable row level security;
alter table public.playbook_places enable row level security;
alter table public.reviews enable row level security;
alter table public.trending_places enable row level security;

drop policy if exists users_select_own on public.users;
drop policy if exists users_insert_own on public.users;
drop policy if exists users_update_own on public.users;
drop policy if exists places_select_all on public.places;
drop policy if exists collections_select_visible on public.collections;
drop policy if exists collections_insert_own on public.collections;
drop policy if exists collections_update_own on public.collections;
drop policy if exists collections_delete_own on public.collections;
drop policy if exists collection_places_select_visible on public.collection_places;
drop policy if exists collection_places_insert_own_collection on public.collection_places;
drop policy if exists collection_places_delete_own_collection on public.collection_places;
drop policy if exists outings_select_allowed on public.outings;
drop policy if exists outings_insert_own on public.outings;
drop policy if exists outings_update_write on public.outings;
drop policy if exists outings_delete_owner on public.outings;
drop policy if exists outing_places_select_allowed on public.outing_places;
drop policy if exists outing_places_insert_suggest_or_write on public.outing_places;
drop policy if exists outing_places_update_write on public.outing_places;
drop policy if exists outing_places_delete_write on public.outing_places;
drop policy if exists outing_contributors_select_related on public.outing_contributors;
drop policy if exists outing_contributors_owner_write on public.outing_contributors;
drop policy if exists playbooks_select_visible on public.playbooks;
drop policy if exists playbooks_insert_own on public.playbooks;
drop policy if exists playbooks_update_own on public.playbooks;
drop policy if exists playbooks_delete_own on public.playbooks;
drop policy if exists playbook_places_select_visible on public.playbook_places;
drop policy if exists playbook_places_write_own on public.playbook_places;
drop policy if exists reviews_select_all on public.reviews;
drop policy if exists reviews_insert_own on public.reviews;
drop policy if exists reviews_update_own on public.reviews;
drop policy if exists reviews_delete_own on public.reviews;
drop policy if exists trending_places_select_all on public.trending_places;

drop policy if exists saved_spots_select_own on public.saved_spots;
drop policy if exists saved_spots_insert_own on public.saved_spots;
drop policy if exists saved_spots_update_own on public.saved_spots;
drop policy if exists saved_spots_delete_own on public.saved_spots;
drop policy if exists collections_select_own_or_public on public.collections;
drop policy if exists collections_insert_user_owned on public.collections;
drop policy if exists collections_update_user_owned on public.collections;
drop policy if exists collections_delete_user_owned on public.collections;
drop policy if exists collection_places_select_collection_access on public.collection_places;
drop policy if exists collection_places_insert_collection_owner on public.collection_places;
drop policy if exists collection_places_update_collection_owner on public.collection_places;
drop policy if exists collection_places_delete_collection_owner on public.collection_places;
drop policy if exists playbooks_select_own_or_public on public.playbooks;
drop policy if exists playbooks_insert_user_owned on public.playbooks;
drop policy if exists playbooks_update_user_owned on public.playbooks;
drop policy if exists playbooks_delete_user_owned on public.playbooks;
drop policy if exists playbook_places_select_playbook_access on public.playbook_places;
drop policy if exists playbook_places_insert_playbook_owner on public.playbook_places;
drop policy if exists playbook_places_update_playbook_owner on public.playbook_places;
drop policy if exists playbook_places_delete_playbook_owner on public.playbook_places;
drop policy if exists outings_select_creator_or_contributor on public.outings;
drop policy if exists outings_insert_creator on public.outings;
drop policy if exists outings_update_write_role on public.outings;
drop policy if exists outings_delete_creator on public.outings;
drop policy if exists outing_places_select_outing_access on public.outing_places;
drop policy if exists outing_places_insert_suggest_role on public.outing_places;
drop policy if exists outing_places_update_write_role on public.outing_places;
drop policy if exists outing_places_delete_write_role on public.outing_places;
drop policy if exists outing_contributors_select_outing_access on public.outing_contributors;
drop policy if exists outing_contributors_insert_creator on public.outing_contributors;
drop policy if exists outing_contributors_update_creator on public.outing_contributors;
drop policy if exists outing_contributors_delete_creator on public.outing_contributors;

create policy users_select_own on public.users
for select using (id = auth.uid());

create policy users_insert_own on public.users
for insert with check (id = auth.uid());

create policy users_update_own on public.users
for update using (id = auth.uid()) with check (id = auth.uid());

create policy places_select_all on public.places
for select using (true);

create policy saved_spots_select_own on public.saved_spots
for select using (user_id = auth.uid());

create policy saved_spots_insert_own on public.saved_spots
for insert with check (user_id = auth.uid());

create policy saved_spots_update_own on public.saved_spots
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy saved_spots_delete_own on public.saved_spots
for delete using (user_id = auth.uid());

create policy collections_select_own_or_public on public.collections
for select using (coalesce(user_id, owner_id) = auth.uid() or visibility = 'public');

create policy collections_insert_user_owned on public.collections
for insert with check (coalesce(user_id, owner_id) = auth.uid());

create policy collections_update_user_owned on public.collections
for update using (coalesce(user_id, owner_id) = auth.uid()) with check (coalesce(user_id, owner_id) = auth.uid());

create policy collections_delete_user_owned on public.collections
for delete using (coalesce(user_id, owner_id) = auth.uid());

create policy collection_places_select_collection_access on public.collection_places
for select using (
  exists (
    select 1 from public.collections c
    where c.id = collection_id
      and (coalesce(c.user_id, c.owner_id) = auth.uid() or c.visibility = 'public')
  )
);

create policy collection_places_insert_collection_owner on public.collection_places
for insert with check (
  exists (
    select 1 from public.collections c
    where c.id = collection_id and coalesce(c.user_id, c.owner_id) = auth.uid()
  )
);

create policy collection_places_update_collection_owner on public.collection_places
for update using (
  exists (
    select 1 from public.collections c
    where c.id = collection_id and coalesce(c.user_id, c.owner_id) = auth.uid()
  )
) with check (
  exists (
    select 1 from public.collections c
    where c.id = collection_id and coalesce(c.user_id, c.owner_id) = auth.uid()
  )
);

create policy collection_places_delete_collection_owner on public.collection_places
for delete using (
  exists (
    select 1 from public.collections c
    where c.id = collection_id and coalesce(c.user_id, c.owner_id) = auth.uid()
  )
);

create policy playbooks_select_own_or_public on public.playbooks
for select using (coalesce(user_id, owner_id) = auth.uid() or visibility = 'public');

create policy playbooks_insert_user_owned on public.playbooks
for insert with check (coalesce(user_id, owner_id) = auth.uid());

create policy playbooks_update_user_owned on public.playbooks
for update using (coalesce(user_id, owner_id) = auth.uid()) with check (coalesce(user_id, owner_id) = auth.uid());

create policy playbooks_delete_user_owned on public.playbooks
for delete using (coalesce(user_id, owner_id) = auth.uid());

create policy playbook_places_select_playbook_access on public.playbook_places
for select using (
  exists (
    select 1 from public.playbooks p
    where p.id = playbook_id
      and (coalesce(p.user_id, p.owner_id) = auth.uid() or p.visibility = 'public')
  )
);

create policy playbook_places_insert_playbook_owner on public.playbook_places
for insert with check (
  exists (
    select 1 from public.playbooks p
    where p.id = playbook_id and coalesce(p.user_id, p.owner_id) = auth.uid()
  )
);

create policy playbook_places_update_playbook_owner on public.playbook_places
for update using (
  exists (
    select 1 from public.playbooks p
    where p.id = playbook_id and coalesce(p.user_id, p.owner_id) = auth.uid()
  )
) with check (
  exists (
    select 1 from public.playbooks p
    where p.id = playbook_id and coalesce(p.user_id, p.owner_id) = auth.uid()
  )
);

create policy playbook_places_delete_playbook_owner on public.playbook_places
for delete using (
  exists (
    select 1 from public.playbooks p
    where p.id = playbook_id and coalesce(p.user_id, p.owner_id) = auth.uid()
  )
);

create policy outings_select_creator_or_contributor on public.outings
for select using (public.can_read_outing(id, auth.uid()));

create policy outings_insert_creator on public.outings
for insert with check (coalesce(creator_user_id, user_id, owner_id) = auth.uid());

create policy outings_update_write_role on public.outings
for update using (public.can_write_outing(id, auth.uid()))
with check (public.can_write_outing(id, auth.uid()));

create policy outings_delete_creator on public.outings
for delete using (public.outing_creator_id(id) = auth.uid());

create policy outing_places_select_outing_access on public.outing_places
for select using (public.can_read_outing(outing_id, auth.uid()));

create policy outing_places_insert_suggest_role on public.outing_places
for insert with check (
  public.can_suggest_outing(outing_id, auth.uid())
  and (added_by is null or added_by = auth.uid())
);

create policy outing_places_update_write_role on public.outing_places
for update using (public.can_write_outing(outing_id, auth.uid()))
with check (public.can_write_outing(outing_id, auth.uid()));

create policy outing_places_delete_write_role on public.outing_places
for delete using (public.can_write_outing(outing_id, auth.uid()));

create policy outing_contributors_select_outing_access on public.outing_contributors
for select using (user_id = auth.uid() or public.can_read_outing(outing_id, auth.uid()));

create policy outing_contributors_insert_creator on public.outing_contributors
for insert with check (
  public.outing_creator_id(outing_id) = auth.uid()
  and permission in ('read', 'suggest', 'write')
);

create policy outing_contributors_update_creator on public.outing_contributors
for update using (public.outing_creator_id(outing_id) = auth.uid())
with check (
  public.outing_creator_id(outing_id) = auth.uid()
  and permission in ('read', 'suggest', 'write')
);

create policy outing_contributors_delete_creator on public.outing_contributors
for delete using (public.outing_creator_id(outing_id) = auth.uid());

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

grant select on public.places, public.trending_places, public.reviews to anon, authenticated;
grant select, insert, update, delete on
  public.users,
  public.saved_spots,
  public.collections,
  public.collection_places,
  public.playbooks,
  public.playbook_places,
  public.outings,
  public.outing_places,
  public.outing_contributors,
  public.reviews
to authenticated;

comment on table public.saved_spots is
  'Private per-user saved places. RLS restricts rows to saved_spots.user_id = auth.uid().';

comment on column public.outing_contributors.permission is
  'Shared outing contributor role: read, suggest, or write.';
