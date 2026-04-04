do $$
begin
  if not exists (select 1 from pg_type where typname = 'organization_membership_status') then
    create type public.organization_membership_status as enum ('invited', 'active', 'suspended');
  end if;

  if not exists (select 1 from pg_type where typname = 'organization_invite_status') then
    create type public.organization_invite_status as enum ('pending', 'accepted', 'revoked', 'expired');
  end if;
end $$;

create table if not exists public.organizations (
  id text primary key,
  slug text not null unique,
  display_name text not null,
  owner_id text not null references public.app_users(id) on delete restrict,
  sso_domain text,
  branding jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organization_members (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  user_id text references public.app_users(id) on delete cascade,
  invited_email text,
  role public.app_user_role not null default 'Builder',
  status public.organization_membership_status not null default 'invited',
  invited_by text references public.app_users(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_members_identity_check check (user_id is not null or invited_email is not null)
);

create table if not exists public.organization_invites (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.app_user_role not null default 'Builder',
  invited_by text references public.app_users(id) on delete set null,
  invite_token text not null unique,
  status public.organization_invite_status not null default 'pending',
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organization_settings (
  organization_id text primary key references public.organizations(id) on delete cascade,
  member_quota integer not null default 25 check (member_quota > 0),
  billing_tier text not null default 'starter',
  feature_flags jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.app_users
  add column if not exists organization_id text references public.organizations(id) on delete set null;

alter table public.projects
  add column if not exists organization_id text references public.organizations(id) on delete set null;

create index if not exists organizations_owner_id_idx on public.organizations (owner_id);
create index if not exists organizations_sso_domain_idx on public.organizations (lower(sso_domain)) where sso_domain is not null;
create index if not exists organization_members_org_status_idx on public.organization_members (organization_id, status);
create unique index if not exists organization_members_org_user_unique_idx on public.organization_members (organization_id, user_id) where user_id is not null;
create unique index if not exists organization_members_org_email_unique_idx on public.organization_members (organization_id, lower(invited_email)) where invited_email is not null;
create unique index if not exists organization_invites_org_email_pending_unique_idx on public.organization_invites (organization_id, lower(email)) where status = 'pending';
create index if not exists projects_organization_id_idx on public.projects (organization_id) where organization_id is not null;
create index if not exists app_users_organization_id_idx on public.app_users (organization_id) where organization_id is not null;

drop trigger if exists set_updated_at_organizations on public.organizations;
create trigger set_updated_at_organizations before update on public.organizations for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_organization_members on public.organization_members;
create trigger set_updated_at_organization_members before update on public.organization_members for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_organization_invites on public.organization_invites;
create trigger set_updated_at_organization_invites before update on public.organization_invites for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_organization_settings on public.organization_settings;
create trigger set_updated_at_organization_settings before update on public.organization_settings for each row execute function public.set_updated_at();

create or replace function public.current_app_user_email()
returns text
language sql
stable
as $$
  select email
  from public.app_users
  where auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_organization_id()
returns text
language sql
stable
as $$
  select organization_id
  from public.app_users
  where auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.can_access_organization(target_organization_id text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.organizations o
    where o.id = target_organization_id
      and (
        public.is_admin_user()
        or o.owner_id = public.current_app_user_id()
        or exists (
          select 1
          from public.organization_members om
          where om.organization_id = o.id
            and om.user_id = public.current_app_user_id()
            and om.status = 'active'
        )
      )
  );
$$;

create or replace function public.can_manage_organization(target_organization_id text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.organizations o
    where o.id = target_organization_id
      and (
        public.is_admin_user()
        or o.owner_id = public.current_app_user_id()
        or exists (
          select 1
          from public.organization_members om
          where om.organization_id = o.id
            and om.user_id = public.current_app_user_id()
            and om.status = 'active'
            and om.role in ('Admin', 'Architect')
        )
      )
  );
$$;

create or replace function public.can_access_project(target_project_id text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and (
        public.is_admin_user()
        or p.owner_id = public.current_app_user_id()
        or (
          p.organization_id is not null
          and public.can_access_organization(p.organization_id)
        )
        or jsonb_path_exists(
          coalesce(p.members, '[]'::jsonb),
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
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and (
        public.is_admin_user()
        or p.owner_id = public.current_app_user_id()
        or (
          p.organization_id is not null
          and public.can_manage_organization(p.organization_id)
        )
      )
  );
$$;

grant execute on function public.current_app_user_email() to authenticated;
grant execute on function public.current_organization_id() to authenticated;
grant execute on function public.can_access_organization(text) to authenticated;
grant execute on function public.can_manage_organization(text) to authenticated;
grant execute on function public.can_access_project(text) to authenticated;
grant execute on function public.can_modify_project(text) to authenticated;

grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update, delete on public.organization_invites to authenticated;
grant select, insert, update, delete on public.organization_settings to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invites enable row level security;
alter table public.organization_settings enable row level security;

drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations
  for select to authenticated
  using (public.can_access_organization(id));

drop policy if exists organizations_insert on public.organizations;
create policy organizations_insert on public.organizations
  for insert to authenticated
  with check (public.is_admin_user() or owner_id = public.current_app_user_id());

drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations
  for update to authenticated
  using (public.can_manage_organization(id))
  with check (public.can_manage_organization(id));

drop policy if exists organizations_delete on public.organizations;
create policy organizations_delete on public.organizations
  for delete to authenticated
  using (public.can_manage_organization(id));

drop policy if exists organization_members_select on public.organization_members;
create policy organization_members_select on public.organization_members
  for select to authenticated
  using (public.can_access_organization(organization_id));

drop policy if exists organization_members_insert on public.organization_members;
create policy organization_members_insert on public.organization_members
  for insert to authenticated
  with check (public.can_manage_organization(organization_id));

drop policy if exists organization_members_update on public.organization_members;
create policy organization_members_update on public.organization_members
  for update to authenticated
  using (public.can_manage_organization(organization_id))
  with check (public.can_manage_organization(organization_id));

drop policy if exists organization_members_delete on public.organization_members;
create policy organization_members_delete on public.organization_members
  for delete to authenticated
  using (public.can_manage_organization(organization_id));

drop policy if exists organization_invites_select on public.organization_invites;
create policy organization_invites_select on public.organization_invites
  for select to authenticated
  using (
    public.can_manage_organization(organization_id)
    or lower(email) = lower(coalesce(public.current_app_user_email(), ''))
  );

drop policy if exists organization_invites_insert on public.organization_invites;
create policy organization_invites_insert on public.organization_invites
  for insert to authenticated
  with check (public.can_manage_organization(organization_id));

drop policy if exists organization_invites_update on public.organization_invites;
create policy organization_invites_update on public.organization_invites
  for update to authenticated
  using (public.can_manage_organization(organization_id))
  with check (public.can_manage_organization(organization_id));

drop policy if exists organization_invites_delete on public.organization_invites;
create policy organization_invites_delete on public.organization_invites
  for delete to authenticated
  using (public.can_manage_organization(organization_id));

drop policy if exists organization_settings_select on public.organization_settings;
create policy organization_settings_select on public.organization_settings
  for select to authenticated
  using (public.can_access_organization(organization_id));

drop policy if exists organization_settings_write on public.organization_settings;
create policy organization_settings_write on public.organization_settings
  for all to authenticated
  using (public.can_manage_organization(organization_id))
  with check (public.can_manage_organization(organization_id));

with distinct_orgs as (
  select
    coalesce(nullif(trim(organization_name), ''), 'Independent Workspace') as display_name,
    min(id) as owner_id,
    regexp_replace(lower(coalesce(nullif(trim(organization_name), ''), 'Independent Workspace')), '[^a-z0-9]+', '-', 'g') as slug_seed
  from public.app_users
  group by 1
), numbered_orgs as (
  select
    display_name,
    owner_id,
    case
      when row_number() over (partition by slug_seed order by display_name) = 1 then slug_seed
      else slug_seed || '-' || row_number() over (partition by slug_seed order by display_name)
    end as slug
  from distinct_orgs
)
insert into public.organizations (id, slug, display_name, owner_id, metadata)
select
  'org-' || slug,
  slug,
  display_name,
  owner_id,
  jsonb_build_object('seeded_by', '20260404_002_add_tenant_organization_model')
from numbered_orgs
on conflict (id) do update
set display_name = excluded.display_name,
    owner_id = excluded.owner_id,
    metadata = public.organizations.metadata || excluded.metadata,
    updated_at = timezone('utc', now());

update public.app_users u
set organization_id = o.id
from public.organizations o
where o.display_name = coalesce(nullif(trim(u.organization_name), ''), 'Independent Workspace')
  and (u.organization_id is null or u.organization_id <> o.id);

insert into public.organization_members (
  id,
  organization_id,
  user_id,
  invited_email,
  role,
  status,
  invited_by,
  joined_at
)
select
  'orgm-' || u.id,
  u.organization_id,
  u.id,
  u.email,
  u.role,
  'active',
  o.owner_id,
  coalesce(u.created_at, timezone('utc', now()))
from public.app_users u
join public.organizations o on o.id = u.organization_id
where u.organization_id is not null
on conflict (id) do update
set organization_id = excluded.organization_id,
    user_id = excluded.user_id,
    invited_email = excluded.invited_email,
    role = excluded.role,
    status = 'active',
    joined_at = excluded.joined_at,
    updated_at = timezone('utc', now());

insert into public.organization_settings (
  organization_id,
  member_quota,
  billing_tier,
  feature_flags,
  settings
)
select
  o.id,
  25,
  case when o.display_name = 'MyMindVentures' then 'internal' else 'starter' end,
  jsonb_build_object('tenant_model', true, 'project_members_enabled', true),
  jsonb_build_object('default_project_visibility', 'organization')
from public.organizations o
on conflict (organization_id) do update
set feature_flags = public.organization_settings.feature_flags || excluded.feature_flags,
    settings = public.organization_settings.settings || excluded.settings,
    updated_at = timezone('utc', now());

update public.projects p
set organization_id = owner.organization_id
from public.app_users owner
where owner.id = p.owner_id
  and owner.organization_id is not null
  and (p.organization_id is null or p.organization_id <> owner.organization_id);
