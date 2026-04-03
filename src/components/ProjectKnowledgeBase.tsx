import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Save, 
  History, 
  Plus, 
  ChevronRight, 
  FileCode, 
  Search, 
  Loader2, 
  Check, 
  Sparkles,
  BookOpen,
  Target,
  Zap,
  ArrowLeft,
  Copy,
  Download
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Project, Feature } from '../types';
import { useToast } from './Toast';
import { AgentOrchestrator, AgentTaskType } from '../services/ai/orchestrator';
import { AuditService, AuditAction } from '../services/audit';
import { cn } from '../lib/utils';

interface ProjectKnowledgeBaseProps {
  project: Project;
  features: Feature[];
  onUpdate: (updates: Partial<Project>) => Promise<void>;
  onBack: () => void;
}

export default function ProjectKnowledgeBase({ project, features, onUpdate, onBack }: ProjectKnowledgeBaseProps) {
  const [activeView, setActiveView] = useState<'manual' | 'ai'>('manual');
  const [activeSpec, setActiveSpec] = useState('vision');
  const [activeAIDoc, setActiveAIDoc] = useState<'prd' | 'concept' | 'tagline'>('prd');
  
  // Manual Specs State
  const [appVision, setAppVision] = useState(project.appVision || '');
  const [prd, setPrd] = useState(project.prd || '');
  const [techArch, setTechArch] = useState(project.techArch || '');
  const [uxStrategy, setUxStrategy] = useState(project.uxStrategy || '');
  
  // AI Docs State
  const [aiDocs, setAiDocs] = useState<{ prd: string; conceptSummary: string; tagline: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { showToast } = useToast();
  
  const completedFeatures = features.filter(f => f.status === 'Completed');

  const specs = [
    { id: 'vision', title: 'App Vision', icon: Sparkles, lastUpdated: 'Real-time' },
    { id: 'prd', title: 'Manual PRD', icon: FileText, lastUpdated: 'Real-time' },
    { id: 'tech', title: 'Technical Architecture', icon: FileCode, lastUpdated: 'Real-time' },
    { id: 'ux', title: 'UX Strategy & Flow', icon: History, lastUpdated: 'Real-time' },
  ];

  // Audit Log Helper
  const logChange = useCallback(async (action: AuditAction | string, details: any) => {
    await AuditService.log(action, details, project.id);
  }, [project.id]);

  // Autosave Logic for Manual Specs
  useEffect(() => {
    const timer = setTimeout(async () => {
      const updates: Partial<Project> = {};
      let hasChanges = false;
      let changedField = '';

      if (appVision !== project.appVision) { updates.appVision = appVision; hasChanges = true; changedField = 'appVision'; }
      if (prd !== project.prd) { updates.prd = prd; hasChanges = true; changedField = 'prd'; }
      if (techArch !== project.techArch) { updates.techArch = techArch; hasChanges = true; changedField = 'techArch'; }
      if (uxStrategy !== project.uxStrategy) { updates.uxStrategy = uxStrategy; hasChanges = true; changedField = 'uxStrategy'; }

      if (hasChanges) {
        setSaving(true);
        try {
          await onUpdate(updates);
          setLastSaved(new Date());
          logChange(AuditAction.PROJECT_UPDATED, { type: 'SPEC_UPDATE', field: changedField });
        } catch (err) {
          showToast('Failed to save specification', 'error');
        } finally {
          setSaving(false);
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [appVision, prd, techArch, uxStrategy, project, onUpdate, showToast, logChange]);

  const handleGenerateAI = async () => {
    if (completedFeatures.length === 0) {
      showToast('No completed features found to generate documentation.', 'error');
      return;
    }
    setGenerating(true);
    try {
      const context = await AgentOrchestrator.runTask(AgentTaskType.RESOLVE_CONTEXT, { project, features });
      const result = await AgentOrchestrator.runTask(AgentTaskType.GENERATE_PRD, { context, features: completedFeatures, projectId: project.id });
      setAiDocs(result);
      showToast('AI Documentation generated!', 'success');
    } catch (error) {
      console.error('Error generating documentation:', error);
      showToast('Failed to generate documentation.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!aiDocs) return;
    const content = activeAIDoc === 'prd' ? aiDocs.prd : activeAIDoc === 'concept' ? aiDocs.conceptSummary : aiDocs.tagline;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Copied to clipboard!');
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Header */}
      <header className="p-4 lg:p-6 border-b border-white/5 bg-[#0d0d0d]/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Knowledge Base</h2>
            <p className="text-xs text-gray-500">Specs, PRDs, and AI-generated insights</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveView('manual')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                activeView === 'manual' ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
              )}
            >
              Manual Specs
            </button>
            <button
              onClick={() => setActiveView('ai')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                activeView === 'ai' ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
              )}
            >
              AI Generated
            </button>
          </div>

          {activeView === 'manual' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              {saving ? (
                <>
                  <Loader2 size={12} className="animate-spin text-indigo-400" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Check size={12} className="text-emerald-400" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Saved</span>
                </>
              ) : (
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Autosave Active</span>
              )}
            </div>
          )}

          {activeView === 'ai' && (
            <div className="flex items-center gap-3">
              {aiDocs && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>Copy</span>
                </button>
              )}
              <button
                onClick={handleGenerateAI}
                disabled={generating || completedFeatures.length === 0}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                <span>{aiDocs ? 'Regenerate' : 'Generate'}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 lg:w-80 border-r border-white/5 p-4 overflow-y-auto hidden md:block bg-[#0d0d0d]/30">
          {activeView === 'manual' ? (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-4">Core Specifications</p>
              {specs.map(spec => (
                <button
                  key={spec.id}
                  onClick={() => setActiveSpec(spec.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                    activeSpec === spec.id ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                  )}
                >
                  <spec.icon size={18} />
                  <div className="text-left overflow-hidden">
                    <p className="text-sm font-bold truncate">{spec.title}</p>
                    <p className="text-[10px] opacity-60">{spec.lastUpdated}</p>
                  </div>
                  <ChevronRight size={14} className={cn("ml-auto transition-transform", activeSpec === spec.id ? 'rotate-90' : '')} />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-4">AI Documentation</p>
              <button
                onClick={() => setActiveAIDoc('prd')}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                  activeAIDoc === 'prd' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                )}
              >
                <BookOpen size={18} />
                <div className="text-left">
                  <p className="text-sm font-bold">AI PRD</p>
                  <p className="text-[10px] opacity-60">Generated from features</p>
                </div>
              </button>
              <button
                onClick={() => setActiveAIDoc('concept')}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                  activeAIDoc === 'concept' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                )}
              >
                <Target size={18} />
                <div className="text-left">
                  <p className="text-sm font-bold">Concept Summary</p>
                  <p className="text-[10px] opacity-60">High-level overview</p>
                </div>
              </button>
              <button
                onClick={() => setActiveAIDoc('tagline')}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                  activeAIDoc === 'tagline' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                )}
              >
                <Zap size={18} />
                <div className="text-left">
                  <p className="text-sm font-bold">Marketing Tagline</p>
                  <p className="text-[10px] opacity-60">AI-powered pitch</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-12">
          {activeView === 'manual' ? (
            <motion.div
              key={activeSpec}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-bold text-white tracking-tight">
                  {specs.find(s => s.id === activeSpec)?.title}
                </h1>
                {activeSpec === 'vision' && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    <Sparkles size={12} />
                    AI Context Primary
                  </div>
                )}
              </div>
              
              <div className="prose prose-invert max-w-none">
                <textarea 
                  className="w-full min-h-[600px] bg-transparent border-none text-gray-300 text-xl leading-relaxed focus:outline-none resize-none placeholder:text-gray-700"
                  placeholder={`Write your ${specs.find(s => s.id === activeSpec)?.title} here...`}
                  value={
                    activeSpec === 'vision' ? appVision :
                    activeSpec === 'prd' ? prd :
                    activeSpec === 'tech' ? techArch : uxStrategy
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (activeSpec === 'vision') setAppVision(val);
                    else if (activeSpec === 'prd') setPrd(val);
                    else if (activeSpec === 'tech') setTechArch(val);
                    else setUxStrategy(val);
                  }}
                />
              </div>
            </motion.div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {!aiDocs ? (
                <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Sparkles size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">AI Documentation Not Generated</h3>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
                      Generate a comprehensive PRD and app concept summary based on your 
                      <span className="text-indigo-400 font-bold"> {completedFeatures.length} completed features</span>.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateAI}
                    disabled={generating || completedFeatures.length === 0}
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all flex items-center gap-3 shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {generating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                    Generate Now
                  </button>
                </div>
              ) : (
                <motion.div
                  key={activeAIDoc}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {activeAIDoc === 'prd' && (
                    <div className="bg-[#141414] border border-white/5 rounded-3xl p-8 lg:p-12 shadow-2xl">
                      <div className="prose prose-invert prose-indigo max-w-none">
                        <div className="markdown-body">
                          <Markdown>{aiDocs.prd}</Markdown>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeAIDoc === 'concept' && (
                    <div className="bg-[#141414] border border-white/5 rounded-3xl p-8 lg:p-12 shadow-2xl space-y-6">
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
                        {aiDocs.conceptSummary}
                      </p>
                    </div>
                  )}

                  {activeAIDoc === 'tagline' && (
                    <div className="bg-[#141414] border border-white/5 rounded-3xl p-8 lg:p-12 shadow-2xl h-96 flex flex-col items-center justify-center text-center space-y-8">
                      <div className="p-4 bg-indigo-500/10 rounded-full text-indigo-400">
                        <Zap size={48} />
                      </div>
                      <h3 className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-tight italic">
                        "{aiDocs.tagline}"
                      </h3>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
