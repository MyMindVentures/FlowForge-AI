import React from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface SyncIndicatorProps {
  status: 'synced' | 'syncing' | 'offline' | 'error';
  lastSynced?: string;
}

export default function SyncIndicator({ status, lastSynced }: SyncIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
      <AnimatePresence mode="wait">
        {status === 'syncing' && (
          <motion.div
            key="syncing"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <RefreshCw className="text-indigo-400 animate-spin" size={14} />
          </motion.div>
        )}
        {status === 'synced' && (
          <motion.div
            key="synced"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Cloud className="text-emerald-400" size={14} />
          </motion.div>
        )}
        {status === 'offline' && (
          <motion.div
            key="offline"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <CloudOff className="text-amber-400" size={14} />
          </motion.div>
        )}
        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <CloudOff className="text-rose-400" size={14} />
          </motion.div>
        )}
      </AnimatePresence>
      
      <span className={cn(
        "text-[10px] font-bold uppercase tracking-widest",
        status === 'syncing' && "text-indigo-400",
        status === 'synced' && "text-emerald-400",
        status === 'offline' && "text-amber-400",
        status === 'error' && "text-rose-400"
      )}>
        {status === 'syncing' ? 'Syncing...' : status === 'synced' ? 'Synced' : status === 'offline' ? 'Offline' : 'Sync Error'}
      </span>
    </div>
  );
}


