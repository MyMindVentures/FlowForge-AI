export type ProductProjectPlatform = 'web' | 'ios' | 'android' | 'responsive';
export type ProductProjectStatus = 'draft' | 'active' | 'archived';
export type FeatureCardPriority = 'low' | 'medium' | 'high' | 'critical';
export type FeatureCardStatus = 'idea' | 'backlog' | 'planned' | 'in_progress' | 'done';
export type UserflowStatus = 'draft' | 'active' | 'archived';
export type PageType = 'screen' | 'modal' | 'overlay' | 'settings' | 'detail' | 'list' | 'form';
export type PageStatus = 'draft' | 'active' | 'deprecated' | 'archived';
export type LayoutType = 'default' | 'mobile' | 'desktop' | 'tablet' | 'modal' | 'split_view';
export type ComponentStatus = 'draft' | 'active' | 'deprecated' | 'archived';

export type TimestampedRow = {
  created_at: string;
  updated_at: string;
};

export type ProductProjectRow = TimestampedRow & {
  id: string;
  name: string;
  slug: string;
  description: string;
  platform: ProductProjectPlatform;
  status: ProductProjectStatus;
  version: string;
  owner_auth_id: string;
};

export type ProductProjectInsert = Omit<ProductProjectRow, 'id' | 'created_at' | 'updated_at'>;
export type ProductProjectUpdate = Partial<ProductProjectInsert>;

export type ProductProjectMemberRow = {
  id: string;
  project_id: string;
  member_auth_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer' | 'member';
  created_at: string;
};

export type ProductProjectMemberInsert = Omit<ProductProjectMemberRow, 'id' | 'created_at'>;
export type ProductProjectMemberUpdate = Partial<ProductProjectMemberInsert>;

export type ProductFeatureCardRow = TimestampedRow & {
  id: string;
  project_id: string;
  title: string;
  slug: string;
  summary: string | null;
  problem_statement: string | null;
  goal: string | null;
  user_value: string | null;
  business_value: string | null;
  priority: FeatureCardPriority;
  status: FeatureCardStatus;
  category: string | null;
  epic: string | null;
  release: string | null;
  persona: string | null;
  jobs_to_be_done: string | null;
  acceptance_criteria: string | null;
  success_metrics: string | null;
  non_functional_requirements: string | null;
  dependencies: string | null;
  assumptions: string | null;
  risks: string | null;
  notes: string | null;
  figma_link: string | null;
  spec_link: string | null;
  owner_auth_id: string | null;
};

export type ProductFeatureCardInsert = Omit<ProductFeatureCardRow, 'id' | 'created_at' | 'updated_at'>;
export type ProductFeatureCardUpdate = Partial<ProductFeatureCardInsert>;

export type ProductUserflowRow = TimestampedRow & {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  description: string | null;
  goal: string | null;
  entry_point: string | null;
  exit_point: string | null;
  primary_actor: string | null;
  status: UserflowStatus;
  version: string;
};

export type ProductUserflowInsert = Omit<ProductUserflowRow, 'id' | 'created_at' | 'updated_at'>;
export type ProductUserflowUpdate = Partial<ProductUserflowInsert>;

export type ProductPageRow = TimestampedRow & {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  page_type: PageType;
  description: string | null;
  route: string | null;
  purpose: string | null;
  auth_required: boolean;
  status: PageStatus;
  screen_title: string | null;
  empty_state_description: string | null;
  error_state_description: string | null;
  loading_state_description: string | null;
};

export type ProductPageInsert = Omit<ProductPageRow, 'id' | 'created_at' | 'updated_at'>;
export type ProductPageUpdate = Partial<ProductPageInsert>;

export type ProductPageLayoutRow = TimestampedRow & {
  id: string;
  page_id: string;
  name: string;
  layout_type: LayoutType;
  description: string | null;
  breakpoint: string | null;
  grid_definition: Record<string, unknown>;
  notes: string | null;
  version: string;
  is_primary: boolean;
};

export type ProductPageLayoutInsert = Omit<ProductPageLayoutRow, 'id' | 'created_at' | 'updated_at'>;
export type ProductPageLayoutUpdate = Partial<ProductPageLayoutInsert>;

export type ProductComponentRow = TimestampedRow & {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  component_type: string;
  description: string | null;
  design_purpose: string | null;
  props_schema: Record<string, unknown>;
  states: unknown[];
  variants: unknown[];
  reusability_level: string | null;
  design_system_ref: string | null;
  figma_link: string | null;
  dev_reference: string | null;
  status: ComponentStatus;
};

