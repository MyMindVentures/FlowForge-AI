import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider, useProject } from './context/ProjectContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Workspace from './components/Workspace';
import Backlog from './components/Backlog';
import FeatureDetail from './components/FeatureDetail';
import Notifications from './components/Notifications';
import Admin from './components/Admin';
import Onboarding from './components/Onboarding';
import RoleSelection from './components/RoleSelection';
import ProjectHub from './components/ProjectHub';
import Roadmap from './components/Roadmap';
import ProjectDocumentation from './components/ProjectDocumentation';
import MarketingKit from './components/MarketingKit';
import AssetManager from './components/AssetManager';
import ProjectSettings from './components/ProjectSettings';
import ProjectSpecifications from './components/ProjectSpecifications';
import AIAgents from './components/AIAgents';
import UIArchitecture from './components/UIArchitecture';
import FeatureChat from './components/FeatureChat';
import Splash from './components/Splash';
import Auth from './components/Auth';
import Storytelling from './components/Storytelling';
import ErrorBoundary from './components/ErrorBoundary';
import DatabaseTruthSync from './components/DatabaseTruthSync';
import { ToastProvider } from './components/Toast';
import { Sparkles, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Version, Project } from './types';

// --- Guards ---

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;

  return <>{children}</>;
}

function StorytellingGuard({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const location = useLocation();

  if (!profile) return <LoadingScreen />;
  if (!profile.storytellingCompleted && location.pathname !== '/storytelling') {
    return <Navigate to="/storytelling" replace />;
  }

  return <>{children}</>;
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const location = useLocation();

  if (!profile) return <LoadingScreen />;
  if (!profile.storytellingCompleted && location.pathname !== '/storytelling') {
    return <Navigate to="/storytelling" replace />;
  }
  if (profile.storytellingCompleted && !profile.onboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  if (profile.onboarded && !profile.role && location.pathname !== '/role-selection') {
    return <Navigate to="/role-selection" replace />;
  }

  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'Admin' || profile?.email === 'lacometta33@gmail.com';

  if (!isAdmin) return <Navigate to="/projects" replace />;
  return <>{children}</>;
}

// --- Wrappers ---

function ProjectGuard() {
  const { projectId } = useParams();
  const { selectedProject, setSelectedProject, loading, projectsLoading, projects } = useProject();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId && (!selectedProject || selectedProject.id !== projectId)) {
      setSelectedProject({ id: projectId } as any);
    }
  }, [projectId, selectedProject, setSelectedProject]);

  if (!user) return <Navigate to="/auth" replace />;
  
  // If projects are loaded and we still don't have the project, it's a 404
  if (!projectsLoading && !projects.find(p => p.id === projectId)) {
    return <Navigate to="/projects" replace />;
  }

  if (loading || !selectedProject || selectedProject.id !== projectId) {
    return <LoadingScreen />;
  }

  return <Outlet />;
}

function FeatureDetailWrapper() {
  const { featureId } = useParams();
  const { selectedProject, features } = useProject();
  const navigate = useNavigate();

  const feature = features.find(f => f.id === featureId);

  if (!selectedProject) return <Navigate to="/projects" replace />;
  
  if (!feature) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
        <p className="text-gray-400">Loading feature...</p>
        <button 
          onClick={() => navigate(`/projects/${selectedProject.id}/backlog`)}
          className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm"
        >
          Return to Backlog
        </button>
      </div>
    );
  }

  return (
    <FeatureDetail 
      project={selectedProject} 
      feature={feature} 
      onBack={() => navigate(`/projects/${selectedProject.id}/backlog`)}
      onOpenChat={() => navigate(`/projects/${selectedProject.id}/feature/${feature.id}/chat`)}
    />
  );
}

