import React, { useState } from 'react';
import { Image as ImageIcon, Loader2, Sparkles, Maximize2, RefreshCw, Terminal } from 'lucide-react';
import { doc, updateDoc } from '../../lib/db/supabaseData';
import { db } from '../../lib/supabase/appClient';
import { Project, Feature } from '../../types';
import { cn, resizeBase64Image } from '../../lib/utils';
import { useToast } from '../Toast';
import { handleDataOperationError, DataOperationType } from '../../lib/databaseErrorHandler';
import { AgentOrchestrator, AgentTaskType } from '../../services/ai/orchestrator';
import { AuditService, AuditAction } from '../../services/audit';

interface FeatureVisualsProps {
  project: Project;
  feature: Feature;
}

export default function FeatureVisuals({ project, feature }: FeatureVisualsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { showToast } = useToast();

  const handleGenerateVisual = async () => {
    if (feature.isLocked) {
      showToast('Feature is locked. Unlock to regenerate.', 'info');
      return;
    }
    setIsGenerating(true);
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
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <ImageIcon size={24} className="text-indigo-400" />
            Visual Representation
          </h3>
          <p className="text-sm text-gray-500 mt-1">AI-generated visual interpretation of this feature's core concept.</p>
        </div>
        <button
          onClick={handleGenerateVisual}
          disabled={isGenerating || feature.isLocked}
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg",
            feature.visualUrl 
              ? "bg-white/5 text-white hover:bg-white/10 border border-white/10" 
              : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              {feature.visualUrl ? 'Regenerate Visual' : 'Generate Visual'}
            </>
          )}
        </button>
      </div>

      {feature.visualUrl ? (
        <div className="space-y-6">
          <div className="relative group rounded-3xl overflow-hidden border border-white/10 bg-[#141414] shadow-2xl aspect-video">
            <img 
              src={feature.visualUrl} 
              alt={feature.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8 gap-3">
              <button 
                onClick={() => window.open(feature.visualUrl, '_blank')}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold border border-white/20 transition-all flex items-center gap-2"
              >
                <Maximize2 size={14} />
                View Full Size
              </button>
              <button 
                onClick={handleGenerateVisual}
                disabled={isGenerating || feature.isLocked}
                className="bg-indigo-600/80 hover:bg-indigo-600 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold border border-white/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                Regenerate
              </button>
            </div>
          </div>

          {feature.visualPrompt && (
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Terminal size={12} />
                Generation Prompt
              </h4>
              <p className="text-sm text-gray-400 italic leading-relaxed">
                "{feature.visualPrompt}"
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 px-6 rounded-[2rem] bg-[#0f0f0f] border border-dashed border-white/10 text-center">
          <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
            <ImageIcon size={40} />
          </div>
          <h4 className="text-xl font-bold text-white mb-2">No Visual Representation Yet</h4>
          <p className="text-gray-500 max-w-md mb-8">
            Generate an AI-powered visual to help founders and developers align on the interface and experience of this feature.
          </p>
          <button
            onClick={handleGenerateVisual}
            disabled={isGenerating || feature.isLocked}
            className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Generating Visual...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Generate First Visual
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}


