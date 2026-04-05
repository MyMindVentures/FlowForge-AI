-- AI Product Interviewer relational model (Supabase source of truth)

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  status text not null default 'Draft',
  current_version text not null default 'v0.1',
  active_mode text not null default 'discovery',
  interview_phase text not null default 'idea',
  vision text not null default '',
  problem text not null default '',
  target_users text[] not null default '{}',
  mvp_scope text[] not null default '{}',
  future_ideas text[] not null default '{}',
  open_questions text[] not null default '{}',
  roadmap jsonb not null default '{"MVP":[],"Next":[],"Later":[],"Maybe":[]}'::jsonb,
  user_flow text[] not null default '{}',
  developer_summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  label text not null,
  summary text not null default '',
  changed_items text[] not null default '{}',
  project_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.features (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text not null default '',
  goal text not null default '',
  user_value text not null default '',
  priority text not null default 'P2',
  status text not null default 'Drafting',
  notes text not null default '',
  decision_ids uuid[] not null default '{}',
  history text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feature_dependencies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  feature_id uuid not null references public.features(id) on delete cascade,
  depends_on_feature_id uuid not null references public.features(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (feature_id, depends_on_feature_id)
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  reasoning text not null default '',
  linked_feature_ids uuid[] not null default '{}',
  impact text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  type text not null,
  title text not null,
  reason text not null default '',
  impact text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  mode text not null default 'discovery',
  started_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_session_id uuid not null references public.chat_sessions(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  role text not null,
  mode text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.developer_handoffs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  generated_by uuid not null references auth.users(id) on delete cascade,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects for each row execute function public.set_updated_at();

drop trigger if exists features_set_updated_at on public.features;
create trigger features_set_updated_at before update on public.features for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.project_versions enable row level security;
alter table public.features enable row level security;
alter table public.feature_dependencies enable row level security;
alter table public.decisions enable row level security;
alter table public.activity_log enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.developer_handoffs enable row level security;

-- projects policies
create policy if not exists "projects_select_own" on public.projects for select using (auth.uid() = owner_id);
create policy if not exists "projects_insert_own" on public.projects for insert with check (auth.uid() = owner_id);
create policy if not exists "projects_update_own" on public.projects for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy if not exists "projects_delete_own" on public.projects for delete using (auth.uid() = owner_id);

-- helper predicate via owning project
create or replace function public.can_access_project(target_project_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.projects p where p.id = target_project_id and p.owner_id = auth.uid()
  );
$$;

create policy if not exists "project_versions_access" on public.project_versions
for all
using (public.can_access_project(project_id))
with check (public.can_access_project(project_id));

create policy if not exists "features_access" on public.features
for all
using (public.can_access_project(project_id))
with check (public.can_access_project(project_id));

create policy if not exists "feature_dependencies_access" on public.feature_dependencies
for all
using (public.can_access_project(project_id))
with check (public.can_access_project(project_id));

create policy if not exists "decisions_access" on public.decisions
for all
using (public.can_access_project(project_id))
with check (public.can_access_project(project_id));

create policy if not exists "activity_log_access" on public.activity_log
for all
using (public.can_access_project(project_id))
with check (public.can_access_project(project_id));

create policy if not exists "chat_sessions_access" on public.chat_sessions
for all
using (public.can_access_project(project_id))
with check (public.can_access_project(project_id));

create policy if not exists "chat_messages_access" on public.chat_messages
for all
using (public.can_access_project(project_id))
with check (public.can_access_project(project_id));

create policy if not exists "developer_handoffs_access" on public.developer_handoffs
for all
using (public.can_access_project(project_id))
with check (public.can_access_project(project_id));
