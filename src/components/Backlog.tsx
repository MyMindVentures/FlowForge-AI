import React, { useState, useMemo } from 'react';
import { FolderKanban, Search, ChevronRight, Clock, ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { where, orderBy } from 'firebase/firestore';
import { Project, Feature } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import { useFirestore } from '../hooks/useFirestore';

interface BacklogProps {
  project: Project;
  onSelectFeature: (feature: Feature) => void;
}

export default function Backlog({ project, onSelectFeature }: BacklogProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isAdding, setIsAdding] = useState(false);

  const { data: features, add: addFeature } = useFirestore<Feature>(
    project.id ? `projects/${project.id}/features` : null,
    [where('archived', '==', false), orderBy('updatedAt', 'desc')]
  );

  const filteredFeatures = useMemo(() => {
    return features.filter((f) => {
      const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            f.featureCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || f.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [features, searchTerm, statusFilter]);

  const handleAddFeature = async () => {
    setIsAdding(true);
    try {
      const id = await addFeature({
        projectId: project.id,
        title: 'New Feature',
        status: 'Pending',
        priority: 'Medium',
        featureCode: `FEAT-${Math.floor(Math.random() * 10000)}`,
        problem: 'Describe the problem this feature solves...',
        solution: 'Describe the proposed solution...',
        why: 'Explain why this feature is important...',
        nonTechnicalDescription: 'A simple explanation for non-technical stakeholders...',
        technicalDescription: 'Detailed technical specifications and implementation details...',
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      showToast('New feature created', 'success');
      onSelectFeature({ id } as any);
    } catch (err) {
      console.error('Error adding feature:', err);
      showToast('Failed to create feature', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <button 
          onClick={() => navigate(`/projects/${project.id}/workspace`)}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={16} />
          Back to Hub
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <FolderKanban className="text-amber-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Feature Backlog</h2>
            <p className="text-gray-400 mt-1 text-sm lg:text-base">Manage and track your approved feature cards.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <button 
            onClick={() => navigate(`/projects/${project.id}/ideation`)}
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-white/10"
          >
            <FolderKanban size={18} className="text-indigo-400" />
            AI Ideation
          </button>
          <button 
            onClick={handleAddFeature}
            disabled={isAdding}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
          >
            {isAdding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Add Feature
          </button>
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search features..."
              className="bg-[#1a1a1a] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full sm:w-64"
            />
          </div>
          <div className="flex items-center gap-1 bg-[#1a1a1a] border border-white/10 rounded-lg p-1 overflow-x-auto no-scrollbar">
            {['All', 'Pending', 'In Progress', 'Completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-3 py-1.5 text-[10px] lg:text-xs font-bold rounded-md transition-all whitespace-nowrap",
                  statusFilter === status 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Feature ID</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Last Updated</th>
              <th className="px-6 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredFeatures.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-gray-500 italic">
                  No features found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredFeatures.map((feature) => (
                <tr
                  key={feature.id}
                  onClick={() => onSelectFeature(feature)}
                  className="group hover:bg-white/5 transition-all cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded border border-indigo-400/20">
                      {feature.featureCode}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">
                      {feature.title}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border",
                      feature.priority === 'Critical' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                      feature.priority === 'High' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                      feature.priority === 'Medium' ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" :
                      "bg-gray-500/10 text-gray-500 border-gray-500/20"
                    )}>
                      {feature.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        feature.status === 'Pending' ? "bg-amber-500" :
                        feature.status === 'In Progress' ? "bg-indigo-500" :
                        "bg-green-500"
                      )} />
                      <span className={cn(
                        "text-xs font-bold",
                        feature.status === 'Pending' ? "text-amber-500" :
                        feature.status === 'In Progress' ? "text-indigo-500" :
                        "text-green-500"
                      )}>
                        {feature.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-xs text-gray-500">
                      <Clock size={14} />
                      <span>{formatDistanceToNow(new Date(feature.updatedAt))} ago</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight className="text-gray-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" size={18} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {filteredFeatures.length === 0 ? (
          <div className="py-20 text-center text-gray-500 italic bg-[#0f0f0f] border border-white/10 rounded-2xl">
            No features found matching your criteria.
          </div>
        ) : (
          filteredFeatures.map((feature) => (
            <div
              key={feature.id}
              onClick={() => onSelectFeature(feature)}
              className="p-5 rounded-2xl bg-[#0f0f0f] border border-white/10 hover:border-indigo-500/30 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded border border-indigo-400/20">
                    {feature.featureCode}
                  </span>
                  <span className={cn(
                    "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border",
                    feature.priority === 'Critical' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                    feature.priority === 'High' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                    feature.priority === 'Medium' ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" :
                    "bg-gray-500/10 text-gray-500 border-gray-500/20"
                  )}>
                    {feature.priority}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    feature.status === 'Pending' ? "bg-amber-500" :
                    feature.status === 'In Progress' ? "bg-indigo-500" :
                    "bg-green-500"
                  )} />
                  <span className={cn(
                    "text-[10px] font-bold",
                    feature.status === 'Pending' ? "text-amber-500" :
                    feature.status === 'In Progress' ? "text-indigo-500" :
                    "text-green-500"
                  )}>
                    {feature.status}
                  </span>
                </div>
              </div>
              <h4 className="text-base font-bold text-white mb-4">{feature.title}</h4>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <Clock size={12} />
                  <span>{formatDistanceToNow(new Date(feature.updatedAt))} ago</span>
                </div>
                <ChevronRight className="text-gray-700" size={16} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
