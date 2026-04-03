import type { Feature, Project, UIComponent, UILayout, UIPage } from '../../types';
import type {
  ComponentStatus,
  FeatureCardPriority,
  FeatureCardStatus,
  LayoutType,
  ProductComponentInsert,
  ProductFeatureCardComponentInsert,
  ProductFeatureCardInsert,
  ProductFeatureCardPageInsert,
  ProductPageInsert,
  ProductPageLayoutInsert,
  ProductPlacedComponentInsert,
  ProductProjectInsert,
  ProductProjectPlatform,
  ProductProjectStatus,
} from '../../types/productSchema';

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
}

function mapProjectStatus(status: Project['status']): ProductProjectStatus {
  switch (status) {
    case 'Active':
      return 'active';
    case 'Archived':
      return 'archived';
    default:
      return 'draft';
  }
}

function mapFeaturePriority(priority: Feature['priority']): FeatureCardPriority {
  switch (priority) {
    case 'Low':
      return 'low';
    case 'High':
      return 'high';
    case 'Critical':
      return 'critical';
    default:
      return 'medium';
  }
}

function mapFeatureStatus(status: Feature['status']): FeatureCardStatus {
  switch (status) {
    case 'Completed':
      return 'done';
    case 'In Progress':
      return 'in_progress';
    default:
      return 'planned';
  }
}

function mapComponentStatus(): ComponentStatus {
  return 'active';
}

function mapProjectPlatform(): ProductProjectPlatform {
  return 'responsive';
}

function mapLayoutType(type: UILayout['type']): LayoutType {
  switch (type) {
    case 'modal':
      return 'modal';
    default:
      return 'default';
  }
}

export function mapLegacyProjectToProductProject(project: Project): ProductProjectInsert {
  return {
    name: project.name,
    slug: slugify(project.name),
    description: project.description,
    tagline: project.description,
    category: 'legacy-project',
    tags: [],
    visibility: 'private',
    platform: mapProjectPlatform(),
    status: mapProjectStatus(project.status),
    version: '1.0.0',
    owner_auth_id: project.ownerId,
    app_icon_url: null,
    hero_image_url: null,
    demo_url: null,
    source_url: null,
    featured_rank: 0,
    last_synced_at: null,
    catalog_metadata: {},
  };
}

export function mapLegacyFeatureToFeatureCard(feature: Feature): ProductFeatureCardInsert {
  return {
    project_id: feature.projectId,
    title: feature.title,
    slug: slugify(feature.featureCode || feature.title),
    summary: feature.nonTechnicalDescription || null,
    problem_statement: feature.problem || null,
    goal: feature.why || null,
    user_value: feature.nonTechnicalDescription || null,
    business_value: feature.technicalDescription || null,
    priority: mapFeaturePriority(feature.priority),
    status: mapFeatureStatus(feature.status),
    category: null,
    epic: null,
    release: null,
    persona: null,
    jobs_to_be_done: null,
    acceptance_criteria: null,
    success_metrics: null,
    non_functional_requirements: null,
    dependencies: null,
    assumptions: null,
    risks: null,
    notes: feature.impactAnalysis || null,
    figma_link: feature.visualUrl || null,
    spec_link: null,
    owner_auth_id: null,
  };
}

export function mapLegacyPageToProductPage(page: UIPage): ProductPageInsert {
  return {
    project_id: page.projectId,
    name: page.name,
    slug: slugify(page.path || page.name),
    page_type: 'screen',
    description: page.documentation || null,
    route: page.path,
    purpose: page.purpose,
    auth_required: page.path.startsWith('/app') || page.path.startsWith('/admin'),
    status: 'active',
    screen_title: page.name,
    empty_state_description: null,
    error_state_description: null,
    loading_state_description: null,
  };
}

export function mapLegacyLayoutToPageLayout(pageId: string, layout: UILayout, isPrimary: boolean = false): ProductPageLayoutInsert {
  return {
    page_id: pageId,
    name: layout.name,
    layout_type: mapLayoutType(layout.type),
    description: layout.description,
    breakpoint: null,
    grid_definition: typeof layout.config === 'object' && layout.config ? layout.config : {},
    notes: null,
    version: '1.0.0',
    is_primary: isPrimary,
  };
}

export function mapLegacyComponentToProductComponent(component: UIComponent): ProductComponentInsert {
  return {
    project_id: component.projectId,
    name: component.name,
    slug: slugify(component.name),
    component_type: component.type,
    description: component.description,
    design_purpose: component.purpose,
    props_schema: component.props,
    states: [],
    variants: [],
    reusability_level: 'shared',
    design_system_ref: null,
    figma_link: null,
    dev_reference: null,
    status: mapComponentStatus(),
  };
}

export function mapLegacyFeaturePageLinks(featureCardId: string, feature: Feature): ProductFeatureCardPageInsert[] {
  return (feature.relatedPages ?? []).map((pageId) => ({
    feature_card_id: featureCardId,
    page_id: pageId,
  }));
}

export function mapLegacyFeatureComponentLinks(featureCardId: string, feature: Feature): ProductFeatureCardComponentInsert[] {
  return (feature.relatedComponents ?? []).map((componentId) => ({
    feature_card_id: featureCardId,
    component_id: componentId,
  }));
}

export function mapLegacyPageComponentsToPlacedComponents(
  layoutId: string,
  page: UIPage
): ProductPlacedComponentInsert[] {
  return page.componentIds.map((componentId, index) => ({
    layout_id: layoutId,
    component_id: componentId,
    parent_layout_component_id: null,
    zone: 'body',
    position_order: index + 1,
    x: null,
    y: null,
    width: null,
    height: null,
    configuration_json: {},
    visibility_rules: {},
    notes: null,
  }));
}

