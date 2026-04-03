import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Activity, 
  Settings, 
  ChevronRight, 
  Cpu, 
  FileCode, 
  Key, 
  BarChart3, 
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Zap,
  FileText,
  ListTodo,
  RefreshCw,
  Loader2,
  Layout
} from 'lucide-react';
import { motion } from 'motion/react';
import { where, orderBy, limit } from '../lib/db/firestoreCompat';
import { AIModelConfig, PromptTemplate, APIKeyConfig, UsageLog, ErrorLog, AuditLogEntry, Task, LLMFunction, PRDSection, AuditFinding, ReadinessCheck } from '../types';
import { cn } from '../lib/utils';
import { useFirestore } from '../hooks/useFirestore';
import { useProject } from '../context/ProjectContext';
import { SyncService } from '../services/SyncService';
import LLMFunctionsManagement from './LLMFunctionsManagement';
import FullPRD from './admin/FullPRD';
import Tasklist from './admin/Tasklist';
import IntegrityBadge from './IntegrityBadge';
import SyncIndicator from './SyncIndicator';

type AdminTab = 'overview' | 'prd' | 'tasklist' | 'audit' | 'readiness' | 'models' | 'prompts' | 'functions' | 'keys' | 'logs';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const { 
    selectedProject, 
    projects,
    setSelectedProject,
    features, 
    pages, 
    components, 
    layouts, 
    functions: projectFunctions,
    styleSystem,
    prdSections,
    auditFindings,
    readinessChecks,
    tasks: dbTasks,
    addPage,
    updatePage,
    addFeature,
    updateFeature,
    addComponent,
    updateComponent,
    addLayout,
    updateLayout,
    addPRDSection,
    addAuditFinding,
    updateAuditFinding,
    addReadinessCheck,
    updateReadinessCheck,
    addTask,
    updateTask,
    updateLLMFunction
  } = useProject();

  const { data: models, update: updateModel } = useFirestore<AIModelConfig>('admin/ai/models');
  const { data: prompts } = useFirestore<PromptTemplate>('admin/ai/prompts');
  const { data: keys } = useFirestore<APIKeyConfig>('admin/ai/keys');
  const { data: usageLogs } = useFirestore<UsageLog>(
    'admin/ai/usage', 
    [orderBy('timestamp', 'desc'), limit(50)]
  );
  const { data: errorLogs } = useFirestore<ErrorLog>(
    'admin/ai/errors', 
    [orderBy('timestamp', 'desc'), limit(50)]
  );
  const { data: functions } = useFirestore<LLMFunction>('admin/ai/functions');

  // Automatically select FlowForge AI project if no project is selected
  useEffect(() => {
    if (!selectedProject && projects.length > 0) {
      const flowForge = projects.find(p => p.name.toLowerCase().includes('flowforge'));
      if (flowForge) {
        setSelectedProject(flowForge);
      }
    }
  }, [projects, selectedProject, setSelectedProject]);

  const handleSync = async () => {
    if (!selectedProject) return;
    setIsSyncing(true);
    try {
      // Simulate a small delay for the "scan"
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { 
        tasks: newTasks,
        updatedPages,
        updatedComponents,
        updatedFeatures,
        updatedLayouts,
        updatedFunctions
      } = await SyncService.analyzeSyncState(
        selectedProject,
        features,
        pages,
        components,
        layouts,
        projectFunctions
      );
      
      setTasks(newTasks);

      // Update integrity status in Firestore
      for (const page of updatedPages) {
        await updatePage(page.id, { integrityStatus: page.integrityStatus });
      }
      for (const component of updatedComponents) {
        await updateComponent(component.id, { integrityStatus: component.integrityStatus });
      }
      for (const feature of updatedFeatures) {
        await updateFeature(feature.id, { integrityStatus: feature.integrityStatus });
      }
      for (const layout of updatedLayouts) {
        await updateLayout(layout.id, { integrityStatus: layout.integrityStatus });
      }
      for (const fn of updatedFunctions) {
        await updateLLMFunction(fn.id, { integrityStatus: fn.integrityStatus });
      }

    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReverseSync = async () => {
    if (!selectedProject) return;
    if (!confirm('This will update the project structure in the database to match the current codebase manifest. Continue?')) return;
    
    setIsSyncing(true);
    try {
      const { 
        pages: newPages, 
        components: newComponents, 
        features: newFeatures,
        prdSections: newPrdSections,
        auditFindings: newAuditFindings,
        readinessChecks: newReadinessChecks,
        tasks: newTasks,
        layouts: newLayouts
      } = SyncService.generateProjectFromCodebase(selectedProject.id);
      
      // Add missing layouts
      for (const layout of newLayouts) {
        if (!layouts.find(l => l.name === layout.name)) {
          await addLayout(layout);
        } else {
          const existing = layouts.find(l => l.name === layout.name);
          if (existing) {
            await updateLayout(existing.id, { integrityStatus: layout.integrityStatus });
          }
        }
      }

      // Add missing pages
      for (const page of newPages) {
        if (!pages.find(p => p.name === page.name)) {
          await addPage(page);
        } else {
          const existing = pages.find(p => p.name === page.name);
          if (existing) {
            await updatePage(existing.id, { integrityStatus: page.integrityStatus });
          }
        }
      }
      
      // Add missing components
      for (const component of newComponents) {
        if (!components.find(c => c.name === component.name)) {
          await addComponent(component);
        } else {
          const existing = components.find(c => c.name === component.name);
          if (existing) {
            await updateComponent(existing.id, { integrityStatus: component.integrityStatus });
          }
        }
      }

      // Add missing features
      for (const feature of newFeatures) {
        if (!features.find(f => f.featureCode === feature.featureCode)) {
          await addFeature(feature);
        } else {
          const existing = features.find(f => f.featureCode === feature.featureCode);
          if (existing) {
            await updateFeature(existing.id, { integrityStatus: feature.integrityStatus });
          }
        }
      }

      // Add missing PRD sections
      for (const section of newPrdSections) {
        if (!prdSections.find(s => s.title === section.title)) {
          await addPRDSection(section);
        }
      }

      // Add missing Audit findings
      for (const finding of newAuditFindings) {
        if (!auditFindings.find(f => f.title === finding.title)) {
          await addAuditFinding(finding);
        }
      }

      // Add missing Readiness checks
      for (const check of newReadinessChecks) {
        if (!readinessChecks.find(c => c.label === check.label)) {
          await addReadinessCheck(check);
        }
      }

      // Add missing Tasks
      for (const task of newTasks) {
        if (!dbTasks.find(t => t.title === task.title)) {
          await addTask(task);
        }
      }
      
      alert('Project data updated from codebase successfully!');
      handleSync();
    } catch (error) {
      console.error('Reverse sync failed:', error);
      alert('Failed to update project data.');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleModel = async (modelId: string, currentStatus: boolean) => {
    try {
      await updateModel(modelId, { isEnabled: !currentStatus });
    } catch (error) {
      console.error('Error toggling model:', error);
    }
  };

  const handleReadinessTest = async () => {
    if (!selectedProject) return;
    setIsSyncing(true);
    try {
      const { score, results, findings } = await SyncService.performProductionReadinessTest(selectedProject.id);
      
      // Update database with results
      for (const check of results) {
        await addReadinessCheck(check);
      }

      for (const finding of findings) {
        const existing = auditFindings.find(f => f.title === finding.title);
        if (!existing) {
          await addAuditFinding(finding);
        }
      }

      alert(`Production Readiness Test Completed! Score: ${score}%`);
    } catch (error) {
      console.error('Readiness test failed:', error);
      alert('Failed to perform readiness test.');
    } finally {
      setIsSyncing(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Project Pages', value: pages.length.toString(), icon: Layout, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
          { label: 'Active Features', value: features.filter(f => f.status === 'In Progress' || f.status === 'Completed').length.toString(), icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Sync Tasks', value: tasks.length.toString(), icon: ListTodo, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Failing Tasks', value: tasks.filter(t => t.status === 'failing').length.toString(), icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-400/10' }
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="p-6 rounded-3xl bg-[#141414] border border-white/5 shadow-xl">
              <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-4`}>
                <Icon className={stat.color} size={20} />
              </div>
              <p className="text-gray-500 text-xs font-medium mb-1 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Activity size={20} className="text-indigo-400" />
            Codebase Health
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-gray-300 font-medium text-sm">Implementation Coverage</span>
              <span className="text-emerald-400 font-bold text-sm">
                {pages.length > 0 ? `${Math.round(((pages.length - tasks.filter(t => t.relatedEntityType === 'page').length) / pages.length) * 100)}%` : '100%'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-gray-300 font-medium text-sm">Feature Sync Status</span>
              <span className="text-emerald-400 font-bold text-sm">
                {features.length > 0 ? `${Math.round(((features.length - tasks.filter(t => t.relatedEntityType === 'feature' && t.status === 'out_of_sync').length) / features.length) * 100)}%` : '100%'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-gray-300 font-medium text-sm">AI Function Readiness</span>
              <span className="text-indigo-400 font-bold text-sm">
                {projectFunctions.length > 0 ? `${Math.round((projectFunctions.filter(f => f.isEnabled).length / projectFunctions.length) * 100)}%` : '0%'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Shield size={20} className="text-emerald-400" />
            Database Truth Status
          </h3>
          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {pages.map(page => (
              <div key={page.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2">
                  <Layout size={14} className="text-gray-500" />
                  <span className="text-white text-sm font-medium">{page.name}</span>
                </div>
                <IntegrityBadge status={page.integrityStatus} />
              </div>
            ))}
            {features.slice(0, 5).map(feature => (
              <div key={feature.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-gray-500" />
                  <span className="text-white text-sm font-medium">{feature.title}</span>
                </div>
                <IntegrityBadge status={feature.integrityStatus} />
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <AlertCircle size={20} className="text-rose-400" />
            Critical Issues
          </h3>
          <div className="space-y-3">
            {tasks.filter(t => t.priority === 'Critical').slice(0, 3).map((task) => (
              <div key={task.id} className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                <p className="text-rose-400 font-bold text-xs uppercase tracking-widest mb-1">{task.status}</p>
                <p className="text-white text-sm truncate">{task.title}</p>
              </div>
            ))}
            {tasks.filter(t => t.priority === 'Critical').length === 0 && (
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-1">Status</p>
                <p className="text-white text-sm text-center py-4">No critical issues detected.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderModels = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Model Routing</h3>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
          <Plus size={18} />
          Add Model
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {models.map((model) => (
          <div key={model.id} className="p-6 rounded-3xl bg-[#141414] border border-white/5 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                model.isEnabled ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-500/10 text-gray-500"
              )}>
                <Cpu size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-white font-bold">{model.name}</h4>
                  {model.isDefault && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-bold uppercase">Default</span>
                  )}
                </div>
                <p className="text-gray-500 text-xs">{model.provider} • {model.modelId}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right hidden md:block">
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Priority</p>
                <p className="text-white font-bold">{model.priority}</p>
              </div>
              <button 
                onClick={() => toggleModel(model.id, model.isEnabled)}
                className={cn(
                  "w-12 h-6 rounded-full relative transition-all",
                  model.isEnabled ? "bg-emerald-500" : "bg-gray-700"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  model.isEnabled ? "right-1" : "left-1"
                )} />
              </button>
              <button className="text-gray-600 hover:text-white transition-colors">
                <Settings size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPrompts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Prompt Templates</h3>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
          <Plus size={18} />
          New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="p-6 rounded-3xl bg-[#141414] border border-white/5 space-y-4 group hover:border-indigo-500/30 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-white font-bold">{prompt.name}</h4>
                <p className="text-gray-500 text-xs mt-1">{prompt.description}</p>
              </div>
              <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] text-gray-400 font-bold">v{prompt.version}</span>
            </div>
            
            <div className="p-4 rounded-2xl bg-black/30 border border-white/5 font-mono text-[10px] text-gray-400 line-clamp-3">
              {prompt.systemInstruction}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                {prompt.variables.map(v => (
                  <span key={v} className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold">{`{{${v}}}`}</span>
                ))}
              </div>
              <button className="text-indigo-400 hover:text-indigo-300 text-xs font-bold flex items-center gap-1">
                Edit <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderKeys = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">API Key Management</h3>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
          <Plus size={18} />
          Add Key
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {keys.map((key) => (
          <div key={key.id} className="p-6 rounded-3xl bg-[#141414] border border-white/5 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center">
                <Key size={24} />
              </div>
              <div>
                <h4 className="text-white font-bold">{key.keyName}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-gray-500 text-xs font-mono">{key.maskedKey}</p>
                  <span className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                    key.status === 'active' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  )}>
                    {key.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right hidden md:block">
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Last Used</p>
                <p className="text-white font-bold text-xs">{new Date(key.lastUsed).toLocaleDateString()}</p>
              </div>
              <button className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const { data: auditLogs } = useFirestore<AuditLogEntry>(
    'admin/audit/logs',
    [orderBy('timestamp', 'desc'), limit(100)]
  );

  const renderLogs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">System Audit Logs</h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Activity size={14} />
          <span>Showing last 100 events</span>
        </div>
      </div>

      <div className="bg-[#141414] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">User</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Action</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-[10px] text-gray-500 font-mono">
                    {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 
                     log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Pending...'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                        {log.userEmail?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="text-xs text-gray-300">{log.userEmail}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border",
                      log.action.includes('CREATED') ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      log.action.includes('DELETED') ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                      log.action.includes('AI') ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                      "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[10px] text-gray-500 font-mono max-w-xs truncate" title={JSON.stringify(log.details)}>
                      {JSON.stringify(log.details)}
                    </div>
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic text-sm">
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">AI Control Center</h2>
          <p className="text-gray-400 mt-1">System-wide AI configuration and monitoring.</p>
        </div>
        <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
          <Shield size={24} />
        </div>
      </div>

      {/* Tabs & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-2xl w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'prd', label: 'Full PRD', icon: FileText },
            { id: 'tasklist', label: 'Tasklist', icon: ListTodo },
            { id: 'audit', label: 'Audit', icon: Shield },
            { id: 'readiness', label: 'Readiness', icon: CheckCircle2 },
            { id: 'models', label: 'Models', icon: Cpu },
            { id: 'prompts', label: 'Prompts', icon: FileCode },
            { id: 'functions', label: 'Functions', icon: Zap },
            { id: 'keys', label: 'API Keys', icon: Key },
            { id: 'logs', label: 'Audit Logs', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                  isActive ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                )}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {selectedProject && (
            <>
              <button
                onClick={handleReadinessTest}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-sm font-bold transition-all disabled:opacity-50"
              >
                <CheckCircle2 size={16} className={cn(isSyncing && "animate-spin")} />
                Run Readiness Test
              </button>
              <button
                onClick={handleReverseSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-sm font-bold transition-all disabled:opacity-50"
                title="Update project data from codebase manifest"
              >
                <RefreshCw size={16} className={cn(isSyncing && "animate-spin")} />
                Sync to DB
              </button>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-sm font-bold transition-all disabled:opacity-50"
              >
                {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Scan Code
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'overview' && renderOverview()}
        
        {activeTab === 'prd' && (
          selectedProject ? (
            <FullPRD 
              project={selectedProject}
              features={features}
              pages={pages}
              components={components}
              layouts={layouts}
              functions={functions}
              styleSystem={styleSystem}
              prdSections={prdSections}
            />
          ) : (
            <div className="p-20 text-center rounded-3xl bg-[#141414] border border-white/5 border-dashed">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                <FileText size={32} />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">No Project Selected</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">Please select a project from the dashboard to view its Full PRD.</p>
            </div>
          )
        )}

        {activeTab === 'tasklist' && (
          selectedProject ? (
            <Tasklist 
              tasks={dbTasks.length > 0 ? dbTasks : tasks} 
              onSync={handleSync} 
              isSyncing={isSyncing} 
            />
          ) : (
            <div className="p-20 text-center rounded-3xl bg-[#141414] border border-white/5 border-dashed">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                <ListTodo size={32} />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">No Project Selected</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">Please select a project from the dashboard to view its Tasklist.</p>
            </div>
          )
        )}

        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Audit Findings</h3>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold">New Finding</button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {auditFindings.map(finding => (
                <div key={finding.id} className="p-6 rounded-3xl bg-[#141414] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center",
                      finding.severity === 'Critical' ? "bg-rose-500/10 text-rose-400" :
                      finding.severity === 'High' ? "bg-amber-500/10 text-amber-400" :
                      "bg-indigo-500/10 text-indigo-400"
                    )}>
                      <Shield size={24} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{finding.title}</h4>
                      <p className="text-gray-500 text-xs mt-1">{finding.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold uppercase border",
                      finding.status === 'Open' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    )}>{finding.status}</span>
                    <span className="text-gray-500 text-xs font-medium">{finding.category}</span>
                  </div>
                </div>
              ))}
              {auditFindings.length === 0 && (
                <div className="p-12 text-center text-gray-500 italic">No audit findings recorded.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'readiness' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Production Readiness</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Overall Status:</span>
                <span className="text-emerald-400 font-bold text-sm">READY</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {readinessChecks.map(check => (
                <div key={check.id} className="p-6 rounded-3xl bg-[#141414] border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{check.category}</span>
                    {check.isPassed ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <AlertCircle size={18} className="text-rose-400" />
                    )}
                  </div>
                  <h4 className="text-white font-bold">{check.label}</h4>
                  <p className="text-gray-500 text-xs leading-relaxed">{check.description}</p>
                  {check.notes && (
                    <div className="p-3 rounded-xl bg-white/5 text-gray-400 text-[10px] italic">
                      {check.notes}
                    </div>
                  )}
                </div>
              ))}
              {readinessChecks.length === 0 && (
                <div className="col-span-2 p-12 text-center text-gray-500 italic">No readiness checks performed.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'models' && renderModels()}
        {activeTab === 'prompts' && renderPrompts()}
        {activeTab === 'functions' && <LLMFunctionsManagement />}
        {activeTab === 'keys' && renderKeys()}
        {activeTab === 'logs' && renderLogs()}
      </motion.div>
    </div>
  );
}