export type ProductComponentInsert = Omit<ProductComponentRow, 'id' | 'created_at' | 'updated_at'>;
export type ProductComponentUpdate = Partial<ProductComponentInsert>;

export type ProductUserflowPageRow = TimestampedRow & {
  id: string;
  userflow_id: string;
  page_id: string;
  step_order: number;
  step_name: string | null;
  is_optional: boolean;
  condition: string | null;
  notes: string | null;
};

export type ProductUserflowPageInsert = Omit<ProductUserflowPageRow, 'id' | 'created_at' | 'updated_at'>;
export type ProductUserflowPageUpdate = Partial<ProductUserflowPageInsert>;

export type ProductLayoutComponentRow = TimestampedRow & {
  id: string;
  layout_id: string;
  component_id: string;
  parent_layout_component_id: string | null;
  zone: string | null;
  position_order: number;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  configuration_json: Record<string, unknown>;
  visibility_rules: Record<string, unknown>;
  notes: string | null;
};

export type ProductLayoutComponentInsert = Omit<ProductLayoutComponentRow, 'id' | 'created_at' | 'updated_at'>;
export type ProductLayoutComponentUpdate = Partial<ProductLayoutComponentInsert>;
export type ProductPlacedComponentInsert = ProductLayoutComponentInsert;

export type ProductFeatureCardUserflowRow = {
  id: string;
  feature_card_id: string;
  userflow_id: string;
  created_at: string;
};

export type ProductFeatureCardUserflowInsert = Omit<ProductFeatureCardUserflowRow, 'id' | 'created_at'>;
export type ProductFeatureCardUserflowUpdate = Partial<ProductFeatureCardUserflowInsert>;

export type ProductFeatureCardPageRow = {
  id: string;
  feature_card_id: string;
  page_id: string;
  created_at: string;
};

export type ProductFeatureCardPageInsert = Omit<ProductFeatureCardPageRow, 'id' | 'created_at'>;
export type ProductFeatureCardPageUpdate = Partial<ProductFeatureCardPageInsert>;

export type ProductFeatureCardComponentRow = {
  id: string;
  feature_card_id: string;
  component_id: string;
  created_at: string;
};

export type ProductFeatureCardComponentInsert = Omit<ProductFeatureCardComponentRow, 'id' | 'created_at'>;
export type ProductFeatureCardComponentUpdate = Partial<ProductFeatureCardComponentInsert>;

export interface ProductDatabase {
  public: {
    Tables: {
      projects: {
        Row: ProductProjectRow;
        Insert: ProductProjectInsert;
        Update: ProductProjectUpdate;
      };
      project_members: {
        Row: ProductProjectMemberRow;
        Insert: ProductProjectMemberInsert;
        Update: ProductProjectMemberUpdate;
      };
      feature_cards: {
        Row: ProductFeatureCardRow;
        Insert: ProductFeatureCardInsert;
        Update: ProductFeatureCardUpdate;
      };
      userflows: {
        Row: ProductUserflowRow;
        Insert: ProductUserflowInsert;
        Update: ProductUserflowUpdate;
      };
      pages: {
        Row: ProductPageRow;
        Insert: ProductPageInsert;
        Update: ProductPageUpdate;
      };
      page_layouts: {
        Row: ProductPageLayoutRow;
        Insert: ProductPageLayoutInsert;
        Update: ProductPageLayoutUpdate;
      };
      components: {
        Row: ProductComponentRow;
        Insert: ProductComponentInsert;
        Update: ProductComponentUpdate;
      };
      userflow_pages: {
        Row: ProductUserflowPageRow;
        Insert: ProductUserflowPageInsert;
        Update: ProductUserflowPageUpdate;
      };
      layout_components: {
        Row: ProductLayoutComponentRow;
        Insert: ProductLayoutComponentInsert;
        Update: ProductLayoutComponentUpdate;
      };
      feature_card_userflows: {
        Row: ProductFeatureCardUserflowRow;
        Insert: ProductFeatureCardUserflowInsert;
        Update: ProductFeatureCardUserflowUpdate;
      };
      feature_card_pages: {
        Row: ProductFeatureCardPageRow;
        Insert: ProductFeatureCardPageInsert;
        Update: ProductFeatureCardPageUpdate;
      };
      feature_card_components: {
        Row: ProductFeatureCardComponentRow;
        Insert: ProductFeatureCardComponentInsert;
        Update: ProductFeatureCardComponentUpdate;
      };
    };
  };
}