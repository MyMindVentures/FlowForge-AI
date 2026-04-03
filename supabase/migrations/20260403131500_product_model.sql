create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text not null default '',
  platform text not null check (platform in ('web', 'ios', 'android', 'responsive')),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  version text not null default '1.0.0',
  owner_auth_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (slug)
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  member_auth_id text not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'editor', 'viewer', 'member')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (project_id, member_auth_id)
);

create table if not exists public.feature_cards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  slug text not null,
  summary text,
  problem_statement text,
  goal text,
  user_value text,
  business_value text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'idea' check (status in ('idea', 'backlog', 'planned', 'in_progress', 'done')),
  category text,
  epic text,
  release text,
  persona text,
  jobs_to_be_done text,
  acceptance_criteria text,
  success_metrics text,
  non_functional_requirements text,
  dependencies text,
  assumptions text,
  risks text,
  notes text,
  figma_link text,
  spec_link text,
  owner_auth_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id, slug)
);

create table if not exists public.userflows (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  goal text,
  entry_point text,
  exit_point text,
  primary_actor text,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  version text not null default '1.0.0',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id, slug)
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  slug text not null,
  page_type text not null check (page_type in ('screen', 'modal', 'overlay', 'settings', 'detail', 'list', 'form')),
  description text,
  route text,
  purpose text,
  auth_required boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'active', 'deprecated', 'archived')),
  screen_title text,
  empty_state_description text,
  error_state_description text,
  loading_state_description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id, slug)
);

create table if not exists public.page_layouts (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  name text not null,
  layout_type text not null default 'default' check (layout_type in ('default', 'mobile', 'desktop', 'tablet', 'modal', 'split_view')),
  description text,
  breakpoint text,
  grid_definition jsonb not null default '{}'::jsonb,
  notes text,
  version text not null default '1.0.0',
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.components (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  slug text not null,
  component_type text not null,
  description text,
  design_purpose text,
  props_schema jsonb not null default '{}'::jsonb,
  states jsonb not null default '[]'::jsonb,
  variants jsonb not null default '[]'::jsonb,
  reusability_level text,
  design_system_ref text,
  figma_link text,
  dev_reference text,
  status text not null default 'draft' check (status in ('draft', 'active', 'deprecated', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id, slug)
);

create table if not exists public.userflow_pages (
  id uuid primary key default gen_random_uuid(),
  userflow_id uuid not null references public.userflows(id) on delete cascade,
  page_id uuid not null references public.pages(id) on delete restrict,
  step_order integer not null check (step_order > 0),
  step_name text,
  is_optional boolean not null default false,
  condition text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (userflow_id, step_order)
);

create table if not exists public.layout_components (
  id uuid primary key default gen_random_uuid(),
  layout_id uuid not null references public.page_layouts(id) on delete cascade,
  component_id uuid not null references public.components(id) on delete restrict,
  parent_layout_component_id uuid references public.layout_components(id) on delete cascade,
  zone text,
  position_order integer not null check (position_order > 0),
  x integer,
  y integer,
  width integer,
  height integer,
  configuration_json jsonb not null default '{}'::jsonb,
  visibility_rules jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (layout_id, position_order)
);

create table if not exists public.feature_card_userflows (
  id uuid primary key default gen_random_uuid(),
  feature_card_id uuid not null references public.feature_cards(id) on delete cascade,
  userflow_id uuid not null references public.userflows(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (feature_card_id, userflow_id)
);

create table if not exists public.feature_card_pages (
  id uuid primary key default gen_random_uuid(),
  feature_card_id uuid not null references public.feature_cards(id) on delete cascade,
  page_id uuid not null references public.pages(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (feature_card_id, page_id)
);

create table if not exists public.feature_card_components (
  id uuid primary key default gen_random_uuid(),
  feature_card_id uuid not null references public.feature_cards(id) on delete cascade,
  component_id uuid not null references public.components(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (feature_card_id, component_id)
);

create index if not exists idx_project_members_project_id on public.project_members(project_id);
create index if not exists idx_project_members_member_auth_id on public.project_members(member_auth_id);
create index if not exists idx_feature_cards_project_id on public.feature_cards(project_id);
create index if not exists idx_feature_cards_project_status_priority on public.feature_cards(project_id, status, priority);
create index if not exists idx_userflows_project_id on public.userflows(project_id);
create index if not exists idx_pages_project_id on public.pages(project_id);
create index if not exists idx_pages_project_status on public.pages(project_id, status);
create index if not exists idx_page_layouts_page_id on public.page_layouts(page_id);
create unique index if not exists idx_page_layouts_primary_per_page on public.page_layouts(page_id) where is_primary;
create index if not exists idx_components_project_id on public.components(project_id);
create index if not exists idx_userflow_pages_userflow_id on public.userflow_pages(userflow_id);
create index if not exists idx_userflow_pages_page_id on public.userflow_pages(page_id);
create index if not exists idx_layout_components_layout_id on public.layout_components(layout_id);
create index if not exists idx_layout_components_component_id on public.layout_components(component_id);
create index if not exists idx_feature_card_userflows_feature_card_id on public.feature_card_userflows(feature_card_id);
create index if not exists idx_feature_card_userflows_userflow_id on public.feature_card_userflows(userflow_id);
create index if not exists idx_feature_card_pages_feature_card_id on public.feature_card_pages(feature_card_id);
create index if not exists idx_feature_card_pages_page_id on public.feature_card_pages(page_id);
create index if not exists idx_feature_card_components_feature_card_id on public.feature_card_components(feature_card_id);
create index if not exists idx_feature_card_components_component_id on public.feature_card_components(component_id);

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_feature_cards_updated_at on public.feature_cards;
create trigger set_feature_cards_updated_at before update on public.feature_cards
for each row execute function public.set_updated_at();

drop trigger if exists set_userflows_updated_at on public.userflows;
create trigger set_userflows_updated_at before update on public.userflows
for each row execute function public.set_updated_at();

drop trigger if exists set_pages_updated_at on public.pages;
create trigger set_pages_updated_at before update on public.pages
for each row execute function public.set_updated_at();

drop trigger if exists set_page_layouts_updated_at on public.page_layouts;
create trigger set_page_layouts_updated_at before update on public.page_layouts
for each row execute function public.set_updated_at();

drop trigger if exists set_components_updated_at on public.components;
create trigger set_components_updated_at before update on public.components
for each row execute function public.set_updated_at();

drop trigger if exists set_userflow_pages_updated_at on public.userflow_pages;
create trigger set_userflow_pages_updated_at before update on public.userflow_pages
for each row execute function public.set_updated_at();

drop trigger if exists set_layout_components_updated_at on public.layout_components;
create trigger set_layout_components_updated_at before update on public.layout_components
for each row execute function public.set_updated_at();