insert into public.roles (id, name, permissions, created_at)
values
  ('architect', 'Architect', array['projects.read','projects.write','features.write','ui.write','docs.write'], timezone('utc', now())),
  ('builder', 'Builder', array['projects.read','features.write','tasks.write'], timezone('utc', now())),
  ('admin', 'Admin', array['*'], timezone('utc', now()))
on conflict (id) do update
set name = excluded.name,
    permissions = excluded.permissions;

with legacy_identities as (
  select owner_auth_id as legacy_user_id, 'owner'::text as legacy_role
  from legacy_product.projects
  union all
  select member_auth_id as legacy_user_id, role as legacy_role
  from legacy_product.project_members
), ranked_identities as (
  select
    legacy_user_id,
    max(
      case legacy_role
        when 'owner' then 3
        when 'admin' then 3
        when 'editor' then 2
        else 1
      end
    ) as role_rank
  from legacy_identities
  where legacy_user_id is not null
  group by legacy_user_id
)
insert into public.app_users (
  id,
  auth_user_id,
  email,
  display_name,
  photo_url,
  role,
  onboarded,
  storytelling_completed,
  created_at,
  updated_at,
  last_login,
  settings
)
select
  legacy_user_id,
  null,
  case
    when position('@' in legacy_user_id) > 0 then lower(legacy_user_id)
    else lower(legacy_user_id || '@legacy.flowforge.local')
  end,
  initcap(replace(legacy_user_id, '-', ' ')),
  null,
  case role_rank
    when 3 then 'Admin'::public.app_user_role
    when 2 then 'Architect'::public.app_user_role
    else 'Builder'::public.app_user_role
  end,
  true,
  false,
  timezone('utc', now()),
  timezone('utc', now()),
  timezone('utc', now()),
  '{"theme":"dark","notifications":true}'::jsonb
from ranked_identities
on conflict (id) do update
set email = excluded.email,
    display_name = excluded.display_name,
    role = excluded.role,
    updated_at = timezone('utc', now());

with aggregated_members as (
  select
    pm.project_id,
    jsonb_agg(
      jsonb_build_object(
        'uid', pm.member_auth_id,
        'email', case
          when position('@' in pm.member_auth_id) > 0 then lower(pm.member_auth_id)
          else lower(pm.member_auth_id || '@legacy.flowforge.local')
        end,
        'role', case
          when pm.role in ('owner', 'admin') then 'Admin'
          when pm.role = 'editor' then 'Architect'
          else 'Builder'
        end,
        'joinedAt', pm.created_at
      )
      order by pm.created_at
    ) as members_json
  from legacy_product.project_members pm
  group by pm.project_id
)
insert into public.projects (
  id,
  name,
  description,
  owner_id,
  status,
  is_favorite,
  current_session_id,
  app_vision,
  prd,
  tech_arch,
  ux_strategy,
  members,
  repositories,
  integrity_status,
  last_modified_by,
  created_at,
  updated_at
)
select
  p.id::text,
  p.name,
  p.description,
  p.owner_auth_id,
  case p.status
    when 'active' then 'Active'
    when 'archived' then 'Archived'
    else 'Draft'
  end,
  false,
  null,
  null,
  null,
  null,
  null,
  coalesce(m.members_json, '[]'::jsonb),
  '[]'::jsonb,
  'needs_confirmation',
  null,
  p.created_at,
  p.updated_at
from legacy_product.projects p
left join aggregated_members m on m.project_id = p.id
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    owner_id = excluded.owner_id,
    status = excluded.status,
    members = excluded.members,
    updated_at = excluded.updated_at;

insert into public.project_versions (
  id,
  project_id,
  name,
  status,
  start_date,
  end_date,
  goal,
  linked_feature_ids,
  release_notes,
  created_at,
  updated_at
)
select
  'legacy-version:' || p.id::text,
  p.id::text,
  coalesce(nullif(p.version, ''), '1.0.0'),
  case p.status
    when 'active' then 'Active'
    when 'archived' then 'Archived'
    else 'Draft'
  end,
  p.created_at,
  null,
  'Imported from legacy_product.projects',
  '{}'::text[],
  'Legacy product schema bootstrap import',
  p.created_at,
  p.updated_at
