import type {
  ActivityItem,
  ChatMessage,
  Decision,
  Feature,
  InterviewMode,
  InterviewPhase,
  Project,
  VersionSnapshot,
} from './types';

export const phaseOrder: InterviewPhase[] = ['idea', 'problem', 'users', 'features', 'mvp', 'flow'];

export const modeLabels: Record<InterviewMode, string> = {
  discovery: 'Discovery Mode',
  feature: 'Feature Mode',
  prioritization: 'Prioritization Mode',
  versioning: 'Versioning Mode',
  handoff: 'Handoff Mode',
};

const now = new Date().toISOString();

const seedDecisions: Decision[] = [
  {
    id: 'dec-1',
    title: 'Single assistant with explicit modes',
    reasoning: 'Keeps interaction continuity while enabling specialized AI behavior.',
    date: now,
    linkedFeatureIds: ['feat-chat'],
    impact: 'Faster onboarding and clearer user mental model.',
  },
];

const seedFeatures: Feature[] = [
  {
    id: 'feat-chat',
    name: 'AI Interview Workspace',
    description: 'Mobile chat interface for phase-based product guidance.',
    goal: 'Capture requirements through natural conversation.',
    userValue: 'Founders can think out loud while the app structures decisions.',
    priority: 'P0',
    status: 'In Progress',
    dependencies: ['feat-memory'],
    notes: 'Needs quick actions and mode switch affordance.',
    decisionIds: ['dec-1'],
    history: ['Feature created from discovery interview.'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'feat-memory',
    name: 'Structured Memory',
    description: 'Live memory that captures vision, users, scope, and unresolved questions.',
    goal: 'Preserve validated information over time.',
    userValue: 'Users can track evolving strategy without losing prior decisions.',
    priority: 'P0',
    status: 'Planned',
    dependencies: [],
    notes: 'Should avoid overwriting approved fields unless requested.',
    decisionIds: [],
    history: ['Memory schema initialized.'],
    createdAt: now,
    updatedAt: now,
  },
];

const seedActivity: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'feature_added',
    title: 'Added AI Interview Workspace',
    reason: 'Needed a primary flow for requirement collection.',
    impact: 'Enabled structured interview from day one.',
    date: now,
  },
  {
    id: 'act-2',
    type: 'decision_made',
    title: 'Committed to single assistant, multi-mode workflow',
    reason: 'Reduce complexity while scaling capabilities.',
    impact: 'Unified chat history and easier onboarding.',
    date: now,
  },
];

const seedVersions: VersionSnapshot[] = [
  {
    id: 'ver-1',
    label: 'v0.1',
    createdAt: now,
    summary: 'Initial discovery and structure established.',
    changedItems: ['Vision drafted', '2 core features identified', 'MVP scope started'],
    projectSnapshot: {
      vision: 'Transform rough app ideas into structured build-ready plans.',
      problem: 'Founders lack a repeatable system to convert ideas into developer-ready direction.',
      targetUsers: ['Founders', 'Indie creators', 'Small product teams'],
      mvpScope: ['Discovery interview', 'Structured memory', 'Roadmap buckets', 'Handoff summary'],
      futureIdeas: ['Voice mode', 'Jira sync', 'Spec scoring'],
      openQuestions: ['Should export include JSON schema?', 'Do we need team collaboration in MVP?'],
      userFlow: ['Create project', 'Run discovery', 'Refine features', 'Prioritize roadmap', 'Save versions', 'Generate handoff'],
      developerSummary: 'Mobile-first PWA with one assistant and specialized product planning modes.',
    },
  },
];

const seedChat: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    mode: 'discovery',
    content: 'Let me clarify that. What should the user be able to do first?',
    timestamp: now,
  },
  {
    id: 'msg-2',
    role: 'user',
    mode: 'discovery',
    content: 'Describe an app idea and leave with a build-ready product summary.',
    timestamp: now,
  },
  {
    id: 'msg-3',
    role: 'assistant',
    mode: 'feature',
    content: 'Who is this feature for? I\'ve added it to your feature list with a dependency check.',
    timestamp: now,
  },
];

