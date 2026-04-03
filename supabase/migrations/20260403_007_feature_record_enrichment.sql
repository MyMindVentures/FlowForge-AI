alter table public.features
  add column if not exists category text,
  add column if not exists epic text,
  add column if not exists release text,
  add column if not exists persona text,
  add column if not exists jobs_to_be_done text,
  add column if not exists acceptance_criteria text,
  add column if not exists success_metrics text,
  add column if not exists non_functional_requirements text,
  add column if not exists assumptions text,
  add column if not exists risks text,
  add column if not exists notes text,
  add column if not exists figma_link text,
  add column if not exists spec_link text;

update public.features
set notes = coalesce(notes, impact_analysis)
where coalesce(notes, '') = ''
  and coalesce(impact_analysis, '') <> '';

comment on column public.features.category is 'Portfolio grouping for the feature card, such as onboarding, architecture, marketing, or admin.';
comment on column public.features.epic is 'Higher-level initiative or theme the feature belongs to.';
comment on column public.features.release is 'Intended release or milestone target for the feature.';
comment on column public.features.persona is 'Primary persona or personas this feature serves.';
comment on column public.features.jobs_to_be_done is 'JTBD statement that anchors the feature in user intent.';
comment on column public.features.acceptance_criteria is 'Concrete success conditions that define what complete delivery looks like.';
comment on column public.features.success_metrics is 'Outcome metrics that indicate whether the feature is delivering value.';
comment on column public.features.non_functional_requirements is 'Cross-cutting delivery requirements such as reliability, performance, accessibility, or security.';
comment on column public.features.assumptions is 'Key assumptions the concept thinker is making while shaping the feature.';
comment on column public.features.risks is 'Known implementation, product, or operational risks.';
comment on column public.features.notes is 'General follow-up notes that do not fit a dedicated field.';
comment on column public.features.figma_link is 'Optional design reference for the feature.';
comment on column public.features.spec_link is 'Optional external or generated specification reference for the feature.';