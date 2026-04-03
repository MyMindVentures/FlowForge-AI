import React from 'react';
import { 
  FileText, 
  Layout, 
  Layers, 
  Zap, 
  Cpu, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { Project, Feature, UIPage, UIComponent, UILayout, LLMFunction, UIStyleSystem, PRDSection } from '../../types';
import { cn } from '../../lib/utils';

interface FullPRDProps {
  project: Project;
  features: Feature[];
  pages: UIPage[];
  components: UIComponent[];
  layouts: UILayout[];
  functions: LLMFunction[];
  styleSystem?: UIStyleSystem;
  prdSections?: PRDSection[];
}

export default function FullPRD({ 
  project, 
  features, 
  pages, 
  components, 
  layouts, 
  functions,
  styleSystem,
  prdSections = []
}: FullPRDProps) {
  
  const sections = [
    { id: 'vision', label: 'Product Vision', icon: FileText },
    { id: 'pages', label: 'App Structure', icon: Layout },
    { id: 'features', label: 'Features & Logic', icon: Zap },
    { id: 'ai', label: 'AI & Governance', icon: Cpu },
    { id: 'design', label: 'Design System', icon: Layers },
  ];

  const renderStatus = (status: string) => {
    const colors = {
      'Completed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'In Progress': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      'Pending': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      'Draft': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      'Active': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
    return (
      <span className={cn(
        "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border",
        colors[status as keyof typeof colors] || "bg-gray-500/10 text-gray-400 border-gray-500/20"
      )}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-white/10 shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-white tracking-tight">{project.name}</h1>
              {renderStatus(project.status)}
            </div>
            <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
              {project.description}
            </p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Last Updated</p>
            <p className="text-white font-bold">{new Date(project.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-white/5">
          {[
            { label: 'Pages', value: pages.length, icon: Layout },
            { label: 'Features', value: features.length, icon: Zap },
            { label: 'Components', value: components.length, icon: Layers },
            { label: 'AI Functions', value: functions.length, icon: Cpu },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                <stat.icon size={18} />
              </div>
              <div>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest">{stat.label}</p>
                <p className="text-white font-bold text-lg">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Shortcuts */}
      <div className="flex flex-wrap gap-3">
        {sections.map((s) => (
          <a 
            key={s.id} 
            href={`#${s.id}`}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm font-medium flex items-center gap-2"
          >
            <s.icon size={16} />
            {s.label}
          </a>
        ))}
        {prdSections.length > 0 && (
          <a 
            href="#custom-sections"
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm font-medium flex items-center gap-2"
          >
            <FileText size={16} />
            Detailed Requirements
          </a>
        )}
      </div>

      {/* Vision Section */}
      <section id="vision" className="scroll-mt-24 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <FileText size={20} />
          </div>
          <h2 className="text-2xl font-bold text-white">Product Vision</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#141414] border border-white/5 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Info size={18} className="text-indigo-400" />
              App Vision
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed italic">
              {project.appVision || "No vision statement defined yet."}
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-[#141414] border border-white/5 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield size={18} className="text-emerald-400" />
              AI Governance
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              The platform employs a multi-layered AI governance model, ensuring all generated content and logic adhere to founder-defined constraints and ethical guidelines.
            </p>
          </div>
        </div>
      </section>

      {/* App Structure Section */}
      <section id="pages" className="scroll-mt-24 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Layout size={20} />
          </div>
          <h2 className="text-2xl font-bold text-white">App Structure</h2>
        </div>
        
        <div className="space-y-8">
          {/* Pages */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page) => (
              <div key={page.id} className="p-6 rounded-2xl bg-[#141414] border border-white/5 hover:border-emerald-500/30 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-white font-bold group-hover:text-emerald-400 transition-colors">{page.name}</h4>
                    <p className="text-gray-500 text-[10px] font-mono mt-1">{page.path}</p>
                  </div>
                  <div className="p-2 bg-white/5 rounded-lg text-gray-500">
                    <ExternalLink size={14} />
                  </div>
                </div>
                <p className="text-gray-400 text-xs line-clamp-2 mb-4">{page.purpose}</p>
                <div className="flex flex-wrap gap-2">
                  {page.linkedFeatureIds.map(fid => {
                    const feature = features.find(f => f.id === fid);
                    return feature ? (
                      <span key={fid} className="px-2 py-0.5 rounded bg-indigo-500/5 text-indigo-400 text-[9px] font-bold uppercase tracking-widest border border-indigo-500/10">
                        {feature.featureCode}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Layouts & Components Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#141414] border border-white/5">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Active Layouts</h3>
              <div className="space-y-3">
                {layouts.map(layout => (
                  <div key={layout.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Layout size={14} />
                      </div>
                      <span className="text-white text-sm font-medium">{layout.name}</span>
                    </div>
                    <span className="text-gray-500 text-[10px] uppercase font-bold">{layout.type}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-[#141414] border border-white/5">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Core Components</h3>
              <div className="flex flex-wrap gap-2">
                {components.map(comp => (
                  <div key={comp.id} className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                    <Layers size={12} className="text-indigo-400" />
                    <span className="text-gray-300 text-xs font-medium">{comp.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="scroll-mt-24 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Zap size={20} />
          </div>
          <h2 className="text-2xl font-bold text-white">Features & Logic</h2>
        </div>
        
        <div className="space-y-4">
          {features.map((feature) => (
            <div key={feature.id} className="p-6 rounded-2xl bg-[#141414] border border-white/5 flex items-center justify-between group hover:bg-white/[0.02] transition-all">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <span className="text-xs font-bold">{feature.featureCode}</span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-white font-bold">{feature.title}</h4>
                    {renderStatus(feature.status)}
                  </div>
                  <p className="text-gray-500 text-xs max-w-xl line-clamp-1">{feature.nonTechnicalDescription}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right hidden lg:block">
                  <p className="text-gray-600 text-[10px] uppercase tracking-widest mb-1">Priority</p>
                  <p className={cn(
                    "text-xs font-bold",
                    feature.priority === 'Critical' ? "text-rose-400" :
                    feature.priority === 'High' ? "text-amber-400" :
                    "text-gray-400"
                  )}>{feature.priority}</p>
                </div>
                <button className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Section */}
      <section id="ai" className="scroll-mt-24 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Cpu size={20} />
          </div>
          <h2 className="text-2xl font-bold text-white">AI & Governance</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {functions.map(fn => (
            <div key={fn.id} className="p-6 rounded-2xl bg-[#141414] border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <Zap size={16} className="text-purple-400" />
                  {fn.name}
                </h4>
                <span className={cn(
                  "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest",
                  fn.isEnabled ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-500/10 text-gray-500"
                )}>
                  {fn.isEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">{fn.description}</p>
              <div className="pt-4 border-t border-white/5">
                <p className="text-gray-600 text-[10px] uppercase tracking-widest mb-2">Parameters</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(fn.parameters.properties).map(p => (
                    <span key={p} className="px-2 py-1 rounded bg-white/5 text-gray-400 text-[10px] font-mono">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Custom PRD Sections */}
      {prdSections.length > 0 && (
        <section id="custom-sections" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <FileText size={20} />
            </div>
            <h2 className="text-2xl font-bold text-white">Detailed Requirements</h2>
          </div>
          <div className="space-y-8">
            {prdSections.sort((a, b) => a.order - b.order).map((section) => (
              <div key={section.id} className="p-8 rounded-3xl bg-[#141414] border border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{section.title}</h3>
                  <span className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border",
                    section.status === 'Finalized' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  )}>{section.status}</span>
                </div>
                <div className="prose prose-invert max-w-none text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </div>
                {section.linkedFeatureIds.length > 0 && (
                  <div className="pt-6 border-t border-white/5">
                    <p className="text-gray-600 text-[10px] uppercase tracking-widest mb-3">Linked Features</p>
                    <div className="flex flex-wrap gap-2">
                      {section.linkedFeatureIds.map(fid => {
                        const feature = features.find(f => f.id === fid || f.featureCode === fid);
                        return feature ? (
                          <div key={fid} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                            <Zap size={12} className="text-indigo-400" />
                            <span className="text-white text-xs font-medium">{feature.title}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Design System Section */}
      {styleSystem && (
        <section id="design" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Layers size={20} />
            </div>
            <h2 className="text-2xl font-bold text-white">Design System</h2>
          </div>
          
          <div className="p-8 rounded-3xl bg-[#141414] border border-white/5 grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Color Palette</h3>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(styleSystem.colors).map(([name, value]) => (
                  <div key={name} className="space-y-2">
                    <div className="w-full aspect-square rounded-xl border border-white/10" style={{ backgroundColor: value }} />
                    <p className="text-[10px] text-gray-500 font-bold uppercase text-center">{name}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Typography</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-[10px] uppercase mb-1">Sans Serif</p>
                  <p className="text-white font-bold" style={{ fontFamily: styleSystem.typography.fontSans }}>Inter / UI Sans</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px] uppercase mb-1">Monospace</p>
                  <p className="text-white font-mono" style={{ fontFamily: styleSystem.typography.fontMono }}>JetBrains Mono</p>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-gray-500 text-[10px] uppercase mb-2">Scale Preview</p>
                  <div className="space-y-2">
                    <p className="text-white text-2xl font-bold">Heading 1</p>
                    <p className="text-white text-xl font-bold">Heading 2</p>
                    <p className="text-white text-lg font-bold">Heading 3</p>
                    <p className="text-gray-400 text-sm">Body text sample</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Global Rules</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-gray-300 text-xs font-medium mb-1">Theme Mode</p>
                  <p className="text-indigo-400 font-bold text-sm">{styleSystem.darkMode ? 'Dark First' : 'Light First'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-gray-300 text-xs font-medium mb-1">Spacing Unit</p>
                  <p className="text-indigo-400 font-bold text-sm">{styleSystem.spacing.unit}px Base</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-gray-300 text-xs font-medium mb-1">Scale Ratio</p>
                  <p className="text-indigo-400 font-bold text-sm">{styleSystem.typography.scale}x</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}


