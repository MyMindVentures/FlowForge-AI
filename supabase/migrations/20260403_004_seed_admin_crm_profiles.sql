alter table public.app_users
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists alias_name text,
  add column if not exists secondary_email text,
  add column if not exists phone text,
  add column if not exists job_title text,
  add column if not exists function_title text,
  add column if not exists organization_name text,
  add column if not exists github_username text,
  add column if not exists github_profile_url text,
  add column if not exists github_primary_email text,
  add column if not exists github_avatar_url text,
  add column if not exists github_user_id text,
  add column if not exists bio text;

create unique index if not exists app_users_secondary_email_unique_idx
  on public.app_users (lower(secondary_email))
  where secondary_email is not null;

create unique index if not exists app_users_github_username_unique_idx
  on public.app_users (lower(github_username))
  where github_username is not null;

create unique index if not exists app_users_github_user_id_unique_idx
  on public.app_users (github_user_id)
  where github_user_id is not null;

do $$
declare
  seed_now timestamptz := timezone('utc', now());
  kevin_auth_user_id uuid;
  loli_auth_user_id uuid;
begin
  select id
  into kevin_auth_user_id
  from auth.users
  where lower(email) = lower('hello@mymindventures.io')
    and deleted_at is null
  limit 1;

  if kevin_auth_user_id is null then
    kevin_auth_user_id := gen_random_uuid();

    insert into auth.users (
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      phone,
      is_sso_user,
      is_anonymous
    )
    values (
      kevin_auth_user_id,
      'authenticated',
      'authenticated',
      'hello@mymindventures.io',
      crypt(gen_random_uuid()::text, gen_salt('bf')),
      seed_now,
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object(
        'first_name', 'Kevin',
        'last_name', 'De Vlieger',
        'alias_name', 'The Architect',
        'full_name', 'Kevin De Vlieger',
        'display_name', 'Kevin De Vlieger',
        'phone', '+34 643 037 346',
        'organization_name', 'MyMindVentures',
        'function_title', 'Architect',
        'job_title', 'Admin',
        'seeded_by', '20260403_004_seed_admin_crm_profiles',
        'password_status', 'reset_required'
      ),
      seed_now,
      seed_now,
      '+34 643 037 346',
      false,
      false
    );
  else
    update auth.users
    set
      email = 'hello@mymindventures.io',
      email_confirmed_at = coalesce(email_confirmed_at, seed_now),
      phone = coalesce(phone, '+34 643 037 346'),
      raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
        'first_name', 'Kevin',
        'last_name', 'De Vlieger',
        'alias_name', 'The Architect',
        'full_name', 'Kevin De Vlieger',
        'display_name', 'Kevin De Vlieger',
        'phone', '+34 643 037 346',
        'organization_name', 'MyMindVentures',
        'function_title', 'Architect',
        'job_title', 'Admin',
        'seeded_by', '20260403_004_seed_admin_crm_profiles',
        'password_status', 'reset_required'
      ),
      updated_at = seed_now
    where id = kevin_auth_user_id;
  end if;

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    gen_random_uuid(),
    kevin_auth_user_id,
    jsonb_build_object(
      'sub', kevin_auth_user_id::text,
      'email', 'hello@mymindventures.io',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    kevin_auth_user_id::text,
    seed_now,
    seed_now,
    seed_now
  )
  on conflict (provider_id, provider)
  do update set
    user_id = excluded.user_id,
    identity_data = excluded.identity_data,
    updated_at = excluded.updated_at;

  insert into public.app_users (
    id,
    auth_user_id,
    email,
    display_name,
    role,
    onboarded,
    storytelling_completed,
    created_at,
    updated_at,
    last_login,
    first_name,
    last_name,
    alias_name,
    phone,
    job_title,
    function_title,
    organization_name,
    settings
  )
  values (
    kevin_auth_user_id::text,
    kevin_auth_user_id,
    'hello@mymindventures.io',
    'Kevin De Vlieger',
    'Admin',
    true,
    true,
    seed_now,
    seed_now,
    seed_now,
    'Kevin',
    'De Vlieger',
    'The Architect',
    '+34 643 037 346',
    'Admin',
    'Architect',
    'MyMindVentures',
    '{"theme":"dark","notifications":true}'::jsonb
  )
  on conflict (email)
  do update set
    auth_user_id = excluded.auth_user_id,
    display_name = excluded.display_name,
    role = 'Admin',
    onboarded = true,
    storytelling_completed = true,
    updated_at = seed_now,
    last_login = seed_now,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    alias_name = excluded.alias_name,
    phone = excluded.phone,
    job_title = excluded.job_title,
    function_title = excluded.function_title,
    organization_name = excluded.organization_name;

  select id
  into loli_auth_user_id
  from auth.users
  where lower(email) = lower('supercabrawoman@gmail.com')
    and deleted_at is null
  limit 1;

  if loli_auth_user_id is null then
    loli_auth_user_id := gen_random_uuid();

    insert into auth.users (
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      phone,
      is_sso_user,
      is_anonymous
    )
    values (
      loli_auth_user_id,
      'authenticated',
      'authenticated',
      'supercabrawoman@gmail.com',
      crypt(gen_random_uuid()::text, gen_salt('bf')),
      seed_now,
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object(
        'first_name', 'Loli',
        'last_name', 'Mariscal',
        'alias_name', 'The Builder',
        'full_name', 'Loli Mariscal',
        'display_name', 'Loli Mariscal',
        'phone', '+34 689 520 721',
        'secondary_email', 'loli.mariscal@hotmail.com',
        'organization_name', 'MyMindVentures',
        'function_title', 'Builder',
        'job_title', 'Admin',
        'seeded_by', '20260403_004_seed_admin_crm_profiles',
        'password_status', 'reset_required'
      ),
      seed_now,
      seed_now,
      '+34 689 520 721',
      false,
      false
    );
  else
    update auth.users
    set
      email = 'supercabrawoman@gmail.com',
      email_confirmed_at = coalesce(email_confirmed_at, seed_now),
      phone = coalesce(phone, '+34 689 520 721'),
      raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
        'first_name', 'Loli',
        'last_name', 'Mariscal',
        'alias_name', 'The Builder',
        'full_name', 'Loli Mariscal',
        'display_name', 'Loli Mariscal',
        'phone', '+34 689 520 721',
        'secondary_email', 'loli.mariscal@hotmail.com',
        'organization_name', 'MyMindVentures',
        'function_title', 'Builder',
        'job_title', 'Admin',
        'seeded_by', '20260403_004_seed_admin_crm_profiles',
        'password_status', 'reset_required'
      ),
      updated_at = seed_now
    where id = loli_auth_user_id;
  end if;

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    gen_random_uuid(),
    loli_auth_user_id,
    jsonb_build_object(
      'sub', loli_auth_user_id::text,
      'email', 'supercabrawoman@gmail.com',
      'email_verified', true,
      'phone_verified', false,
      'secondary_email', 'loli.mariscal@hotmail.com'
    ),
    'email',
    loli_auth_user_id::text,
    seed_now,
    seed_now,
    seed_now
  )
  on conflict (provider_id, provider)
  do update set
    user_id = excluded.user_id,
    identity_data = excluded.identity_data,
    updated_at = excluded.updated_at;

  insert into public.app_users (
    id,
    auth_user_id,
    email,
    display_name,
    role,
    onboarded,
    storytelling_completed,
    created_at,
    updated_at,
    last_login,
    first_name,
    last_name,
    alias_name,
    secondary_email,
    phone,
    job_title,
    function_title,
    organization_name,
    settings
  )
  values (
    loli_auth_user_id::text,
    loli_auth_user_id,
    'supercabrawoman@gmail.com',
    'Loli Mariscal',
    'Admin',
    true,
    true,
    seed_now,
    seed_now,
    seed_now,
    'Loli',
    'Mariscal',
    'The Builder',
    'loli.mariscal@hotmail.com',
    '+34 689 520 721',
    'Admin',
    'Builder',
    'MyMindVentures',
    '{"theme":"dark","notifications":true}'::jsonb
  )
  on conflict (email)
  do update set
    auth_user_id = excluded.auth_user_id,
    display_name = excluded.display_name,
    role = 'Admin',
    onboarded = true,
    storytelling_completed = true,
    updated_at = seed_now,
    last_login = seed_now,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    alias_name = excluded.alias_name,
    secondary_email = excluded.secondary_email,
    phone = excluded.phone,
    job_title = excluded.job_title,
    function_title = excluded.function_title,
    organization_name = excluded.organization_name;
end $$;