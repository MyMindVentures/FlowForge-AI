create table if not exists public.feedback (
  id text primary key,
  user_id text not null references public.app_users(id) on delete cascade,
  user_email text not null,
  project_id text references public.projects(id) on delete set null,
  category text not null,
  status text not null default 'new',
  subject text not null,
  message text not null,
  context_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_feedback_user_created_at on public.feedback(user_id, created_at desc);
create index if not exists idx_feedback_project_created_at on public.feedback(project_id, created_at desc);

drop trigger if exists set_updated_at_feedback on public.feedback;
create trigger set_updated_at_feedback before update on public.feedback for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.feedback to authenticated;

alter table public.feedback enable row level security;

drop policy if exists feedback_select on public.feedback;
create policy feedback_select on public.feedback for select to authenticated using (
  user_id = public.current_app_user_id() or public.is_admin_user()
);

drop policy if exists feedback_insert on public.feedback;
create policy feedback_insert on public.feedback for insert to authenticated with check (
  (
    user_id = public.current_app_user_id()
    and (project_id is null or public.can_access_project(project_id))
  )
  or public.is_admin_user()
);

drop policy if exists feedback_update on public.feedback;
create policy feedback_update on public.feedback for update to authenticated using (
  user_id = public.current_app_user_id() or public.is_admin_user()
) with check (
  (
    user_id = public.current_app_user_id()
    and (project_id is null or public.can_access_project(project_id))
  )
  or public.is_admin_user()
);

drop policy if exists feedback_delete on public.feedback;
create policy feedback_delete on public.feedback for delete to authenticated using (
  public.is_admin_user()
);

do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.feedback';
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;