function FeatureChatWrapper() {
  const { featureId } = useParams();
  const { selectedProject, features } = useProject();
  const navigate = useNavigate();

  const feature = features.find(f => f.id === featureId);

  if (!selectedProject) return <Navigate to="/projects" replace />;
  
  if (!feature) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
        <p className="text-gray-400">Loading feature...</p>
        <button 
          onClick={() => navigate(`/projects/${selectedProject.id}/backlog`)}
          className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm"
        >
          Return to Backlog
        </button>
      </div>
    );
  }

  return <FeatureChat project={selectedProject} feature={feature} onBack={() => navigate(`/projects/${selectedProject.id}/feature/${feature.id}`)} />;
}

function RoadmapWrapper() {
  const { selectedProject, versions, features, addVersion, updateVersion } = useProject();
  const navigate = useNavigate();

  if (!selectedProject) return <Navigate to="/projects" replace />;

  const handleAddVersion = async () => {
    try {
      await addVersion({
        name: `v${versions.length + 1}.0`,
        goal: 'New version goal...',
        status: 'Planned',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        linkedFeatureIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      // Error is already handled by useFirestore/handleFirestoreError
      console.error('Failed to add version:', error);
    }
  };

  const handleUpdateVersion = async (version: Version) => {
    try {
      const { id, ...updates } = version;
      await updateVersion(id, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      // Error is already handled by useFirestore/handleFirestoreError
      console.error('Failed to update version:', error);
    }
  };

  return (
    <Roadmap 
      versions={versions} 
      features={features} 
      onAddVersion={handleAddVersion}
      onUpdateVersion={handleUpdateVersion}
      onBack={() => navigate(`/projects/${selectedProject.id}/workspace`)} 
    />
  );
}

function UIArchitectureWrapper() {
  const { 
    selectedProject, 
    pages, 
    components, 
    layouts, 
    styleSystem,
    features,
    addPage,
    updatePage,
    addComponent,
    updateComponent,
    updateStyleSystem,
    addLayout,
    updateLayout
  } = useProject();
  const navigate = useNavigate();

  if (!selectedProject) return <Navigate to="/projects" replace />;

  return (
    <UIArchitecture 
      project={selectedProject}
      pages={pages}
      components={components}
      layouts={layouts}
      styleSystem={styleSystem}
      features={features}
      onBack={() => navigate(`/projects/${selectedProject.id}/workspace`)}
      onAddPage={addPage}
      onUpdatePage={updatePage}
      onAddComponent={addComponent}
      onUpdateComponent={updateComponent}
      onUpdateStyleSystem={updateStyleSystem}
      onAddLayout={addLayout}
      onUpdateLayout={updateLayout}
    />
  );
}

function LoadingScreen() {
  return (
    <div className="h-full bg-[#0a0a0a] flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="animate-spin text-indigo-500 mx-auto mb-4" size={32} />
        <p className="text-gray-500 font-medium text-sm animate-pulse">Forging workspace...</p>
      </div>
    </div>
  );
}

// --- Main App Routes ---

function AppRoutes() {
  const { user, profile, login, logout, setRole, updateProfile, loading } = useAuth();
  const { selectedProject, setSelectedProject, updateProject, features, versions, syncStatus } = useProject();
  const [showSplash, setShowSplash] = useState(true);
  const navigate = useNavigate();

  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Auth onLogin={login} />;
  }

  const isAdmin = profile?.role === 'Admin' || profile?.email === 'lacometta33@gmail.com';

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Storytelling Flow */}
          <Route path="/storytelling" element={<Storytelling onComplete={() => { updateProfile({ storytellingCompleted: true }); navigate('/onboarding'); }} />} />

          {/* Onboarding Flow */}
          <Route path="/onboarding" element={<StorytellingGuard><Onboarding onComplete={() => { updateProfile({ onboarded: true }); navigate('/role-selection'); }} /></StorytellingGuard>} />
          <Route path="/role-selection" element={<StorytellingGuard><RoleSelection onSelect={(role) => { setRole(role); navigate('/projects'); }} /></StorytellingGuard>} />

          {/* Global Layout Wrapper */}
          <Route element={<OnboardingGuard><Layout projectName={selectedProject?.name} onLogout={logout} isAdmin={isAdmin} syncStatus={syncStatus}><Outlet /></Layout></OnboardingGuard>}>
            
            {/* Dashboard */}
            <Route path="/projects" element={<Dashboard onSelectProject={(p) => { setSelectedProject(p); navigate(`/projects/${p.id}/workspace`); }} />} />
            
            {/* Project Scoped Routes */}
            <Route path="/projects/:projectId" element={<ProjectGuard />}>
              <Route path="workspace" element={<ProjectHub project={selectedProject!} onNavigate={(view) => navigate(`/projects/${selectedProject!.id}/${view}`)} />} />
              <Route path="ideation" element={<FeatureChat project={selectedProject!} feature={{ id: 'new', title: 'Ideation', featureCode: 'IDEA' } as any} onBack={() => navigate(`/projects/${selectedProject!.id}/workspace`)} />} />
              <Route path="backlog" element={<Backlog project={selectedProject!} onSelectFeature={(f) => navigate(`/projects/${selectedProject!.id}/feature/${f.id}`)} />} />
              <Route path="feature/:featureId" element={<FeatureDetailWrapper />} />
              <Route path="feature/:featureId/chat" element={<FeatureChatWrapper />} />
              <Route path="roadmap" element={<RoadmapWrapper />} />
              <Route path="docs" element={<ProjectDocumentation project={selectedProject!} features={features} onBack={() => navigate(`/projects/${selectedProject!.id}/workspace`)} />} />
              <Route path="marketing" element={<MarketingKit project={selectedProject!} features={features} onBack={() => navigate(`/projects/${selectedProject!.id}/workspace`)} />} />
              <Route path="assets" element={<AssetManager project={selectedProject!} features={features} onBack={() => navigate(`/projects/${selectedProject!.id}/workspace`)} />} />
              <Route path="settings" element={<ProjectSettings project={selectedProject!} onUpdate={updateProject} onBack={() => navigate(`/projects/${selectedProject!.id}/workspace`)} />} />
              <Route path="specifications" element={<ProjectSpecifications project={selectedProject!} onUpdate={updateProject} onBack={() => navigate(`/projects/${selectedProject!.id}/workspace`)} />} />
              <Route path="agents" element={<AIAgents project={selectedProject!} onBack={() => navigate(`/projects/${selectedProject!.id}/workspace`)} />} />
              <Route path="ui-architecture" element={<UIArchitectureWrapper />} />
            </Route>

            {/* Global Modules */}
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  );
}


