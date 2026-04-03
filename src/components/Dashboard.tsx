import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Folder, Clock, ChevronRight, Trash2, Loader2, Search, Filter, Star, Archive, ExternalLink, X, AlertCircle, Check } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, deleteDoc, where } from '../lib/db/firestoreCompat';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { db, auth } from '../firebase';
import { Project } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { useToast } from './Toast';
import ConfirmModal from './ConfirmModal';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  onSelectProject: (project: Project) => void;
}

export default function Dashboard({ onSelectProject }: DashboardProps) {
  const { user } = useAuth();
  const { data: projects, loading, error, add, update, remove } = useFirestore<Project>(
    user ? 'projects' : null, 
    user ? [where('ownerId', '==', user.uid)] : []
  );

  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('dashboard_search') || '');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Draft' | 'Active' | 'Archived'>(() => 
    (localStorage.getItem('dashboard_filter') as any) || 'All'
  );
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; projectId: string | null }>({
    isOpen: false,
    projectId: null
  });

  const { showToast } = useToast();

  useEffect(() => {
    localStorage.setItem('dashboard_search', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem('dashboard_filter', statusFilter);
  }, [statusFilter]);

  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }, [projects, searchQuery, statusFilter]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !auth.currentUser || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await add({
        name: newProjectName,
        description: newProjectDesc,
        ownerId: auth.currentUser.uid,
        status: 'Draft',
        isFavorite: false,
        members: [],
        repositories: []
      } as any);
      setNewProjectName('');
      setNewProjectDesc('');
      setIsCreating(false);
      showToast('Project created successfully!');
    } catch (error) {
      showToast('Failed to create project', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !newProjectName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await update(editingProject.id, {
        name: newProjectName,
        description: newProjectDesc,
      });
      setEditingProject(null);
      setNewProjectName('');
      setNewProjectDesc('');
      showToast('Project updated');
    } catch (error) {
      showToast('Failed to update project', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicateProject = async (project: Project) => {
    try {
      await add({
        name: `${project.name} (Copy)`,
        description: project.description,
        ownerId: auth.currentUser?.uid,
        status: 'Draft',
        isFavorite: false,
        members: project.members || [],
        repositories: project.repositories || []
      } as any);
      showToast('Project duplicated');
    } catch (error) {
      showToast('Failed to duplicate project', 'error');
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    try {
      await update(project.id, {
        isFavorite: !project.isFavorite,
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleArchiveProject = async (projectId: string) => {
    try {
      await update(projectId, {
        status: 'Archived',
      });
      showToast('Project archived');
    } catch (error) {
      showToast('Failed to archive project', 'error');
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteModal.projectId) return;
    const projectToDelete = projects.find(p => p.id === deleteModal.projectId);
    if (projectToDelete?.name === 'FlowForge AI') {
      showToast('The FlowForge AI project cannot be deleted.', 'error');
      setDeleteModal({ isOpen: false, projectId: null });
      return;
    }
    try {
      await remove(deleteModal.projectId);
      showToast('Project deleted');
      setDeleteModal({ isOpen: false, projectId: null });
    } catch (error) {
      showToast('Failed to delete project', 'error');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-500 mx-auto mb-4" size={32} />
          <p className="text-gray-400 font-medium">Loading your projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md text-center p-8 rounded-3xl bg-red-500/5 border border-red-500/10">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={40} />
          <h3 className="text-xl font-bold text-white mb-2">Failed to load projects</h3>
          <p className="text-gray-400 mb-6">{error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full pb-24">
      <div className="p-4 lg:p-8 max-w-5xl mx-auto">
        <div className="flex flex-col mb-8 lg:mb-10 gap-6">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Projects</h2>
            <p className="text-gray-400 mt-1 text-sm lg:text-base">Select a project to start forging features.</p>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
              {['All', 'Active', 'Draft', 'Archived'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as any)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all whitespace-nowrap",
                    statusFilter === status 
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProjects.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full py-16 lg:py-20 text-center border-2 border-dashed border-white/5 rounded-3xl"
              >
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Folder className="text-gray-600" size={32} />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">No projects found</h3>
                <p className="text-gray-400 text-sm lg:text-base px-6 mb-6">
                  {searchQuery || statusFilter !== 'All' 
                    ? "Try adjusting your filters or search query." 
                    : "Start by creating your first project to forge amazing features."}
                </p>
                {!searchQuery && statusFilter === 'All' && (
                  <button 
                    onClick={() => setIsCreating(true)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Create Project
                  </button>
                )}
              </motion.div>
            ) : (
              filteredProjects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onSelect={onSelectProject}
                  onToggleFavorite={handleToggleFavorite}
                  onArchive={handleArchiveProject}
                  onDuplicate={handleDuplicateProject}
                  onEdit={(p) => {
                    setEditingProject(p);
                    setNewProjectName(p.name);
                    setNewProjectDesc(p.description || '');
                  }}
                  onDelete={(id) => setDeleteModal({ isOpen: true, projectId: id })}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsCreating(true)}
        className="fixed bottom-24 right-6 lg:bottom-12 lg:right-12 w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 z-40"
      >
        <Plus size={28} />
      </motion.button>

      {/* Create/Edit Project Modal */}
      <AnimatePresence>
        {(isCreating || editingProject) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsCreating(false);
                setEditingProject(null);
                setNewProjectName('');
                setNewProjectDesc('');
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{editingProject ? 'Edit Project' : 'New Project'}</h3>
                <button 
                  onClick={() => {
                    setIsCreating(false);
                    setEditingProject(null);
                    setNewProjectName('');
                    setNewProjectDesc('');
                  }} 
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={editingProject ? handleUpdateProject : handleCreateProject} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="e.g. My Awesome App"
                    required
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Description</label>
                  <textarea
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-32 resize-none"
                    placeholder="What is this project about?"
                    disabled={isSubmitting}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20"
                >
                  {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : (editingProject ? <Check size={24} /> : <Plus size={24} />)}
                  {isSubmitting ? (editingProject ? 'Updating...' : 'Creating...') : (editingProject ? 'Save Changes' : 'Forge Project')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, projectId: null })}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message="Are you sure you want to delete this project? All associated features and chats will be permanently removed. This action cannot be undone."
        confirmText="Delete Project"
        type="danger"
      />
    </div>
  );
}

function ProjectCard({ project, onSelect, onToggleFavorite, onArchive, onDuplicate, onEdit, onDelete }: { 
  project: Project; 
  onSelect: (p: Project) => void;
  onToggleFavorite: (e: React.MouseEvent, p: Project) => void;
  onArchive: (id: string) => void;
  onDuplicate: (p: Project) => void;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
}) {
  const [showOptions, setShowOptions] = useState(false);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0], [0, 1]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x < -100) {
      onArchive(project.id);
    }
  };

  return (
    <div className="relative">
      {/* Archive Background Action */}
      <div className="absolute inset-0 bg-red-500/20 rounded-[24px] flex items-center justify-end px-6 text-red-400">
        <Archive size={24} />
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        onDragEnd={handleDragEnd}
        style={{ x, opacity }}
        onClick={() => onSelect(project)}
        className="relative p-4 lg:p-6 rounded-[24px] bg-[#141414] border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group shadow-xl"
      >
        <div className="flex items-start justify-between mb-3">
          <div className={cn(
            "px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest border",
            project.status === 'Active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
            project.status === 'Draft' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
            "bg-white/5 text-gray-500 border-white/10"
          )}>
            {project.status || 'Draft'}
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => onToggleFavorite(e, project)}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                project.isFavorite ? "text-amber-400 bg-amber-400/10" : "text-gray-600 hover:text-white hover:bg-white/5"
              )}
            >
              <Star size={16} fill={project.isFavorite ? "currentColor" : "none"} />
            </button>
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptions(!showOptions);
                }}
                className="p-1.5 text-gray-600 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <Plus size={16} className={cn("transition-transform", showOptions && "rotate-45")} />
              </button>
              
              <AnimatePresence>
                {showOptions && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowOptions(false);
                      }} 
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-40 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(project);
                          setShowOptions(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <Search size={14} />
                        Edit Details
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicate(project);
                          setShowOptions(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <Plus size={14} />
                        Duplicate
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchive(project.id);
                          setShowOptions(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <Archive size={14} />
                        Archive
                      </button>
                      {project.name !== 'FlowForge AI' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(project.id);
                            setShowOptions(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <h3 className="text-base lg:text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors truncate">
          {project.name}
        </h3>
        <p className="text-gray-500 text-[10px] lg:text-xs line-clamp-2 mb-4 h-8">
          {project.description || 'No description provided.'}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-[8px] lg:text-[10px] text-gray-600">
              <Clock size={10} />
              <span>{formatDistanceToNow(new Date(project.updatedAt || project.createdAt))} ago</span>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onSelect(project);
            }}
            className="p-2 bg-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-indigo-600 transition-all"
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
