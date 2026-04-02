import React from 'react';
import { LayoutDashboard, MessageSquare, Bell, Shield, Settings, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SyncIndicator from './SyncIndicator';
import { SyncStatus } from '../hooks/useFirestore';
import { useProject } from '../context/ProjectContext';

import ErrorBoundary from './ErrorBoundary';

interface LayoutProps {
  children: React.ReactNode;
  projectName?: string;
  onLogout: () => void;
  isAdmin?: boolean;
  syncStatus?: SyncStatus;
}

export default function Layout({ children, projectName, onLogout, isAdmin = false, syncStatus = 'synced' }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedProject } = useProject();
  
  const navItems = [
    { id: 'projects', label: 'Projects', icon: LayoutDashboard, path: '/projects' },
    { 
      id: 'workspace', 
      label: 'Workspace', 
      icon: MessageSquare, 
      path: selectedProject ? `/projects/${selectedProject.id}/workspace` : '/projects',
      disabled: !selectedProject 
    },
    { id: 'notifications', label: 'Alerts', icon: Bell, path: '/notifications' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Shield, path: '/admin' }] : []),
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const isActive = (path: string, id: string) => {
    if (id === 'projects') return location.pathname === '/projects';
    if (id === 'workspace' && selectedProject) {
      return location.pathname.startsWith(`/projects/${selectedProject.id}`);
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] bg-[#0a0a0a] text-gray-100 font-sans overflow-hidden selection:bg-indigo-500/30">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/10 bg-[#0f0f0f] z-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-bold text-white">F</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">FlowForge AI</h1>
        </div>
        <div className="flex items-center gap-4">
          <SyncIndicator status={syncStatus} />
          <button 
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 border-r border-white/10 bg-[#0f0f0f] flex-col flex-shrink-0">
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="font-bold text-white">F</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">FlowForge AI</h1>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              item.disabled ? (
                <div
                  key={item.id}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 opacity-30 cursor-not-allowed"
                >
                  <item.icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              ) : (
                <Link
                  key={item.id}
                  to={item.path}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                    isActive(item.path, item.id)
                      ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20"
                      : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
                  )}
                >
                  <item.icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 bg-[#0f0f0f]">
          <div className="mb-4 flex justify-center">
            <SyncIndicator status={syncStatus} />
          </div>
          {projectName && (
            <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Active Project</p>
              <p className="text-sm font-medium text-indigo-400 truncate">{projectName}</p>
            </div>
          )}
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#0a0a0a] to-[#121212] relative overscroll-none scroll-smooth">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden flex items-center justify-around p-2 border-t border-white/10 bg-[#0f0f0f] z-50 flex-shrink-0 safe-area-pb">
        {navItems.map((item) => (
          item.disabled ? (
            <div
              key={item.id}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl opacity-20 grayscale cursor-not-allowed"
            >
              <item.icon size={20} />
              <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
            </div>
          ) : (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
                isActive(item.path, item.id)
                  ? "text-indigo-400 bg-indigo-500/5"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              <item.icon size={20} className={cn(isActive(item.path, item.id) && "animate-in zoom-in duration-300")} />
              <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
            </Link>
          )
        ))}
      </nav>
    </div>
  );
}