from legacy_product.projects p
on conflict (id) do update
set name = excluded.name,
    status = excluded.status,
    release_notes = excluded.release_notes,
    updated_at = excluded.updated_at;

with feature_page_links as (
  select feature_card_id::text as feature_id, array_agg(page_id::text order by page_id) as page_ids
  from legacy_product.feature_card_pages
  group by feature_card_id
), feature_component_links as (
  select feature_card_id::text as feature_id, array_agg(component_id::text order by component_id) as component_ids
  from legacy_product.feature_card_components
  group by feature_card_id
)
insert into public.features (
  id,
  project_id,
  feature_code,
  title,
  status,
  priority,
  problem,
  solution,
  why,
  non_technical_description,
  technical_description,
  concept_thinker,
  builder_brief,
  coding_prompt,
  ui_design_prompt,
  created_at,
  updated_at,
  archived,
  score,
  related_pages,
  related_components,
  impact_analysis,
  ui_impact,
  is_locked,
  visual_url,
  visual_prompt,
  integrity_status
)
select
  fc.id::text,
  fc.project_id::text,
  upper(replace(coalesce(nullif(fc.slug, ''), 'feature-' || left(fc.id::text, 8)), '-', '_')),
  fc.title,
  case fc.status
    when 'done' then 'Completed'
    when 'in_progress' then 'In Progress'
    else 'Pending'
  end,
  initcap(fc.priority),
  coalesce(fc.problem_statement, ''),
  coalesce(fc.summary, ''),
  coalesce(fc.goal, ''),
  coalesce(fc.user_value, fc.summary, ''),
  coalesce(fc.business_value, ''),
  null,
  null,
  null,
  null,
  fc.created_at,
  fc.updated_at,
  false,
  null,
  coalesce(fpl.page_ids, '{}'::text[]),
  coalesce(fcl.component_ids, '{}'::text[]),
  coalesce(fc.notes, fc.acceptance_criteria),
  null,
  false,
  fc.figma_link,
  null,
  'needs_confirmation'
from legacy_product.feature_cards fc
left join feature_page_links fpl on fpl.feature_id = fc.id::text
left join feature_component_links fcl on fcl.feature_id = fc.id::text
on conflict (id) do update
set title = excluded.title,
    status = excluded.status,
    priority = excluded.priority,
    solution = excluded.solution,
    why = excluded.why,
    non_technical_description = excluded.non_technical_description,
    technical_description = excluded.technical_description,
    related_pages = excluded.related_pages,
    related_components = excluded.related_components,
    impact_analysis = excluded.impact_analysis,
    visual_url = excluded.visual_url,
    updated_at = excluded.updated_at;

with component_feature_links as (
  select component_id::text as component_id, array_agg(feature_card_id::text order by feature_card_id) as feature_ids
  from legacy_product.feature_card_components
  group by component_id
)
insert into public.ui_components (
  id,
  project_id,
  name,
  type,
  description,
  purpose,
  props,
  usage_guidelines,
  linked_feature_ids,
  integrity_status,
  created_at,
  updated_at
)
select
  c.id::text,
  c.project_id::text,
  c.name,
  c.component_type,
  coalesce(c.description, ''),
  coalesce(c.design_purpose, ''),
  coalesce(c.props_schema, '{}'::jsonb),
  concat_ws(E'\n\n',
    nullif('Reusability: ' || coalesce(c.reusability_level, ''), 'Reusability: '),
    nullif('Design system: ' || coalesce(c.design_system_ref, ''), 'Design system: '),
    nullif('Dev reference: ' || coalesce(c.dev_reference, ''), 'Dev reference: ')
  ),
  coalesce(cfl.feature_ids, '{}'::text[]),
  'needs_confirmation',
  c.created_at,
  c.updated_at
from legacy_product.components c
left join component_feature_links cfl on cfl.component_id = c.id::text
on conflict (id) do update
set name = excluded.name,
    type = excluded.type,
    description = excluded.description,
    purpose = excluded.purpose,
    props = excluded.props,
    usage_guidelines = excluded.usage_guidelines,
    linked_feature_ids = excluded.linked_feature_ids,
    updated_at = excluded.updated_at;

