import React from 'react';
import { AlertCircle, CheckCircle2, User, Bot, Archive, Clock, Layers, Sparkles, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';
import { Project, Feature } from '../../types';

interface FeatureOverviewProps {
  project: Project;
  feature: Feature;
  isEditing: boolean;
  editedFeature: Feature;
  setEditedFeature: (feature: Feature) => void;
  isUpdatingStatus: boolean;
  onUpdateStatus: (status: Feature['status']) => void;
  onArchive: () => void;
  isAnalyzing?: boolean;
  onAnalyzeUIImpact?: () => void;
}

export default function FeatureOverview({
  project,
  feature,
  isEditing,
  editedFeature,
  setEditedFeature,
  isUpdatingStatus,
  onUpdateStatus,
  onArchive,
  isAnalyzing,
  onAnalyzeUIImpact
}: FeatureOverviewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
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
                onClick={() => onUpdateStatus(status as Feature['status'])}
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

        {/* UI Impact Analysis Section */}
        <section className="p-6 lg:p-8 rounded-2xl lg:rounded-3xl bg-[#141414] border border-white/5 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400">
                <Layers size={20} />
              </div>
              <h3 className="text-base lg:text-lg font-bold text-white uppercase tracking-widest">UI Impact Analysis</h3>
            </div>
            {onAnalyzeUIImpact && (
              <button
                onClick={onAnalyzeUIImpact}
                disabled={isAnalyzing || feature.isLocked}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-500/20"
              >
                {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {feature.uiImpact ? 'Re-analyze' : 'Analyze UI Impact'}
              </button>
            )}
          </div>

          {feature.uiImpact ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ImpactCard label="Affected Pages" items={feature.uiImpact.affectedPages} color="text-blue-400" />
                <ImpactCard label="Affected Components" items={feature.uiImpact.affectedComponents} color="text-emerald-400" />
                <ImpactCard label="Mobile Pattern" items={[feature.uiImpact.mobilePattern]} color="text-orange-400" />
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-sm text-gray-400 leading-relaxed italic">
                  "{feature.uiImpact.recommendation}"
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500 text-sm">No UI impact analysis performed yet.</p>
            </div>
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
      </div>

      {/* Sidebar info */}
      <div className="space-y-6">
        <section className="p-6 rounded-2xl bg-[#0f0f0f] border border-white/5">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Metadata</h4>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-gray-600 uppercase font-bold mb-1">Created</p>
              <p className="text-sm text-gray-300">{new Date(feature.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-600 uppercase font-bold mb-1">Last Updated</p>
              <p className="text-sm text-gray-300">{formatDistanceToNow(new Date(feature.updatedAt))} ago</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-600 uppercase font-bold mb-1">Project</p>
              <p className="text-sm text-gray-300">{project.name}</p>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3">
          <button 
            onClick={onArchive}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 border border-white/5 text-gray-500 hover:text-red-400 transition-all font-bold text-sm"
          >
            <Archive size={18} />
            Archive Feature
          </button>
        </div>
      </div>
    </div>
  );
}

function ImpactCard({ label, items, color }: { label: string, items: string[], color: string }) {
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">{label}</h4>
      <div className="flex flex-wrap gap-1.5">
        {items && items.length > 0 ? (
          items.map((item, i) => (
            <span key={i} className={cn("px-2 py-1 rounded-lg bg-white/5 text-[10px] font-bold border border-white/5", color)}>
              {item}
            </span>
          ))
        ) : (
          <span className="text-[10px] text-gray-600 italic">None detected</span>
        )}
      </div>
    </div>
  );
}
