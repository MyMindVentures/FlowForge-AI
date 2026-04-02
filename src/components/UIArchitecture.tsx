import React, { useState } from 'react';
import { 
  Layout as LayoutIcon, 
  FileCode, 
  Palette, 
  Plus, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft,
  Layers,
  Smartphone,
  Monitor,
  Component as ComponentIcon,
  Search,
  Filter,
  ExternalLink,
  Info,
  Edit2,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, UIPage, UIComponent, UILayout, UIStyleSystem, Feature } from '../types';
import { AgentOrchestrator, AgentTaskType } from '../services/ai/orchestrator';
import { useToast } from './Toast';
import { cn, resizeBase64Image } from '../lib/utils';

// Modals
import PageModal from './ui-architecture/PageModal';
import ComponentModal from './ui-architecture/ComponentModal';
import LayoutModal from './ui-architecture/LayoutModal';
import StyleModal from './ui-architecture/StyleModal';

// Views
import PageVisualGrid from './ui-architecture/PageVisualGrid';
import PageDetailView from './ui-architecture/PageDetailView';

interface UIArchitectureProps {
  project: Project;
  pages: UIPage[];
  components: UIComponent[];
  layouts: UILayout[];
  features: Feature[];
  styleSystem: UIStyleSystem | null;
  onBack: () => void;
  onAddPage: (page: Omit<UIPage, 'id'>) => Promise<string>;
  onUpdatePage: (id: string, updates: Partial<UIPage>) => Promise<void>;
  onAddComponent: (component: Omit<UIComponent, 'id'>) => Promise<string>;
  onUpdateComponent: (id: string, updates: Partial<UIComponent>) => Promise<void>;
  onUpdateStyleSystem: (updates: Partial<UIStyleSystem>) => Promise<void>;
  onAddLayout: (layout: Omit<UILayout, 'id'>) => Promise<string>;
  onUpdateLayout: (id: string, updates: Partial<UILayout>) => Promise<void>;
}

