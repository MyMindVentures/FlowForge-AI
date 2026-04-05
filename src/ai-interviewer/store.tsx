import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { assistantReply, createProject, initialProjects, nextVersionLabel, phaseOrder } from './mockData';
import type { ActivityItem, ChatMessage, Feature, InterviewMode, InterviewPhase, Project, VersionSnapshot } from './types';

type AppStore = {
  projects: Project[];
  createNewProject: (name: string, description: string) => Project;
  getProject: (projectId: string) => Project | undefined;
  sendChat: (projectId: string, userMessage: string) => void;
  setMode: (projectId: string, mode: InterviewMode) => void;
  addFeature: (projectId: string, feature: Omit<Feature, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => void;
  updateFeature: (projectId: string, featureId: string, updates: Partial<Feature>) => void;
  moveRoadmapItem: (projectId: string, featureId: string, lane: keyof Project['roadmap']) => void;
  saveVersion: (projectId: string, summary: string) => void;
  restoreVersion: (projectId: string, versionId: string) => void;
  generateHandoff: (projectId: string) => void;
  addDecision: (projectId: string, title: string, reasoning: string, impact: string, linkedFeatureIds?: string[]) => void;
  renameProject: (projectId: string, name: string, description: string) => void;
  resetInterview: (projectId: string) => void;
  deleteProject: (projectId: string) => void;
};

const StoreContext = createContext<AppStore | null>(null);
const STORAGE_KEY = 'ai-product-interviewer-state-v2';

function stampActivity(project: Project, activity: ActivityItem): Project {
  return {
    ...project,
    updatedAt: activity.date,
    activity: [activity, ...project.activity],
  };
}

function modeSummary(mode: InterviewMode): string {
  switch (mode) {
    case 'feature':
      return 'Feature refinement in progress';
    case 'prioritization':
      return 'Prioritization analysis running';
    case 'versioning':
      return 'Version notes being prepared';
    case 'handoff':
      return 'Handoff synthesis in progress';
    default:
      return 'Discovery interview in progress';
  }
}

/**
 * Provider containing local MVP state management for projects and interview outputs.
 */
export function InterviewStoreProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialProjects;
    try {
      return JSON.parse(raw) as Project[];
    } catch {
      return initialProjects;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const api = useMemo<AppStore>(() => ({
    projects,
    createNewProject(name, description) {
      const project = createProject(name, description);
      setProjects((prev) => [project, ...prev]);
      return project;
    },
    getProject(projectId) {
      return projects.find((item) => item.id === projectId);
    },
    sendChat(projectId, userMessage) {
      setProjects((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          const now = new Date().toISOString();
          const phaseIndex = phaseOrder.indexOf(project.interviewPhase);
          const nextPhase = phaseOrder[Math.min(phaseOrder.length - 1, phaseIndex + 1)] as InterviewPhase;

          const user: ChatMessage = { id: `msg-${Date.now()}`, role: 'user', mode: project.activeMode, content: userMessage, timestamp: now };
          const assistant: ChatMessage = {
            id: `msg-${Date.now() + 1}`,
            role: 'assistant',
            mode: project.activeMode,
            content: assistantReply(project.activeMode, nextPhase),
            timestamp: now,
          };

          const containsFeatureSignal = /feature|add|build|screen|flow/i.test(userMessage);
          const containsDecisionSignal = /decide|decision|choose|tradeoff|priority/i.test(userMessage);
          const features = containsFeatureSignal && project.activeMode !== 'handoff'
            ? project.features
            : project.features;

          let nextProject: Project = {
            ...project,
            status: 'Interviewing',
            updatedAt: now,
            interviewPhase: nextPhase,
            vision: project.vision || userMessage,
            problem: project.problem || 'Teams need a structured path from idea to implementation.',
            targetUsers: project.targetUsers.length ? project.targetUsers : ['Founders validating scope before engineering'],
            openQuestions: project.openQuestions.includes('What metric defines MVP success?')
              ? project.openQuestions
              : [...project.openQuestions, 'What metric defines MVP success?'],
            chatMessages: [...project.chatMessages, user, assistant],
            features,
          };

          if (containsDecisionSignal) {
            nextProject = {
              ...nextProject,
              decisions: [
                {
                  id: `dec-${Date.now()}`,
                  title: 'Interview-derived decision',
                  reasoning: userMessage,
                  date: now,
                  linkedFeatureIds: [],
                  impact: 'Captured from chat and ready for review.',
                },
                ...nextProject.decisions,
              ],
            };
          }

          return stampActivity(nextProject, {
            id: `act-${Date.now()}`,
            type: containsDecisionSignal ? 'decision_made' : 'feature_updated',
            title: `AI ${modeSummary(project.activeMode)}`,
            reason: 'User responded to AI prompt',
            impact: `Structured memory advanced to ${nextPhase}`,
            date: now,
          });
        }),
      );
    },
    setMode(projectId, mode) {
      setProjects((prev) => prev.map((project) => project.id === projectId ? { ...project, activeMode: mode, updatedAt: new Date().toISOString() } : project));
    },
    addFeature(projectId, featureInput) {
      setProjects((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          const now = new Date().toISOString();
          const feature: Feature = { ...featureInput, id: `feat-${Date.now()}`, createdAt: now, updatedAt: now, history: ['Feature added'] };
          const withFeature = {
            ...project,
            features: [feature, ...project.features],
            roadmap: { ...project.roadmap, MVP: [feature.id, ...project.roadmap.MVP.filter((id) => id !== feature.id)] },
          };
          return stampActivity(withFeature, {
            id: `act-${Date.now()}`,
            type: 'feature_added',
            title: `Added feature: ${feature.name}`,
            reason: 'Feature mode action',
            impact: 'Feature added to roadmap buckets',
            date: now,
          });
        }),
      );
    },
    updateFeature(projectId, featureId, updates) {
      setProjects((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          const now = new Date().toISOString();
          const existing = project.features.find((feature) => feature.id === featureId);
          const features = project.features.map((feature) =>
            feature.id === featureId
              ? {
                  ...feature,
                  ...updates,
                  history: [...feature.history, `Updated at ${new Date(now).toLocaleString()}`],
                  updatedAt: now,
                }
              : feature,
          );
          return stampActivity({ ...project, features }, {
            id: `act-${Date.now()}`,
            type: updates.priority && updates.priority !== existing?.priority ? 'priority_changed' : 'feature_updated',
            title: `Updated feature: ${existing?.name ?? 'Unknown feature'}`,
            reason: 'Feature mode refinement',
            impact: updates.priority ? `Priority set to ${updates.priority}` : 'Feature detail enriched',
            date: now,
          });
        }),
      );
    },
    moveRoadmapItem(projectId, featureId, lane) {
      setProjects((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          const now = new Date().toISOString();
          const cleaned = {
            MVP: project.roadmap.MVP.filter((id) => id !== featureId),
            Next: project.roadmap.Next.filter((id) => id !== featureId),
            Later: project.roadmap.Later.filter((id) => id !== featureId),
            Maybe: project.roadmap.Maybe.filter((id) => id !== featureId),
          };
          const roadmap = { ...cleaned, [lane]: [featureId, ...cleaned[lane]] };
          return stampActivity({ ...project, roadmap, activeMode: 'prioritization' }, {
            id: `act-${Date.now()}`,
            type: 'priority_changed',
            title: `Moved feature to ${lane}`,
            reason: 'Prioritization mode action',
            impact: 'Roadmap delivery sequence updated',
            date: now,
          });
        }),
      );
    },
    saveVersion(projectId, summary) {
      setProjects((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          const now = new Date().toISOString();
          const label = nextVersionLabel(project.currentVersion);
          const version: VersionSnapshot = {
            id: `ver-${Date.now()}`,
            label,
            createdAt: now,
            summary,
            changedItems: project.activity.slice(0, 5).map((item) => item.title),
            projectSnapshot: {
              vision: project.vision,
              problem: project.problem,
              targetUsers: project.targetUsers,
              mvpScope: project.mvpScope,
              futureIdeas: project.futureIdeas,
              openQuestions: project.openQuestions,
              userFlow: project.userFlow,
              developerSummary: project.developerSummary,
            },
          };
          return stampActivity({ ...project, currentVersion: label, versions: [version, ...project.versions], activeMode: 'versioning' }, {
            id: `act-${Date.now()}`,
            type: 'version_saved',
            title: `Saved version ${label}`,
            reason: 'Versioning mode checkpoint',
            impact: 'Project snapshot archived',
            date: now,
          });
        }),
      );
    },
    restoreVersion(projectId, versionId) {
      setProjects((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          const snapshot = project.versions.find((version) => version.id === versionId);
          if (!snapshot) return project;
          const restored: Project = {
            ...project,
            currentVersion: snapshot.label,
            vision: snapshot.projectSnapshot.vision,
            problem: snapshot.projectSnapshot.problem,
            targetUsers: snapshot.projectSnapshot.targetUsers,
            mvpScope: snapshot.projectSnapshot.mvpScope,
            futureIdeas: snapshot.projectSnapshot.futureIdeas,
            openQuestions: snapshot.projectSnapshot.openQuestions,
            userFlow: snapshot.projectSnapshot.userFlow,
            developerSummary: snapshot.projectSnapshot.developerSummary,
            activeMode: 'versioning',
          };
          return stampActivity(restored, {
            id: `act-${Date.now()}`,
            type: 'version_saved',
            title: `Restored ${snapshot.label}`,
            reason: 'User selected restore version',
            impact: 'Project summary fields restored from snapshot',
            date: new Date().toISOString(),
          });
        }),
      );
    },
    generateHandoff(projectId) {
      setProjects((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          const summary = [
            `Vision: ${project.vision || 'TBD'}`,
            `Problem: ${project.problem || 'TBD'}`,
            `Users: ${project.targetUsers.join(', ') || 'TBD'}`,
            `MVP: ${project.roadmap.MVP.map((id) => project.features.find((f) => f.id === id)?.name).filter(Boolean).join(', ') || 'TBD'}`,
            `Open questions: ${project.openQuestions.join('; ') || 'None'}`,
          ].join('\n');

          return stampActivity({ ...project, developerSummary: summary, activeMode: 'handoff' }, {
            id: `act-${Date.now()}`,
            type: 'feature_updated',
            title: 'Generated developer handoff summary',
            reason: 'Handoff mode action',
            impact: 'Project can be shared with engineering',
            date: new Date().toISOString(),
          });
        }),
      );
    },
    addDecision(projectId, title, reasoning, impact, linkedFeatureIds = []) {
      setProjects((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          const now = new Date().toISOString();
          const decision = { id: `dec-${Date.now()}`, title, reasoning, impact, date: now, linkedFeatureIds };
          return stampActivity({ ...project, decisions: [decision, ...project.decisions] }, {
            id: `act-${Date.now()}`,
            type: 'decision_made',
            title: `Decision logged: ${title}`,
            reason: 'Manual decision capture',
            impact,
            date: now,
          });
        }),
      );
    },
    renameProject(projectId, name, description) {
      setProjects((prev) => prev.map((project) => project.id === projectId ? { ...project, name: name || project.name, description: description || project.description, updatedAt: new Date().toISOString() } : project));
    },
    resetInterview(projectId) {
      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId
            ? {
                ...project,
                activeMode: 'discovery',
                interviewPhase: 'idea',
                chatMessages: [{ id: `msg-${Date.now()}`, role: 'assistant', mode: 'discovery', content: 'Interview reset. What should the user be able to do first?', timestamp: new Date().toISOString() }],
              }
            : project,
        ),
      );
    },
    deleteProject(projectId) {
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
    },
  }), [projects]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

/**
 * Hook exposing centralized app state and actions for AI Product Interviewer.
 */
export function useInterviewStore(): AppStore {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useInterviewStore must be used within InterviewStoreProvider');
  }
  return context;
}