insert into public.ui_layouts (
  id,
  project_id,
  name,
  type,
  description,
  config,
  integrity_status,
  created_at,
  updated_at
)
select
  pl.id::text,
  p.project_id::text,
  pl.name,
  pl.layout_type,
  coalesce(pl.description, ''),
  jsonb_build_object(
    'pageId', pl.page_id::text,
    'breakpoint', pl.breakpoint,
    'gridDefinition', coalesce(pl.grid_definition, '{}'::jsonb),
    'notes', pl.notes,
    'version', pl.version,
    'isPrimary', pl.is_primary
  ),
  'needs_confirmation',
  pl.created_at,
  pl.updated_at
from legacy_product.page_layouts pl
join legacy_product.pages p on p.id = pl.page_id
on conflict (id) do update
set name = excluded.name,
    type = excluded.type,
    description = excluded.description,
    config = excluded.config,
    updated_at = excluded.updated_at;

with page_feature_links as (
  select page_id::text as page_id, array_agg(feature_card_id::text order by feature_card_id) as feature_ids
  from legacy_product.feature_card_pages
  group by page_id
), page_component_links as (
  select pl.page_id::text as page_id, array_agg(distinct lc.component_id::text) as component_ids
  from legacy_product.page_layouts pl
  join legacy_product.layout_components lc on lc.layout_id = pl.id
  group by pl.page_id
), primary_layouts as (
  select distinct on (pl.page_id)
    pl.page_id::text as page_id,
    pl.id::text as layout_id
  from legacy_product.page_layouts pl
  order by pl.page_id, pl.is_primary desc, pl.created_at asc
)
insert into public.ui_pages (
  id,
  project_id,
  name,
  path,
  purpose,
  layout_id,
  linked_feature_ids,
  component_ids,
  mobile_pattern,
  visual_url,
  visual_prompt,
  documentation,
  integrity_status,
  created_at,
  updated_at
)
select
  p.id::text,
  p.project_id::text,
  p.name,
  coalesce(nullif(p.route, ''), '/' || p.slug),
  coalesce(p.purpose, ''),
  pl.layout_id,
  coalesce(pfl.feature_ids, '{}'::text[]),
  coalesce(pcl.component_ids, '{}'::text[]),
  p.page_type,
  null,
  null,
  trim(both E'\n' from concat_ws(E'\n\n', p.description, p.empty_state_description, p.error_state_description, p.loading_state_description)),
  'needs_confirmation',
  p.created_at,
  p.updated_at
from legacy_product.pages p
left join page_feature_links pfl on pfl.page_id = p.id::text
left join page_component_links pcl on pcl.page_id = p.id::text
left join primary_layouts pl on pl.page_id = p.id::text
on conflict (id) do update
set name = excluded.name,
    path = excluded.path,
    purpose = excluded.purpose,
    layout_id = excluded.layout_id,
    linked_feature_ids = excluded.linked_feature_ids,
    component_ids = excluded.component_ids,
    mobile_pattern = excluded.mobile_pattern,
    documentation = excluded.documentation,
    updated_at = excluded.updated_at;

insert into public.ui_style_systems (
  id,
  project_id,
  colors,
  typography,
  spacing,
  dark_mode,
  created_at,
  updated_at
)
select
  'style-system:' || p.id::text,
  p.id::text,
  '{}'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  true,
  p.created_at,
  p.updated_at
from legacy_product.projects p
on conflict (project_id) do update
set updated_at = excluded.updated_at;

insert into public.audit_logs (
  id,
  action,
  details,
  user_id,
  user_email,
  project_id,
  feature_id,
  timestamp
)
select
  'legacy-import:' || p.id::text,
  'legacy_product_import',
  jsonb_build_object(
    'sourceProjectId', p.id::text,
    'sourceSchema', 'legacy_product',
    'importedAt', timezone('utc', now())
  ),
  p.owner_auth_id,
  case
    when position('@' in p.owner_auth_id) > 0 then lower(p.owner_auth_id)
    else lower(p.owner_auth_id || '@legacy.flowforge.local')
  end,
  p.id::text,
  null,
  timezone('utc', now())
from legacy_product.projects p
on conflict (id) do update
set details = excluded.details,
    timestamp = excluded.timestamp;