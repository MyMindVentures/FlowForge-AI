export type InterviewMode = 'discovery' | 'feature' | 'prioritization' | 'versioning' | 'handoff';

export type InterviewPhase = 'idea' | 'problem' | 'users' | 'features' | 'mvp' | 'flow';

export type FeaturePriority = 'P0' | 'P1' | 'P2' | 'P3';
export type FeatureStatus = 'Backlog' | 'Drafting' | 'Planned' | 'In Progress' | 'Complete';

export type Feature = {
  id: string;
  name: string;
  description: string;
  goal: string;
  userValue: string;
  priority: FeaturePriority;
  status: FeatureStatus;
  dependencies: string[];
  notes: string;
  decisionIds: string[];
  history: string[];
  createdAt: string;
  updatedAt: string;
};

export type Decision = {
  id: string;
  title: string;
  reasoning: string;
  date: string;
  linkedFeatureIds: string[];
  impact: string;
};

export type VersionSnapshot = {
  id: string;
  label: string;
  createdAt: string;
  summary: string;
  changedItems: string[];
  projectSnapshot: Pick<
    Project,
    | 'vision'
    | 'problem'
    | 'targetUsers'
    | 'mvpScope'
    | 'futureIdeas'
    | 'openQuestions'
    | 'userFlow'
    | 'developerSummary'
  >;
};

export type ActivityItem = {
  id: string;
  type: 'feature_added' | 'feature_updated' | 'priority_changed' | 'decision_made' | 'version_saved';
  title: string;
  reason: string;
  impact: string;
  date: string;
};

export type RoadmapLane = 'MVP' | 'Next' | 'Later' | 'Maybe';

export type Roadmap = Record<RoadmapLane, string[]>;

export type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  mode: InterviewMode;
  content: string;
  timestamp: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  status: 'Draft' | 'Interviewing' | 'Structured' | 'Ready for Build';
  updatedAt: string;
  currentVersion: string;
  activeMode: InterviewMode;
  interviewPhase: InterviewPhase;
  vision: string;
  problem: string;
  targetUsers: string[];
  features: Feature[];
  mvpScope: string[];
  futureIdeas: string[];
  openQuestions: string[];
  decisions: Decision[];
  versions: VersionSnapshot[];
  activity: ActivityItem[];
  roadmap: Roadmap;
  userFlow: string[];
  developerSummary: string;
  chatMessages: ChatMessage[];
};
