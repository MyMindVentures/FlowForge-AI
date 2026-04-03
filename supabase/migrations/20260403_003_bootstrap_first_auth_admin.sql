create or replace function public.promote_first_linked_user()
returns trigger
language plpgsql
as $$
begin
  if new.auth_user_id is not null and not exists (
    select 1
    from public.app_users existing_users
    where existing_users.auth_user_id is not null
      and existing_users.id <> new.id
  ) then
    new.role = 'Admin'::public.app_user_role;
  end if;

  return new;
end;
$$;

drop trigger if exists promote_first_linked_user_on_app_users on public.app_users;
create trigger promote_first_linked_user_on_app_users
before insert or update of auth_user_id on public.app_users
for each row
execute function public.promote_first_linked_user();