function SettingsView() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  if (!user || !profile) return null;

  return (
    <div className="p-4 lg:p-12 max-w-2xl mx-auto text-center">
      <h2 className="text-2xl lg:text-3xl font-bold text-white mb-6">Settings</h2>
      <div className="p-6 lg:p-8 rounded-2xl lg:rounded-3xl bg-[#141414] border border-white/5 text-left">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
          <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-16 h-16 rounded-full border-2 border-indigo-500/20" />
          <div className="text-center sm:text-left">
            <p className="text-xl font-bold text-white">{user.displayName}</p>
            <p className="text-gray-500">{user.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              <Sparkles size={10} />
              {profile.role}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-gray-300 font-medium text-sm lg:text-base">AI Model</span>
            <span className="text-indigo-400 font-bold text-sm lg:text-base">Gemini 3 Flash</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-gray-300 font-medium text-sm lg:text-base">Theme</span>
            <span className="text-gray-500 font-bold text-sm lg:text-base">Premium Dark</span>
          </div>
          <button 
            onClick={() => navigate('/role-selection')}
            className="w-full mt-4 p-4 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:border-white/10 transition-all text-sm font-medium flex items-center justify-between"
          >
            Change Role
            <Sparkles size={16} className="text-indigo-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ProjectProvider>
            <DatabaseTruthSync />
            <AppRoutes />
          </ProjectProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
