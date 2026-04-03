with upsert_project as (
  insert into public.projects (
    name,
    slug,
    description,
    platform,
    status,
    version,
    owner_auth_id
  )
  values (
    'FlowForge AI',
    'flowforge-ai',
    'The self-reflecting project of the FlowForge AI platform itself. Synchronized with the codebase and database.',
    'responsive',
    'active',
    '1.0.0',
    'system-flowforge'
  )
  on conflict (slug) do update
  set description = excluded.description,
      platform = excluded.platform,
      status = excluded.status,
      version = excluded.version,
      owner_auth_id = excluded.owner_auth_id,
      updated_at = timezone('utc', now())
  returning id
),
project_ref as (
  select id from upsert_project
  union all
  select id from public.projects where slug = 'flowforge-ai'
  limit 1
),
upsert_member as (
  insert into public.project_members (project_id, member_auth_id, role)
  select id, 'system-flowforge', 'owner' from project_ref
  on conflict (project_id, member_auth_id) do update
  set role = excluded.role
  returning id
),
upsert_pages as (
  insert into public.pages (
    project_id,
    name,
    slug,
    page_type,
    description,
    route,
    purpose,
    auth_required,
    status,
    screen_title,
    empty_state_description,
    error_state_description,
    loading_state_description
  )
  select project_ref.id, seed.name, seed.slug, seed.page_type, seed.description, seed.route, seed.purpose,
         seed.auth_required, 'active', seed.name, null, null, null
  from project_ref
  cross join (
    values
      ('Admin', 'admin', 'screen', 'System-wide control and monitoring', '/admin', 'System-wide control and monitoring', true),
      ('Dashboard', 'dashboard', 'screen', 'Project overview and selection', '/projects', 'Project overview and selection', true),
      ('Workspace', 'workspace', 'screen', 'Main collaboration area', '/projects/:id/workspace', 'Main collaboration area', true),
      ('Storytelling', 'storytelling', 'screen', 'Mission and vision introduction', '/storytelling', 'Mission and vision introduction', false),
      ('Onboarding', 'onboarding', 'form', 'User setup and role selection', '/onboarding', 'User setup and role selection', false),
      ('ProjectHub', 'project-hub', 'screen', 'Central project management', '/projects/:id/hub', 'Central project management', true),
      ('UIArchitecture', 'ui-architecture', 'screen', 'Visual app structure planning', '/projects/:id/architecture', 'Visual app structure planning', true),
      ('AIAgents', 'ai-agents', 'screen', 'AI agent configuration', '/projects/:id/agents', 'AI agent configuration', true),
      ('AssetManager', 'asset-manager', 'screen', 'Media and asset management', '/projects/:id/assets', 'Media and asset management', true),
      ('Backlog', 'backlog', 'list', 'Feature backlog management', '/projects/:id/backlog', 'Feature backlog management', true),
      ('FeatureChat', 'feature-chat', 'screen', 'AI-powered feature ideation', '/projects/:id/ideation', 'AI-powered feature ideation', true),
      ('MarketingKit', 'marketing-kit', 'screen', 'Marketing and showcase tools', '/projects/:id/marketing', 'Marketing and showcase tools', true),
      ('ProjectDocumentation', 'project-documentation', 'screen', 'Project documentation', '/projects/:id/docs', 'Project documentation', true),
      ('Roadmap', 'roadmap', 'screen', 'Project roadmap visualization', '/projects/:id/roadmap', 'Project roadmap visualization', true),
      ('FeatureDetail', 'feature-detail', 'detail', 'Detailed feature view and management', '/projects/:id/feature/:featureId', 'Detailed feature view and management', true),
      ('Notifications', 'notifications', 'screen', 'System and project notifications', '/notifications', 'System and project notifications', true),
      ('ProjectSettings', 'project-settings', 'settings', 'Project configuration', '/projects/:id/settings', 'Project configuration', true),
      ('ProjectSpecifications', 'project-specifications', 'screen', 'High-level project specs', '/projects/:id/specifications', 'High-level project specs', true),
      ('RoleSelection', 'role-selection', 'screen', 'User role selection', '/role-selection', 'User role selection', false),
      ('Splash', 'splash', 'screen', 'Initial loading and splash screen', '/', 'Initial loading and splash screen', false)
  ) as seed(name, slug, page_type, description, route, purpose, auth_required)
  on conflict (project_id, slug) do update
  set name = excluded.name,
      page_type = excluded.page_type,
      description = excluded.description,
      route = excluded.route,
      purpose = excluded.purpose,
      auth_required = excluded.auth_required,
      status = excluded.status,
      screen_title = excluded.screen_title,
      updated_at = timezone('utc', now())
  returning id
),
upsert_layouts as (
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
  select page_ref.id,
         case
           when page_ref.slug in ('onboarding', 'role-selection') then 'Auth Layout'
           when page_ref.slug in ('storytelling', 'splash') then 'Empty Layout'
           else 'Dashboard Layout'
         end,
         case
           when page_ref.slug in ('onboarding', 'role-selection') then 'mobile'
           else 'default'
         end,
         case
           when page_ref.slug in ('onboarding', 'role-selection') then 'Clean layout for authentication and onboarding'
           when page_ref.slug in ('storytelling', 'splash') then 'Minimal layout for splash and storytelling'
           else 'Main application layout with sidebar and header'
         end,
         null,
         '{}'::jsonb,
         null,
         '1.0.0',
         true
  from (
    select id, slug from public.pages where project_id = (select id from project_ref)
  ) as page_ref
  on conflict do nothing
  returning id
),
upsert_components as (
  insert into public.components (
    project_id,
    name,
    slug,
    component_type,
    description,
    design_purpose,
    props_schema,
    states,
    variants,
    reusability_level,
    design_system_ref,
    figma_link,
    dev_reference,
    status
  )
  select project_ref.id, seed.name, seed.slug, seed.component_type, seed.description, seed.design_purpose,
         '{}'::jsonb, '[]'::jsonb, '[]'::jsonb, 'shared', null, null, null, 'active'
  from project_ref
  cross join (
    values
      ('FullPRD', 'full-prd', 'section', 'Comprehensive PRD view', 'Display full product requirements'),
      ('Tasklist', 'tasklist', 'list', 'Live task and sync board', 'Monitor implementation tasks'),
      ('FeatureVisuals', 'feature-visuals', 'card', 'AI-generated feature visuals', 'Visualize feature concepts'),
      ('SyncIndicator', 'sync-indicator', 'other', 'Real-time sync status indicator', 'Show database sync status'),
      ('IntegrityBadge', 'integrity-badge', 'chip', 'Visual indicator of data truth state', 'Show integrity status of entities'),
      ('FeatureAudit', 'feature-audit', 'section', 'Feature audit trail', 'Review audit findings for a feature'),
      ('FeatureBuilderBrief', 'feature-builder-brief', 'section', 'Builder implementation brief', 'Turn product context into a build plan'),
      ('FeatureConcept', 'feature-concept', 'card', 'Feature concept summary', 'Summarize the concept behind a feature'),
      ('FeatureDiscussion', 'feature-discussion', 'section', 'Conversation about the feature', 'Track product discussions'),
      ('FeatureOverview', 'feature-overview', 'section', 'Overview of a selected feature', 'Present key feature metadata'),
      ('FeaturePrompts', 'feature-prompts', 'section', 'Prompt pack for execution', 'Store prompts for coding and design'),
      ('FeatureUIArchitecture', 'feature-ui-architecture', 'section', 'Feature-specific UI architecture', 'Show feature impact on pages and components'),
      ('PageDetailView', 'page-detail-view', 'section', 'Detailed page presentation', 'Inspect a page and its linked layout/components'),
      ('ComponentModal', 'component-modal', 'modal', 'Component editor modal', 'Edit reusable component metadata'),
      ('LayoutModal', 'layout-modal', 'modal', 'Layout editor modal', 'Edit page layout metadata'),
      ('PageModal', 'page-modal', 'modal', 'Page editor modal', 'Edit page metadata'),
      ('PageVisualGrid', 'page-visual-grid', 'section', 'Visual page gallery', 'Display generated page visuals'),
      ('StyleModal', 'style-modal', 'modal', 'Style system modal', 'Edit visual system settings'),
      ('LLMFunctionsManagement', 'llm-functions-management', 'section', 'AI function configuration UI', 'Manage AI model routing and functions')
  ) as seed(name, slug, component_type, description, design_purpose)
  on conflict (project_id, slug) do update
  set name = excluded.name,
      component_type = excluded.component_type,
      description = excluded.description,
      design_purpose = excluded.design_purpose,
      status = excluded.status,
      updated_at = timezone('utc', now())
  returning id
),
upsert_features as (
  insert into public.feature_cards (
    project_id,
    title,
    slug,
    summary,
    problem_statement,
    goal,
    user_value,
    business_value,
    priority,
    status,
    category,
    epic,
    release,
    persona,
    jobs_to_be_done,
    acceptance_criteria,
    success_metrics,
    non_functional_requirements,
    dependencies,
    assumptions,
    risks,
    notes,
    figma_link,
    spec_link,
    owner_auth_id
  )
  select project_ref.id, seed.title, seed.slug, seed.summary, seed.problem_statement, seed.goal,
         seed.user_value, seed.business_value, seed.priority, seed.status, seed.category, null, '1.0.0',
         seed.persona, null, null, null, null, null, null, null, seed.notes, null, null, 'system-flowforge'
  from project_ref
  cross join (
    values
      ('AI Product Orchestrator', 'ai-product-orchestrator', 'The brain of the app that helps you build other apps.', 'Founders struggle to translate abstract ideas into technical requirements.', 'Core value proposition of the platform.', 'The brain of the app that helps you build other apps.', 'A multi-agent system using Gemini models to generate PRDs, UI structures, and code prompts.', 'critical', 'done', 'core', 'Founders and developers need a structured AI orchestration layer.', 'Multi-agent orchestration backed by Gemini services.'),
      ('Real-time Sync Engine', 'real-time-sync-engine', 'Keeps the app data in sync with the actual code.', 'Codebase and database often drift apart during rapid development.', 'Ensures the FlowForge AI project remains a reliable reference.', 'Keeps the app data in sync with the actual code.', 'Service-based heuristic scanner that maps a maintained codebase manifest to UI pages and components in Firestore.', 'high', 'done', 'core', 'Teams need product data to reflect real implementation.', 'Current source is a codebase manifest and sync service.'),
      ('Storytelling Onboarding', 'storytelling-onboarding', 'A cinematic intro to the platform purpose.', 'Developers often lack the why behind a founder vision.', 'Builds empathy and alignment between founder and developer.', 'A cinematic intro to the platform purpose.', 'Motion-driven interactive sequence placed after authentication.', 'high', 'done', 'ux', 'New team members need context before execution.', 'Mission-driven onboarding and narrative framing.'),
      ('AI Control Center', 'ai-control-center', 'A dashboard for the app owner to manage AI settings.', 'Managing multiple AI models and prompts is complex.', 'Essential for platform maintainability.', 'A dashboard for the app owner to manage AI settings.', 'Admin-only section with Firestore-backed configuration for LLM functions.', 'medium', 'done', 'admin', 'Operators need one place to manage model routing and prompts.', 'Control center for operational AI configuration.'),
      ('Visual UI Architect', 'visual-ui-architect', 'A visual tool to plan how your app looks and works.', 'Visualizing app structure before coding is difficult for non-designers.', 'Accelerates the design-to-code transition.', 'A visual tool to plan how your app looks and works.', 'Canvas-based UI using Framer Motion for interactive architecture mapping.', 'high', 'done', 'architecture', 'Founders need a visual planning model before implementation.', 'Interactive UI architecture and page/component planning.'),
      ('Database Truth Sync', 'database-truth-sync', 'Automatically keeps the app data in sync with its code.', 'Ensuring the database accurately reflects the codebase is a manual, error-prone task.', 'Maintains the integrity of the FlowForge AI project as a living example.', 'Automatically keeps the app data in sync with its code.', 'Automated synchronization service that audits the codebase and updates the persisted product model.', 'critical', 'done', 'sync', 'Teams need a maintainable single source of truth.', 'Canonical seed and sync workflow for project metadata.')
  ) as seed(title, slug, summary, problem_statement, goal, user_value, business_value, priority, status, category, persona, notes)
  on conflict (project_id, slug) do update
  set title = excluded.title,
      summary = excluded.summary,
      problem_statement = excluded.problem_statement,
      goal = excluded.goal,
      user_value = excluded.user_value,
      business_value = excluded.business_value,
      priority = excluded.priority,
      status = excluded.status,
      category = excluded.category,
      persona = excluded.persona,
      notes = excluded.notes,
      owner_auth_id = excluded.owner_auth_id,
      updated_at = timezone('utc', now())
  returning id
),
upsert_userflows as (
  insert into public.userflows (
    project_id,
    name,
    slug,
    description,
    goal,
    entry_point,
    exit_point,
    primary_actor,
    status,
    version
  )
  select project_ref.id, seed.name, seed.slug, seed.description, seed.goal, seed.entry_point, seed.exit_point,
         seed.primary_actor, 'active', '1.0.0'
  from project_ref
  cross join (
    values
      ('Founder Onboarding', 'founder-onboarding', 'Introduce a new user to the mission and route them into the workspace.', 'Align founders and builders before planning starts.', '/', '/projects/:id/hub', 'Founder'),
      ('Project Planning', 'project-planning', 'Guide a team through hub, backlog, architecture, and documentation work.', 'Turn a raw idea into structured delivery assets.', '/projects/:id/hub', '/projects/:id/docs', 'Builder'),
      ('Admin Operations', 'admin-operations', 'Manage platform state, audit health, and AI runtime controls.', 'Operate FlowForge as a maintained internal product.', '/admin', '/notifications', 'Admin')
  ) as seed(name, slug, description, goal, entry_point, exit_point, primary_actor)
  on conflict (project_id, slug) do update
  set name = excluded.name,
      description = excluded.description,
      goal = excluded.goal,
      entry_point = excluded.entry_point,
      exit_point = excluded.exit_point,
      primary_actor = excluded.primary_actor,
      status = excluded.status,
      version = excluded.version,
      updated_at = timezone('utc', now())
  returning id
)
insert into public.userflow_pages (userflow_id, page_id, step_order, step_name, is_optional, condition, notes)
select uf.id, pg.id, steps.step_order, steps.step_name, false, null, null
from project_ref
join public.userflows uf on uf.project_id = project_ref.id
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
join public.pages pg on pg.project_id = project_ref.id and pg.slug = steps.page_slug
on conflict (userflow_id, step_order) do update
set page_id = excluded.page_id,
    step_name = excluded.step_name,
    updated_at = timezone('utc', now());

