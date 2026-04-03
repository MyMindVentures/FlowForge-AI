import React from 'react';
import { History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';

interface FeatureAuditProps {
  auditLogs: any[];
}

export default function FeatureAudit({ auditLogs }: FeatureAuditProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <History size={20} className="text-indigo-400" />
          Activity History
        </h3>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Last 50 events</span>
      </div>
      
      <div className="space-y-4">
        {auditLogs.map((log: any) => (
          <div key={log.id} className="p-4 rounded-2xl bg-[#141414] border border-white/5 flex items-start gap-4 hover:border-indigo-500/20 transition-all">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs flex-shrink-0">
              {log.userEmail?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold text-white truncate">{log.userEmail}</p>
                <span className="text-[10px] text-gray-600 font-mono">
                  {log.timestamp?.toDate ? formatDistanceToNow(log.timestamp.toDate(), { addSuffix: true }) : 'Pending...'}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border",
                  log.action.includes('CREATED') ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  log.action.includes('DELETED') ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                  log.action.includes('AI') ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                  "bg-amber-500/10 text-amber-400 border-amber-500/20"
                )}>
                  {log.action.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-[10px] text-gray-500 font-mono overflow-x-auto">
                {JSON.stringify(log.details, null, 2)}
              </div>
            </div>
          </div>
        ))}
        {auditLogs.length === 0 && (
          <div className="text-center py-20 bg-[#141414] border border-white/5 rounded-3xl">
            <History size={48} className="mx-auto text-gray-700 mb-4" />
            <p className="text-gray-500 font-bold">No activity history found</p>
            <p className="text-gray-600 text-xs mt-1">Changes to this feature will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}


