create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.app_users
    where auth_user_id = auth.uid()
      and role = 'Admin'
  );
$$;

grant execute on function public.is_admin_user() to anon, authenticated;