insert into public.feature_card_pages (feature_card_id, page_id)
select fc.id, pg.id
from public.projects pr
join public.feature_cards fc on fc.project_id = pr.id
join (
  values
    ('ai-product-orchestrator', 'workspace'),
    ('ai-product-orchestrator', 'feature-chat'),
    ('ai-product-orchestrator', 'project-hub'),
    ('real-time-sync-engine', 'admin'),
    ('real-time-sync-engine', 'workspace'),
    ('storytelling-onboarding', 'storytelling'),
    ('storytelling-onboarding', 'role-selection'),
    ('storytelling-onboarding', 'onboarding'),
    ('ai-control-center', 'admin'),
    ('ai-control-center', 'ai-agents'),
    ('visual-ui-architect', 'ui-architecture'),
    ('visual-ui-architect', 'feature-detail'),
    ('database-truth-sync', 'admin'),
    ('database-truth-sync', 'project-documentation')
) as mapping(feature_slug, page_slug) on mapping.feature_slug = fc.slug
join public.pages pg on pg.project_id = pr.id and pg.slug = mapping.page_slug
where pr.slug = 'flowforge-ai'
on conflict (feature_card_id, page_id) do nothing;

insert into public.feature_card_components (feature_card_id, component_id)
select fc.id, cmp.id
from public.projects pr
join public.feature_cards fc on fc.project_id = pr.id
join (
  values
    ('ai-product-orchestrator', 'feature-overview'),
    ('ai-product-orchestrator', 'feature-prompts'),
    ('real-time-sync-engine', 'sync-indicator'),
    ('real-time-sync-engine', 'integrity-badge'),
    ('storytelling-onboarding', 'feature-concept'),
    ('ai-control-center', 'llm-functions-management'),
    ('visual-ui-architect', 'page-detail-view'),
    ('visual-ui-architect', 'layout-modal'),
    ('database-truth-sync', 'tasklist'),
    ('database-truth-sync', 'full-prd')
) as mapping(feature_slug, component_slug) on mapping.feature_slug = fc.slug
join public.components cmp on cmp.project_id = pr.id and cmp.slug = mapping.component_slug
where pr.slug = 'flowforge-ai'
on conflict (feature_card_id, component_id) do nothing;

insert into public.feature_card_userflows (feature_card_id, userflow_id)
select fc.id, uf.id
from public.projects pr
join public.feature_cards fc on fc.project_id = pr.id
join (
  values
    ('ai-product-orchestrator', 'project-planning'),
    ('real-time-sync-engine', 'admin-operations'),
    ('storytelling-onboarding', 'founder-onboarding'),
    ('ai-control-center', 'admin-operations'),
    ('visual-ui-architect', 'project-planning'),
    ('database-truth-sync', 'admin-operations')
) as mapping(feature_slug, userflow_slug) on mapping.feature_slug = fc.slug
join public.userflows uf on uf.project_id = pr.id and uf.slug = mapping.userflow_slug
where pr.slug = 'flowforge-ai'
on conflict (feature_card_id, userflow_id) do nothing;

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