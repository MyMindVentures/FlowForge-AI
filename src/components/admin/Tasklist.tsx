import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Shield, 
  Zap, 
  Layout, 
  Layers, 
  Cpu, 
  Filter, 
  Search, 
  ArrowUpRight, 
  MoreVertical,
  ChevronRight,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { Task, SyncStatus } from '../../types';
import { cn } from '../../lib/utils';

interface TasklistProps {
  tasks: Task[];
  onSync: () => void;
  isSyncing: boolean;
}

export default function Tasklist({ tasks, onSync, isSyncing }: TasklistProps) {
  const [filter, setFilter] = React.useState<SyncStatus | 'all'>('all');
  const [search, setSearch] = React.useState('');

  const filteredTasks = tasks.filter(t => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                         t.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: tasks.length,
    failing: tasks.filter(t => t.status === 'failing').length,
    planned: tasks.filter(t => t.status === 'planned').length,
    outOfSync: tasks.filter(t => t.status === 'out_of_sync').length,
    implemented: tasks.filter(t => t.status === 'implemented').length,
  };

  const getStatusIcon = (status: SyncStatus) => {
    switch (status) {
      case 'implemented': return <CheckCircle2 className="text-emerald-400" size={18} />;
      case 'failing': return <AlertCircle className="text-rose-400" size={18} />;
      case 'blocked': return <Shield className="text-amber-400" size={18} />;
      case 'out_of_sync': return <RefreshCw className="text-indigo-400" size={18} />;
      default: return <Clock className="text-gray-500" size={18} />;
    }
  };

  const getStatusLabel = (status: SyncStatus) => {
    switch (status) {
      case 'implemented': return 'Done';
      case 'failing': return 'Failing';
      case 'blocked': return 'Blocked';
      case 'out_of_sync': return 'Out of Sync';
      case 'planned': return 'Planned';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'High': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Medium': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getEntityIcon = (type?: string) => {
    switch (type) {
      case 'page': return <Layout size={12} />;
      case 'feature': return <Zap size={12} />;
      case 'component': return <Layers size={12} />;
      case 'function': return <Cpu size={12} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Header */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Tasks', value: stats.total, color: 'text-white', bg: 'bg-white/5' },
          { label: 'Failing', value: stats.failing, color: 'text-rose-400', bg: 'bg-rose-400/10' },
          { label: 'Planned', value: stats.planned, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Out of Sync', value: stats.outOfSync, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
          { label: 'Done', value: stats.implemented, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        ].map((stat) => (
          <div key={stat.label} className={cn("p-6 rounded-3xl border border-white/5 shadow-xl", stat.bg)}>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#141414] border border-white/5">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/30 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 bg-black/30 border border-white/5 rounded-xl p-1">
            {['all', 'planned', 'implemented', 'failing', 'blocked', 'out_of_sync'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s as any)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                  filter === s ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                )}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
        <button 
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
        >
          {isSyncing ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
          Sync Codebase
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <motion.div 
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-[#141414] border border-white/5 hover:border-indigo-500/30 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getStatusIcon(task.status)}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-white font-bold text-lg">{task.title}</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border",
                      getPriorityColor(task.priority)
                    )}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm max-w-2xl leading-relaxed mb-4">
                    {task.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    {task.relatedEntityType && (
                      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {getEntityIcon(task.relatedEntityType)}
                        {task.relatedEntityType}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      <Clock size={12} />
                      {new Date(task.updatedAt).toLocaleDateString()}
                    </div>
                    {task.status === 'failing' && (
                      <div className="flex items-center gap-2 text-[10px] text-rose-400 font-bold uppercase tracking-widest">
                        <AlertCircle size={12} />
                        Sync Error Detected
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                  <MoreVertical size={18} />
                </button>
                <button className="flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">
                  Fix Now
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
            
            {task.failureNotes && (
              <div className="mt-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest mb-1">Failure Logs</p>
                <p className="text-rose-300/70 text-xs font-mono">{task.failureNotes}</p>
              </div>
            )}
          </motion.div>
        ))}
        
        {filteredTasks.length === 0 && (
          <div className="p-20 text-center rounded-3xl bg-[#141414] border border-white/5 border-dashed">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">All tasks complete</h3>
            <p className="text-gray-500 text-sm">No tasks match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}


