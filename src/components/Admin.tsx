import React, { useState } from 'react';
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
  Plus,
  Trash2,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { where, orderBy, limit } from 'firebase/firestore';
import { AIModelConfig, PromptTemplate, APIKeyConfig, UsageLog, ErrorLog } from '../types';
import { cn } from '../lib/utils';
import { useFirestore } from '../hooks/useFirestore';
import LLMFunctionsManagement from './LLMFunctionsManagement';

type AdminTab = 'overview' | 'models' | 'prompts' | 'functions' | 'keys' | 'logs';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

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

  const toggleModel = async (modelId: string, currentStatus: boolean) => {
    try {
      await updateModel(modelId, { isEnabled: !currentStatus });
    } catch (error) {
      console.error('Error toggling model:', error);
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Total Users', value: '1,234', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
          { label: 'Active Models', value: models.filter(m => m.isEnabled).length.toString(), icon: Cpu, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Total Requests', value: usageLogs.length.toString(), icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Error Rate', value: usageLogs.length ? `${((errorLogs.length / usageLogs.length) * 100).toFixed(1)}%` : '0%', icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-400/10' }
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
            System Health
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-gray-300 font-medium text-sm">API Latency (avg)</span>
              <span className="text-emerald-400 font-bold text-sm">142ms</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-gray-300 font-medium text-sm">Model Availability</span>
              <span className="text-emerald-400 font-bold text-sm">100%</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-gray-300 font-medium text-sm">Token Usage (24h)</span>
              <span className="text-indigo-400 font-bold text-sm">42.5k</span>
            </div>
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <AlertCircle size={20} className="text-rose-400" />
            Recent Errors
          </h3>
          <div className="space-y-3">
            {errorLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                <p className="text-rose-400 font-bold text-xs uppercase tracking-widest mb-1">{log.errorCode}</p>
                <p className="text-white text-sm truncate">{log.errorMessage}</p>
                <p className="text-gray-600 text-[10px] mt-2">{new Date(log.timestamp).toLocaleString()}</p>
              </div>
            ))}
            {errorLogs.length === 0 && <p className="text-gray-500 text-center py-4">No recent errors</p>}
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

      {/* Tabs */}
      <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-2xl w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'models', label: 'Models', icon: Cpu },
          { id: 'prompts', label: 'Prompts', icon: FileCode },
          { id: 'functions', label: 'Functions', icon: Zap },
          { id: 'keys', label: 'API Keys', icon: Key },
          { id: 'logs', label: 'Logs', icon: Activity }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all",
                isActive ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'models' && renderModels()}
        {activeTab === 'prompts' && renderPrompts()}
        {activeTab === 'functions' && <LLMFunctionsManagement />}
        {activeTab === 'keys' && renderKeys()}
        {activeTab === 'logs' && (
          <div className="p-12 text-center bg-[#141414] border border-white/5 rounded-3xl">
            <Activity size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-white font-bold">Log Explorer</h3>
            <p className="text-gray-500 text-sm mt-2">Advanced log filtering and visualization coming soon.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
