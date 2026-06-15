do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'places'
      and column_name = 'price_level'
      and data_type in ('text', 'character varying')
  ) then
    alter table public.places
    alter column price_level type integer using (
      case upper(price_level)
        when 'PRICE_LEVEL_FREE' then 0
        when 'PRICE_LEVEL_INEXPENSIVE' then 1
        when 'PRICE_LEVEL_MODERATE' then 2
        when 'PRICE_LEVEL_EXPENSIVE' then 3
        when 'PRICE_LEVEL_VERY_EXPENSIVE' then 4
        when 'FREE' then 0
        when 'INEXPENSIVE' then 1
        when 'MODERATE' then 2
        when 'EXPENSIVE' then 3
        when 'VERY_EXPENSIVE' then 4
        else nullif(regexp_replace(price_level, '[^0-9]', '', 'g'), '')::integer
      end
    );
  end if;
end;
$$;
