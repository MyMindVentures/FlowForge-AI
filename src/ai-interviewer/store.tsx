import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { assistantReply, createProject as createLocalProject, initialProjects, nextVersionLabel, phaseOrder } from './mockData';
import {
  createDecisionRecord,
  createFeatureRecord,
  createProjectRecord,
  deleteProjectRecord,
  getCurrentUserId,
  isSupabaseReady,
  listProjects,
  saveChatMessages,
  saveDeveloperHandoff,
  saveProjectVersion,
  updateFeatureRecord,
  updateProjectRecord,
  insertActivity,
} from './supabaseRepository';
import type { Feature, InterviewMode, InterviewPhase, Project } from './types';

type AppStore = {
  projects: Project[];
  loading: boolean;
  syncError: string | null;
  createNewProject: (name: string, description: string) => Promise<Project>;
  getProject: (projectId: string) => Project | undefined;
  sendChat: (projectId: string, userMessage: string) => Promise<void>;
  setMode: (projectId: string, mode: InterviewMode) => Promise<void>;
  addFeature: (projectId: string, feature: Omit<Feature, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => Promise<void>;
  updateFeature: (projectId: string, featureId: string, updates: Partial<Feature>) => Promise<void>;
  moveRoadmapItem: (projectId: string, featureId: string, lane: keyof Project['roadmap']) => Promise<void>;
  saveVersion: (projectId: string, summary: string) => Promise<void>;
  restoreVersion: (projectId: string, versionId: string) => Promise<void>;
  generateHandoff: (projectId: string) => Promise<void>;
  addDecision: (projectId: string, title: string, reasoning: string, impact: string, linkedFeatureIds?: string[]) => Promise<void>;
  renameProject: (projectId: string, name: string, description: string) => Promise<void>;
  resetInterview: (projectId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const StoreContext = createContext<AppStore | null>(null);

/**
 * Provider that treats Supabase as source of truth for all project data.
 */
export function InterviewStoreProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const useFallback = !isSupabaseReady();

  const refresh = async () => {
    if (useFallback) {
      setProjects(initialProjects);
      setLoading(false);
      setSyncError('Supabase is not configured. Running in fallback demo mode.');
      return;
    }

    try {
      const uid = await getCurrentUserId();
      if (!uid) {
        setProjects([]);
        setSyncError('No authenticated Supabase user session found.');
        setLoading(false);
        return;
      }
      setUserId(uid);
      const freshProjects = await listProjects(uid);
      setProjects(freshProjects);
      setSyncError(null);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Failed to sync with Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const api = useMemo<AppStore>(() => ({
    projects,
    loading,
    syncError,
    async refresh() {
      await refresh();
    },
    async createNewProject(name, description) {
      if (useFallback || !userId) {
        const project = createLocalProject(name, description);
        setProjects((prev) => [project, ...prev]);
        return project;
      }

      const project = await createProjectRecord(userId, { name, description });
      await refresh();
      return project;
    },
    getProject(projectId) {
      return projects.find((item) => item.id === projectId);
    },
    async sendChat(projectId, userMessage) {
      const project = projects.find((item) => item.id === projectId);
      if (!project) return;

      const phaseIndex = phaseOrder.indexOf(project.interviewPhase);
      const nextPhase = phaseOrder[Math.min(phaseOrder.length - 1, phaseIndex + 1)] as InterviewPhase;
      const now = new Date().toISOString();
      const assistantMessage = assistantReply(project.activeMode, nextPhase);

      const updates = {
        active_mode: project.activeMode,
        interview_phase: nextPhase,
        status: 'Interviewing',
        vision: project.vision || userMessage,
        problem: project.problem || 'Teams need a structured path from idea to implementation.',
        target_users: project.targetUsers.length ? project.targetUsers : ['Founders validating scope before engineering'],
        open_questions: project.openQuestions.includes('What metric defines MVP success?')
          ? project.openQuestions
          : [...project.openQuestions, 'What metric defines MVP success?'],
      };

      if (useFallback || !userId) {
        setProjects((prev) => prev.map((entry) => entry.id === projectId ? {
          ...entry,
          ...{ status: 'Interviewing', interviewPhase: nextPhase, vision: updates.vision, problem: updates.problem, targetUsers: updates.target_users, openQuestions: updates.open_questions },
          chatMessages: [
            ...entry.chatMessages,
            { id: `msg-${Date.now()}`, role: 'user', mode: entry.activeMode, content: userMessage, timestamp: now },
            { id: `msg-${Date.now() + 1}`, role: 'assistant', mode: entry.activeMode, content: assistantMessage, timestamp: now },
          ],
        } : entry));
        return;
      }

      await updateProjectRecord(projectId, updates);
      await saveChatMessages(projectId, userId, project.activeMode, [
        { role: 'user', mode: project.activeMode, content: userMessage },
        { role: 'assistant', mode: project.activeMode, content: assistantMessage },
      ]);
      await insertActivity(projectId, {
        type: 'feature_updated',
        title: `AI ${project.activeMode} interaction`,
        reason: 'User sent chat input',
        impact: `Interview phase moved to ${nextPhase}`,
      });

      await refresh();
    },
    async setMode(projectId, mode) {
      const project = projects.find((item) => item.id === projectId);
      if (!project) return;

      if (useFallback) {
        setProjects((prev) => prev.map((entry) => entry.id === projectId ? { ...entry, activeMode: mode } : entry));
        return;
      }

      await updateProjectRecord(projectId, { active_mode: mode });
      await refresh();
    },
    async addFeature(projectId, feature) {
      if (useFallback) {
        setProjects((prev) => prev.map((entry) => entry.id === projectId ? {
          ...entry,
          features: [{ ...feature, id: `feat-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), history: ['Feature added'] }, ...entry.features],
        } : entry));
        return;
      }

      await createFeatureRecord(projectId, feature);
      await insertActivity(projectId, {
        type: 'feature_added',
        title: `Added feature: ${feature.name}`,
        reason: 'Add feature action',
        impact: 'Feature table and dependencies updated',
      });
      await refresh();
    },
    async updateFeature(projectId, featureId, updates) {
      if (useFallback) {
        setProjects((prev) => prev.map((entry) => entry.id === projectId ? {
          ...entry,
          features: entry.features.map((feature) => feature.id === featureId ? { ...feature, ...updates, updatedAt: new Date().toISOString() } : feature),
        } : entry));
        return;
      }

      await updateFeatureRecord(projectId, featureId, updates);
      await insertActivity(projectId, {
        type: updates.priority ? 'priority_changed' : 'feature_updated',
        title: 'Updated feature metadata',
        reason: 'Feature update action',
        impact: updates.priority ? `Priority set to ${updates.priority}` : 'Feature details changed',
      });
      await refresh();
    },
    async moveRoadmapItem(projectId, featureId, lane) {
      const project = projects.find((entry) => entry.id === projectId);
      if (!project) return;

      const cleaned = {
        MVP: project.roadmap.MVP.filter((id) => id !== featureId),
        Next: project.roadmap.Next.filter((id) => id !== featureId),
        Later: project.roadmap.Later.filter((id) => id !== featureId),
        Maybe: project.roadmap.Maybe.filter((id) => id !== featureId),
      };
      const roadmap = { ...cleaned, [lane]: [featureId, ...cleaned[lane]] };

      if (useFallback) {
        setProjects((prev) => prev.map((entry) => entry.id === projectId ? { ...entry, roadmap } : entry));
        return;
      }

      await updateProjectRecord(projectId, { roadmap, active_mode: 'prioritization' });
      await insertActivity(projectId, {
        type: 'priority_changed',
        title: `Moved feature to ${lane}`,
        reason: 'Prioritization action',
        impact: 'Roadmap bucket assignment changed',
      });
      await refresh();
    },
    async saveVersion(projectId, summary) {
      const project = projects.find((entry) => entry.id === projectId);
      if (!project) return;

      const label = nextVersionLabel(project.currentVersion);
      const snapshot = {
        label,
        summary,
        changedItems: project.activity.slice(0, 5).map((entry) => entry.title),
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

      if (useFallback) {
        setProjects((prev) => prev.map((entry) => entry.id === projectId ? {
          ...entry,
          currentVersion: label,
          versions: [{ id: `ver-${Date.now()}`, createdAt: new Date().toISOString(), ...snapshot }, ...entry.versions],
        } : entry));
        return;
      }

      await updateProjectRecord(projectId, { current_version: label, active_mode: 'versioning' });
      await saveProjectVersion(projectId, snapshot);
      await insertActivity(projectId, {
        type: 'version_saved',
        title: `Saved version ${label}`,
        reason: 'Versioning action',
        impact: 'Project snapshot stored',
      });
      await refresh();
    },
    async restoreVersion(projectId, versionId) {
      const project = projects.find((entry) => entry.id === projectId);
      const version = project?.versions.find((entry) => entry.id === versionId);
      if (!project || !version) return;

      if (useFallback) {
        setProjects((prev) => prev.map((entry) => entry.id === projectId ? {
          ...entry,
          currentVersion: version.label,
          ...version.projectSnapshot,
        } : entry));
        return;
      }

      await updateProjectRecord(projectId, {
        current_version: version.label,
        vision: version.projectSnapshot.vision,
        problem: version.projectSnapshot.problem,
        target_users: version.projectSnapshot.targetUsers,
        mvp_scope: version.projectSnapshot.mvpScope,
        future_ideas: version.projectSnapshot.futureIdeas,
        open_questions: version.projectSnapshot.openQuestions,
        user_flow: version.projectSnapshot.userFlow,
        developer_summary: version.projectSnapshot.developerSummary,
        active_mode: 'versioning',
      });
      await insertActivity(projectId, {
        type: 'version_saved',
        title: `Restored version ${version.label}`,
        reason: 'Version restore action',
        impact: 'Project summary fields restored',
      });
      await refresh();
    },
    async generateHandoff(projectId) {
      const project = projects.find((entry) => entry.id === projectId);
      if (!project) return;

      const summary = [
        `Vision: ${project.vision || 'TBD'}`,
        `Problem: ${project.problem || 'TBD'}`,
        `Users: ${project.targetUsers.join(', ') || 'TBD'}`,
        `MVP: ${project.roadmap.MVP.map((id) => project.features.find((feature) => feature.id === id)?.name).filter(Boolean).join(', ') || 'TBD'}`,
        `Open questions: ${project.openQuestions.join('; ') || 'None'}`,
      ].join('\n');

      if (useFallback || !userId) {
        setProjects((prev) => prev.map((entry) => entry.id === projectId ? { ...entry, developerSummary: summary, activeMode: 'handoff' } : entry));
        return;
      }

      await updateProjectRecord(projectId, { developer_summary: summary, active_mode: 'handoff' });
      await saveDeveloperHandoff(projectId, userId, summary, {
        version: project.currentVersion,
        targetUsers: project.targetUsers,
        roadmap: project.roadmap,
        decisions: project.decisions,
      });
      await insertActivity(projectId, {
        type: 'feature_updated',
        title: 'Generated developer handoff',
        reason: 'Handoff action',
        impact: 'Handoff summary saved for export/share',
      });
      await refresh();
    },
    async addDecision(projectId, title, reasoning, impact, linkedFeatureIds = []) {
      if (useFallback) {
        setProjects((prev) => prev.map((entry) => entry.id === projectId ? {
          ...entry,
          decisions: [{ id: `dec-${Date.now()}`, title, reasoning, impact, linkedFeatureIds, date: new Date().toISOString() }, ...entry.decisions],
        } : entry));
        return;
      }

      await createDecisionRecord(projectId, { title, reasoning, impact, linkedFeatureIds });
      await insertActivity(projectId, {
        type: 'decision_made',
        title: `Decision logged: ${title}`,
        reason: 'Decision capture action',
        impact,
      });
      await refresh();
    },
    async renameProject(projectId, name, description) {
      if (useFallback) {
        setProjects((prev) => prev.map((entry) => entry.id === projectId ? { ...entry, name, description } : entry));
        return;
      }
      await updateProjectRecord(projectId, { name, description });
      await refresh();
    },
    async resetInterview(projectId) {
      const project = projects.find((entry) => entry.id === projectId);
      if (!project) return;
      if (useFallback) {
        setProjects((prev) => prev.map((entry) => entry.id === projectId ? { ...entry, activeMode: 'discovery', interviewPhase: 'idea', chatMessages: [] } : entry));
        return;
      }

      await updateProjectRecord(projectId, { active_mode: 'discovery', interview_phase: 'idea' });
      await insertActivity(projectId, {
        type: 'feature_updated',
        title: 'Interview reset',
        reason: 'Reset action',
        impact: 'Interview mode and phase reset to initial state',
      });
      await refresh();
    },
    async deleteProject(projectId) {
      if (useFallback) {
        setProjects((prev) => prev.filter((entry) => entry.id !== projectId));
        return;
      }
      await deleteProjectRecord(projectId);
      setProjects((prev) => prev.filter((entry) => entry.id !== projectId));
    },
  }), [projects, loading, syncError, userId]);

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
