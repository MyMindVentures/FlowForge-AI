alter table public.features
  add column if not exists delivery_checklist jsonb not null default jsonb_build_object(
    'frontendImplemented', false,
    'backendImplemented', false,
    'databaseImplemented', false,
    'aiImplemented', false,
    'testsImplemented', false,
    'docsUpdated', false,
    'qaApproved', false,
    'readyForRelease', false
  );

update public.features
set delivery_checklist = coalesce(
  delivery_checklist,
  jsonb_build_object(
    'frontendImplemented', false,
    'backendImplemented', false,
    'databaseImplemented', false,
    'aiImplemented', false,
    'testsImplemented', false,
    'docsUpdated', false,
    'qaApproved', false,
    'readyForRelease', false
  )
)
where delivery_checklist is null;

comment on column public.features.delivery_checklist is 'Structured implementation checklist for feature delivery across frontend, backend, database, AI, testing, docs, QA, and release readiness.';