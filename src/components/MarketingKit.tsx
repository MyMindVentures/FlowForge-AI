import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Megaphone, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowLeft,
  Loader2,
  Target,
  Zap,
  Quote,
  TrendingUp,
  Mail,
  Globe,
  Share2
} from 'lucide-react';
import { Project, Feature } from '../types';
import { AgentOrchestrator, AgentTaskType } from '../services/ai/orchestrator';
import { useToast } from './Toast';
import { cn } from '../lib/utils';

interface MarketingKitProps {
  project: Project;
  features: Feature[];
  onBack: () => void;
}

export default function MarketingKit({ project, features, onBack }: MarketingKitProps) {
  const [loading, setLoading] = useState(false);
  const [kit, setKit] = useState<{
    taglines: string[];
    valuePropositions: { title: string; description: string }[];
    pitchNarrative: string;
    marketingCopy: { headline: string; body: string }[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'taglines' | 'propositions' | 'pitch' | 'copy'>('taglines');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await AgentOrchestrator.runTask(AgentTaskType.GENERATE_MARKETING_KIT, { project, features });
      setKit(result);
      showToast('Marketing kit generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating marketing kit:', error);
      showToast('Failed to generate marketing kit.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
            <h2 className="text-xl font-bold text-white tracking-tight">Marketing Kit</h2>
            <p className="text-xs text-gray-500">AI-powered taglines, pitches, and copy</p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          <span>{kit ? 'Regenerate Kit' : 'Generate Kit'}</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-8">
        {!kit ? (
          <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Megaphone size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Ready to Pitch?</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Generate investor-ready taglines, value propositions, and marketing copy 
                based on your project's features and goals.
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
            >
              <Sparkles size={20} className="text-indigo-400" />
              Generate Marketing Assets
            </button>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 w-fit overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('taglines')}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                  activeTab === 'taglines' ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                )}
              >
                <Quote size={14} />
                Taglines
              </button>
              <button
                onClick={() => setActiveTab('propositions')}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                  activeTab === 'propositions' ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                )}
              >
                <TrendingUp size={14} />
                Value Props
              </button>
              <button
                onClick={() => setActiveTab('pitch')}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                  activeTab === 'pitch' ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                )}
              >
                <Target size={14} />
                Pitch Narrative
              </button>
              <button
                onClick={() => setActiveTab('copy')}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                  activeTab === 'copy' ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                )}
              >
                <Share2 size={14} />
                Marketing Copy
              </button>
            </div>

            {/* Content Area */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {activeTab === 'taglines' && (
                <div className="grid grid-cols-1 gap-4">
                  {kit.taglines.map((tagline, idx) => (
                    <div 
                      key={idx}
                      className="group p-8 rounded-3xl bg-[#141414] border border-white/5 hover:border-indigo-500/30 transition-all relative overflow-hidden"
                    >
                      <h3 className="text-2xl lg:text-3xl font-black text-white tracking-tight italic leading-tight pr-12">
                        "{tagline}"
                      </h3>
                      <button
                        onClick={() => handleCopy(tagline, `tagline-${idx}`)}
                        className="absolute top-6 right-6 p-3 rounded-xl bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                      >
                        {copiedId === `tagline-${idx}` ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                      </button>
                      <div className="absolute -bottom-4 -right-4 text-white/5 transform rotate-12">
                        <Quote size={120} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'propositions' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {kit.valuePropositions.map((prop, idx) => (
                    <div 
                      key={idx}
                      className="p-8 rounded-3xl bg-[#141414] border border-white/5 flex flex-col h-full"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
                        <TrendingUp size={24} />
                      </div>
                      <h4 className="text-xl font-bold text-white mb-4">{prop.title}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed flex-1">
                        {prop.description}
                      </p>
                      <button
                        onClick={() => handleCopy(`${prop.title}: ${prop.description}`, `prop-${idx}`)}
                        className="mt-8 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-all text-xs font-bold"
                      >
                        {copiedId === `prop-${idx}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        Copy Proposition
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'pitch' && (
                <div className="p-8 lg:p-12 rounded-3xl bg-[#141414] border border-white/5 relative">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                      <Target size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Investor Pitch Narrative</h3>
                      <p className="text-sm text-gray-500">The story of your project's impact</p>
                    </div>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                      {kit.pitchNarrative}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(kit.pitchNarrative, 'pitch')}
                    className="absolute top-8 right-8 p-3 rounded-xl bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                  >
                    {copiedId === 'pitch' ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                  </button>
                </div>
              )}

              {activeTab === 'copy' && (
                <div className="grid grid-cols-1 gap-8">
                  {kit.marketingCopy.map((copy, idx) => (
                    <div 
                      key={idx}
                      className="p-8 rounded-3xl bg-[#141414] border border-white/5 relative"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        {idx === 0 ? <Globe size={20} className="text-sky-400" /> : 
                         idx === 1 ? <Mail size={20} className="text-amber-400" /> : 
                         <Share2 size={20} className="text-rose-400" />}
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                          {idx === 0 ? 'Landing Page Copy' : idx === 1 ? 'Email Outreach' : 'Social Media Post'}
                        </span>
                      </div>
                      <h4 className="text-2xl font-bold text-white mb-4 tracking-tight">{copy.headline}</h4>
                      <p className="text-gray-400 leading-relaxed whitespace-pre-wrap mb-8">
                        {copy.body}
                      </p>
                      <button
                        onClick={() => handleCopy(`${copy.headline}\n\n${copy.body}`, `copy-${idx}`)}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-all text-xs font-bold"
                      >
                        {copiedId === `copy-${idx}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        Copy Block
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}


