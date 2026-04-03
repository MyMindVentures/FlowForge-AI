import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Clock, MessageSquare, Bot, X, Save, Loader2, Sparkles, Lock, Unlock, Terminal, FileText, Layout as LayoutIcon, History, Image as ImageIcon } from 'lucide-react';
import { doc, updateDoc, orderBy, where, limit } from '../lib/db/supabaseData';
import { db } from '../lib/supabase/appClient';
import { Project, Feature, Comment } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { cn, resizeBase64Image } from '../lib/utils';
import { useToast } from './Toast';
import ConfirmModal from './ConfirmModal';
import { useSupabaseCollection } from '../hooks/useSupabaseCollection';
import { handleDataOperationError, DataOperationType } from '../lib/databaseErrorHandler';
import { AgentOrchestrator, AgentTaskType } from '../services/ai/orchestrator';
import { AuditService, AuditAction } from '../services/audit';

import FeatureVisuals from './feature/FeatureVisuals';
import FeatureUIArchitecture from './feature/FeatureUIArchitecture';
import FeatureAudit from './feature/FeatureAudit';
import FeatureDiscussion from './feature/FeatureDiscussion';
import FeatureOverview from './feature/FeatureOverview';
import FeatureConcept from './feature/FeatureConcept';
import FeatureBuilderBrief from './feature/FeatureBuilderBrief';
import FeaturePrompts from './feature/FeaturePrompts';

import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';

interface FeatureDetailProps {
  project: Project;
  feature: Feature;
  onBack: () => void;
  onOpenChat?: () => void;
}

type TabType = 'overview' | 'concept' | 'builder' | 'prompts' | 'discussion' | 'audit' | 'visuals' | 'ui_architecture';

