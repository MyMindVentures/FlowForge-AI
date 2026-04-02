import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  ChevronRight, 
  Filter, 
  Plus, 
  CheckCircle2, 
  Clock, 
  PlayCircle,
  ArrowLeft,
  Sparkles,
  FileText,
  List,
  Target
} from 'lucide-react';
import { Version, VersionStatus, Feature } from '../types';
import { generateReleaseNotes } from '../services/geminiService';

interface RoadmapProps {
  versions: Version[];
  features: Feature[];
  onAddVersion: () => void;
  onUpdateVersion: (version: Version) => void;
  onBack: () => void;
}

export default function Roadmap({ versions, features, onAddVersion, onUpdateVersion, onBack }: RoadmapProps) {
  const [filter, setFilter] = useState<VersionStatus | 'All'>('All');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);

  const filteredVersions = useMemo(() => {
    return versions
      .filter(v => filter === 'All' || v.status === filter)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [versions, filter]);

  const selectedVersion = useMemo(() => 
    versions.find(v => v.id === selectedVersionId),
    [versions, selectedVersionId]
  );

  const getStatusColor = (status: VersionStatus) => {
    switch (status) {
      case 'Released': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'In Progress': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Planned': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
    }
  };

  const getStatusIcon = (status: VersionStatus) => {
    switch (status) {
      case 'Released': return <CheckCircle2 size={14} />;
      case 'In Progress': return <PlayCircle size={14} />;
      case 'Planned': return <Clock size={14} />;
    }
  };

  const handleGenerateReleaseNotes = async (version: Version) => {
    setIsGeneratingNotes(true);
    try {
      const linkedFeatures = features.filter(f => version.linkedFeatureIds.includes(f.id));
      const notes = await generateReleaseNotes(version.name, version.goal, linkedFeatures);
      onUpdateVersion({ ...version, releaseNotes: notes });
    } catch (error) {
      console.error('Error generating release notes:', error);
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  if (selectedVersion) {
    const linkedFeatures = features.filter(f => selectedVersion.linkedFeatureIds.includes(f.id));

    return (
      <div className="flex flex-col h-full bg-[#0a0a0a]">
        {/* Detail Header */}
        <div className="p-4 border-b border-white/5 flex items-center gap-4 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md z-10">
          <button 
            onClick={() => setSelectedVersionId(null)}
            className="p-2 hover:bg-white/5 rounded-full text-gray-400 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{selectedVersion.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${getStatusColor(selectedVersion.status)}`}>
                {getStatusIcon(selectedVersion.status)}
                {selectedVersion.status}
              </span>
              <span className="text-gray-500 text-xs flex items-center gap-1">
                <Calendar size={12} />
                {new Date(selectedVersion.startDate).toLocaleDateString()} - {new Date(selectedVersion.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-24">
          {/* Goal Section */}
          <section>
            <div className="flex items-center gap-2 mb-3 text-indigo-400">
              <Target size={18} />
              <h3 className="font-bold uppercase tracking-wider text-xs">Primary Goal</h3>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-gray-300 leading-relaxed">
              {selectedVersion.goal}
            </div>
          </section>

          {/* Linked Features */}
          <section>
            <div className="flex items-center gap-2 mb-3 text-amber-400">
              <List size={18} />
              <h3 className="font-bold uppercase tracking-wider text-xs">Linked Features ({linkedFeatures.length})</h3>
            </div>
            <div className="space-y-3">
              {linkedFeatures.map(feature => (
                <div 
                  key={feature.id}
                  className="p-4 rounded-2xl bg-[#141414] border border-white/5 flex items-center justify-between group"
                >
                  <div>
                    <h4 className="text-white font-medium mb-1">{feature.title}</h4>
                    <span className="text-gray-500 text-xs px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                      {feature.featureCode}
                    </span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                    feature.status === 'Completed' ? 'text-emerald-400' : 
                    feature.status === 'In Progress' ? 'text-amber-400' : 'text-gray-400'
                  }`}>
                    {feature.status}
                  </div>
                </div>
              ))}
              {linkedFeatures.length === 0 && (
                <div className="text-center py-8 text-gray-500 italic text-sm">
                  No features linked to this version yet.
                </div>
              )}
            </div>
          </section>

          {/* Release Notes */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <FileText size={18} />
                <h3 className="font-bold uppercase tracking-wider text-xs">Release Notes</h3>
              </div>
              <button
                onClick={() => handleGenerateReleaseNotes(selectedVersion)}
                disabled={isGeneratingNotes}
                className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
              >
                {isGeneratingNotes ? (
                  <Loader2 className="animate-spin" size={12} />
                ) : (
                  <Sparkles size={12} />
                )}
                {selectedVersion.releaseNotes ? 'Regenerate' : 'Generate with AI'}
              </button>
            </div>
            
            {selectedVersion.releaseNotes ? (
              <div className="p-6 rounded-2xl bg-[#141414] border border-white/5 prose prose-invert prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-300 font-mono text-xs leading-relaxed">
                  {selectedVersion.releaseNotes}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center text-center">
                <FileText className="text-gray-600 mb-3" size={32} />
                <p className="text-gray-500 text-sm mb-4">No release notes generated yet.</p>
                <button
                  onClick={() => handleGenerateReleaseNotes(selectedVersion)}
                  disabled={isGeneratingNotes}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-500 transition-all"
                >
                  {isGeneratingNotes ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                  Generate Notes
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Filters */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-full text-gray-400 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          {(['All', 'Released', 'In Progress', 'Planned'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                filter === f 
                  ? 'bg-white text-black' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button 
          onClick={onAddVersion}
          className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Timeline View */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/50 via-white/10 to-transparent" />

          <div className="space-y-8">
            {filteredVersions.map((version, index) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                key={version.id}
                className="relative pl-10"
              >
                {/* Timeline Dot */}
                <div className={`absolute left-2.5 top-2 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a0a] z-10 ${
                  version.status === 'Released' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
                  version.status === 'In Progress' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-indigo-500'
                }`} />

                <button
                  onClick={() => setSelectedVersionId(version.id)}
                  className="w-full text-left p-5 rounded-3xl bg-[#141414] border border-white/5 hover:border-indigo-500/30 transition-all group shadow-xl"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {version.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 ${getStatusColor(version.status)}`}>
                          {getStatusIcon(version.status)}
                          {version.status}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" size={20} />
                  </div>

                  <p className="text-gray-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                    {version.goal}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-gray-500 text-[10px] font-medium">
                      <Calendar size={12} />
                      {new Date(version.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-[10px] font-medium">
                      <List size={12} />
                      {version.linkedFeatureIds.length} Features
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}

            {filteredVersions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
                  <Calendar className="text-gray-600" size={32} />
                </div>
                <h3 className="text-white font-bold mb-2">No versions found</h3>
                <p className="text-gray-500 text-sm max-w-[200px]">
                  Try changing your filter or add a new version to the roadmap.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
