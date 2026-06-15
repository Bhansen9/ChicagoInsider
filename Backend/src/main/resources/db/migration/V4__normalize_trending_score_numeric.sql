alter table public.trending_places
alter column trend_score type numeric(12, 4)
using trend_score::numeric(12, 4);

alter table public.trending_places
alter column trend_score set default 0;
