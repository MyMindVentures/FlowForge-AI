create table if not exists public.auth_login_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  app_user_id text unique references public.app_users(id) on delete cascade,
  slug text not null unique,
  display_name text not null,
  alias_name text,
  email text not null,
  role public.app_user_role not null default 'Builder',
  sort_order integer not null default 0,
  is_enabled boolean not null default true,
  password_login_enabled boolean not null default true,
  password_status text not null default 'active',
  password_seeded_at timestamptz,
  last_password_rotation_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists auth_login_profiles_email_unique_idx
  on public.auth_login_profiles (lower(email));

create index if not exists auth_login_profiles_enabled_sort_idx
  on public.auth_login_profiles (sort_order, display_name)
  where is_enabled = true;

drop trigger if exists set_updated_at_auth_login_profiles on public.auth_login_profiles;
create trigger set_updated_at_auth_login_profiles before update on public.auth_login_profiles for each row execute function public.set_updated_at();

grant select on public.auth_login_profiles to anon, authenticated;

alter table public.auth_login_profiles enable row level security;

drop policy if exists auth_login_profiles_public_select on public.auth_login_profiles;
create policy auth_login_profiles_public_select on public.auth_login_profiles
  for select
  to anon, authenticated
  using (is_enabled = true);

do $$
declare
  seed_now timestamptz := timezone('utc', now());
  kevin_auth_user_id uuid;
  loli_auth_user_id uuid;
begin
  select auth_user_id
  into kevin_auth_user_id
  from public.app_users
  where lower(email) = lower('hello@mymindventures.io')
  limit 1;

  select auth_user_id
  into loli_auth_user_id
  from public.app_users
  where lower(email) = lower('supercabrawoman@gmail.com')
  limit 1;

  if kevin_auth_user_id is not null then
    update auth.users
    set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
      'password_status', 'active',
      'password_seeded_at', seed_now,
      'default_login_slug', 'kevin'
    )
    where id = kevin_auth_user_id;

    insert into public.auth_login_profiles (
      auth_user_id,
      app_user_id,
      slug,
      display_name,
      alias_name,
      email,
      role,
      sort_order,
      is_enabled,
      password_login_enabled,
      password_status,
      password_seeded_at,
      last_password_rotation_at
    )
    values (
      kevin_auth_user_id,
      kevin_auth_user_id::text,
      'kevin',
      'Kevin De Vlieger',
      'The Architect',
      'hello@mymindventures.io',
      'Admin',
      10,
      true,
      true,
      'active',
      seed_now,
      seed_now
    )
    on conflict (slug)
    do update set
      auth_user_id = excluded.auth_user_id,
      app_user_id = excluded.app_user_id,
      display_name = excluded.display_name,
      alias_name = excluded.alias_name,
      email = excluded.email,
      role = excluded.role,
      sort_order = excluded.sort_order,
      is_enabled = excluded.is_enabled,
      password_login_enabled = excluded.password_login_enabled,
      password_status = excluded.password_status,
      password_seeded_at = excluded.password_seeded_at,
      last_password_rotation_at = excluded.last_password_rotation_at,
      updated_at = seed_now;
  end if;

  if loli_auth_user_id is not null then
    update auth.users
    set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
      'password_status', 'active',
      'password_seeded_at', seed_now,
      'default_login_slug', 'loli'
    )
    where id = loli_auth_user_id;

    insert into public.auth_login_profiles (
      auth_user_id,
      app_user_id,
      slug,
      display_name,
      alias_name,
      email,
      role,
      sort_order,
      is_enabled,
      password_login_enabled,
      password_status,
      password_seeded_at,
      last_password_rotation_at
    )
    values (
      loli_auth_user_id,
      loli_auth_user_id::text,
      'loli',
      'Loli Mariscal',
      'The Builder',
      'supercabrawoman@gmail.com',
      'Admin',
      20,
      true,
      true,
      'active',
      seed_now,
      seed_now
    )
    on conflict (slug)
    do update set
      auth_user_id = excluded.auth_user_id,
      app_user_id = excluded.app_user_id,
      display_name = excluded.display_name,
      alias_name = excluded.alias_name,
      email = excluded.email,
      role = excluded.role,
      sort_order = excluded.sort_order,
      is_enabled = excluded.is_enabled,
      password_login_enabled = excluded.password_login_enabled,
      password_status = excluded.password_status,
      password_seeded_at = excluded.password_seeded_at,
      last_password_rotation_at = excluded.last_password_rotation_at,
      updated_at = seed_now;
  end if;
end $$;