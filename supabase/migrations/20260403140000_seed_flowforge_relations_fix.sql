insert into public.page_layouts (
  page_id,
  name,
  layout_type,
  description,
  breakpoint,
  grid_definition,
  notes,
  version,
  is_primary
)
select pg.id,
       case
         when pg.slug in ('onboarding', 'role-selection') then 'Auth Layout'
         when pg.slug in ('storytelling', 'splash') then 'Empty Layout'
         else 'Dashboard Layout'
       end,
       case
         when pg.slug in ('onboarding', 'role-selection') then 'mobile'
         else 'default'
       end,
       case
         when pg.slug in ('onboarding', 'role-selection') then 'Clean layout for authentication and onboarding'
         when pg.slug in ('storytelling', 'splash') then 'Minimal layout for splash and storytelling'
         else 'Main application layout with sidebar and header'
       end,
       null,
       '{}'::jsonb,
       null,
       '1.0.0',
       true
from public.projects pr
join public.pages pg on pg.project_id = pr.id
where pr.slug = 'flowforge-ai'
  and not exists (
    select 1 from public.page_layouts pl where pl.page_id = pg.id and pl.is_primary = true
  );

insert into public.userflow_pages (userflow_id, page_id, step_order, step_name, is_optional, condition, notes)
select uf.id, pg.id, steps.step_order, steps.step_name, false, null, null
from public.projects pr
join public.userflows uf on uf.project_id = pr.id
join (
  values
    ('founder-onboarding', 'splash', 1, 'Splash'),
    ('founder-onboarding', 'storytelling', 2, 'Storytelling'),
    ('founder-onboarding', 'role-selection', 3, 'Role Selection'),
    ('founder-onboarding', 'onboarding', 4, 'Onboarding'),
    ('founder-onboarding', 'project-hub', 5, 'Project Hub'),
    ('project-planning', 'project-hub', 1, 'Hub'),
    ('project-planning', 'backlog', 2, 'Backlog'),
    ('project-planning', 'feature-chat', 3, 'Feature Ideation'),
    ('project-planning', 'ui-architecture', 4, 'UI Architecture'),
    ('project-planning', 'feature-detail', 5, 'Feature Detail'),
    ('project-planning', 'project-documentation', 6, 'Documentation'),
    ('project-planning', 'roadmap', 7, 'Roadmap'),
    ('admin-operations', 'admin', 1, 'Admin Home'),
    ('admin-operations', 'dashboard', 2, 'Dashboard'),
    ('admin-operations', 'notifications', 3, 'Notifications'),
    ('admin-operations', 'project-settings', 4, 'Project Settings')
) as steps(userflow_slug, page_slug, step_order, step_name) on steps.userflow_slug = uf.slug
join public.pages pg on pg.project_id = pr.id and pg.slug = steps.page_slug
where pr.slug = 'flowforge-ai'
on conflict (userflow_id, step_order) do update
set page_id = excluded.page_id,
    step_name = excluded.step_name,
    updated_at = timezone('utc', now());

insert into public.layout_components (
  layout_id,
  component_id,
  parent_layout_component_id,
  zone,
  position_order,
  x,
  y,
  width,
  height,
  configuration_json,
  visibility_rules,
  notes
)
select pl.id, cmp.id, null, mapping.zone, mapping.position_order, null, null, null, null, '{}'::jsonb, '{}'::jsonb, null
from public.projects pr
join public.pages pg on pg.project_id = pr.id
join public.page_layouts pl on pl.page_id = pg.id and pl.is_primary = true
join (
  values
    ('admin', 'full-prd', 'body', 1),
    ('admin', 'tasklist', 'body', 2),
    ('workspace', 'sync-indicator', 'header', 1),
    ('workspace', 'integrity-badge', 'body', 2),
    ('feature-detail', 'feature-overview', 'body', 1),
    ('feature-detail', 'feature-prompts', 'body', 2),
    ('feature-detail', 'feature-builder-brief', 'body', 3),
    ('feature-detail', 'feature-ui-architecture', 'body', 4),
    ('ui-architecture', 'page-detail-view', 'body', 1),
    ('ui-architecture', 'layout-modal', 'body', 2),
    ('ui-architecture', 'component-modal', 'body', 3),
    ('project-documentation', 'full-prd', 'body', 1),
    ('ai-agents', 'llm-functions-management', 'body', 1),
    ('storytelling', 'feature-concept', 'body', 1)
) as mapping(page_slug, component_slug, zone, position_order) on mapping.page_slug = pg.slug
join public.components cmp on cmp.project_id = pr.id and cmp.slug = mapping.component_slug
where pr.slug = 'flowforge-ai'
on conflict (layout_id, position_order) do update
set component_id = excluded.component_id,
    zone = excluded.zone,
    configuration_json = excluded.configuration_json,
    visibility_rules = excluded.visibility_rules,
    updated_at = timezone('utc', now());