export default function UIArchitecture({
  project,
  pages,
  components,
  layouts,
  features,
  styleSystem,
  onBack,
  onAddPage,
  onUpdatePage,
  onAddComponent,
  onUpdateComponent,
  onUpdateStyleSystem,
  onAddLayout,
  onUpdateLayout
}: UIArchitectureProps) {
  const [activeTab, setActiveTab] = useState<'pages' | 'components' | 'layouts' | 'styling'>('pages');
  const [viewMode, setViewMode] = useState<'registry' | 'visuals'>('registry');
  const [selectedPage, setSelectedPage] = useState<UIPage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPage, setIsGeneratingPage] = useState<string | null>(null);
  const { showToast } = useToast();

  // Modal states
  const [isPageModalOpen, setIsPageModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<UIPage | undefined>();

  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<UIComponent | undefined>();

  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [editingLayout, setEditingLayout] = useState<UILayout | undefined>();

  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);

  const handleGenerateArchitecture = async () => {
    setIsGenerating(true);
    try {
      const result = await AgentOrchestrator.runTask(AgentTaskType.GENERATE_UI_ARCHITECTURE, {
        project,
        features: features
      });

      if (result) {
        // Apply generated architecture
        if (result.pages) {
          for (const p of result.pages) {
            await onAddPage({
              projectId: project.id,
              name: p.name,
              path: p.path,
              purpose: p.purpose,
              layoutId: '', // AI doesn't know IDs yet
              linkedFeatureIds: [],
              componentIds: [],
              mobilePattern: 'Stacked',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        }

        if (result.components) {
          for (const c of result.components) {
            await onAddComponent({
              projectId: project.id,
              name: c.name,
              type: (c.type?.toLowerCase() || 'card') as any,
              description: c.purpose,
              purpose: c.purpose,
              props: {},
              usageGuidelines: c.usageGuidelines || '',
              linkedFeatureIds: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        }

        if (result.styleSystem) {
          await onUpdateStyleSystem(result.styleSystem);
        }

        showToast('UI Architecture generated successfully!', 'success');
      }
    } catch (error) {
      showToast('Failed to generate UI architecture', 'error');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePageVisual = async (page: UIPage) => {
    setIsGeneratingPage(page.id);
    try {
      const prompt = await AgentOrchestrator.runTask(AgentTaskType.GENERATE_PAGE_VISUAL_PROMPT, {
        page,
        project,
        layout: layouts.find(l => l.id === page.layoutId),
        components: components.filter(c => page.componentIds?.includes(c.id)),
        features: features.filter(f => page.linkedFeatureIds?.includes(f.id)),
        styleSystem
      });

      if (prompt) {
        const visualUrl = await AgentOrchestrator.runTask(AgentTaskType.GENERATE_FEATURE_VISUAL, {
          prompt,
          projectId: project.id
        });

        if (visualUrl) {
          // Resize image to stay within Firestore 1MB limit
          const resizedUrl = await resizeBase64Image(visualUrl);
          
          await onUpdatePage(page.id, { 
            visualUrl: resizedUrl, 
            visualPrompt: prompt,
            updatedAt: new Date().toISOString()
          });
          showToast('Page visual generated!', 'success');
        }
      }
    } catch (error) {
      showToast('Failed to generate page visual', 'error');
      console.error(error);
    } finally {
      setIsGeneratingPage(null);
    }
  };

  const handleGeneratePageDocumentation = async (page: UIPage) => {
    setIsGeneratingPage(page.id);
    try {
      const documentation = await AgentOrchestrator.runTask(AgentTaskType.GENERATE_PAGE_DOCUMENTATION, {
        page,
        project,
        layout: layouts.find(l => l.id === page.layoutId),
        components: components.filter(c => page.componentIds?.includes(c.id)),
        features: features.filter(f => page.linkedFeatureIds?.includes(f.id)),
        styleSystem
      });

      if (documentation) {
        await onUpdatePage(page.id, { 
          documentation,
          updatedAt: new Date().toISOString()
        });
        showToast('Page documentation updated!', 'success');
      }
    } catch (error) {
      showToast('Failed to generate documentation', 'error');
      console.error(error);
    } finally {
      setIsGeneratingPage(null);
    }
  };

  if (selectedPage) {
    return (
      <PageDetailView 
        page={selectedPage}
        project={project}
        layout={layouts.find(l => l.id === selectedPage.layoutId)}
        components={components}
        features={features}
        styleSystem={styleSystem}
        onBack={() => setSelectedPage(null)}
        onUpdatePage={onUpdatePage}
        onGenerateDocumentation={handleGeneratePageDocumentation}
        onGenerateVisual={handleGeneratePageVisual}
        isGenerating={isGeneratingPage === selectedPage.id ? 'visual' : null}
      />
    );
  }

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
            <h1 className="text-xl font-bold tracking-tight">UI Architecture</h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Project: {project.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateArchitecture}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
          >
            {isGenerating ? (
              <Sparkles size={16} className="animate-pulse" />
            ) : (
              <Sparkles size={16} />
            )}
            {isGenerating ? 'Generating...' : 'AI Architect'}
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 px-6 py-2 bg-[#0d0d0d] border-b border-white/5 overflow-x-auto no-scrollbar">
        <TabButton 
          active={activeTab === 'pages'} 
          onClick={() => setActiveTab('pages')}
          icon={<FileCode size={16} />}
          label="App Pages"
          count={pages.length}
        />
        <TabButton 
          active={activeTab === 'components'} 
          onClick={() => setActiveTab('components')}
          icon={<ComponentIcon size={16} />}
          label="Components"
          count={components.length}
        />
        <TabButton 
          active={activeTab === 'layouts'} 
          onClick={() => setActiveTab('layouts')}
          icon={<LayoutIcon size={16} />}
          label="Layouts"
          count={layouts.length}
        />
        <TabButton 
          active={activeTab === 'styling'} 
          onClick={() => setActiveTab('styling')}
          icon={<Palette size={16} />}
          label="Styling System"
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'pages' && (
            <motion.div
              key="pages"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <FileCode className="text-indigo-400" size={20} />
                    App Pages Registry
                  </h2>
                  <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/5">
                    <button 
                      onClick={() => setViewMode('registry')}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                        viewMode === 'registry' ? "bg-indigo-500 text-white" : "text-gray-500 hover:text-gray-300"
                      )}
                    >
                      Registry
                    </button>
                    <button 
                      onClick={() => setViewMode('visuals')}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                        viewMode === 'visuals' ? "bg-indigo-500 text-white" : "text-gray-500 hover:text-gray-300"
                      )}
                    >
                      Visual Overview
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => { setEditingPage(undefined); setIsPageModalOpen(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors border border-white/5"
                >
                  <Plus size={14} />
                  Add Page
                </button>
              </div>

              {viewMode === 'registry' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pages.length > 0 ? (
                    pages.map(page => (
                      <PageCard 
                        key={page.id} 
                        page={page} 
                        onEdit={() => { setEditingPage(page); setIsPageModalOpen(true); }}
                        onClick={() => setSelectedPage(page)}
                      />
                    ))
                  ) : (
                    <EmptyState 
                      icon={<FileCode size={48} />}
                      title="No pages defined yet"
                      description="Use the AI Architect to map your features to app pages automatically."
                      onAction={handleGenerateArchitecture}
                      actionLabel="Generate Pages"
                    />
                  )}
                </div>
              ) : (
                <PageVisualGrid 
                  pages={pages}
                  layouts={layouts}
                  components={components}
                  features={features}
                  onPageClick={setSelectedPage}
                  onRegenerateVisual={handleGeneratePageVisual}
                  isGenerating={isGeneratingPage}
                />
              )}
            </motion.div>
          )}

          {activeTab === 'components' && (
            <motion.div
              key="components"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ComponentIcon className="text-indigo-400" size={20} />
                  Reusable Components
                </h2>
                <button 
                  onClick={() => { setEditingComponent(undefined); setIsComponentModalOpen(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors border border-white/5"
                >
                  <Plus size={14} />
                  Add Component
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {components.length > 0 ? (
                  components.map(component => (
                    <ComponentCard 
                      key={component.id} 
                      component={component} 
                      onEdit={() => { setEditingComponent(component); setIsComponentModalOpen(true); }}
                    />
                  ))
                ) : (
                  <EmptyState 
                    icon={<ComponentIcon size={48} />}
                    title="No components defined"
                    description="Build a reusable component library to ensure consistency across your app."
                    onAction={handleGenerateArchitecture}
                    actionLabel="Generate Components"
                  />
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'layouts' && (
            <motion.div
              key="layouts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <LayoutIcon className="text-indigo-400" size={20} />
                  Layout System
                </h2>
                <button 
                  onClick={() => { setEditingLayout(undefined); setIsLayoutModalOpen(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors border border-white/5"
                >
                  <Plus size={14} />
                  Add Layout
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {layouts.length > 0 ? (
                  layouts.map(layout => (
                    <LayoutCard 
                      key={layout.id} 
                      layout={layout} 
                      onEdit={() => { setEditingLayout(layout); setIsLayoutModalOpen(true); }}
                    />
                  ))
                ) : (
                  <div className="col-span-full p-12 rounded-3xl bg-[#141414] border border-white/5 text-center">
                    <LayoutIcon size={48} className="mx-auto mb-4 text-gray-600" />
                    <h3 className="text-xl font-bold mb-2">Standard Layouts</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      We use a set of standard layouts to maintain structural consistency.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
                      {['Auth', 'Dashboard', 'Detail', 'Chat', 'Modal', 'Empty'].map(type => (
                        <div key={type} className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm font-bold text-gray-400">
                          {type}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'styling' && (
            <motion.div
              key="styling"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Palette className="text-indigo-400" size={20} />
                  Design Rules & Styling
                </h2>
                <button 
                  onClick={() => setIsStyleModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors border border-white/5"
                >
                  <Edit2 size={14} />
                  Edit Design System
                </button>
              </div>

              {styleSystem ? (
                <StyleSystemView styleSystem={styleSystem} onEdit={() => setIsStyleModalOpen(true)} />
              ) : (
                <EmptyState 
                  icon={<Palette size={48} />}
                  title="Design system not initialized"
                  description="Define your brand colors, typography, and spacing rules."
                  onAction={handleGenerateArchitecture}
                  actionLabel="Initialize Design System"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <PageModal 
        isOpen={isPageModalOpen}
        onClose={() => setIsPageModalOpen(false)}
        onSave={async (data) => {
          if (editingPage) {
            await onUpdatePage(editingPage.id, data);
          } else {
            await onAddPage(data);
          }
        }}
        layouts={layouts}
        initialData={editingPage}
      />

      <ComponentModal
        isOpen={isComponentModalOpen}
        onClose={() => setIsComponentModalOpen(false)}
        onSave={async (data) => {
          if (editingComponent) {
            await onUpdateComponent(editingComponent.id, data);
          } else {
            await onAddComponent(data);
          }
        }}
        initialData={editingComponent}
      />

      <LayoutModal
        isOpen={isLayoutModalOpen}
        onClose={() => setIsLayoutModalOpen(false)}
        onSave={async (data) => {
          if (editingLayout) {
            await onUpdateLayout(editingLayout.id, data);
          } else {
            await onAddLayout(data);
          }
        }}
        initialData={editingLayout}
      />

      <StyleModal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        onSave={onUpdateStyleSystem}
        initialData={styleSystem}
      />
    </div>
  );
}

function TabButton({ active, onClick, icon, label, count }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, count?: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap",
        active 
          ? "border-indigo-500 text-white bg-indigo-500/5" 
          : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5"
      )}
    >
      {icon}
      <span className="text-sm font-bold">{label}</span>
      {count !== undefined && (
        <span className={cn(
          "px-1.5 py-0.5 rounded-md text-[10px] font-bold",
          active ? "bg-indigo-500 text-white" : "bg-white/10 text-gray-400"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

function PageCard({ page, onEdit, onClick }: { page: UIPage, onEdit: () => void, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="group p-5 rounded-3xl bg-[#141414] border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
          <FileCode size={24} />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <Edit2 size={16} />
          </button>
          <span className="px-2 py-1 rounded-lg bg-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            {page.path}
          </span>
        </div>
      </div>
      
      <h3 className="text-lg font-bold mb-1 group-hover:text-indigo-400 transition-colors">{page.name}</h3>
      <p className="text-sm text-gray-500 line-clamp-2 mb-4">{page.purpose}</p>
      
      <div className="flex flex-wrap gap-1.5 mb-4">
        {page.componentIds.slice(0, 3).map(id => (
          <span key={id} className="px-2 py-1 rounded-md bg-white/5 text-[10px] text-gray-400 border border-white/5">
            {id}
          </span>
        ))}
        {page.componentIds.length > 3 && (
          <span className="px-2 py-1 rounded-md bg-white/5 text-[10px] text-gray-500">
            +{page.componentIds.length - 3} more
          </span>
        )}
      </div>

      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] font-mono text-gray-600">{page.path}</span>
        <div className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
}

function ComponentCard({ component, onEdit }: { component: UIComponent, onEdit: () => void }) {
  return (
    <div className="group p-5 rounded-3xl bg-[#141414] border border-white/5 hover:border-emerald-500/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
          <ComponentIcon size={24} />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onEdit}
            className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <Edit2 size={16} />
          </button>
          <span className="px-2 py-1 rounded-lg bg-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            {component.type}
          </span>
        </div>
      </div>
      
      <h3 className="text-lg font-bold mb-1 group-hover:text-emerald-400 transition-colors">{component.name}</h3>
      <p className="text-sm text-gray-500 line-clamp-2 mb-4">{component.purpose}</p>
      
      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
          <Info size={12} />
          <span>Usage guidelines defined</span>
        </div>
        <button className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function LayoutCard({ layout, onEdit }: { layout: UILayout, onEdit: () => void }) {
  return (
    <div className="group p-5 rounded-3xl bg-[#141414] border border-white/5 hover:border-orange-500/30 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
            <LayoutIcon size={20} />
          </div>
          <h3 className="font-bold">{layout.name}</h3>
        </div>
        <button 
          onClick={onEdit}
          className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        >
          <Edit2 size={16} />
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-4">{layout.description}</p>
      <div className="p-4 rounded-2xl bg-black/20 border border-white/5 aspect-video flex items-center justify-center">
        <div className="w-full h-full border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center">
          <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Layout Preview</span>
        </div>
      </div>
    </div>
  );
}

function StyleSystemView({ styleSystem, onEdit }: { styleSystem: UIStyleSystem, onEdit: () => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-6 rounded-3xl bg-[#141414] border border-white/5 relative group">
        <button 
          onClick={onEdit}
          className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        >
          <Edit2 size={16} />
        </button>
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <div className="w-2 h-6 bg-indigo-500 rounded-full" />
          Color Palette
        </h3>
        <div className="space-y-4">
          <ColorRow label="Primary" color={styleSystem.colors.primary} />
          <ColorRow label="Secondary" color={styleSystem.colors.secondary} />
          <ColorRow label="Accent" color={styleSystem.colors.accent} />
          <ColorRow label="Background" color={styleSystem.colors.background} />
          <ColorRow label="Surface" color={styleSystem.colors.surface} />
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-[#141414] border border-white/5">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <div className="w-2 h-6 bg-emerald-500 rounded-full" />
          Typography
        </h3>
        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Sans Serif</p>
            <p className="text-2xl font-sans" style={{ fontFamily: styleSystem.typography.fontSans }}>
              The quick brown fox jumps over the lazy dog.
            </p>
            <p className="text-xs text-gray-600 mt-1 font-mono">{styleSystem.typography.fontSans}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Monospace</p>
            <p className="text-2xl font-mono" style={{ fontFamily: styleSystem.typography.fontMono }}>
              {'const forge = () => "AI";'}
            </p>
            <p className="text-xs text-gray-600 mt-1 font-mono">{styleSystem.typography.fontMono}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorRow({ label, color }: { label: string, color: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl shadow-inner" style={{ backgroundColor: color }} />
        <div>
          <p className="text-sm font-bold">{label}</p>
          <p className="text-[10px] font-mono text-gray-500 uppercase">{color}</p>
        </div>
      </div>
      <button className="p-2 hover:bg-white/10 rounded-lg text-gray-500 transition-colors">
        <ExternalLink size={14} />
      </button>
    </div>
  );
}

function EmptyState({ icon, title, description, onAction, actionLabel }: { icon: React.ReactNode, title: string, description: string, onAction: () => void, actionLabel: string }) {
  return (
    <div className="col-span-full p-12 rounded-3xl bg-[#141414] border border-white/5 text-center">
      <div className="text-gray-600 mb-4 flex justify-center">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-6">{description}</p>
      <button
        onClick={onAction}
        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
      >
        <Sparkles size={18} />
        {actionLabel}
      </button>
    </div>
  );
}
