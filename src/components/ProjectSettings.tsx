import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Save, Shield, Eye, Globe, Zap, Github, Plus, Trash2, Check, Loader2, Users, Mail, UserPlus } from 'lucide-react';
import { Project, ProjectMember, GitHubRepo, UserRole } from '../types';
import { useToast } from './Toast';
import { cn } from '../lib/utils';
import { collection, addDoc } from '../lib/db/supabaseData';
import { db, auth } from '../lib/supabase/appClient';
import { AuditService, AuditAction } from '../services/audit';

interface ProjectSettingsProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => Promise<void>;
  onBack: () => void;
}

export default function ProjectSettings({ project, onUpdate, onBack }: ProjectSettingsProps) {
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || '',
    status: project.status,
    members: project.members || [],
    repositories: project.repositories || []
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'dirty' | 'saving' | 'success' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const { showToast } = useToast();

  const user = auth.currentUser;
  const isOwner = project.ownerId === user?.uid;
  const isAdmin = user?.email === 'lacometta33@gmail.com';
  const canEdit = isOwner || isAdmin;

  // Audit Log Helper
  const logChange = useCallback(async (action: AuditAction | string, details: any) => {
    await AuditService.log(action, details, project.id);
  }, [project.id]);

  // Check for changes
  useEffect(() => {
    const hasChanges = 
      formData.name !== project.name ||
      formData.description !== project.description ||
      formData.status !== project.status ||
      JSON.stringify(formData.members) !== JSON.stringify(project.members) ||
      JSON.stringify(formData.repositories) !== JSON.stringify(project.repositories);

    if (hasChanges && saveStatus === 'idle') {
      setSaveStatus('dirty');
    } else if (!hasChanges && saveStatus === 'dirty') {
      setSaveStatus('idle');
    }
  }, [formData, project, saveStatus]);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="p-12 max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <Shield className="text-red-400" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
        <p className="text-gray-400 mb-8">You do not have permission to modify the settings for this project. Only the project owner or an administrator can make changes.</p>
        <button 
          onClick={onBack}
          className="px-8 py-3 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-all"
        >
          Return to Workspace
        </button>
      </div>
    );
  }

  const handleSave = async () => {
    if (saveStatus !== 'dirty') return;

    // Validation
    if (!formData.name.trim()) {
      showToast('Project name is required', 'error');
      setSaveStatus('error');
      return;
    }

    // Permission check (only owner or admin can edit)
    const user = auth.currentUser;
    const isOwner = project.ownerId === user?.uid;
    const isAdmin = user?.email === 'lacometta33@gmail.com'; // Simple admin check for now

    if (!isOwner && !isAdmin) {
      showToast('You do not have permission to edit this project', 'error');
      setSaveStatus('error');
      return;
    }
    
    setSaveStatus('saving');
    try {
      const user = auth.currentUser;
      const metadata = {
        lastModifiedBy: {
          uid: user?.uid || 'unknown',
          email: user?.email || 'unknown',
          displayName: user?.displayName || undefined,
          timestamp: new Date().toISOString(),
          action: 'Project settings updated'
        }
      };

      await onUpdate({ ...formData, ...metadata });
      setLastSaved(new Date());
      setSaveStatus('success');
      showToast('Settings saved successfully', 'success');
      
      // Log important changes
      if (formData.status !== project.status) {
        logChange(AuditAction.PROJECT_UPDATED, { field: 'status', from: project.status, to: formData.status });
      }

      // Reset to idle after a delay
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('error');
      showToast('Failed to save changes', 'error');
    }
  };

  const handleReset = () => {
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      members: project.members || [],
      repositories: project.repositories || []
    });
    setSaveStatus('idle');
    showToast('Changes discarded', 'info');
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    
    const newMember: ProjectMember = {
      uid: Math.random().toString(36).substr(2, 9), // Mock UID for now
      email: newMemberEmail,
      role: 'Builder',
      joinedAt: new Date().toISOString()
    };

    setFormData(prev => ({
      ...prev,
      members: [...prev.members, newMember]
    }));
    setNewMemberEmail('');
    logChange(AuditAction.MEMBER_ADDED, { email: newMemberEmail });
  };

  const handleRemoveMember = (uid: string) => {
    const member = formData.members.find(m => m.uid === uid);
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter(m => m.uid !== uid)
    }));
    logChange(AuditAction.MEMBER_REMOVED, { email: member?.email });
  };

  const handleAddRepo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoUrl.trim()) return;

    const repoName = newRepoUrl.split('/').pop() || 'New Repo';
    const newRepo: GitHubRepo = {
      id: Math.random().toString(36).substr(2, 9),
      name: repoName,
      url: newRepoUrl,
      defaultBranch: 'main',
      isConnected: true
    };

    setFormData(prev => ({
      ...prev,
      repositories: [...prev.repositories, newRepo]
    }));
    setNewRepoUrl('');
    logChange(AuditAction.REPO_ADDED, { url: newRepoUrl });
  };

  return (
    <div className="p-4 lg:p-12 max-w-5xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-bold text-white tracking-tight">Project Settings</h2>
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 size={12} className="animate-spin text-indigo-400" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Saving...</span>
                </>
              ) : saveStatus === 'success' ? (
                <>
                  <Check size={12} className="text-emerald-400" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Saved</span>
                </>
              ) : saveStatus === 'dirty' ? (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Unsaved Changes</span>
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Error Saving</span>
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Up to date</span>
                </>
              )}
            </div>
          </div>
          <p className="text-gray-400">Manage configuration, team, and repository connections for {project.name}</p>
          {project.lastModifiedBy && (
            <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
              Last modified by <span className="text-indigo-400">{project.lastModifiedBy.email}</span> 
              at {new Date(project.lastModifiedBy.timestamp).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleReset}
            disabled={saveStatus === 'idle' || saveStatus === 'saving'}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Discard
          </button>
          <button 
            onClick={handleSave}
            disabled={saveStatus !== 'dirty'}
            className={cn(
              "px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-xl active:scale-95 disabled:scale-100 disabled:opacity-30 disabled:cursor-not-allowed",
              saveStatus === 'dirty' 
                ? "bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-500" 
                : "bg-white/5 text-gray-500 border border-white/10"
            )}
          >
            {saveStatus === 'saving' ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Save Changes
          </button>
          <div className="w-px h-8 bg-white/10 mx-2" />
          <button 
            onClick={onBack}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: General & Status */}
        <div className="lg:col-span-2 space-y-8">
          <section className="p-8 rounded-[32px] bg-[#141414] border border-white/5">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Shield className="text-indigo-400" size={20} />
              </div>
              <h3 className="text-xl font-bold text-white">General Information</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Project Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all text-lg font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Project Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all resize-none leading-relaxed"
                  placeholder="Describe the purpose and goals of this project..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Project Status</label>
                <div className="flex flex-wrap gap-2">
                  {['Draft', 'Active', 'Archived'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFormData(prev => ({ ...prev, status: status as any }))}
                      className={cn(
                        "px-6 py-3 rounded-xl text-sm font-bold transition-all border",
                        formData.status === status 
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                          : "bg-white/5 border-white/10 text-gray-500 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Repository Section */}
          <section className="p-8 rounded-[32px] bg-[#141414] border border-white/5">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-500/10 flex items-center justify-center">
                  <Github className="text-gray-400" size={20} />
                </div>
                <h3 className="text-xl font-bold text-white">Repositories</h3>
              </div>
            </div>

            <div className="space-y-4">
              <form onSubmit={handleAddRepo} className="flex gap-3 mb-6">
                <input 
                  type="url" 
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                />
                <button 
                  type="submit"
                  className="px-6 py-3 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  <Plus size={20} />
                  Connect
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.repositories.map(repo => (
                  <div key={repo.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-white">{repo.name}</p>
                        <input 
                          type="text"
                          value={repo.defaultBranch}
                          onChange={(e) => {
                            const newRepos = formData.repositories.map(r => 
                              r.id === repo.id ? { ...r, defaultBranch: e.target.value } : r
                            );
                            setFormData(prev => ({ ...prev, repositories: newRepos }));
                          }}
                          className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[10px] font-bold text-indigo-400 focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Connected</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setFormData(prev => ({ ...prev, repositories: prev.repositories.filter(r => r.id !== repo.id) }))}
                      className="p-2 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Team Members */}
        <div className="space-y-8">
          <section className="p-8 rounded-[32px] bg-[#141414] border border-white/5">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Users className="text-amber-400" size={20} />
              </div>
              <h3 className="text-xl font-bold text-white">Team Members</h3>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4 mb-8">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="email" 
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Invite by email..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                <UserPlus size={20} />
                Invite Member
              </button>
            </form>

            <div className="space-y-3">
              {formData.members.map(member => (
                <div key={member.uid} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold">
                      {member.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white truncate max-w-[120px]">{member.email}</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{member.role}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveMember(member.uid)}
                    className="p-2 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Danger Zone */}
          <section className="p-8 rounded-[32px] bg-red-500/5 border border-red-500/10">
            <h3 className="text-lg font-bold text-red-400 mb-4">Danger Zone</h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Once you delete a project, there is no going back. Please be certain.
            </p>
            <button className="w-full py-4 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl font-bold transition-all">
              Delete Project
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}


