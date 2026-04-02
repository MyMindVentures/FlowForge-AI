import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, Feature, Version } from '../types';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from './AuthContext';
import { where } from 'firebase/firestore';

interface ProjectContextType {
  projects: Project[];
  projectsLoading: boolean;
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  updateProject: (updates: Partial<Project>) => Promise<void>;
  addVersion: (version: Partial<Version>) => Promise<string>;
  updateVersion: (id: string, updates: Partial<Version>) => Promise<void>;
  removeVersion: (id: string) => Promise<void>;
  features: Feature[];
  versions: Version[];
  loading: boolean;
  syncStatus: any;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'Admin' || profile?.email === 'lacometta33@gmail.com';
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    return localStorage.getItem('selected_project_id');
  });

  const { data: projects, loading: projectsLoading, update: updateProjectDoc } = useFirestore<Project>(
    user ? 'projects' : null, 
    user ? (isAdmin ? [] : [where('ownerId', '==', user.uid)]) : []
  );

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  const updateProject = async (updates: Partial<Project>) => {
    if (!selectedProjectId) return;
    await updateProjectDoc(selectedProjectId, updates);
  };

  const { data: features, loading: featuresLoading, syncStatus: featuresSync } = useFirestore<Feature>(
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
      addVersion,
      updateVersion,
      removeVersion,
      features, 
      versions, 
      loading,
      syncStatus: featuresSync // Simplified for now
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
