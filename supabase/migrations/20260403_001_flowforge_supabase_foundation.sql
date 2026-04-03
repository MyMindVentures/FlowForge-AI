create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_user_role') then
    create type public.app_user_role as enum ('Architect', 'Builder', 'Admin');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.app_users (
  id text primary key,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text not null unique,
  display_name text not null,
  photo_url text,
  role public.app_user_role not null default 'Builder',
  onboarded boolean not null default false,
  storytelling_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_login timestamptz not null default timezone('utc', now()),
  settings jsonb not null default '{"theme":"dark","notifications":true}'::jsonb
);

create table if not exists public.roles (
  id text primary key,
  name text not null unique,
  permissions text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.projects (
  id text primary key,
  name text not null,
  description text not null default '',
  owner_id text not null references public.app_users(id) on delete restrict,
  status text not null default 'Draft',
  is_favorite boolean not null default false,
  current_session_id text,
  app_vision text,
  prd text,
  tech_arch text,
  ux_strategy text,
  members jsonb not null default '[]'::jsonb,
  repositories jsonb not null default '[]'::jsonb,
  integrity_status text,
  last_modified_by jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.current_app_user_id()
returns text
language sql
stable
as $$
  select id
  from public.app_users
  where auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.app_users
    where auth_user_id = auth.uid()
      and role = 'Admin'
  );
$$;

create or replace function public.can_access_project(target_project_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.projects
    where id = target_project_id
      and (
        public.is_admin_user()
        or owner_id = public.current_app_user_id()
        or jsonb_path_exists(
          coalesce(members, '[]'::jsonb),
          '$[*] ? (@.uid == $uid)',
          jsonb_build_object('uid', public.current_app_user_id())
        )
      )
  );
$$;

create or replace function public.can_modify_project(target_project_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.projects
    where id = target_project_id
      and (
        public.is_admin_user()
        or owner_id = public.current_app_user_id()
      )
  );
$$;

create table if not exists public.sessions (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.features (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  feature_code text not null,
  title text not null,
  status text not null,
  priority text not null,
  problem text not null default '',
  solution text not null default '',
  why text not null default '',
  non_technical_description text not null default '',
  technical_description text not null default '',
  concept_thinker text,
  builder_brief text,
  coding_prompt text,
  ui_design_prompt text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived boolean not null default false,
  score integer,
  related_pages text[] not null default '{}',
  related_components text[] not null default '{}',
  impact_analysis text,
  ui_impact jsonb,
  is_locked boolean not null default false,
  visual_url text,
  visual_prompt text,
  integrity_status text
);

create table if not exists public.feature_comments (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  feature_id text not null references public.features(id) on delete cascade,
  author_role text not null,
  content text not null,
  type text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_versions (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  name text not null,
  status text not null,
  start_date timestamptz,
  end_date timestamptz,
  goal text not null default '',
  linked_feature_ids text[] not null default '{}',
  release_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.assets (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  name text not null,
  type text not null,
  url text not null,
  tags text[] not null default '{}',
  feature_ids text[] not null default '{}',
  size integer,
  mime_type text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ui_layouts (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  name text not null,
  type text not null,
  description text not null default '',
  config jsonb not null default '{}'::jsonb,
  integrity_status text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ui_pages (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  name text not null,
  path text not null,
  purpose text not null default '',
  layout_id text,
  linked_feature_ids text[] not null default '{}',
  component_ids text[] not null default '{}',
  mobile_pattern text not null default '',
  visual_url text,
  visual_prompt text,
  documentation text,
  integrity_status text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ui_components (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  name text not null,
  type text not null,
  description text not null default '',
  purpose text not null default '',
  props jsonb not null default '{}'::jsonb,
  usage_guidelines text not null default '',
  linked_feature_ids text[] not null default '{}',
  integrity_status text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ui_style_systems (
  id text primary key,
  project_id text not null unique references public.projects(id) on delete cascade,
  colors jsonb not null default '{}'::jsonb,
  typography jsonb not null default '{}'::jsonb,
  spacing jsonb not null default '{}'::jsonb,
  dark_mode boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.prd_sections (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  title text not null,
  content text not null default '',
  "order" integer not null default 0,
  linked_feature_ids text[] not null default '{}',
  status text not null default 'Draft',
  integrity_status text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_findings (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  title text not null,
  description text not null default '',
  severity text not null,
  category text not null,
  status text not null,
  linked_feature_id text,
  linked_page_id text,
  integrity_status text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.readiness_checks (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  category text not null,
  label text not null,
  description text not null default '',
  is_passed boolean not null default false,
  notes text,
  integrity_status text,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.blockers (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  title text not null,
  description text not null default '',
  severity text not null,
  status text not null,
  linked_task_id text,
  linked_feature_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tasks (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null,
  priority text not null,
  related_entity_id text,
  related_entity_type text,
  developer_notes text,
  failure_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.llm_functions (
  id text primary key,
  project_id text references public.projects(id) on delete cascade,
  name text not null,
  description text not null default '',
  system_prompt text,
  parameters jsonb not null default '{}'::jsonb,
  model_id text not null,
  fallback_config jsonb,
  prompt_template_id text,
  is_enabled boolean not null default true,
  integrity_status text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chat_messages (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  session_id text references public.sessions(id) on delete cascade,
  user_id text,
  role text not null,
  content text not null,
  timestamp timestamptz not null default timezone('utc', now())
);

create table if not exists public.suggestions (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  session_id text references public.sessions(id) on delete cascade,
  title text not null,
  problem text not null default '',
  solution text not null default '',
  user_value text not null default '',
  scope text not null,
  status text not null,
  timestamp timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_logs (
  id text primary key,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  user_id text,
  user_email text,
  project_id text references public.projects(id) on delete cascade,
  feature_id text references public.features(id) on delete cascade,
  timestamp timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_task_logs (
  id text primary key,
  task_type text,
  params jsonb,
  result jsonb,
  status text not null default 'pending',
  user_id text,
  project_id text references public.projects(id) on delete cascade,
  latency integer,
  error text,
  timestamp timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_models (
  id text primary key,
  name text not null,
  provider text not null,
  model_id text not null,
  is_enabled boolean not null default true,
  is_default boolean not null default false,
  priority integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.prompt_templates (
  id text primary key,
  name text not null,
  description text not null default '',
  system_instruction text not null default '',
  user_prompt text not null default '',
  variables text[] not null default '{}',
  version integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.api_key_configs (
  id text primary key,
  provider text not null,
  key_name text not null,
  masked_key text not null,
  last_used timestamptz,
  status text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.usage_logs (
  id text primary key,
  timestamp timestamptz not null default timezone('utc', now()),
  user_id text,
  project_id text references public.projects(id) on delete cascade,
  model_id text not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  cost numeric(12, 6) not null default 0,
  latency integer not null default 0
);

create table if not exists public.error_logs (
  id text primary key,
  timestamp timestamptz not null default timezone('utc', now()),
  user_id text,
  project_id text references public.projects(id) on delete cascade,
  model_id text,
  error_code text not null,
  error_message text not null,
  stack_trace text,
  request_payload jsonb
);

create table if not exists public.notifications (
  id text primary key,
  user_id text not null,
  title text not null default '',
  body text not null default '',
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sync_states (
  id text primary key,
  user_id text not null,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_projects_owner_id on public.projects(owner_id);
create index if not exists idx_features_project_id_updated_at on public.features(project_id, updated_at desc);
create unique index if not exists idx_features_project_id_feature_code on public.features(project_id, feature_code);
create index if not exists idx_assets_project_id_updated_at on public.assets(project_id, updated_at desc);
create index if not exists idx_feature_comments_feature_id_created_at on public.feature_comments(feature_id, created_at asc);
create index if not exists idx_versions_project_id on public.project_versions(project_id);
create index if not exists idx_pages_project_id on public.ui_pages(project_id);
create index if not exists idx_components_project_id on public.ui_components(project_id);
create index if not exists idx_layouts_project_id on public.ui_layouts(project_id);
create index if not exists idx_tasks_project_id_status on public.tasks(project_id, status);
create index if not exists idx_audit_logs_project_id_timestamp on public.audit_logs(project_id, timestamp desc);
create index if not exists idx_ai_task_logs_project_id_timestamp on public.ai_task_logs(project_id, timestamp desc);
create index if not exists idx_chat_messages_session_id_timestamp on public.chat_messages(session_id, timestamp asc);
create index if not exists idx_suggestions_session_id_status on public.suggestions(session_id, status);
create index if not exists idx_usage_logs_timestamp on public.usage_logs(timestamp desc);
create index if not exists idx_error_logs_timestamp on public.error_logs(timestamp desc);
create index if not exists idx_llm_functions_project_name on public.llm_functions(project_id, name);

drop trigger if exists set_updated_at_app_users on public.app_users;
create trigger set_updated_at_app_users before update on public.app_users for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_projects on public.projects;
create trigger set_updated_at_projects before update on public.projects for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_features on public.features;
create trigger set_updated_at_features before update on public.features for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_feature_comments on public.feature_comments;
create trigger set_updated_at_feature_comments before update on public.feature_comments for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_project_versions on public.project_versions;
create trigger set_updated_at_project_versions before update on public.project_versions for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_assets on public.assets;
create trigger set_updated_at_assets before update on public.assets for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_ui_layouts on public.ui_layouts;
create trigger set_updated_at_ui_layouts before update on public.ui_layouts for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_ui_pages on public.ui_pages;
create trigger set_updated_at_ui_pages before update on public.ui_pages for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_ui_components on public.ui_components;
create trigger set_updated_at_ui_components before update on public.ui_components for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_ui_style_systems on public.ui_style_systems;
create trigger set_updated_at_ui_style_systems before update on public.ui_style_systems for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_prd_sections on public.prd_sections;
create trigger set_updated_at_prd_sections before update on public.prd_sections for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_audit_findings on public.audit_findings;
create trigger set_updated_at_audit_findings before update on public.audit_findings for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_readiness_checks on public.readiness_checks;
create trigger set_updated_at_readiness_checks before update on public.readiness_checks for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_blockers on public.blockers;
create trigger set_updated_at_blockers before update on public.blockers for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_tasks on public.tasks;
create trigger set_updated_at_tasks before update on public.tasks for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_llm_functions on public.llm_functions;
create trigger set_updated_at_llm_functions before update on public.llm_functions for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_ai_task_logs on public.ai_task_logs;
create trigger set_updated_at_ai_task_logs before update on public.ai_task_logs for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_ai_models on public.ai_models;
create trigger set_updated_at_ai_models before update on public.ai_models for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_prompt_templates on public.prompt_templates;
create trigger set_updated_at_prompt_templates before update on public.prompt_templates for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_api_key_configs on public.api_key_configs;
create trigger set_updated_at_api_key_configs before update on public.api_key_configs for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_notifications on public.notifications;
create trigger set_updated_at_notifications before update on public.notifications for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_sync_states on public.sync_states;
create trigger set_updated_at_sync_states before update on public.sync_states for each row execute function public.set_updated_at();

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

alter table public.app_users enable row level security;
alter table public.roles enable row level security;
alter table public.projects enable row level security;
alter table public.sessions enable row level security;
alter table public.features enable row level security;
alter table public.feature_comments enable row level security;
alter table public.project_versions enable row level security;
alter table public.assets enable row level security;
alter table public.ui_layouts enable row level security;
alter table public.ui_pages enable row level security;
alter table public.ui_components enable row level security;
alter table public.ui_style_systems enable row level security;
alter table public.prd_sections enable row level security;
alter table public.audit_findings enable row level security;
alter table public.readiness_checks enable row level security;
alter table public.blockers enable row level security;
alter table public.tasks enable row level security;
alter table public.llm_functions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.suggestions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.ai_task_logs enable row level security;
alter table public.ai_models enable row level security;
alter table public.prompt_templates enable row level security;
alter table public.api_key_configs enable row level security;
alter table public.usage_logs enable row level security;
alter table public.error_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.sync_states enable row level security;

drop policy if exists app_users_select on public.app_users;
create policy app_users_select on public.app_users for select to authenticated using (
  auth_user_id = auth.uid() or public.is_admin_user()
);
drop policy if exists app_users_insert on public.app_users;
create policy app_users_insert on public.app_users for insert to authenticated with check (
  auth_user_id = auth.uid() or public.is_admin_user()
);
drop policy if exists app_users_update on public.app_users;
create policy app_users_update on public.app_users for update to authenticated using (
  auth_user_id = auth.uid() or public.is_admin_user()
) with check (
  auth_user_id = auth.uid() or public.is_admin_user()
);

drop policy if exists roles_admin_all on public.roles;
create policy roles_admin_all on public.roles for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects for select to authenticated using (public.can_access_project(id));
drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects for insert to authenticated with check (
  public.is_admin_user() or owner_id = public.current_app_user_id()
);
drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects for update to authenticated using (public.can_modify_project(id)) with check (public.can_modify_project(id));
drop policy if exists projects_delete on public.projects;
create policy projects_delete on public.projects for delete to authenticated using (public.can_modify_project(id));

drop policy if exists sessions_all on public.sessions;
create policy sessions_all on public.sessions for all to authenticated using (public.can_access_project(project_id)) with check (public.can_modify_project(project_id));
drop policy if exists features_all on public.features;
create policy features_all on public.features for all to authenticated using (public.can_access_project(project_id)) with check (public.can_modify_project(project_id));
drop policy if exists feature_comments_all on public.feature_comments;
create policy feature_comments_all on public.feature_comments for all to authenticated using (public.can_access_project(project_id)) with check (public.can_modify_project(project_id));
drop policy if exists project_versions_all on public.project_versions;
create policy project_versions_all on public.project_versions for all to authenticated using (public.can_access_project(project_id)) with check (public.can_modify_project(project_id));
drop policy if exists assets_all on public.assets;
create policy assets_all on public.assets for all to authenticated using (public.can_access_project(project_id)) with check (public.can_modify_project(project_id));
drop policy if exists ui_layouts_all on public.ui_layouts;
create policy ui_layouts_all on public.ui_layouts for all to authenticated using (public.can_access_project(project_id)) with check (public.can_modify_project(project_id));
drop policy if exists ui_pages_all on public.ui_pages;
create policy ui_pages_all on public.ui_pages for all to authenticated using (public.can_access_project(project_id)) with check (public.can_modify_project(project_id));
drop policy if exists ui_components_all on public.ui_components;
create policy ui_components_all on public.ui_components for all to authenticated using (public.can_access_project(project_id)) with check (public.can_modify_project(project_id));
drop policy if exists ui_style_systems_all on public.ui_style_systems;
create policy ui_style_systems_all on public.ui_style_systems for all to authenticated using (public.can_access_project(project_id)) with check (public.can_modify_project(project_id));
drop policy if exists prd_sections_all on public.prd_sections;
create policy prd_sections_all on public.prd_sections for all to authenticated using (public.can_access_project(project_id)) with check (public.can_modify_project(project_id));
drop policy if exists audit_findings_all on public.audit_findings;
create policy audit_findings_all on public.audit_findings for all to authenticated using (public.can_access_project(project_id)) with check (public.can_modify_project(project_id));
drop policy if exists readiness_checks_all on public.readiness_checks;
create policy readiness_checks_all on public.readiness_checks for all to authenticated using (public.can_access_project(project_id)) with check (public.can_modify_project(project_id));
drop policy if exists blockers_all on public.blockers;
create policy blockers_all on public.blockers for all to authenticated using (public.can_access_project(project_id)) with check (public.can_modify_project(project_id));
drop policy if exists tasks_all on public.tasks;
create policy tasks_all on public.tasks for all to authenticated using (public.can_access_project(project_id)) with check (public.can_modify_project(project_id));
drop policy if exists chat_messages_all on public.chat_messages;
create policy chat_messages_all on public.chat_messages for all to authenticated using (public.can_access_project(project_id)) with check (public.can_modify_project(project_id));
drop policy if exists suggestions_all on public.suggestions;
create policy suggestions_all on public.suggestions for all to authenticated using (public.can_access_project(project_id)) with check (public.can_modify_project(project_id));
drop policy if exists project_audit_logs_all on public.audit_logs;
create policy project_audit_logs_all on public.audit_logs for all to authenticated using (
  project_id is null and public.is_admin_user()
  or project_id is not null and public.can_access_project(project_id)
) with check (
  project_id is null and public.is_admin_user()
  or project_id is not null and public.can_modify_project(project_id)
);
drop policy if exists ai_task_logs_all on public.ai_task_logs;
create policy ai_task_logs_all on public.ai_task_logs for all to authenticated using (
  project_id is null and public.is_admin_user()
  or project_id is not null and public.can_access_project(project_id)
) with check (
  project_id is null and public.is_admin_user()
  or project_id is not null and public.can_modify_project(project_id)
);
drop policy if exists llm_functions_all on public.llm_functions;
create policy llm_functions_all on public.llm_functions for all to authenticated using (
  (project_id is null and public.is_admin_user())
  or (project_id is not null and public.can_access_project(project_id))
) with check (
  (project_id is null and public.is_admin_user())
  or (project_id is not null and public.can_modify_project(project_id))
);

drop policy if exists ai_models_admin_all on public.ai_models;
create policy ai_models_admin_all on public.ai_models for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
drop policy if exists prompt_templates_admin_all on public.prompt_templates;
create policy prompt_templates_admin_all on public.prompt_templates for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
drop policy if exists api_key_configs_admin_all on public.api_key_configs;
create policy api_key_configs_admin_all on public.api_key_configs for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
drop policy if exists usage_logs_admin_all on public.usage_logs;
create policy usage_logs_admin_all on public.usage_logs for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
drop policy if exists error_logs_admin_all on public.error_logs;
create policy error_logs_admin_all on public.error_logs for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select to authenticated using (
  user_id = public.current_app_user_id() or public.is_admin_user()
);
drop policy if exists notifications_write on public.notifications;
create policy notifications_write on public.notifications for all to authenticated using (
  user_id = public.current_app_user_id() or public.is_admin_user()
) with check (
  user_id = public.current_app_user_id() or public.is_admin_user()
);

drop policy if exists sync_states_all on public.sync_states;
create policy sync_states_all on public.sync_states for all to authenticated using (
  user_id = public.current_app_user_id() or public.is_admin_user()
) with check (
  user_id = public.current_app_user_id() or public.is_admin_user()
);

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'app_users','roles','projects','sessions','features','feature_comments','project_versions',
    'assets',
    'ui_layouts','ui_pages','ui_components','ui_style_systems','prd_sections','audit_findings',
    'readiness_checks','blockers','tasks','llm_functions','chat_messages','suggestions',
    'audit_logs','ai_task_logs','ai_models','prompt_templates','api_key_configs',
    'usage_logs','error_logs','notifications','sync_states'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', target_table);
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
  end loop;
end $$;