export default function FeatureDetail({ project, feature, onBack, onOpenChat }: FeatureDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { pages, components, layouts } = useProject();
  const { user, profile } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [commentSummary, setCommentSummary] = useState('');
  const [commentFilter, setCommentFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [commentRole, setCommentRole] = useState<'Architect' | 'Builder'>('Architect');
  const [commentType, setCommentType] = useState<'Question' | 'Decision' | 'Definition'>('Question');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFeature, setEditedFeature] = useState(feature);
  const [isSaving, setIsSaving] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const { showToast } = useToast();

  const { data: comments, add: addComment, update: updateComment } = useSupabaseCollection<Comment>(
    project.id && feature.id ? `projects/${project.id}/features/${feature.id}/comments` : null,
    [orderBy('createdAt', 'asc')]
  );

  const { data: auditLogs } = useSupabaseCollection<any>(
    project.id && feature.id ? `projects/${project.id}/audit_logs` : null,
    [where('featureId', '==', feature.id), orderBy('timestamp', 'desc'), limit(50)]
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
      }).catch(e => handleDataOperationError(e, DataOperationType.UPDATE, `projects/${project.id}/features/${feature.id}`));
      
      await AuditService.log(AuditAction.FEATURE_UPDATED, { 
        field: 'status', 
        from: feature.status, 
        to: newStatus,
        featureTitle: feature.title 
      }, project.id, feature.id);

      showToast(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleToggleLock = async () => {
    try {
      const featureRef = doc(db, 'projects', project.id, 'features', feature.id);
      await updateDoc(featureRef, {
        isLocked: !feature.isLocked,
        updatedAt: new Date().toISOString(),
      }).catch(e => handleDataOperationError(e, DataOperationType.UPDATE, `projects/${project.id}/features/${feature.id}`));
      
      await AuditService.log(
        feature.isLocked ? AuditAction.FEATURE_UNLOCKED : AuditAction.FEATURE_LOCKED,
        { featureTitle: feature.title },
        project.id,
        feature.id
      );

      showToast(feature.isLocked ? 'Feature unlocked' : 'Feature locked');
    } catch (error) {
      showToast('Failed to toggle lock', 'error');
    }
  };

  const handleArchive = async () => {
    try {
      const featureRef = doc(db, 'projects', project.id, 'features', feature.id);
      await updateDoc(featureRef, {
        archived: true,
        updatedAt: new Date().toISOString(),
      }).catch(e => handleDataOperationError(e, DataOperationType.UPDATE, `projects/${project.id}/features/${feature.id}`));
      
      await AuditService.log(AuditAction.FEATURE_ARCHIVED, { featureTitle: feature.title }, project.id, feature.id);

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
        category: editedFeature.category,
        epic: editedFeature.epic,
        release: editedFeature.release,
        persona: editedFeature.persona,
        jobsToBeDone: editedFeature.jobsToBeDone,
        acceptanceCriteria: editedFeature.acceptanceCriteria,
        successMetrics: editedFeature.successMetrics,
        nonFunctionalRequirements: editedFeature.nonFunctionalRequirements,
        dependencies: editedFeature.dependencies,
        assumptions: editedFeature.assumptions,
        risks: editedFeature.risks,
        notes: editedFeature.notes,
        figmaLink: editedFeature.figmaLink,
        specLink: editedFeature.specLink,
        conceptThinker: editedFeature.conceptThinker,
        builderBrief: editedFeature.builderBrief,
        codingPrompt: editedFeature.codingPrompt,
        uiDesignPrompt: editedFeature.uiDesignPrompt,
        updatedAt: new Date().toISOString(),
      }).catch(e => handleDataOperationError(e, DataOperationType.UPDATE, `projects/${project.id}/features/${feature.id}`));
      
      await AuditService.log(AuditAction.FEATURE_UPDATED, { 
        type: 'MANUAL_EDIT',
        featureTitle: editedFeature.title 
      }, project.id, feature.id);

      setIsEditing(false);
      showToast('Feature card updated');
    } catch (error) {
      console.error('Error updating feature:', error);
      showToast('Failed to update feature', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAI = async (task: AgentTaskType, field: keyof Feature) => {
    if (feature.isLocked) {
      showToast('Feature is locked. Unlock to regenerate.', 'info');
      return;
    }
    setIsGenerating(field as string);
    try {
      const result = await AgentOrchestrator.runTask(task, { feature, project });
      const featureRef = doc(db, 'projects', project.id, 'features', feature.id);
      await updateDoc(featureRef, {
        [field]: result,
        updatedAt: new Date().toISOString(),
      }).catch(e => handleDataOperationError(e, DataOperationType.UPDATE, `projects/${project.id}/features/${feature.id}`));
      
      await AuditService.log(AuditAction.AI_GENERATION, { 
        task, 
        field,
        featureTitle: feature.title 
      }, project.id, feature.id);

      showToast(`${field} generated successfully!`, 'success');
    } catch (error) {
      showToast(`Failed to generate ${field}`, 'error');
    } finally {
      setIsGenerating(null);
    }
  };

  const handleGenerateVisual = async () => {
    if (feature.isLocked) {
      showToast('Feature is locked. Unlock to regenerate.', 'info');
      return;
    }
    setIsGenerating('visual');
    try {
      // 1. Generate prompt
      const visualPrompt = await AgentOrchestrator.runTask(AgentTaskType.GENERATE_VISUAL_PROMPT, { feature, project });
      
      // 2. Generate image
      const visualUrl = await AgentOrchestrator.runTask(AgentTaskType.GENERATE_FEATURE_VISUAL, { prompt: visualPrompt, projectId: project.id });
      
      if (visualUrl) {
        // Resize image to stay within Firestore 1MB limit
        const resizedUrl = await resizeBase64Image(visualUrl);
        
        // 3. Update feature
        const featureRef = doc(db, 'projects', project.id, 'features', feature.id);
        await updateDoc(featureRef, {
          visualUrl: resizedUrl,
          visualPrompt,
          updatedAt: new Date().toISOString(),
        }).catch(e => handleDataOperationError(e, DataOperationType.UPDATE, `projects/${project.id}/features/${feature.id}`));
      }
      
      await AuditService.log(AuditAction.AI_GENERATION, { 
        task: 'GENERATE_FEATURE_VISUAL', 
        field: 'visualUrl',
        featureTitle: feature.title 
      }, project.id, feature.id);

      showToast('Visual representation generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating visual:', error);
      showToast('Failed to generate visual', 'error');
    } finally {
      setIsGenerating(null);
    }
  };

  const handleAnalyzeUIImpact = async () => {
    if (feature.isLocked) {
      showToast('Feature is locked. Unlock to analyze.', 'info');
      return;
    }
    setIsGenerating('uiImpactAnalysis');
    try {
      const result = await AgentOrchestrator.runTask(AgentTaskType.ANALYZE_UI_IMPACT, { 
        feature, 
        project,
        currentArchitecture: { pages: [], components: [], layouts: [] } 
      });
      
      const featureRef = doc(db, 'projects', project.id, 'features', feature.id);
      await updateDoc(featureRef, {
        uiImpact: result,
        updatedAt: new Date().toISOString(),
      }).catch(e => handleDataOperationError(e, DataOperationType.UPDATE, `projects/${project.id}/features/${feature.id}`));
      
      await AuditService.log(AuditAction.AI_GENERATION, { 
        task: 'ANALYZE_UI_IMPACT', 
        field: 'uiImpact',
        featureTitle: feature.title 
      }, project.id, feature.id);

      showToast('UI Impact Analysis completed!', 'success');
    } catch (error) {
      showToast('Failed to analyze UI impact', 'error');
    } finally {
      setIsGenerating(null);
    }
  };

  const onUpdateFeature = async (updates: Partial<Feature>) => {
    try {
      const featureRef = doc(db, 'projects', project.id, 'features', feature.id);
      await updateDoc(featureRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      }).catch(e => handleDataOperationError(e, DataOperationType.UPDATE, `projects/${project.id}/features/${feature.id}`));
      
      await AuditService.log(AuditAction.FEATURE_UPDATED, { 
        featureTitle: feature.title,
        updates: Object.keys(updates).join(', ')
      }, project.id, feature.id);
    } catch (error) {
      console.error('Error updating feature:', error);
      showToast('Failed to update feature', 'error');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const authorName = profile?.displayName || user?.displayName || commentRole;

      await addComment({
        featureId: feature.id,
        authorRole: commentRole,
        authorName,
        summary: commentSummary.trim() || `${commentType}: ${newComment.trim().slice(0, 72)}`,
        content: newComment.trim(),
        type: commentType,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setNewComment('');
      setCommentSummary('');
    } catch (error) {
      console.error('Error adding comment:', error);
      showToast('Failed to add comment', 'error');
    }
  };

  const handleUpdateCommentStatus = async (commentId: string, status: 'open' | 'resolved') => {
    try {
      await updateComment(commentId, {
        status,
        resolvedAt: status === 'resolved' ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      } as Partial<Comment>);

      await AuditService.log(AuditAction.FEATURE_UPDATED, {
        type: 'COMMENT_STATUS',
        featureTitle: feature.title,
        commentId,
        status,
      }, project.id, feature.id);

      showToast(status === 'resolved' ? 'Comment resolved' : 'Comment reopened');
    } catch (error) {
      console.error('Error updating comment status:', error);
      showToast('Failed to update comment status', 'error');
    }
  };

  const handleCopy = (text: string | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
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
                <h2 className="text-base lg:text-xl font-bold text-white tracking-tight truncate flex items-center gap-2">
                  {feature.title}
                  {feature.isLocked && <Lock size={14} className="text-amber-500" />}
                </h2>
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
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
          <button
            onClick={handleToggleLock}
            className={cn(
              "p-2 rounded-lg transition-all border",
              feature.isLocked ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent"
            )}
            title={feature.isLocked ? "Unlock Feature" : "Lock Feature"}
          >
            {feature.isLocked ? <Lock size={18} /> : <Unlock size={18} />}
          </button>
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

      {/* Tabs Navigation */}
      <div className="bg-[#0f0f0f] border-b border-white/5 px-4 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutIcon },
            { id: 'concept', label: 'Concept Thinker', icon: FileText },
            { id: 'builder', label: 'Builder Brief', icon: Bot },
            { id: 'prompts', label: 'Prompts', icon: Terminal },
            { id: 'discussion', label: 'Discussion', icon: MessageSquare },
            { id: 'visuals', label: 'Visuals', icon: ImageIcon },
            { id: 'ui_architecture', label: 'UI Architecture', icon: LayoutIcon },
            { id: 'audit', label: 'Audit', icon: History }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === tab.id ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-8 max-w-6xl mx-auto w-full">
        {activeTab === 'overview' && (
          <FeatureOverview
            project={project}
            feature={feature}
            isEditing={isEditing}
            editedFeature={editedFeature}
            setEditedFeature={setEditedFeature}
            isUpdatingStatus={isUpdatingStatus}
            onUpdateStatus={handleUpdateStatus}
            onArchive={() => setArchiveModalOpen(true)}
            isAnalyzing={isGenerating === 'uiImpactAnalysis'}
            onAnalyzeUIImpact={handleAnalyzeUIImpact}
          />
        )}

        {activeTab === 'concept' && (
          <FeatureConcept
            feature={feature}
            isGenerating={isGenerating}
            onGenerateAI={handleGenerateAI}
          />
        )}

        {activeTab === 'builder' && (
          <FeatureBuilderBrief
            feature={feature}
            isGenerating={isGenerating}
            onGenerateAI={handleGenerateAI}
          />
        )}

        {activeTab === 'prompts' && (
          <FeaturePrompts
            feature={feature}
            isGenerating={isGenerating}
            onGenerateAI={handleGenerateAI}
            onCopy={handleCopy}
          />
        )}

        {activeTab === 'discussion' && (
          <FeatureDiscussion
            comments={comments}
            newComment={newComment}
            setNewComment={setNewComment}
            commentSummary={commentSummary}
            setCommentSummary={setCommentSummary}
            commentFilter={commentFilter}
            setCommentFilter={setCommentFilter}
            commentRole={commentRole}
            setCommentRole={setCommentRole}
            commentType={commentType}
            setCommentType={setCommentType}
            onAddComment={handleAddComment}
            onUpdateCommentStatus={handleUpdateCommentStatus}
          />
        )}

        {activeTab === 'visuals' && (
          <FeatureVisuals project={project} feature={feature} />
        )}

        {activeTab === 'ui_architecture' && (
          <FeatureUIArchitecture 
            feature={feature} 
            pages={pages}
            components={components}
            layouts={layouts}
            onUpdateFeature={onUpdateFeature} 
          />
        )}

        {activeTab === 'audit' && (
          <FeatureAudit auditLogs={auditLogs} />
        )}
      </div>

      <ConfirmModal
        isOpen={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        onConfirm={handleArchive}
        title="Archive Feature Card"
        message="Are you sure you want to archive this feature card? It will be moved to the archive and hidden from the main backlog."
        confirmText="Archive Feature"
        type="danger"
      />
    </div>
  );
}


