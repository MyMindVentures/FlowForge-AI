export type SyncStatus = 'planned' | 'implemented' | 'failing' | 'blocked' | 'out_of_sync';

export type IntegrityStatus = 'verified' | 'incomplete' | 'out_of_sync' | 'needs_confirmation' | 'failing' | 'planned';

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: SyncStatus;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  category?: string;
  sourceDocument?: string;
  sourceKey?: string;
  sortOrder?: number;
  relatedEntityId?: string;
  relatedEntityType?: 'feature' | 'page' | 'component' | 'layout' | 'function';
  developerNotes?: string;
  failureNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserRole = 'Architect' | 'Builder' | 'Admin';

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  firstName?: string;
  lastName?: string;
  aliasName?: string;
  secondaryEmail?: string;
  phone?: string;
  jobTitle?: string;
  functionTitle?: string;
  organizationName?: string;
  githubUsername?: string;
  githubProfileUrl?: string;
  githubPrimaryEmail?: string;
  githubAvatarUrl?: string;
  githubUserId?: string;
  bio?: string;
  role: UserRole;
  onboarded: boolean;
  storytellingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  settings: {
    theme: 'dark' | 'light';
    notifications: boolean;
  };
};

export type Asset = {
  id: string;
  projectId: string;
  name: string;
  type: 'image' | 'logo' | 'document' | 'other';
  url: string;
  tags: string[];
  featureIds: string[]; // Linked features
  createdAt: string;
  updatedAt: string;
  size?: number;
  mimeType?: string;
};

export type AIModelConfig = {
  id: string;
  name: string;
  provider: 'google' | 'openai' | 'anthropic';
  modelId: string;
  isEnabled: boolean;
  isDefault: boolean;
  priority: number;
  config: {
    temperature: number;
    maxOutputTokens: number;
    topP: number;
    topK: number;
  };
};

