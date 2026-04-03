create schema if not exists legacy_product;

create table if not exists legacy_product.migration_inventory (
  id bigserial primary key,
  archived_at timestamptz not null default timezone('utc', now()),
  source_schema text not null,
  target_schema text not null,
  table_name text not null,
  row_count bigint,
  notes text
);

do $$
declare
  target_table text;
  table_count bigint;
begin
  foreach target_table in array array[
    'feature_card_components',
    'feature_card_pages',
    'feature_card_userflows',
    'layout_components',
    'page_layouts',
    'userflow_pages',
    'components',
    'feature_cards',
    'pages',
    'project_members',
    'userflows',
    'projects'
  ]
  loop
    if exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = target_table
    ) then
      execute format('select count(*) from public.%I', target_table) into table_count;

      insert into legacy_product.migration_inventory (source_schema, target_schema, table_name, row_count, notes)
      values ('public', 'legacy_product', target_table, table_count, 'Archived before FlowForge enterprise schema bootstrap');

      execute format('alter table public.%I set schema legacy_product', target_table);
    end if;
  end loop;
end $$;