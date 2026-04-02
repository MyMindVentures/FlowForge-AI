import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Bot, Zap, Shield, Settings, Plus, Play, History, Search, ArrowLeft } from 'lucide-react';
import { Project } from '../types';
import { useToast } from './Toast';

interface AIAgentsProps {
  project: Project;
  onBack: () => void;
}

export default function AIAgents({ project, onBack }: AIAgentsProps) {
  const { showToast } = useToast();
  const agents = [
    { id: 'roadmap', name: 'Roadmap Specialist', role: 'Strategy & Planning', status: 'Active', icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { id: 'tech', name: 'Technical Architect', role: 'Implementation & Logic', status: 'Active', icon: Bot, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'marketing', name: 'Marketing Guru', role: 'Copywriting & GTM', status: 'Inactive', icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="p-4 lg:p-12 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">AI Agents</h2>
            <p className="text-gray-400 mt-1">Configure and manage AI agents for {project.name}</p>
          </div>
        </div>
        <button 
          onClick={() => showToast('Agent creation coming soon!', 'info')}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
        >
          <Plus size={20} />
          Create Agent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent, index) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 rounded-3xl bg-[#141414] border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 ${agent.bg} blur-3xl opacity-20 -mr-16 -mt-16 group-hover:opacity-40 transition-opacity`} />
            
            <div className="flex items-center justify-between mb-6">
              <div className={`w-12 h-12 rounded-2xl ${agent.bg} flex items-center justify-center`}>
                <agent.icon className={agent.color} size={24} />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{agent.status}</span>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{agent.name}</h3>
            <p className="text-sm text-gray-500 mb-6">{agent.role}</p>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => showToast(`Running ${agent.name}...`, 'info')}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all"
              >
                <Play size={16} className="text-indigo-400" />
                Run
              </button>
              <button 
                onClick={() => showToast(`${agent.name} settings coming soon!`, 'info')}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                <Settings size={18} />
              </button>
              <button 
                onClick={() => showToast(`${agent.name} history coming soon!`, 'info')}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                <History size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 p-8 rounded-3xl bg-indigo-600/5 border border-indigo-500/10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
            <Zap className="text-indigo-400" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Global AI Configuration</h3>
            <p className="text-sm text-gray-400">Manage model routing and system-wide prompt templates</p>
          </div>
          <button 
            onClick={() => showToast('Global configuration coming soon!', 'info')}
            className="ml-auto px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all"
          >
            Manage Config
          </button>
        </div>
      </div>
    </div>
  );
}
