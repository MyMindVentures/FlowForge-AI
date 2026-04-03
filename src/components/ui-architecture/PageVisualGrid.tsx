import React from 'react';
import { 
  FileCode, 
  Image as ImageIcon, 
  Sparkles, 
  Loader2, 
  ChevronRight,
  Layout as LayoutIcon,
  Layers
} from 'lucide-react';
import { motion } from 'motion/react';
import { UIPage, Project, UILayout, UIComponent, Feature } from '../../types';
import { cn } from '../../lib/utils';

interface PageVisualGridProps {
  pages: UIPage[];
  layouts: UILayout[];
  components: UIComponent[];
  features: Feature[];
  onPageClick: (page: UIPage) => void;
  onRegenerateVisual: (page: UIPage) => void;
  isGenerating?: string | null;
}

export default function PageVisualGrid({ 
  pages, 
  layouts, 
  components, 
  features,
  onPageClick, 
  onRegenerateVisual,
  isGenerating 
}: PageVisualGridProps) {
  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-6 rounded-full bg-white/5 text-gray-600 mb-6">
          <FileCode size={48} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No pages defined yet</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Add pages to your registry first, then you can generate visual previews and documentation for them.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pages.map((page) => (
        <PageVisualCard 
          key={page.id}
          page={page}
          layout={layouts.find(l => l.id === page.layoutId)}
          linkedFeatures={features.filter(f => page.linkedFeatureIds?.includes(f.id))}
          onClick={() => onPageClick(page)}
          onRegenerate={() => onRegenerateVisual(page)}
          isGenerating={isGenerating === page.id}
        />
      ))}
    </div>
  );
}

function PageVisualCard({ 
  page, 
  layout, 
  linkedFeatures,
  onClick, 
  onRegenerate,
  isGenerating 
}: { 
  page: UIPage; 
  layout?: UILayout;
  linkedFeatures: Feature[];
  onClick: () => void; 
  onRegenerate: () => void;
  isGenerating: boolean;
}) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative flex flex-col bg-[#141414] border border-white/5 rounded-[2rem] overflow-hidden hover:border-indigo-500/30 transition-all shadow-xl"
    >
      {/* Visual Preview */}
      <div className="relative aspect-[16/10] bg-[#0a0a0a] overflow-hidden">
        {page.visualUrl ? (
          <img 
            src={page.visualUrl} 
            alt={page.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
            <ImageIcon size={48} className="text-gray-700 mb-4" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">No visual preview</p>
          </div>
        )}

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
          <button 
            onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
            disabled={isGenerating}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
            title="Regenerate Visual"
          >
            {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
          </button>
          <button 
            onClick={onClick}
            className="px-6 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
          >
            View Spec
          </button>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 uppercase tracking-widest">
            {layout?.name || 'Standard'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col cursor-pointer" onClick={onClick}>
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{page.name}</h3>
          <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
            {page.path}
          </span>
        </div>
        
        <p className="text-sm text-gray-400 line-clamp-2 mb-6 flex-1">
          {page.purpose}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Layers size={14} />
              <span className="text-xs font-bold">{page.componentIds.length}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <LayoutIcon size={14} />
              <span className="text-xs font-bold">{linkedFeatures.length}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-indigo-400 text-xs font-bold group-hover:translate-x-1 transition-transform">
            Page Spec
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}


