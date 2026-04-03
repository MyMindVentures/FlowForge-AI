alter table public.feature_comments
  add column if not exists author_name text,
  add column if not exists summary text,
  add column if not exists status text not null default 'open',
  add column if not exists resolved_at timestamptz;

update public.feature_comments
set author_name = coalesce(author_name, author_role),
    summary = coalesce(summary, left(content, 120)),
    status = coalesce(nullif(status, ''), 'open')
where author_name is null
   or summary is null
   or status is null
   or status = '';

create index if not exists idx_feature_comments_feature_status_created_at
  on public.feature_comments(feature_id, status, created_at desc);

comment on column public.feature_comments.author_name is 'Display name or alias of the person or role that authored the collaboration note.';
comment on column public.feature_comments.summary is 'Short collaboration headline used by the comment hub for fast triage.';
comment on column public.feature_comments.status is 'Open or resolved collaboration state for the comment thread item.';
comment on column public.feature_comments.resolved_at is 'Timestamp set when a collaboration item is resolved.';