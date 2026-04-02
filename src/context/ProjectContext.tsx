import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, Feature, Version, UIPage, UIComponent, UILayout, UIStyleSystem, PRDSection, AuditFinding, ReadinessCheck, Blocker, Task, LLMFunction } from '../types';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from './AuthContext';
import { where } from 'firebase/firestore';
import { SyncService } from '../services/SyncService';

interface ProjectContextType {
  projects: Project[];
  projectsLoading: boolean;
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  updateProject: (updates: Partial<Project>) => Promise<void>;
  updateProjectById: (id: string, updates: Partial<Project>) => Promise<void>;
  addVersion: (version: Partial<Version>) => Promise<string>;
  updateVersion: (id: string, updates: Partial<Version>) => Promise<void>;
  removeVersion: (id: string) => Promise<void>;
  features: Feature[];
  versions: Version[];
  pages: UIPage[];
  components: UIComponent[];
  layouts: UILayout[];
  styleSystem: UIStyleSystem | null;
  loading: boolean;
  syncStatus: any;
  addPage: (page: Omit<UIPage, 'id'>) => Promise<string>;
  updatePage: (id: string, updates: Partial<UIPage>) => Promise<void>;
  addFeature: (feature: Omit<Feature, 'id'>) => Promise<string>;
  updateFeature: (id: string, updates: Partial<Feature>) => Promise<void>;
  addComponent: (component: Omit<UIComponent, 'id'>) => Promise<string>;
  updateComponent: (id: string, updates: Partial<UIComponent>) => Promise<void>;
  updateStyleSystem: (updates: Partial<UIStyleSystem>) => Promise<void>;
  addLayout: (layout: Omit<UILayout, 'id'>) => Promise<string>;
  updateLayout: (id: string, updates: Partial<UILayout>) => Promise<void>;
  prdSections: PRDSection[];
  auditFindings: AuditFinding[];
  readinessChecks: ReadinessCheck[];
  blockers: Blocker[];
  tasks: Task[];
  functions: LLMFunction[];
  addPRDSection: (section: Omit<PRDSection, 'id'>) => Promise<string>;
  updatePRDSection: (id: string, updates: Partial<PRDSection>) => Promise<void>;
  addAuditFinding: (finding: Omit<AuditFinding, 'id'>) => Promise<string>;
  updateAuditFinding: (id: string, updates: Partial<AuditFinding>) => Promise<void>;
  addReadinessCheck: (check: Omit<ReadinessCheck, 'id'>) => Promise<string>;
  updateReadinessCheck: (id: string, updates: Partial<ReadinessCheck>) => Promise<void>;
  addBlocker: (blocker: Omit<Blocker, 'id'>) => Promise<string>;
  updateBlocker: (id: string, updates: Partial<Blocker>) => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => Promise<string>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  addLLMFunction: (fn: Omit<LLMFunction, 'id'>) => Promise<string>;
  updateLLMFunction: (id: string, updates: Partial<LLMFunction>) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'Admin' || profile?.email === 'lacometta33@gmail.com';
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    return localStorage.getItem('selected_project_id');
  });

  const { data: projects, loading: projectsLoading, add: addProjectDoc, update: updateProjectDoc } = useFirestore<Project>(
    user ? 'projects' : null, 
    user ? (isAdmin ? [] : [where('ownerId', '==', user.uid)]) : []
  );

  // Ensure FlowForge AI project exists and handle duplicates
  useEffect(() => {
    if (!projectsLoading && user && isAdmin) {
      const systemMetadata = SyncService.getSystemProjectMetadata();
      const flowForgeProjects = projects.filter(p => p.name === systemMetadata.name);
      
      if (flowForgeProjects.length === 0) {
        // Create if none exists
        addProjectDoc({
          ...systemMetadata,
          ownerId: user.uid,
          members: [],
          repositories: []
        } as any);
      } else if (flowForgeProjects.length > 1) {
        // If duplicates exist, we should ideally merge them.
        // For now, we'll just log it and the UI will naturally pick the first one or the one with the most data if we sort it.
        console.warn(`Found ${flowForgeProjects.length} duplicate FlowForge AI projects. Consolidation recommended.`);
      }
    }
  }, [projectsLoading, projects, user, isAdmin, addProjectDoc]);

  // Sort projects to ensure consistent selection of the "primary" one if duplicates exist
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.name === 'FlowForge AI' && b.name === 'FlowForge AI') {
      // Prefer the one created earlier or with more metadata
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return 0;
  });

  const selectedProject = sortedProjects.find(p => p.id === selectedProjectId) || null;

  const updateProject = async (updates: Partial<Project>) => {
    if (!selectedProjectId) return;
    await updateProjectDoc(selectedProjectId, updates);
  };

  const updateProjectById = async (id: string, updates: Partial<Project>) => {
    await updateProjectDoc(id, updates);
  };

  const { data: features, loading: featuresLoading, syncStatus: featuresSync, add: addFeatureDoc, update: updateFeatureDoc } = useFirestore<Feature>(
    (user && selectedProjectId) ? `projects/${selectedProjectId}/features` : null, 
    []
  );

  const { 
    data: versions, 
    loading: versionsLoading, 
    syncStatus: versionsSync,
    add: addVersionDoc,
    update: updateVersionDoc,
    remove: removeVersionDoc
  } = useFirestore<Version>(
    (user && selectedProjectId) ? `projects/${selectedProjectId}/versions` : null, 
    []
  );

  const { data: pages, loading: pagesLoading, add: addPageDoc, update: updatePageDoc } = useFirestore<UIPage>(
    (user && selectedProjectId) ? `projects/${selectedProjectId}/ui_pages` : null, 
    []
  );

  const { data: components, loading: componentsLoading, add: addComponentDoc, update: updateComponentDoc } = useFirestore<UIComponent>(
    (user && selectedProjectId) ? `projects/${selectedProjectId}/ui_components` : null, 
    []
  );

  const { data: layouts, loading: layoutsLoading, add: addLayoutDoc, update: updateLayoutDoc } = useFirestore<UILayout>(
    (user && selectedProjectId) ? `projects/${selectedProjectId}/ui_layouts` : null, 
    []
  );

  const { data: styleSystemDocs, loading: styleSystemLoading, add: addStyleSystemDoc, update: updateStyleSystemDoc } = useFirestore<UIStyleSystem>(
    (user && selectedProjectId) ? `projects/${selectedProjectId}/ui_style` : null, 
    []
  );

  const { data: prdSections, add: addPRDSectionDoc, update: updatePRDSectionDoc } = useFirestore<PRDSection>(
    (user && selectedProjectId) ? `projects/${selectedProjectId}/prd_sections` : null, 
    []
  );

  const { data: auditFindings, add: addAuditFindingDoc, update: updateAuditFindingDoc } = useFirestore<AuditFinding>(
    (user && selectedProjectId) ? `projects/${selectedProjectId}/audit_findings` : null, 
    []
  );

  const { data: readinessChecks, add: addReadinessCheckDoc, update: updateReadinessCheckDoc } = useFirestore<ReadinessCheck>(
    (user && selectedProjectId) ? `projects/${selectedProjectId}/readiness_checks` : null, 
    []
  );

  const { data: blockers, add: addBlockerDoc, update: updateBlockerDoc } = useFirestore<Blocker>(
    (user && selectedProjectId) ? `projects/${selectedProjectId}/blockers` : null, 
    []
  );

  const { data: tasks, add: addTaskDoc, update: updateTaskDoc } = useFirestore<Task>(
    (user && selectedProjectId) ? `projects/${selectedProjectId}/tasks` : null, 
    []
  );

  const { data: functions, add: addFunctionDoc, update: updateFunctionDoc } = useFirestore<LLMFunction>(
    (user && selectedProjectId) ? `projects/${selectedProjectId}/ai_functions` : null, 
    []
  );

  const styleSystem = styleSystemDocs[0] || null;

  const addPage = async (page: Omit<UIPage, 'id'>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    return await addPageDoc(page);
  };

  const updatePage = async (id: string, updates: Partial<UIPage>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    await updatePageDoc(id, updates);
  };
  
  const addFeature = async (feature: Omit<Feature, 'id'>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    return await addFeatureDoc(feature);
  };

  const updateFeature = async (id: string, updates: Partial<Feature>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    await updateFeatureDoc(id, updates);
  };

  const addComponent = async (component: Omit<UIComponent, 'id'>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    return await addComponentDoc(component);
  };

  const updateComponent = async (id: string, updates: Partial<UIComponent>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    await updateComponentDoc(id, updates);
  };

  const updateStyleSystem = async (updates: Partial<UIStyleSystem>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    if (styleSystem) {
      await updateStyleSystemDoc(styleSystem.id, updates);
    } else {
      // Create initial style system if it doesn't exist
      await addStyleSystemDoc({
        projectId: selectedProjectId,
        colors: {
          primary: '#6366f1',
          secondary: '#10b981',
          accent: '#f59e0b',
          background: '#0a0a0a',
          surface: '#141414',
          error: '#ef4444',
          success: '#22c55e',
          warning: '#f59e0b',
          info: '#3b82f6',
        },
        typography: {
          fontSans: 'Inter',
          fontMono: 'JetBrains Mono',
          baseSize: '16px',
          scale: 1.2,
        },
        spacing: {
          unit: 4,
          scale: [0, 4, 8, 12, 16, 24, 32, 48, 64],
        },
        darkMode: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...updates
      } as any);
    }
  };

  const addLayout = async (layout: Omit<UILayout, 'id'>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    return await addLayoutDoc(layout);
  };

  const updateLayout = async (id: string, updates: Partial<UILayout>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    await updateLayoutDoc(id, updates);
  };

  const addPRDSection = async (section: Omit<PRDSection, 'id'>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    return await addPRDSectionDoc(section);
  };

  const updatePRDSection = async (id: string, updates: Partial<PRDSection>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    await updatePRDSectionDoc(id, updates);
  };

  const addAuditFinding = async (finding: Omit<AuditFinding, 'id'>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    return await addAuditFindingDoc(finding);
  };

  const updateAuditFinding = async (id: string, updates: Partial<AuditFinding>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    await updateAuditFindingDoc(id, updates);
  };

  const addReadinessCheck = async (check: Omit<ReadinessCheck, 'id'>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    return await addReadinessCheckDoc(check);
  };

  const updateReadinessCheck = async (id: string, updates: Partial<ReadinessCheck>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    await updateReadinessCheckDoc(id, updates);
  };

  const addBlocker = async (blocker: Omit<Blocker, 'id'>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    return await addBlockerDoc(blocker);
  };

  const updateBlocker = async (id: string, updates: Partial<Blocker>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    await updateBlockerDoc(id, updates);
  };

  const addTask = async (task: Omit<Task, 'id'>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    return await addTaskDoc(task);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    await updateTaskDoc(id, updates);
  };

  const addLLMFunction = async (fn: Omit<LLMFunction, 'id'>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    return await addFunctionDoc(fn);
  };

  const updateLLMFunction = async (id: string, updates: Partial<LLMFunction>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    await updateFunctionDoc(id, updates);
  };

  const addVersion = async (version: Omit<Version, 'id'>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    return await addVersionDoc(version);
  };

  const updateVersion = async (id: string, updates: Partial<Version>) => {
    if (!selectedProjectId) throw new Error('No project selected');
    await updateVersionDoc(id, updates);
  };

  const removeVersion = async (id: string) => {
    if (!selectedProjectId) throw new Error('No project selected');
    await removeVersionDoc(id);
  };

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('selected_project_id', selectedProjectId);
    } else {
      localStorage.removeItem('selected_project_id');
    }
  }, [selectedProjectId]);

  const setSelectedProject = (project: Project | null) => {
    setSelectedProjectId(project?.id || null);
  };

  const loading = projectsLoading || (selectedProjectId ? (featuresLoading || versionsLoading) : false);

  return (
    <ProjectContext.Provider value={{ 
      projects,
      projectsLoading,
      selectedProject, 
      setSelectedProject, 
      updateProject,
      updateProjectById,
      addVersion,
      updateVersion,
      removeVersion,
      features, 
      versions, 
      pages,
      components,
      layouts,
      styleSystem,
      loading,
      syncStatus: featuresSync, // Simplified for now
      addPage,
      updatePage,
      addFeature,
      updateFeature,
      addComponent,
      updateComponent,
      updateStyleSystem,
      addLayout,
      updateLayout,
      prdSections,
      auditFindings,
      readinessChecks,
      blockers,
      tasks,
      functions,
      addPRDSection,
      updatePRDSection,
      addAuditFinding,
      updateAuditFinding,
      addReadinessCheck,
      updateReadinessCheck,
      addBlocker,
      updateBlocker,
      addTask,
      updateTask,
      addLLMFunction,
      updateLLMFunction
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
