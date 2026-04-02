import React, { useState } from 'react';
import { 
  Layout as LayoutIcon, 
  FileCode, 
  Component as ComponentIcon,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Plus,
  Link as LinkIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { Feature, UIPage, UIComponent, UILayout, UIImpactAnalysis } from '../../types';
import { AgentOrchestrator, AgentTaskType } from '../../services/ai/orchestrator';
import { useToast } from '../Toast';
import { cn } from '../../lib/utils';

interface FeatureUIArchitectureProps {
  feature: Feature;
  pages: UIPage[];
  components: UIComponent[];
  layouts: UILayout[];
  onUpdateFeature: (updates: Partial<Feature>) => Promise<void>;
}

export default function FeatureUIArchitecture({
  feature,
  pages,
  components,
  layouts,
  onUpdateFeature
}: FeatureUIArchitectureProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { showToast } = useToast();

  const handleAnalyzeImpact = async () => {
    setIsAnalyzing(true);
    try {
      const orchestrator = new AgentOrchestrator();
      const result = await orchestrator.executeTask<UIImpactAnalysis>(AgentTaskType.ANALYZE_UI_IMPACT, {
        feature,
        existingPages: pages,
        existingComponents: components,
        existingLayouts: layouts
      });

      if (result) {
        await onUpdateFeature({
          uiImpact: result,
          updatedAt: new Date().toISOString()
        });
        showToast('UI Impact Analysis complete!', 'success');
      }
    } catch (error) {
      showToast('Failed to analyze UI impact', 'error');
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const impact = feature.uiImpact;

  return (
    <div className="space-y-8">
      {/* AI Impact Analysis Section */}
      <section className="p-6 rounded-3xl bg-[#141414] border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="text-indigo-400" size={20} />
              AI UI Impact Analysis
            </h3>
            <p className="text-sm text-gray-500">How this feature integrates with the existing UI architecture.</p>
          </div>
          <button
            onClick={handleAnalyzeImpact}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 rounded-xl text-sm font-bold transition-all"
          >
            {isAnalyzing ? <Sparkles size={16} className="animate-pulse" /> : <Sparkles size={16} />}
            {isAnalyzing ? 'Analyzing...' : 'Analyze Impact'}
          </button>
        </div>

        {impact ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ImpactStat 
                label="Affected Pages" 
                count={impact.affectedPages.length} 
                items={impact.affectedPages}
                icon={<FileCode size={16} />}
                color="indigo"
              />
              <ImpactStat 
                label="Affected Components" 
                count={impact.affectedComponents.length} 
                items={impact.affectedComponents}
                icon={<ComponentIcon size={16} />}
                color="emerald"
              />
              <ImpactStat 
                label="Affected Layouts" 
                count={impact.affectedLayouts.length} 
                items={impact.affectedLayouts}
                icon={<LayoutIcon size={16} />}
                color="orange"
              />
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Recommendation</h4>
              <p className="text-sm text-gray-300 leading-relaxed">{impact.recommendation}</p>
            </div>

            {impact.newPagesNeeded && impact.newPagesNeeded.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Suggested New Pages</h4>
                <div className="space-y-2">
                  {impact.newPagesNeeded.map((page, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                          <Plus size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{page.name}</p>
                          <p className="text-[10px] text-gray-500">{page.purpose}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full">
                        {page.layoutType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
            <AlertCircle size={48} className="mx-auto mb-4 text-gray-600" />
            <h4 className="text-lg font-bold mb-2">No Analysis Yet</h4>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Run the AI Impact Analysis to see how this feature fits into your app's structure.
            </p>
          </div>
        )}
      </section>

      {/* Linked Architecture Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <LinkIcon className="text-emerald-400" size={20} />
            Linked UI Elements
          </h3>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors border border-white/5">
            <Plus size={14} />
            Link Element
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Linked Pages */}
          <div className="p-6 rounded-3xl bg-[#141414] border border-white/5">
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
              <FileCode size={16} className="text-indigo-400" />
              Linked Pages
            </h4>
            <div className="space-y-2">
              {pages.filter(p => p.linkedFeatureIds.includes(feature.id)).map(page => (
                <div key={page.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-sm font-medium">{page.name}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{page.path}</span>
                </div>
              ))}
              {pages.filter(p => p.linkedFeatureIds.includes(feature.id)).length === 0 && (
                <p className="text-xs text-gray-600 italic">No pages linked yet.</p>
              )}
            </div>
          </div>

          {/* Linked Components */}
          <div className="p-6 rounded-3xl bg-[#141414] border border-white/5">
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
              <ComponentIcon size={16} className="text-emerald-400" />
              Linked Components
            </h4>
            <div className="space-y-2">
              {components.filter(c => c.linkedFeatureIds.includes(feature.id)).map(comp => (
                <div key={comp.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-sm font-medium">{comp.name}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">{comp.type}</span>
                </div>
              ))}
              {components.filter(c => c.linkedFeatureIds.includes(feature.id)).length === 0 && (
                <p className="text-xs text-gray-600 italic">No components linked yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ImpactStat({ label, count, items, icon, color }: { label: string, count: number, items: string[], icon: React.ReactNode, color: 'indigo' | 'emerald' | 'orange' }) {
  const colors = {
    indigo: 'text-indigo-400 bg-indigo-400/10',
    emerald: 'text-emerald-400 bg-emerald-400/10',
    orange: 'text-orange-400 bg-orange-400/10'
  };

  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <div className={cn("p-2 rounded-lg", colors[color])}>
          {icon}
        </div>
        <span className="text-xl font-bold">{count}</span>
      </div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.slice(0, 2).map((item, idx) => (
          <span key={idx} className="text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
            {item}
          </span>
        ))}
        {items.length > 2 && (
          <span className="text-[10px] text-gray-600">+{items.length - 2} more</span>
        )}
      </div>
    </div>
  );
}