export const initialProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'AI Product Interviewer',
    description: 'AI-powered product planning operating system for founders.',
    status: 'Interviewing',
    updatedAt: now,
    currentVersion: 'v0.1',
    activeMode: 'discovery',
    interviewPhase: 'features',
    vision: 'Transform rough app ideas into structured build-ready plans.',
    problem: 'Founders lack a repeatable system to convert ideas into developer-ready direction.',
    targetUsers: ['Founders', 'Indie creators', 'Small product teams'],
    features: seedFeatures,
    mvpScope: ['Discovery interview', 'Structured memory', 'Roadmap buckets', 'Developer handoff'],
    futureIdeas: ['Voice interview', 'Jira sync', 'Spec quality scoring'],
    openQuestions: ['Should export include JSON schema?', 'Need collaboration in MVP?'],
    decisions: seedDecisions,
    versions: seedVersions,
    activity: seedActivity,
    roadmap: {
      MVP: ['feat-chat', 'feat-memory'],
      Next: [],
      Later: [],
      Maybe: [],
    },
    userFlow: ['Create project', 'Run interview', 'Review memory', 'Refine features', 'Save version', 'Generate handoff'],
    developerSummary:
      'Mobile-first app with one assistant in Discovery, Feature, Prioritization, Versioning, and Handoff modes.',
    chatMessages: seedChat,
  },
];

/**
 * Creates a draft project with starter interview state and memory placeholders.
 */
export function createProject(name: string, description: string): Project {
  const createdAt = new Date().toISOString();
  return {
    id: `proj-${Math.random().toString(36).slice(2, 9)}`,
    name,
    description,
    status: 'Draft',
    updatedAt: createdAt,
    currentVersion: 'v0.1',
    activeMode: 'discovery',
    interviewPhase: 'idea',
    vision: '',
    problem: '',
    targetUsers: [],
    features: [],
    mvpScope: [],
    futureIdeas: [],
    openQuestions: [],
    decisions: [],
    versions: [],
    activity: [],
    roadmap: { MVP: [], Next: [], Later: [], Maybe: [] },
    userFlow: [],
    developerSummary: '',
    chatMessages: [
      {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        mode: 'discovery',
        content: 'Welcome. Let me clarify that. Tell me your product idea in one sentence.',
        timestamp: createdAt,
      },
    ],
  };
}

/**
 * Generates the next semantic-lite version label (v0.1 -> v0.2 style).
 */
export function nextVersionLabel(currentVersion: string): string {
  const match = currentVersion.match(/^v(\d+)\.(\d+)$/);
  if (!match) return 'v0.1';
  const major = Number(match[1]);
  const minor = Number(match[2]) + 1;
  return `v${major}.${minor}`;
}

/**
 * Returns a deterministic assistant follow-up based on active interview mode and phase.
 */
export function assistantReply(mode: InterviewMode, phase: InterviewPhase): string {
  if (mode === 'feature') {
    return 'Who is this feature for? I can add user value, dependencies, and priority.';
  }
  if (mode === 'prioritization') {
    return 'Is this part of MVP, Next, Later, or Maybe? I can challenge scope bloat.';
  }
  if (mode === 'versioning') {
    return 'Would you like to save this as a new project version with change notes?';
  }
  if (mode === 'handoff') {
    return 'I can generate a concise developer handoff with risks, roadmap, and open questions.';
  }

  const byPhase: Record<InterviewPhase, string> = {
    idea: 'What should the user be able to do first?',
    problem: 'What painful workflow are we solving today?',
    users: 'Who is this feature for?',
    features: 'I\'ve added that to your feature list. Should it be MVP?',
    mvp: 'What can we remove while preserving user value?',
    flow: 'What is the final step in the happy path?',
  };
  return `Let me clarify that. ${byPhase[phase]}`;
}
