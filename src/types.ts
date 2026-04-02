export type UserRole = 'Architect' | 'Builder' | 'Admin';

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  onboarded: boolean;
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

export type ProjectMember = {
  uid: string;
  email: string;
  role: UserRole;
  joinedAt: string;
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
  createdAt: string;
  updatedAt: string;
  archived: boolean;
};

export type Comment = {
  id: string;
  featureId: string;
  authorRole: 'Architect' | 'Builder';
  content: string;
  type: 'Question' | 'Decision' | 'Definition';
  createdAt: string;
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
