import React from 'react';
import { motion } from 'motion/react';
import { 
  Map, 
  MessageSquare, 
  Layout as LayoutIcon, 
  FileText, 
  FileCode,
  Play, 
  Bot, 
  Image as ImageIcon,
  ChevronRight,
  Clock,
  Megaphone,
  Settings as SettingsIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../types';
import { cn } from '../lib/utils';
import IntegrityBadge from './IntegrityBadge';

interface ProjectHubProps {
  project: Project;
  onNavigate: (view: 'hub' | 'ideation' | 'backlog' | 'docs' | 'showcase' | 'agents' | 'assets' | 'roadmap') => void;
}

const modules = [
  {
    id: 'ideation',
    title: 'AI Ideation',
    description: 'Brainstorm features & suggestions with AI',
    icon: MessageSquare,
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10',
    lastActivity: 'Just now',
    badge: 3
  },
  {
    id: 'knowledge-base',
    title: 'Knowledge Base',
    description: 'Project vision, specs & AI documentation',
    icon: FileText,
    color: 'text-sky-400',
    bg: 'bg-sky-400/10',
    lastActivity: 'Updated',
    badge: 1
  },
  {
    id: 'roadmap',
    title: 'Project Roadmap',
    description: 'Timeline, versions & milestones',
    icon: Map,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    lastActivity: '2h ago',
    badge: 0
  },
  {
    id: 'ui-architecture',
    title: 'App Architecture',
    description: 'Pages, components & design system',
    icon: LayoutIcon,
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10',
    lastActivity: 'New',
    badge: 0
  },
  {
    id: 'backlog',
    title: 'Feature Backlog',
    description: 'Manage features & technical briefs',
    icon: LayoutIcon,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    lastActivity: '1d ago',
    badge: 0
  },
  {
    id: 'assets',
    title: 'Asset Library',
    description: 'Media, icons & design resources',
    icon: ImageIcon,
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-400/10',
    lastActivity: '2d ago',
    badge: 0
  },
  {
    id: 'marketing',
    title: 'Marketing Kit',
    description: 'AI taglines, pitch decks & showcase',
    icon: Megaphone,
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
    lastActivity: 'New',
    badge: 0
  },
  {
    id: 'settings',
    title: 'Project Settings',
    description: 'Configuration, visibility & members',
    icon: SettingsIcon,
    color: 'text-gray-400',
    bg: 'bg-gray-400/10',
    lastActivity: '1w ago',
    badge: 0
  }
];

export default function ProjectHub({ project, onNavigate }: ProjectHubProps) {
  const navigate = useNavigate();

  const handleNavigate = (moduleId: string) => {
    // Map module IDs to their respective routes
    const routeMap: Record<string, string> = {
      'ideation': 'ideation',
      'backlog': 'backlog',
      'knowledge-base': 'knowledge-base',
      'marketing': 'marketing',
      'agents': 'agents',
      'assets': 'assets',
      'settings': 'settings',
      'roadmap': 'roadmap',
      'ui-architecture': 'ui-architecture'
    };

    const target = routeMap[moduleId];
    if (target) {
      navigate(`/projects/${project.id}/${target}`);
    } else {
      onNavigate(moduleId as any);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] overflow-y-auto pb-20 lg:pb-8">
      {/* Header */}
      <div className="p-6 lg:p-8 border-b border-white/5 bg-[#0d0d0d]/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">{project.name}</h2>
            <IntegrityBadge status={project.integrityStatus} />
          </div>
          <span className={cn(
            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
            project.status === 'Active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
            project.status === 'Draft' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
            "bg-gray-500/10 text-gray-400 border-gray-500/20"
          )}>
            {project.status}
          </span>
        </div>
        <p className="text-gray-500 text-sm lg:text-base max-w-2xl line-clamp-1">
          {project.description}
        </p>
      </div>

      {/* Grid */}
      <div className="p-4 lg:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {modules.map((module, index) => (
          <motion.button
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleNavigate(module.id)}
            className="group relative p-6 rounded-3xl bg-[#141414] border border-white/5 hover:border-indigo-500/30 transition-all text-left shadow-xl hover:shadow-indigo-500/5 active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-6">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", module.bg, module.color)}>
                <module.icon size={28} />
              </div>
              {module.badge > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-lg shadow-indigo-500/20 animate-pulse">
                  {module.badge}
                </span>
              )}
            </div>

            <div className="space-y-1 mb-6">
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                {module.title}
                <ChevronRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
                {module.description}
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-600">
              <Clock size={12} />
              <span>Last activity: {module.lastActivity}</span>
            </div>

            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
