import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Loader2, 
  FileText, 
  Layout as LayoutIcon, 
  Layers, 
  Smartphone, 
  Monitor, 
  Component as ComponentIcon,
  Search,
  Filter,
  ExternalLink,
  Info,
  Edit2,
  Download,
  Copy,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Zap,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { UIPage, Project, UILayout, UIComponent, Feature, UIStyleSystem } from '../../types';
import { cn } from '../../lib/utils';
import { useToast } from '../Toast';

interface PageDetailViewProps {
  page: UIPage;
  project: Project;
  layout?: UILayout;
  components: UIComponent[];
  features: Feature[];
  styleSystem: UIStyleSystem | null;
  onBack: () => void;
  onUpdatePage: (id: string, updates: Partial<UIPage>) => Promise<void>;
  onGenerateDocumentation: (page: UIPage) => Promise<void>;
  onGenerateVisual: (page: UIPage) => Promise<void>;
  isGenerating?: string | null;
}

export default function PageDetailView({ 
  page, 
  project, 
  layout, 
  components, 
  features,
  styleSystem,
  onBack, 
  onUpdatePage,
  onGenerateDocumentation,
  onGenerateVisual,
  isGenerating 
}: PageDetailViewProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'documentation' | 'components' | 'features'>('documentation');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  };

  const linkedComponents = components.filter(c => page.componentIds?.includes(c.id));
  const linkedFeatures = features.filter(f => page.linkedFeatureIds?.includes(f.id));

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0d0d0d]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold tracking-tight">{page.name}</h1>
              <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">
                {page.path}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Page Specification & Documentation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onGenerateVisual(page)}
            disabled={isGenerating === 'visual'}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 rounded-xl text-sm font-bold transition-all border border-white/5"
          >
            {isGenerating === 'visual' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Regenerate Visual
          </button>
          <button
            onClick={() => onGenerateDocumentation(page)}
            disabled={isGenerating === 'documentation'}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
          >
            {isGenerating === 'documentation' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Update Spec
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto p-6 lg:p-10 space-y-10">
          {/* Visual Preview Hero */}
          <section className="relative rounded-[2.5rem] overflow-hidden bg-[#141414] border border-white/5 shadow-2xl">
            <div className="aspect-[21/9] w-full relative group">
              {page.visualUrl ? (
                <img 
                  src={page.visualUrl} 
                  alt={page.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent">
                  <ImageIcon size={64} className="text-gray-700 mb-6" />
                  <h3 className="text-2xl font-bold text-gray-400 mb-2">Visual Preview Pending</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-8">
                    Generate a visual preview to help developers understand the intended UI/UX for this page.
                  </p>
                  <button 
                    onClick={() => onGenerateVisual(page)}
                    disabled={isGenerating === 'visual'}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
                  >
                    {isGenerating === 'visual' ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    Generate Visual Preview
                  </button>
                </div>
              )}
              
              {page.visualUrl && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                  <p className="text-xs text-gray-400 max-w-2xl italic">
                    AI-generated visual representation based on page purpose and project style rules.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Page Metadata Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetadataCard 
              icon={<LayoutIcon size={18} />}
              label="Layout Structure"
              value={layout?.name || 'Standard Layout'}
              subValue={layout?.type || 'Dashboard'}
              color="text-blue-400"
            />
            <MetadataCard 
              icon={<Smartphone size={18} />}
              label="Mobile Pattern"
              value={page.mobilePattern || 'Responsive Stack'}
              subValue="Mobile-First Design"
              color="text-emerald-400"
            />
            <MetadataCard 
              icon={<Layers size={18} />}
              label="Components"
              value={`${linkedComponents.length} Reusable`}
              subValue="Library Components"
              color="text-purple-400"
            />
            <MetadataCard 
              icon={<Zap size={18} />}
              label="Linked Features"
              value={`${linkedFeatures.length} Features`}
              subValue="Functional Scope"
              color="text-orange-400"
            />
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-1 border-b border-white/5 pb-px">
            <TabButton 
              active={activeTab === 'documentation'} 
              onClick={() => setActiveTab('documentation')}
              icon={<FileText size={16} />}
              label="Page Specification"
            />
            <TabButton 
              active={activeTab === 'components'} 
              onClick={() => setActiveTab('components')}
              icon={<ComponentIcon size={16} />}
              label="Component Tree"
            />
            <TabButton 
              active={activeTab === 'features'} 
              onClick={() => setActiveTab('features')}
              icon={<Zap size={16} />}
              label="Functional Scope"
            />
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === 'documentation' && (
                <motion.div
                  key="documentation"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  {page.documentation ? (
                    <div className="prose prose-invert prose-indigo max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-6 prose-p:text-gray-400 prose-p:leading-relaxed prose-li:text-gray-400 prose-strong:text-white prose-code:text-indigo-400 prose-code:bg-indigo-500/10 prose-code:px-1 prose-code:rounded">
                      <ReactMarkdown>{page.documentation}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="py-20 text-center rounded-[2rem] bg-[#141414] border border-white/5">
                      <FileText size={48} className="mx-auto mb-4 text-gray-700" />
                      <h3 className="text-xl font-bold text-white mb-2">No Documentation Yet</h3>
                      <p className="text-gray-500 max-w-md mx-auto mb-8">
                        Generate a professional UI/UX specification for this page to help developers build it accurately.
                      </p>
                      <button 
                        onClick={() => onGenerateDocumentation(page)}
                        disabled={isGenerating === 'documentation'}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 mx-auto"
                      >
                        {isGenerating === 'documentation' ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        Generate Documentation Spec
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'components' && (
                <motion.div
                  key="components"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {linkedComponents.length > 0 ? (
                    linkedComponents.map(component => (
                      <ComponentSpecCard key={component.id} component={component} />
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center rounded-[2rem] bg-[#141414] border border-white/5">
                      <ComponentIcon size={48} className="mx-auto mb-4 text-gray-700" />
                      <h3 className="text-xl font-bold text-white mb-2">No Components Linked</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Link reusable components to this page to define its structural building blocks.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'features' && (
                <motion.div
                  key="features"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {linkedFeatures.length > 0 ? (
                    linkedFeatures.map(feature => (
                      <FeatureSpecCard key={feature.id} feature={feature} />
                    ))
                  ) : (
                    <div className="py-20 text-center rounded-[2rem] bg-[#141414] border border-white/5">
                      <Zap size={48} className="mx-auto mb-4 text-gray-700" />
                      <h3 className="text-xl font-bold text-white mb-2">No Features Linked</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Link features to this page to define its functional scope and business logic.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetadataCard({ icon, label, value, subValue, color }: { icon: React.ReactNode, label: string, value: string, subValue: string, color: string }) {
  return (
    <div className="p-5 rounded-3xl bg-[#141414] border border-white/5 flex items-start gap-4">
      <div className={cn("p-3 rounded-2xl bg-white/5", color)}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-bold text-white mb-0.5">{value}</p>
        <p className="text-[10px] text-gray-600 font-medium">{subValue}</p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-4 border-b-2 transition-all whitespace-nowrap",
        active 
          ? "border-indigo-500 text-white bg-indigo-500/5" 
          : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5"
      )}
    >
      {icon}
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}

function ComponentSpecCard({ component }: { component: UIComponent }) {
  return (
    <div className="p-6 rounded-3xl bg-[#141414] border border-white/5 hover:border-white/10 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <ComponentIcon size={18} />
          </div>
          <h4 className="font-bold text-white">{component.name}</h4>
        </div>
        <span className="px-2 py-1 rounded-lg bg-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          {component.type}
        </span>
      </div>
      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{component.purpose}</p>
      <div className="flex items-center gap-2 text-[10px] text-gray-500">
        <Info size={12} />
        <span>Reusable Library Component</span>
      </div>
    </div>
  );
}

function FeatureSpecCard({ feature }: { feature: Feature }) {
  return (
    <div className="p-6 rounded-3xl bg-[#141414] border border-white/5 hover:border-white/10 transition-all flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
          <Zap size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded border border-indigo-400/20">
              {feature.featureCode}
            </span>
            <h4 className="font-bold text-white">{feature.title}</h4>
          </div>
          <p className="text-sm text-gray-500 line-clamp-1">{feature.nonTechnicalDescription}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className={cn(
          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
          feature.status === 'Completed' ? "bg-emerald-500/10 text-emerald-400" :
          feature.status === 'In Progress' ? "bg-blue-500/10 text-blue-400" :
          "bg-gray-500/10 text-gray-400"
        )}>
          {feature.status}
        </div>
        <ChevronRight size={18} className="text-gray-700 group-hover:text-white transition-colors" />
      </div>
    </div>
  );
}


