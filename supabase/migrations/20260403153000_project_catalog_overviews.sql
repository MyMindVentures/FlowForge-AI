alter table public.projects
  add column if not exists tagline text not null default '',
  add column if not exists category text,
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists visibility text not null default 'private' check (visibility in ('private', 'internal', 'shared', 'public')),
  add column if not exists app_icon_url text,
  add column if not exists hero_image_url text,
  add column if not exists demo_url text,
  add column if not exists source_url text,
  add column if not exists featured_rank integer not null default 0 check (featured_rank >= 0),
  add column if not exists last_synced_at timestamptz,
  add column if not exists catalog_metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_projects_visibility_status on public.projects(visibility, status);
create index if not exists idx_projects_category on public.projects(category);
create index if not exists idx_projects_featured_rank on public.projects(featured_rank desc, updated_at desc);
create index if not exists idx_projects_tags on public.projects using gin(tags);

create or replace view public.project_overviews as
with feature_agg as (
  select
    project_id,
    count(*)::integer as feature_count,
    count(*) filter (where status in ('backlog', 'planned', 'in_progress'))::integer as active_feature_count,
    max(updated_at) as last_feature_activity
  from public.feature_cards
  group by project_id
),
page_agg as (
  select
    project_id,
    count(*)::integer as page_count,
    max(updated_at) as last_page_activity
  from public.pages
  group by project_id
),
component_agg as (
  select
    project_id,
    count(*)::integer as component_count,
    max(updated_at) as last_component_activity
  from public.components
  group by project_id
),
userflow_agg as (
  select
    project_id,
    count(*)::integer as userflow_count,
    max(updated_at) as last_userflow_activity
  from public.userflows
  group by project_id
),
member_agg as (
  select
    project_id,
    count(*)::integer as member_count,
    max(created_at) as last_member_activity
  from public.project_members
  group by project_id
)
select
  p.id,
  p.name,
  p.slug,
  p.description,
  p.tagline,
  p.category,
  p.tags,
  p.visibility,
  p.platform,
  p.status,
  p.version,
  p.owner_auth_id,
  p.app_icon_url,
  p.hero_image_url,
  p.demo_url,
  p.source_url,
  p.featured_rank,
  p.last_synced_at,
  p.catalog_metadata,
  p.created_at,
  p.updated_at,
  coalesce(feature_agg.feature_count, 0) as feature_count,
  coalesce(feature_agg.active_feature_count, 0) as active_feature_count,
  coalesce(page_agg.page_count, 0) as page_count,
  coalesce(component_agg.component_count, 0) as component_count,
  coalesce(userflow_agg.userflow_count, 0) as userflow_count,
  coalesce(member_agg.member_count, 0) as member_count,
  greatest(
    p.updated_at,
    feature_agg.last_feature_activity,
    page_agg.last_page_activity,
    component_agg.last_component_activity,
    userflow_agg.last_userflow_activity,
    member_agg.last_member_activity
  ) as last_activity
from public.projects p
left join feature_agg on feature_agg.project_id = p.id
left join page_agg on page_agg.project_id = p.id
left join component_agg on component_agg.project_id = p.id
left join userflow_agg on userflow_agg.project_id = p.id
left join member_agg on member_agg.project_id = p.id;
