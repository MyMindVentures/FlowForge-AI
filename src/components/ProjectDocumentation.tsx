import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  ArrowLeft,
  Loader2,
  BookOpen,
  Target,
  Zap
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Project, Feature } from '../types';
import { AgentOrchestrator, AgentTaskType } from '../services/ai/orchestrator';
import { useToast } from './Toast';
import { cn } from '../lib/utils';

interface ProjectDocumentationProps {
  project: Project;
  features: Feature[];
  onBack: () => void;
}

export default function ProjectDocumentation({ project, features, onBack }: ProjectDocumentationProps) {
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<{ prd: string; conceptSummary: string; tagline: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'prd' | 'concept' | 'tagline'>('prd');
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const completedFeatures = features.filter(f => f.status === 'Completed');

  const handleGenerate = async () => {
    if (completedFeatures.length === 0) {
      showToast('No completed features found to generate documentation.', 'error');
      return;
    }
    setLoading(true);
    try {
      // 1. Resolve Context
      const context = await AgentOrchestrator.runTask(AgentTaskType.RESOLVE_CONTEXT, { project, features });
      
      // 2. Generate PRD
      const result = await AgentOrchestrator.runTask(AgentTaskType.GENERATE_PRD, { context, features: completedFeatures, projectId: project.id });
      
      setDocs(result);
      showToast('Project documentation generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating documentation:', error);
      showToast('Failed to generate documentation.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!docs) return;
    const content = activeTab === 'prd' ? docs.prd : activeTab === 'concept' ? docs.conceptSummary : docs.tagline;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Copied to clipboard!');
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Header */}
      <header className="p-4 lg:p-6 border-b border-white/10 bg-[#0f0f0f] flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Documentation</h2>
            <p className="text-xs text-gray-500">AI-generated documentation based on completed features</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {docs && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm font-bold"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              <span>Copy</span>
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading || completedFeatures.length === 0}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            <span>{docs ? 'Regenerate' : 'Generate Specs'}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-8">
        {!docs ? (
          <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <FileText size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">No Documentation Yet</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Generate a comprehensive PRD and app concept summary based on your 
                <span className="text-indigo-400 font-bold"> {completedFeatures.length} completed features</span>.
              </p>
            </div>
            {completedFeatures.length === 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-start gap-3">
                <Zap size={16} className="flex-shrink-0 mt-0.5" />
                <p className="text-left">
                  You need at least one completed feature in your backlog to generate project documentation.
                </p>
              </div>
            )}
            <button
              onClick={handleGenerate}
              disabled={loading || completedFeatures.length === 0}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
            >
              <Sparkles size={20} className="text-indigo-400" />
              Generate Now
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 w-fit">
              <button
                onClick={() => setActiveTab('prd')}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                  activeTab === 'prd' ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                )}
              >
                <BookOpen size={14} />
                PRD
              </button>
              <button
                onClick={() => setActiveTab('concept')}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                  activeTab === 'concept' ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                )}
              >
                <Target size={14} />
                Concept
              </button>
              <button
                onClick={() => setActiveTab('tagline')}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                  activeTab === 'tagline' ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                )}
              >
                <Zap size={14} />
                Tagline
              </button>
            </div>

            {/* Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#141414] border border-white/5 rounded-3xl p-8 lg:p-12 shadow-2xl"
            >
              {activeTab === 'prd' && (
                <div className="prose prose-invert prose-indigo max-w-none">
                  <div className="markdown-body">
                    <Markdown>{docs.prd}</Markdown>
                  </div>
                </div>
              )}

              {activeTab === 'concept' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                      <Target size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">App Concept Summary</h3>
                      <p className="text-sm text-gray-500">The high-level vision of your project</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                    {docs.conceptSummary}
                  </p>
                </div>
              )}

              {activeTab === 'tagline' && (
                <div className="h-64 flex flex-col items-center justify-center text-center space-y-8">
                  <div className="p-4 bg-indigo-500/10 rounded-full text-indigo-400">
                    <Zap size={48} />
                  </div>
                  <h3 className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-tight italic">
                    "{docs.tagline}"
                  </h3>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
