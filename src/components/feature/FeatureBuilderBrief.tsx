import React from 'react';
import { Bot, Loader2, Sparkles } from 'lucide-react';
import { Feature } from '../../types';
import { AgentTaskType } from '../../services/ai/orchestrator';

interface FeatureBuilderBriefProps {
  feature: Feature;
  isGenerating: string | null;
  onGenerateAI: (task: AgentTaskType, field: keyof Feature) => void;
}

export default function FeatureBuilderBrief({
  feature,
  isGenerating,
  onGenerateAI
}: FeatureBuilderBriefProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <section className="p-8 lg:p-12 rounded-3xl bg-[#141414] border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Bot size={200} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400">
                <Bot size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Builder Brief</h3>
                <p className="text-sm text-gray-500">Clear build instructions for developers</p>
              </div>
            </div>
            <button
              onClick={() => onGenerateAI(AgentTaskType.TRANSLATE_TECHNICAL, 'builderBrief')}
              disabled={isGenerating === 'builderBrief'}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            >
              {isGenerating === 'builderBrief' ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              Regenerate
            </button>
          </div>
          
          <div className="prose prose-invert max-w-none">
            {feature.builderBrief ? (
              <div className="bg-black/20 p-8 rounded-2xl border border-white/5 font-mono text-sm leading-relaxed text-gray-300 whitespace-pre-wrap">
                {feature.builderBrief}
              </div>
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                <p className="text-gray-500 mb-6">No builder brief generated yet.</p>
                <button
                  onClick={() => onGenerateAI(AgentTaskType.TRANSLATE_TECHNICAL, 'builderBrief')}
                  className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl font-bold transition-all border border-white/10"
                >
                  Generate Builder Brief
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}


