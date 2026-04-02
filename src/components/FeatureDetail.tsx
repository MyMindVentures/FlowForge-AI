import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, CheckCircle2, Clock, MessageSquare, User, Bot, Send, Tag, Archive, Check, X, Save, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Project, Feature, Comment } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { useToast } from './Toast';
import ConfirmModal from './ConfirmModal';
import { useFirestore } from '../hooks/useFirestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface FeatureDetailProps {
  project: Project;
  feature: Feature;
  onBack: () => void;
  onOpenChat?: () => void;
}

export default function FeatureDetail({ project, feature, onBack, onOpenChat }: FeatureDetailProps) {
  const [newComment, setNewComment] = useState('');
  const [commentRole, setCommentRole] = useState<'Architect' | 'Builder'>('Architect');
  const [commentType, setCommentType] = useState<'Question' | 'Decision' | 'Definition'>('Question');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFeature, setEditedFeature] = useState(feature);
  const [isSaving, setIsSaving] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);

  const { showToast } = useToast();

  const { data: comments, add: addComment } = useFirestore<Comment>(
    project.id && feature.id ? `projects/${project.id}/features/${feature.id}/comments` : null,
    [orderBy('createdAt', 'asc')]
  );

  // Sync editedFeature with feature prop when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditedFeature(feature);
    }
  }, [feature, isEditing]);

  const handleUpdateStatus = async (newStatus: Feature['status']) => {
    if (feature.status === newStatus) return;
    setIsUpdatingStatus(true);
    try {
      const featureRef = doc(db, 'projects', project.id, 'features', feature.id);
      await updateDoc(featureRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `projects/${project.id}/features/${feature.id}`));
      showToast(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleArchive = async () => {
    try {
      const featureRef = doc(db, 'projects', project.id, 'features', feature.id);
      await updateDoc(featureRef, {
        archived: true,
        updatedAt: new Date().toISOString(),
      }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `projects/${project.id}/features/${feature.id}`));
      showToast('Feature card archived');
      onBack();
    } catch (error) {
      console.error('Error archiving feature:', error);
      showToast('Failed to archive feature', 'error');
    }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const featureRef = doc(db, 'projects', project.id, 'features', feature.id);
      await updateDoc(featureRef, {
        title: editedFeature.title,
        priority: editedFeature.priority,
        problem: editedFeature.problem,
        solution: editedFeature.solution,
        why: editedFeature.why,
        nonTechnicalDescription: editedFeature.nonTechnicalDescription,
        technicalDescription: editedFeature.technicalDescription,
        updatedAt: new Date().toISOString(),
      }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `projects/${project.id}/features/${feature.id}`));
      setIsEditing(false);
      showToast('Feature card updated');
    } catch (error) {
      console.error('Error updating feature:', error);
      showToast('Failed to update feature', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await addComment({
        featureId: feature.id,
        authorRole: commentRole,
        content: newComment.trim(),
        type: commentType,
        createdAt: new Date().toISOString(),
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      showToast('Failed to add comment', 'error');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <header className="p-4 lg:p-6 border-b border-white/10 bg-[#0f0f0f] flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3 lg:gap-6 min-w-0">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-3 mb-1">
              <span className="text-[10px] lg:text-xs font-mono font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded border border-indigo-400/20 w-fit">
                {feature.featureCode}
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={editedFeature.title}
                  onChange={(e) => setEditedFeature({ ...editedFeature, title: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white font-bold text-base lg:text-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              ) : (
                <h2 className="text-base lg:text-xl font-bold text-white tracking-tight truncate">{feature.title}</h2>
              )}
            </div>
            <div className="flex items-center gap-3 lg:gap-4 text-[10px] lg:text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border",
                  feature.priority === 'Critical' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                  feature.priority === 'High' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                  feature.priority === 'Medium' ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" :
                  "bg-gray-500/10 text-gray-500 border-gray-500/20"
                )}>
                  {feature.priority}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span className="truncate">Updated {formatDistanceToNow(new Date(feature.updatedAt))} ago</span>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <Tag size={12} />
                <span className="truncate">{project.name}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border border-indigo-500/20"
            >
              <Sparkles size={16} />
              <span className="hidden sm:inline">AI Chat</span>
            </button>
          )}
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span className="hidden sm:inline">Save</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setEditedFeature(feature);
                setIsEditing(true);
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <Edit2 size={18} />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-8 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          {/* Top Status Section */}
          <section className="p-4 lg:p-6 rounded-2xl lg:rounded-3xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Current Status</h4>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2.5 h-2.5 lg:w-3 h-3 rounded-full",
                  feature.status === 'Pending' ? "bg-amber-500" :
                  feature.status === 'In Progress' ? "bg-indigo-500" :
                  "bg-green-500"
                )} />
                <span className="text-lg lg:text-xl font-bold text-white">{feature.status}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-[#1a1a1a] border border-white/10 rounded-lg p-1 w-full sm:w-auto overflow-x-auto no-scrollbar">
              {['Pending', 'In Progress', 'Completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(status as Feature['status'])}
                  disabled={isUpdatingStatus}
                  className={cn(
                    "flex-1 sm:flex-none px-3 py-1.5 text-[10px] lg:text-xs font-bold rounded-md transition-all whitespace-nowrap",
                    feature.status === status 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                      : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </section>

          {/* Problem & Solution Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="p-6 lg:p-8 rounded-2xl lg:rounded-3xl bg-[#141414] border border-white/5 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                  <AlertCircle size={20} />
                </div>
                <h3 className="text-base lg:text-lg font-bold text-white uppercase tracking-widest">The Problem</h3>
              </div>
              {isEditing ? (
                <textarea
                  value={editedFeature.problem}
                  onChange={(e) => setEditedFeature({ ...editedFeature, problem: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-gray-200 leading-relaxed text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-32 resize-none"
                />
              ) : (
                <p className="text-gray-200 leading-relaxed text-sm lg:text-base">{feature.problem}</p>
              )}
            </section>

            <section className="p-6 lg:p-8 rounded-2xl lg:rounded-3xl bg-[#141414] border border-white/5 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="text-base lg:text-lg font-bold text-white uppercase tracking-widest">The Solution</h3>
              </div>
              {isEditing ? (
                <textarea
                  value={editedFeature.solution}
                  onChange={(e) => setEditedFeature({ ...editedFeature, solution: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-gray-200 leading-relaxed text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-32 resize-none"
                />
              ) : (
                <p className="text-gray-200 leading-relaxed text-sm lg:text-base">{feature.solution}</p>
              )}
            </section>
          </div>

          {/* Why Section */}
          <section className="p-6 lg:p-8 rounded-2xl lg:rounded-3xl bg-[#141414] border border-white/5 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Sparkles size={20} />
              </div>
              <h3 className="text-base lg:text-lg font-bold text-white uppercase tracking-widest">The Why</h3>
            </div>
            {isEditing ? (
              <textarea
                value={editedFeature.why}
                onChange={(e) => setEditedFeature({ ...editedFeature, why: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-gray-200 leading-relaxed text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-32 resize-none"
              />
            ) : (
              <p className="text-gray-200 leading-relaxed text-sm lg:text-base">{feature.why}</p>
            )}
          </section>

          {/* Descriptions Section */}
          <div className="space-y-6">
            <section className="p-6 lg:p-8 rounded-2xl lg:rounded-3xl bg-[#141414] border border-white/5 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <User size={20} />
                </div>
                <h3 className="text-base lg:text-lg font-bold text-white uppercase tracking-widest">Non-Technical Description</h3>
              </div>
              {isEditing ? (
                <textarea
                  value={editedFeature.nonTechnicalDescription}
                  onChange={(e) => setEditedFeature({ ...editedFeature, nonTechnicalDescription: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-gray-200 leading-relaxed text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-32 resize-none"
                />
              ) : (
                <p className="text-gray-200 leading-relaxed text-sm lg:text-base">{feature.nonTechnicalDescription}</p>
              )}
            </section>

            <section className="p-6 lg:p-8 rounded-2xl lg:rounded-3xl bg-[#141414] border border-white/5 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                  <Bot size={20} />
                </div>
                <h3 className="text-base lg:text-lg font-bold text-white uppercase tracking-widest">Technical Description</h3>
              </div>
              {isEditing ? (
                <textarea
                  value={editedFeature.technicalDescription}
                  onChange={(e) => setEditedFeature({ ...editedFeature, technicalDescription: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-gray-200 leading-relaxed text-sm lg:text-base font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-64 resize-none"
                />
              ) : (
                <p className="text-gray-200 leading-relaxed text-sm lg:text-base font-mono whitespace-pre-wrap">{feature.technicalDescription}</p>
              )}
            </section>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 pt-8 border-t border-white/5">
            <button
              onClick={onBack}
              className="text-gray-500 hover:text-white text-sm font-medium transition-colors text-center sm:text-left"
            >
              Back to Feature List
            </button>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button 
                onClick={() => setArchiveModalOpen(true)}
                className="flex items-center justify-center gap-2 text-gray-500 hover:text-red-400 text-sm font-medium transition-colors py-2"
              >
                <Archive size={18} />
                Archive
              </button>
              <button
                onClick={() => handleUpdateStatus('Completed')}
                disabled={feature.status === 'Completed'}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 lg:py-2 rounded-xl font-bold transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={18} />
                Mark as Completed
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar / Comments */}
        <div className="space-y-6">
          <div className="p-4 lg:p-6 rounded-2xl lg:rounded-3xl bg-[#0f0f0f] border border-white/5 h-[500px] lg:h-[calc(100vh-12rem)] flex flex-col shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare size={18} className="text-indigo-400" />
              <h3 className="font-bold text-white">Discussion</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-6 scrollbar-thin scrollbar-thumb-white/10">
              {comments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <MessageSquare size={40} className="mb-2" />
                  <p className="text-xs">No discussion yet.</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-5 h-5 rounded flex items-center justify-center",
                          comment.authorRole === 'Architect' ? "bg-indigo-500/20 text-indigo-400" : "bg-amber-500/20 text-amber-400"
                        )}>
                          {comment.authorRole === 'Architect' ? <User size={12} /> : <Bot size={12} />}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{comment.authorRole}</span>
                      </div>
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                        comment.type === 'Question' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        comment.type === 'Decision' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                        "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      )}>
                        {comment.type}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-sm text-gray-300 leading-relaxed">
                      {comment.content}
                    </div>
                    <p className="text-[9px] text-gray-600 text-right">{formatDistanceToNow(new Date(comment.createdAt))} ago</p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex items-center gap-2">
                <select
                  value={commentRole}
                  onChange={(e) => setCommentRole(e.target.value as any)}
                  className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider focus:outline-none"
                >
                  <option value="Architect">Architect</option>
                  <option value="Builder">Builder</option>
                </select>
                <select
                  value={commentType}
                  onChange={(e) => setCommentType(e.target.value as any)}
                  className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider focus:outline-none"
                >
                  <option value="Question">Question</option>
                  <option value="Decision">Decision</option>
                  <option value="Definition">Definition</option>
                </select>
              </div>
              <form onSubmit={handleAddComment} className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-24 resize-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="absolute right-2 bottom-2 p-2 text-indigo-400 hover:text-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        onConfirm={handleArchive}
        title="Archive Feature Card"
        message="Are you sure you want to archive this feature card? It will be moved to the archive and hidden from the main backlog."
        confirmText="Archive Feature"
        type="warning"
      />
    </div>
  );
}
