do $$
begin
  if not exists (select 1 from pg_type where typname = 'auth_provider_protocol') then
    create type public.auth_provider_protocol as enum ('oauth_oidc', 'saml_2_0', 'email', 'webauthn', 'totp', 'sms');
  end if;

  if not exists (select 1 from pg_type where typname = 'auth_provider_availability') then
    create type public.auth_provider_availability as enum ('available', 'preview', 'requires_config');
  end if;

  if not exists (select 1 from pg_type where typname = 'auth_factor_type') then
    create type public.auth_factor_type as enum ('password', 'magic_link', 'email_otp', 'passkey', 'totp', 'sms');
  end if;

  if not exists (select 1 from pg_type where typname = 'feature_flag_environment') then
    create type public.feature_flag_environment as enum ('all', 'development', 'staging', 'production');
  end if;
end $$;

create table if not exists public.auth_provider_configs (
  id text primary key,
  display_name text not null,
  protocol public.auth_provider_protocol not null,
  category text not null,
  availability public.auth_provider_availability not null default 'requires_config',
  is_enabled boolean not null default false,
  supports_direct_client_flow boolean not null default false,
  is_enterprise boolean not null default false,
  sort_order integer not null default 0,
  discovery_url text,
  domain_hint text,
  client_id_env_var text,
  secret_env_var text,
  redirect_url_env_var text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.auth_flow_definitions (
  id text primary key,
  provider_config_id text references public.auth_provider_configs(id) on delete set null,
  display_name text not null,
  flow_kind text not null,
  is_enabled boolean not null default true,
  fallback_ux jsonb not null default '{}'::jsonb,
  failure_states jsonb not null default '[]'::jsonb,
  telemetry_event_prefix text not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.auth_feature_flags (
  id text primary key,
  environment public.feature_flag_environment not null default 'all',
  is_enabled boolean not null default false,
  rollout_percentage integer not null default 100 check (rollout_percentage between 0 and 100),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.permission_catalog (
  permission_key text primary key,
  scope text not null,
  description text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.role_permissions (
  role_name public.app_user_role not null,
  permission_key text not null references public.permission_catalog(permission_key) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (role_name, permission_key)
);

create table if not exists public.auth_device_sessions (
  id uuid primary key,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  app_user_id text references public.app_users(id) on delete set null,
  provider_key text,
  device_name text,
  platform text,
  browser text,
  user_agent text,
  ip_address inet,
  is_trusted boolean not null default false,
  expires_at timestamptz,
  last_seen_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.auth_security_events (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  app_user_id text references public.app_users(id) on delete set null,
  device_session_id uuid references public.auth_device_sessions(id) on delete set null,
  event_name text not null,
  severity text not null default 'info',
  provider_key text,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pwa_install_events (
  id uuid primary key default gen_random_uuid(),
  app_user_id text references public.app_users(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  platform text,
  display_mode text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_auth_device_sessions_auth_user_id_last_seen
  on public.auth_device_sessions (auth_user_id, last_seen_at desc);

create index if not exists idx_auth_device_sessions_revoked_at
  on public.auth_device_sessions (revoked_at)
  where revoked_at is not null;

create index if not exists idx_auth_security_events_auth_user_id_created_at
  on public.auth_security_events (auth_user_id, created_at desc);

create index if not exists idx_pwa_install_events_auth_user_id_created_at
  on public.pwa_install_events (auth_user_id, created_at desc);

drop trigger if exists set_updated_at_auth_provider_configs on public.auth_provider_configs;
create trigger set_updated_at_auth_provider_configs before update on public.auth_provider_configs for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_auth_flow_definitions on public.auth_flow_definitions;
create trigger set_updated_at_auth_flow_definitions before update on public.auth_flow_definitions for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_auth_feature_flags on public.auth_feature_flags;
create trigger set_updated_at_auth_feature_flags before update on public.auth_feature_flags for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_auth_device_sessions on public.auth_device_sessions;
create trigger set_updated_at_auth_device_sessions before update on public.auth_device_sessions for each row execute function public.set_updated_at();

create or replace function public.current_auth_session_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'session_id', '')::uuid;
$$;

create or replace function public.get_role_permissions(target_role public.app_user_role)
returns text[]
language sql
stable
as $$
  select coalesce(array_agg(permission_key order by permission_key), '{}'::text[])
  from public.role_permissions
  where role_name = target_role;
$$;

grant select on public.auth_provider_configs to anon, authenticated;
grant select on public.auth_flow_definitions to anon, authenticated;
grant select on public.auth_feature_flags to anon, authenticated;
grant select on public.permission_catalog to authenticated;
grant select on public.role_permissions to authenticated;
grant select, insert, update on public.auth_device_sessions to authenticated;
grant select, insert on public.auth_security_events to authenticated;
grant select, insert on public.pwa_install_events to authenticated;

alter table public.auth_provider_configs enable row level security;
alter table public.auth_flow_definitions enable row level security;
alter table public.auth_feature_flags enable row level security;
alter table public.permission_catalog enable row level security;
alter table public.role_permissions enable row level security;
alter table public.auth_device_sessions enable row level security;
alter table public.auth_security_events enable row level security;
alter table public.pwa_install_events enable row level security;

drop policy if exists auth_provider_configs_public_select on public.auth_provider_configs;
create policy auth_provider_configs_public_select on public.auth_provider_configs
  for select to anon, authenticated
  using (true);

drop policy if exists auth_flow_definitions_public_select on public.auth_flow_definitions;
create policy auth_flow_definitions_public_select on public.auth_flow_definitions
  for select to anon, authenticated
  using (is_enabled = true);

drop policy if exists auth_feature_flags_public_select on public.auth_feature_flags;
create policy auth_feature_flags_public_select on public.auth_feature_flags
  for select to anon, authenticated
  using (true);

drop policy if exists permission_catalog_authenticated_select on public.permission_catalog;
create policy permission_catalog_authenticated_select on public.permission_catalog
  for select to authenticated
  using (true);

drop policy if exists role_permissions_authenticated_select on public.role_permissions;
create policy role_permissions_authenticated_select on public.role_permissions
  for select to authenticated
  using (true);

drop policy if exists auth_device_sessions_select_own on public.auth_device_sessions;
create policy auth_device_sessions_select_own on public.auth_device_sessions
  for select to authenticated
  using (auth_user_id = auth.uid() or public.is_admin_user());

drop policy if exists auth_device_sessions_insert_own on public.auth_device_sessions;
create policy auth_device_sessions_insert_own on public.auth_device_sessions
  for insert to authenticated
  with check (auth_user_id = auth.uid() or public.is_admin_user());

drop policy if exists auth_device_sessions_update_own on public.auth_device_sessions;
create policy auth_device_sessions_update_own on public.auth_device_sessions
  for update to authenticated
  using (auth_user_id = auth.uid() or public.is_admin_user())
  with check (auth_user_id = auth.uid() or public.is_admin_user());

drop policy if exists auth_security_events_select_own on public.auth_security_events;
create policy auth_security_events_select_own on public.auth_security_events
  for select to authenticated
  using (auth_user_id = auth.uid() or public.is_admin_user());

drop policy if exists auth_security_events_insert_own on public.auth_security_events;
create policy auth_security_events_insert_own on public.auth_security_events
  for insert to authenticated
  with check (auth_user_id = auth.uid() or public.is_admin_user());

drop policy if exists pwa_install_events_select_own on public.pwa_install_events;
create policy pwa_install_events_select_own on public.pwa_install_events
  for select to authenticated
  using (auth_user_id = auth.uid() or public.is_admin_user());

drop policy if exists pwa_install_events_insert_own on public.pwa_install_events;
create policy pwa_install_events_insert_own on public.pwa_install_events
  for insert to authenticated
  with check (auth_user_id = auth.uid() or public.is_admin_user());

insert into public.auth_provider_configs (
  id,
  display_name,
  protocol,
  category,
  availability,
  is_enabled,
  supports_direct_client_flow,
  is_enterprise,
  sort_order,
  discovery_url,
  domain_hint,
  client_id_env_var,
  secret_env_var,
  redirect_url_env_var,
  metadata
)
values
  ('google', 'Google', 'oauth_oidc', 'social', 'available', true, true, false, 10, 'https://accounts.google.com/.well-known/openid-configuration', null, 'SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID', 'SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET', 'VITE_AUTH_REDIRECT_URL', '{"scopes":["openid","email","profile"]}'::jsonb),
  ('github', 'GitHub', 'oauth_oidc', 'social', 'available', true, true, false, 20, 'https://github.com/login/oauth/.well-known/openid-configuration', null, 'SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID', 'SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET', 'VITE_AUTH_REDIRECT_URL', '{"scopes":["read:user","user:email"]}'::jsonb),
  ('azure', 'Microsoft', 'oauth_oidc', 'social', 'available', true, true, false, 30, 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration', null, 'SUPABASE_AUTH_EXTERNAL_AZURE_CLIENT_ID', 'SUPABASE_AUTH_EXTERNAL_AZURE_SECRET', 'VITE_AUTH_REDIRECT_URL', '{"scopes":["openid","email","profile"]}'::jsonb),
  ('apple', 'Apple', 'oauth_oidc', 'social', 'requires_config', false, true, false, 40, 'https://appleid.apple.com/.well-known/openid-configuration', null, 'SUPABASE_AUTH_EXTERNAL_APPLE_CLIENT_ID', 'SUPABASE_AUTH_EXTERNAL_APPLE_SECRET', 'VITE_AUTH_REDIRECT_URL', '{"scopes":["name","email"]}'::jsonb),
  ('enterprise_oidc', 'Enterprise OIDC', 'oauth_oidc', 'enterprise', 'available', true, true, true, 50, null, 'company.com', 'SUPABASE_AUTH_SSO_OIDC_CLIENT_ID', 'SUPABASE_AUTH_SSO_OIDC_SECRET', 'VITE_AUTH_REDIRECT_URL', '{"supportsDomainRouting":true}'::jsonb),
  ('enterprise_saml', 'Enterprise SAML', 'saml_2_0', 'enterprise', 'available', true, true, true, 60, null, 'company.com', 'SUPABASE_AUTH_SSO_SAML_ENTITY_ID', 'SUPABASE_AUTH_SSO_SAML_SIGNING_CERT', 'VITE_AUTH_REDIRECT_URL', '{"supportsDomainRouting":true}'::jsonb),
  ('password', 'Password', 'email', 'password', 'available', true, true, false, 70, null, null, null, null, 'VITE_AUTH_REDIRECT_URL', '{"requiresEmailVerification":true}'::jsonb),
  ('magic_link', 'Magic Link', 'email', 'passwordless', 'available', true, true, false, 80, null, null, null, null, 'VITE_AUTH_REDIRECT_URL', '{"delivery":"email_link"}'::jsonb),
  ('email_otp', 'Email One-Time Code', 'email', 'passwordless', 'requires_config', false, true, false, 90, null, null, null, null, 'VITE_AUTH_REDIRECT_URL', '{"delivery":"email_code"}'::jsonb),
  ('passkey', 'Passkeys', 'webauthn', 'mfa', 'preview', false, false, false, 100, null, null, 'VITE_SUPABASE_PASSKEYS_ENABLED', null, null, '{"requiresBrowserSupport":true}'::jsonb),
  ('totp', 'TOTP MFA', 'totp', 'mfa', 'preview', true, false, false, 110, null, null, 'VITE_SUPABASE_TOTP_MFA_ENABLED', null, null, '{"issuer":"FlowForge AI"}'::jsonb),
  ('sms_otp', 'SMS Fallback', 'sms', 'mfa', 'requires_config', false, false, false, 120, null, null, 'VITE_SUPABASE_SMS_MFA_FALLBACK_ENABLED', 'SUPABASE_AUTH_SMS_PROVIDER_SECRET', null, '{"fallbackOnly":true}'::jsonb)
on conflict (id) do update
set display_name = excluded.display_name,
    protocol = excluded.protocol,
    category = excluded.category,
    availability = excluded.availability,
    is_enabled = excluded.is_enabled,
    supports_direct_client_flow = excluded.supports_direct_client_flow,
    is_enterprise = excluded.is_enterprise,
    sort_order = excluded.sort_order,
    discovery_url = excluded.discovery_url,
    domain_hint = excluded.domain_hint,
    client_id_env_var = excluded.client_id_env_var,
    secret_env_var = excluded.secret_env_var,
    redirect_url_env_var = excluded.redirect_url_env_var,
    metadata = excluded.metadata,
    updated_at = timezone('utc', now());

insert into public.auth_flow_definitions (
  id,
  provider_config_id,
  display_name,
  flow_kind,
  is_enabled,
  fallback_ux,
  failure_states,
  telemetry_event_prefix,
  notes
)
values
  ('auth_google_oauth', 'google', 'Google Sign-In', 'oauth', true, '{"fallback":"password_or_magic_link","message":"Use your email-based fallback if your Google domain is blocked."}'::jsonb, '["provider_disabled","popup_blocked","redirect_mismatch"]'::jsonb, 'auth_google', 'Backward-compatible default sign-in path.'),
  ('auth_github_oauth', 'github', 'GitHub Sign-In', 'oauth', true, '{"fallback":"password_or_magic_link","message":"Switch to another provider if GitHub org policies block OAuth."}'::jsonb, '["provider_disabled","org_policy_blocked"]'::jsonb, 'auth_github', 'Engineering-oriented social provider.'),
  ('auth_microsoft_oauth', 'azure', 'Microsoft Sign-In', 'oauth', true, '{"fallback":"enterprise_sso","message":"Use enterprise SSO when tenant-specific Entra routing is required."}'::jsonb, '["provider_disabled","tenant_mismatch"]'::jsonb, 'auth_microsoft', 'Mapped to Supabase azure provider.'),
  ('auth_apple_oauth', 'apple', 'Apple Sign-In', 'oauth', true, '{"fallback":"magic_link","message":"Fallback to email-based login until Apple credentials are configured per environment."}'::jsonb, '["provider_disabled","missing_client_secret"]'::jsonb, 'auth_apple', 'Guarded behind feature flag and environment secrets.'),
  ('auth_enterprise_oidc', 'enterprise_oidc', 'Enterprise OIDC', 'sso', true, '{"fallback":"support_contact","message":"Show your IT setup instructions and fall back to email sign-in if domain routing is unavailable."}'::jsonb, '["unknown_domain","provider_not_found","tenant_not_enabled"]'::jsonb, 'auth_enterprise_oidc', 'Tenant-aware OIDC SSO.'),
  ('auth_enterprise_saml', 'enterprise_saml', 'Enterprise SAML', 'sso', true, '{"fallback":"support_contact","message":"Surface the company-specific SAML setup checklist when the tenant is not ready."}'::jsonb, '["unknown_domain","provider_not_found","metadata_invalid"]'::jsonb, 'auth_enterprise_saml', 'Tenant-aware SAML 2.0 SSO.'),
  ('auth_magic_link', 'magic_link', 'Magic Link', 'passwordless', true, '{"fallback":"email_otp","message":"Offer one-time codes when users switch devices before opening the email."}'::jsonb, '["rate_limited","smtp_unavailable","expired_link"]'::jsonb, 'auth_magic_link', 'Best for same-device passwordless sign-in.'),
  ('auth_email_otp', 'email_otp', 'Email One-Time Code', 'passwordless', true, '{"fallback":"magic_link","message":"Hide the code form when the environment has not enabled Token-based emails yet."}'::jsonb, '["template_not_updated","rate_limited","invalid_code"]'::jsonb, 'auth_email_otp', 'Cross-device email-based login and step-up verification.'),
  ('auth_passkey', 'passkey', 'Passkeys', 'mfa', true, '{"fallback":"totp","message":"Fallback to authenticator-app MFA on browsers or tenants without WebAuthn rollout."}'::jsonb, '["browser_not_supported","not_enrolled"]'::jsonb, 'auth_passkey', 'Future-proof WebAuthn contract.'),
  ('auth_totp', 'totp', 'TOTP MFA', 'mfa', true, '{"fallback":"sms_otp","message":"Keep SMS fallback opt-in only for recovery and edge cases."}'::jsonb, '["not_enrolled","challenge_failed"]'::jsonb, 'auth_totp', 'Primary MFA factor for FlowForge users.'),
  ('auth_sms_otp', 'sms_otp', 'SMS Fallback', 'mfa', true, '{"fallback":"support_contact","message":"SMS remains optional and is disabled until a provider is configured for the environment."}'::jsonb, '["provider_not_configured","rate_limited","code_expired"]'::jsonb, 'auth_sms', 'Recovery-only fallback factor.')
on conflict (id) do update
set provider_config_id = excluded.provider_config_id,
    display_name = excluded.display_name,
    flow_kind = excluded.flow_kind,
    is_enabled = excluded.is_enabled,
    fallback_ux = excluded.fallback_ux,
    failure_states = excluded.failure_states,
    telemetry_event_prefix = excluded.telemetry_event_prefix,
    notes = excluded.notes,
    updated_at = timezone('utc', now());

insert into public.auth_feature_flags (id, environment, is_enabled, rollout_percentage, config)
values
  ('auth.apple_oauth', 'all', false, 100, '{"provider":"apple"}'::jsonb),
  ('auth.enterprise_sso', 'all', true, 100, '{"modes":["oidc","saml"]}'::jsonb),
  ('auth.email_otp', 'all', false, 100, '{"template":"token_based"}'::jsonb),
  ('auth.passkeys_preview', 'all', false, 5, '{"rollout":"preview"}'::jsonb),
  ('auth.totp_mfa', 'all', true, 100, '{"primaryFactor":true}'::jsonb),
  ('auth.sms_mfa_fallback', 'all', false, 100, '{"fallbackOnly":true}'::jsonb),
  ('auth.session_registry', 'all', true, 100, '{"revocationMode":"app_managed"}'::jsonb),
  ('pwa.install_prompt', 'all', true, 100, '{"tabletFirst":true}'::jsonb),
  ('pwa.offline_shell', 'all', true, 100, '{"strategy":"shell_and_runtime_cache"}'::jsonb),
  ('pwa.background_updates', 'all', true, 100, '{"refreshPrompt":true}'::jsonb),
  ('pwa.tablet_layouts', 'all', true, 100, '{"minimumTapTargetPx":44}'::jsonb)
on conflict (id) do update
set environment = excluded.environment,
    is_enabled = excluded.is_enabled,
    rollout_percentage = excluded.rollout_percentage,
    config = excluded.config,
    updated_at = timezone('utc', now());

insert into public.permission_catalog (permission_key, scope, description)
values
  ('auth.providers.read', 'auth', 'Read provider catalog, flow definitions, and auth feature flags.'),
  ('auth.sessions.read_self', 'auth', 'Read your own device sessions.'),
  ('auth.sessions.revoke_self', 'auth', 'Revoke your own device sessions.'),
  ('auth.sessions.read_any', 'auth', 'Read any user device session for support and incident response.'),
  ('auth.sessions.revoke_any', 'auth', 'Revoke any user device session for support and incident response.'),
  ('auth.audit.read_self', 'auth', 'Read your own auth security events.'),
  ('auth.audit.read_any', 'auth', 'Read any auth security event.'),
  ('auth.flags.manage', 'auth', 'Manage auth feature flags and rollout state.'),
  ('pwa.install.telemetry.read', 'pwa', 'Read PWA install and update telemetry.')
on conflict (permission_key) do update
set scope = excluded.scope,
    description = excluded.description;

insert into public.role_permissions (role_name, permission_key)
values
  ('Builder', 'auth.providers.read'),
  ('Builder', 'auth.sessions.read_self'),
  ('Builder', 'auth.sessions.revoke_self'),
  ('Builder', 'auth.audit.read_self'),
  ('Architect', 'auth.providers.read'),
  ('Architect', 'auth.sessions.read_self'),
  ('Architect', 'auth.sessions.revoke_self'),
  ('Architect', 'auth.audit.read_self'),
  ('Architect', 'pwa.install.telemetry.read'),
  ('Admin', 'auth.providers.read'),
  ('Admin', 'auth.sessions.read_self'),
  ('Admin', 'auth.sessions.revoke_self'),
  ('Admin', 'auth.sessions.read_any'),
  ('Admin', 'auth.sessions.revoke_any'),
  ('Admin', 'auth.audit.read_self'),
  ('Admin', 'auth.audit.read_any'),
  ('Admin', 'auth.flags.manage'),
  ('Admin', 'pwa.install.telemetry.read')
on conflict (role_name, permission_key) do nothing;

do $$
declare
  flowforge_project_id text;
begin
  select id into flowforge_project_id
  from public.projects
  where lower(name) = lower('FlowForge AI')
  order by created_at asc
  limit 1;

  if flowforge_project_id is not null then
    insert into public.features (
      id,
      project_id,
      feature_code,
      title,
      status,
      priority,
      problem,
      solution,
      why,
      non_technical_description,
      technical_description,
      concept_thinker,
      builder_brief,
      coding_prompt,
      ui_design_prompt,
      archived,
      integrity_status,
      created_at,
      updated_at
    )
    values
      (
        'flowforge-auth-modernization',
        flowforge_project_id,
        'AUTH-401',
        'Industry-Standard Auth Modernization',
        'In Progress',
        'Critical',
        'FlowForge currently supports a subset of social auth and email-based passwordless flows, but lacks enterprise SSO, MFA orchestration, trusted-device management, and revocable session inventory.',
        'Introduce a provider-agnostic auth architecture with Google, GitHub, Microsoft, Apple, enterprise SAML/OIDC routing, password reset, passwordless flows, TOTP-first MFA, optional SMS fallback, and device/session controls backed by Supabase and FlowForge-managed session telemetry.',
        'Authentication is a prerequisite for enterprise rollout, shared tablet use, and long-running daily workspace sessions.',
        'Give every team a familiar and secure way to sign in without locking FlowForge to one provider.',
        'Seed provider config tables, flow definitions, auth feature flags, session registry, and client-side auth UX so future providers can be added by configuration rather than bespoke UI rewrites.',
        'Concept Thinkers need low-friction sign-in that still meets enterprise buyer expectations.',
        'Implement provider catalog reads, enterprise domain routing, session registry writes, session list UX, fallback messaging, and audit telemetry.',
        'Add Supabase migrations, feature flags, session registry helpers, password reset, enterprise SSO initiation, and review-ready fallback states while preserving existing Google login behavior.',
        'Keep social and enterprise auth pathways visually grouped, show rollout state for security factors, and expose failure/fallback guidance directly on the auth screen.',
        false,
        'planned',
        timezone('utc', now()),
        timezone('utc', now())
      ),
      (
        'flowforge-tablet-pwa-shell',
        flowforge_project_id,
        'PWA-402',
        'Tablet-Installable PWA Shell',
        'In Progress',
        'High',
        'Daily tablet usage suffers from browser tab churn, unreliable connectivity, and missing install/update affordances.',
        'Ship FlowForge as an installable PWA with a manifest, service worker, offline shell, install prompt, background update prompt, and tablet-first touch ergonomics while keeping sensitive auth material out of local-only caches.',
        'An installable shell improves resilience for App Concept Thinkers and Developers who keep FlowForge open for long sessions on iPads and Android tablets.',
        'Make FlowForge feel like a dependable daily workspace, not a disposable browser tab.',
        'Seed PWA feature flags, install telemetry, and supporting docs while adding a service worker, manifest, tablet-safe layout adjustments, and resilient install/update UX.',
        'Concept Thinkers need faster startup and fewer interruptions when switching between meetings and hands-on work.',
        'Add manifest metadata, cached app shell, install banner, update flow, and network-aware UX with non-sensitive local persistence only.',
        'Register a service worker, add public PWA assets, create install/update prompts, and document the production icon pipeline gap for iOS splash assets.',
        'Optimize prompts and controls for coarse pointers, safe areas, and landscape tablet usage without breaking desktop layouts.',
        false,
        'planned',
        timezone('utc', now()),
        timezone('utc', now())
      )
    on conflict (id) do update
    set project_id = excluded.project_id,
        feature_code = excluded.feature_code,
        title = excluded.title,
        status = excluded.status,
        priority = excluded.priority,
        problem = excluded.problem,
        solution = excluded.solution,
        why = excluded.why,
        non_technical_description = excluded.non_technical_description,
        technical_description = excluded.technical_description,
        concept_thinker = excluded.concept_thinker,
        builder_brief = excluded.builder_brief,
        coding_prompt = excluded.coding_prompt,
        ui_design_prompt = excluded.ui_design_prompt,
        archived = excluded.archived,
        integrity_status = excluded.integrity_status,
        updated_at = timezone('utc', now());

    insert into public.tasks (
      id,
      project_id,
      title,
      description,
      status,
      priority,
      related_entity_id,
      related_entity_type,
      developer_notes,
      failure_notes,
      created_at,
      updated_at
    )
    values
      ('task-auth-sso-rollout', flowforge_project_id, 'Roll out enterprise SSO catalog', 'Configure tenant-aware SAML and OIDC providers with environment-specific secrets, redirect URLs, and domain routing.', 'planned', 'Critical', 'flowforge-auth-modernization', 'feature', 'Use Supabase SSO plus FlowForge provider config tables.', 'Surface fallback UX when a company domain is unknown.', timezone('utc', now()), timezone('utc', now())),
      ('task-auth-session-hardening', flowforge_project_id, 'Ship session registry and revoke UX', 'Track device sessions, trusted devices, revoke flows, and logout-all without breaking existing auth.', 'planned', 'Critical', 'flowforge-auth-modernization', 'feature', 'Use FlowForge-managed session registry keyed by JWT session_id.', 'Current implementation needs follow-up if server-side auth cookies are introduced.', timezone('utc', now()), timezone('utc', now())),
      ('task-pwa-offline-shell', flowforge_project_id, 'Deliver installable tablet shell', 'Add manifest, service worker, install prompt, offline shell caching, and background update notices.', 'planned', 'High', 'flowforge-tablet-pwa-shell', 'feature', 'Cache only shell assets and non-sensitive UI state.', 'iOS production splash assets still need a generated icon pipeline.', timezone('utc', now()), timezone('utc', now())),
      ('task-pwa-network-resilience', flowforge_project_id, 'Add sync and retry UX', 'Show offline state, preserve workspace shell, and make retries clear after the network returns.', 'planned', 'High', 'flowforge-tablet-pwa-shell', 'feature', 'Prefer background refresh and user-visible update prompts over silent stale shells.', 'Write-through mutation retry queues are still a follow-up concern.', timezone('utc', now()), timezone('utc', now()))
    on conflict (id) do update
    set title = excluded.title,
        description = excluded.description,
        status = excluded.status,
        priority = excluded.priority,
        related_entity_id = excluded.related_entity_id,
        related_entity_type = excluded.related_entity_type,
        developer_notes = excluded.developer_notes,
        failure_notes = excluded.failure_notes,
        updated_at = timezone('utc', now());
  end if;
end $$;