export type PromptTemplate = {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  userPrompt: string;
  variables: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type APIKeyConfig = {
  id: string;
  provider: string;
  keyName: string;
  maskedKey: string;
  lastUsed: string;
  status: 'active' | 'revoked' | 'expired';
};

export type AuthProviderConfig = {
  id: string;
  displayName: string;
  protocol: 'oauth_oidc' | 'saml_2_0' | 'email' | 'webauthn' | 'totp' | 'sms';
  category: string;
  availability: 'available' | 'preview' | 'requires_config';
  isEnabled: boolean;
  supportsDirectClientFlow: boolean;
  isEnterprise: boolean;
  sortOrder: number;
  discoveryUrl?: string;
  domainHint?: string;
  clientIdEnvVar?: string;
  secretEnvVar?: string;
  redirectUrlEnvVar?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AuthFlowDefinition = {
  id: string;
  providerConfigId?: string;
  displayName: string;
  flowKind: string;
  isEnabled: boolean;
  fallbackUx?: Record<string, unknown>;
  failureStates?: unknown[];
  telemetryEventPrefix: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthFeatureFlag = {
  id: string;
  environment: 'all' | 'development' | 'staging' | 'production';
  isEnabled: boolean;
  rolloutPercentage: number;
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type PermissionCatalogEntry = {
  permissionKey: string;
  scope: string;
  description: string;
  createdAt: string;
};

export type RolePermissionAssignment = {
  roleName: UserRole;
  permissionKey: string;
  createdAt: string;
};

export type UsageLog = {
  id: string;
  timestamp: string;
  userId: string;
  projectId: string;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  latency: number;
};

export type ErrorLog = {
  id: string;
  timestamp: string;
  userId: string;
  projectId: string;
  modelId: string;
  errorCode: string;
  errorMessage: string;
  stackTrace?: string;
  requestPayload?: any;
};

export type FeedbackItem = {
  id: string;
  userId: string;
  userEmail: string;
  projectId?: string;
  category: 'bug' | 'feature' | 'ux' | 'other';
  status: 'new' | 'reviewed' | 'planned' | 'resolved';
  subject: string;
  message: string;
  contextPath?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectMember = {
  uid: string;
  email: string;
  role: UserRole;
  joinedAt: string;
  status?: 'invited' | 'active';
  invitedByEmail?: string;
  invitedAt?: string;
};

export type GitHubRepo = {
  id: string;
  name: string;
  url: string;
  defaultBranch: string;
  isConnected: boolean;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  status: 'Draft' | 'Active' | 'Archived';
  isFavorite: boolean;
  currentSessionId?: string;
  appVision?: string;
  prd?: string;
  techArch?: string;
  uxStrategy?: string;
  members: ProjectMember[];
  repositories: GitHubRepo[];
  integrityStatus?: IntegrityStatus;
  lastModifiedBy?: {
    uid: string;
    email: string;
    displayName?: string;
    timestamp: string;
    action: string;
  };
};

export type Session = {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  projectId: string;
  sessionId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export type Suggestion = {
  id: string;
  projectId: string;
  sessionId: string;
  title: string;
  problem: string;
  solution: string;
  userValue: string;
  scope: 'Small' | 'Medium' | 'Large';
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
};

export type UIImpactAnalysis = {
  affectedPages: string[];
  affectedLayouts: string[];
  affectedComponents: string[];
  mobilePattern: string;
  recommendation: string;
  newPagesNeeded?: {
    name: string;
    purpose: string;
    layoutType: string;
  }[];
  newComponentsNeeded?: {
    name: string;
    type: string;
    purpose: string;
  }[];
};

export type FeatureDeliveryChecklist = {
  frontendImplemented: boolean;
  backendImplemented: boolean;
  databaseImplemented: boolean;
  aiImplemented: boolean;
  testsImplemented: boolean;
  docsUpdated: boolean;
  qaApproved: boolean;
  readyForRelease: boolean;
};

export type Feature = {
  id: string;
  projectId: string;
  featureCode: string;
  title: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  problem: string;
  solution: string;
  why: string;
  nonTechnicalDescription: string;
  technicalDescription: string;
  conceptThinker?: string;
  builderBrief?: string;
  codingPrompt?: string;
  uiDesignPrompt?: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  score?: number;
  relatedPages?: string[];
  relatedComponents?: string[];
  impactAnalysis?: string;
  category?: string;
  epic?: string;
  release?: string;
  persona?: string;
  jobsToBeDone?: string;
  acceptanceCriteria?: string;
  successMetrics?: string;
  nonFunctionalRequirements?: string;
  dependencies?: string;
  assumptions?: string;
  risks?: string;
  notes?: string;
  figmaLink?: string;
  specLink?: string;
  deliveryChecklist?: FeatureDeliveryChecklist;
  uiImpact?: UIImpactAnalysis;
  isLocked?: boolean;
  visualUrl?: string;
  visualPrompt?: string;
  integrityStatus?: IntegrityStatus;
};

export type UILayoutType = 'auth' | 'dashboard' | 'detail' | 'chat' | 'modal' | 'empty';

export type UILayout = {
  id: string;
  projectId: string;
  name: string;
  type: UILayoutType;
  description: string;
  config: any;
  createdAt: string;
  updatedAt: string;
  integrityStatus?: IntegrityStatus;
};

export type UIComponent = {
  id: string;
  projectId: string;
  name: string;
  type: 'card' | 'tab' | 'chip' | 'list' | 'modal' | 'section' | 'input' | 'button' | 'other';
  description: string;
  purpose: string;
  props: Record<string, any>;
  usageGuidelines: string;
  linkedFeatureIds: string[];
  createdAt: string;
  updatedAt: string;
  integrityStatus?: IntegrityStatus;
};

export type UIPageVisual = {
  id: string;
  projectId: string;
  pageId: string;
  url: string;
  prompt: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type UIPageDocumentation = {
  id: string;
  projectId: string;
  pageId: string;
  content: string;
  sections: {
    title: string;
    body: string;
  }[];
  updatedAt: string;
};

export type UIPage = {
  id: string;
  projectId: string;
  name: string;
  path: string;
  purpose: string;
  layoutId: string;
  linkedFeatureIds: string[];
  componentIds: string[];
  mobilePattern: string;
  visualUrl?: string;
  visualPrompt?: string;
  documentation?: string;
  createdAt: string;
  updatedAt: string;
  integrityStatus?: IntegrityStatus;
};

export type UIStyleSystem = {
  id: string;
  projectId: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
  typography: {
    fontSans: string;
    fontMono: string;
    baseSize: string;
    scale: number;
  };
  spacing: {
    unit: number;
    scale: number[];
  };
  darkMode: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Comment = {
  id: string;
  featureId: string;
  authorRole: 'Architect' | 'Builder';
  authorName?: string;
  summary?: string;
  content: string;
  type: 'Question' | 'Decision' | 'Definition';
  status?: 'open' | 'resolved';
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
};

export type LLMFunction = {
  id: string;
  name: string;
  description: string;
  systemPrompt?: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  modelId: string;
  fallbackConfig?: {
    strategy: 'retry' | 'fallback_model' | 'error';
    fallbackModelId?: string;
    maxRetries?: number;
  };
  promptTemplateId?: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  integrityStatus?: IntegrityStatus;
};

export type VersionStatus = 'Planned' | 'In Progress' | 'Released';

export type Version = {
  id: string;
  projectId: string;
  name: string;
  status: VersionStatus;
  startDate: string;
  endDate: string;
  goal: string;
  linkedFeatureIds: string[];
  releaseNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuditLogEntry = {
  id: string;
  action: string;
  details: any;
  userId: string;
  userEmail: string;
  projectId?: string;
  featureId?: string;
  timestamp: any; // ISO string or database-native timestamp payload
};

export type PRDSection = {
  id: string;
  projectId: string;
  title: string;
  content: string;
  order: number;
  linkedFeatureIds: string[];
  status: 'Draft' | 'Finalized' | 'Review';
  createdAt: string;
  updatedAt: string;
  integrityStatus?: IntegrityStatus;
};

export type AuditFinding = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  category: 'Security' | 'Performance' | 'UI/UX' | 'Logic' | 'Sync';
  status: 'Open' | 'Fixed' | 'Ignored';
  linkedFeatureId?: string;
  linkedPageId?: string;
  createdAt: string;
  updatedAt: string;
  integrityStatus?: IntegrityStatus;
};

export type ReadinessCheck = {
  id: string;
  projectId: string;
  category: 'Security' | 'Performance' | 'UI/UX' | 'Logic' | 'Infrastructure';
  label: string;
  description: string;
  isPassed: boolean;
  notes?: string;
  updatedAt: string;
  integrityStatus?: IntegrityStatus;
};

export type Blocker = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Active' | 'Resolved';
  linkedTaskId?: string;
  linkedFeatureId?: string;
  createdAt: string;
  updatedAt: string;
};


