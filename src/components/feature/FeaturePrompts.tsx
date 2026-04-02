import React from 'react';
import { Terminal, Palette, Loader2, Sparkles, Copy } from 'lucide-react';
import { Feature } from '../../types';
import { AgentTaskType } from '../../services/ai/orchestrator';

interface FeaturePromptsProps {
  feature: Feature;
  isGenerating: string | null;
  onGenerateAI: (task: AgentTaskType, field: keyof Feature) => void;
  onCopy: (text: string | undefined) => void;
}

export default function FeaturePrompts({
  feature,
  isGenerating,
  onGenerateAI,
  onCopy
}: FeaturePromptsProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Coding Prompt */}
        <section className="p-8 rounded-3xl bg-[#141414] border border-white/5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                <Terminal size={24} />
              </div>
              <h4 className="font-bold text-white">Coding Prompt</h4>
            </div>
            <button
              onClick={() => onGenerateAI(AgentTaskType.GENERATE_CODING_PROMPT, 'codingPrompt')}
              disabled={isGenerating === 'codingPrompt'}
              className="p-2 text-gray-500 hover:text-white transition-all"
            >
              {isGenerating === 'codingPrompt' ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            </button>
          </div>
          <div className="flex-1 bg-black/40 rounded-2xl p-4 border border-white/5 mb-6 overflow-y-auto max-h-[300px]">
            {feature.codingPrompt ? (
              <p className="text-xs font-mono text-gray-400 leading-relaxed whitespace-pre-wrap">{feature.codingPrompt}</p>
            ) : (
              <p className="text-xs text-gray-600 italic">No coding prompt generated.</p>
            )}
          </div>
          <button
            onClick={() => onCopy(feature.codingPrompt)}
            disabled={!feature.codingPrompt}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Copy size={16} />
            Copy Coding Prompt
          </button>
        </section>

        {/* UI Design Prompt */}
        <section className="p-8 rounded-3xl bg-[#141414] border border-white/5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
                <Palette size={24} />
              </div>
              <h4 className="font-bold text-white">UI Design Prompt</h4>
            </div>
            <button
              onClick={() => onGenerateAI(AgentTaskType.GENERATE_DESIGN_PROMPT, 'uiDesignPrompt')}
              disabled={isGenerating === 'uiDesignPrompt'}
              className="p-2 text-gray-500 hover:text-white transition-all"
            >
              {isGenerating === 'uiDesignPrompt' ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            </button>
          </div>
          <div className="flex-1 bg-black/40 rounded-2xl p-4 border border-white/5 mb-6 overflow-y-auto max-h-[300px]">
            {feature.uiDesignPrompt ? (
              <p className="text-xs font-mono text-gray-400 leading-relaxed whitespace-pre-wrap">{feature.uiDesignPrompt}</p>
            ) : (
              <p className="text-xs text-gray-600 italic">No UI design prompt generated.</p>
            )}
          </div>
          <button
            onClick={() => onCopy(feature.uiDesignPrompt)}
            disabled={!feature.uiDesignPrompt}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Copy size={16} />
            Copy Design Prompt
          </button>
        </section>
      </div>
    </div>
  );
}
