import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { FileText, Save, History, Plus, ChevronRight, FileCode, Search, Loader2, Check, Sparkles } from 'lucide-react';
import { Project } from '../types';
import { useToast } from './Toast';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { AuditService, AuditAction } from '../services/audit';

interface ProjectSpecificationsProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => Promise<void>;
  onBack: () => void;
}

export default function ProjectSpecifications({ project, onUpdate, onBack }: ProjectSpecificationsProps) {
  const [activeSpec, setActiveSpec] = useState('vision');
  const [appVision, setAppVision] = useState(project.appVision || '');
  const [prd, setPrd] = useState(project.prd || '');
  const [techArch, setTechArch] = useState(project.techArch || '');
  const [uxStrategy, setUxStrategy] = useState(project.uxStrategy || '');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { showToast } = useToast();
  
  const specs = [
    { id: 'vision', title: 'App Vision', icon: Sparkles, lastUpdated: 'Real-time' },
    { id: 'prd', title: 'Product Requirements Document', icon: FileText, lastUpdated: 'Real-time' },
    { id: 'tech', title: 'Technical Architecture', icon: FileCode, lastUpdated: 'Real-time' },
    { id: 'ux', title: 'UX Strategy & Flow', icon: History, lastUpdated: 'Real-time' },
  ];

  // Audit Log Helper
  const logChange = useCallback(async (action: AuditAction | string, details: any) => {
    await AuditService.log(action, details, project.id);
  }, [project.id]);

  // Autosave Logic
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

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="p-4 lg:p-8 border-b border-white/5 flex items-center justify-between bg-[#0f0f0f]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <FileText className="text-indigo-400" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Project Specifications</h2>
            <p className="text-xs text-gray-500">Define the core DNA of {project.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 mr-2">
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
          <button 
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 lg:w-80 border-r border-white/5 p-4 overflow-y-auto hidden md:block">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search specs..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">Core Definitions</p>
            {specs.map(spec => (
              <button
                key={spec.id}
                onClick={() => setActiveSpec(spec.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${
                  activeSpec === spec.id ? 'bg-indigo-600/10 text-indigo-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <spec.icon size={18} />
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-bold truncate">{spec.title}</p>
                  <p className="text-[10px] opacity-60">{spec.lastUpdated}</p>
                </div>
                <ChevronRight size={14} className={`ml-auto transition-transform ${activeSpec === spec.id ? 'rotate-90' : ''}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-12">
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
              {activeSpec === 'vision' && (
                <textarea 
                  className="w-full min-h-[600px] bg-transparent border-none text-gray-300 text-xl leading-relaxed focus:outline-none resize-none placeholder:text-gray-700"
                  placeholder="Describe the grand vision for this application. What problem does it solve? Who is it for? What makes it unique?"
                  value={appVision}
                  onChange={(e) => setAppVision(e.target.value)}
                />
              )}
              {activeSpec === 'prd' && (
                <textarea 
                  className="w-full min-h-[600px] bg-transparent border-none text-gray-300 text-xl leading-relaxed focus:outline-none resize-none placeholder:text-gray-700"
                  placeholder="Write the Product Requirements Document here..."
                  value={prd}
                  onChange={(e) => setPrd(e.target.value)}
                />
              )}
              {activeSpec === 'tech' && (
                <textarea 
                  className="w-full min-h-[600px] bg-transparent border-none text-gray-300 text-xl leading-relaxed focus:outline-none resize-none placeholder:text-gray-700"
                  placeholder="Define the Technical Architecture here..."
                  value={techArch}
                  onChange={(e) => setTechArch(e.target.value)}
                />
              )}
              {activeSpec === 'ux' && (
                <textarea 
                  className="w-full min-h-[600px] bg-transparent border-none text-gray-300 text-xl leading-relaxed focus:outline-none resize-none placeholder:text-gray-700"
                  placeholder="Describe the UX Strategy & Flow here..."
                  value={uxStrategy}
                  onChange={(e) => setUxStrategy(e.target.value)}
                />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
