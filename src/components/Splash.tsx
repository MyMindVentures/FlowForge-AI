import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Loader2 } from 'lucide-react';

interface SplashProps {
  onComplete: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
  React.useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative" 
      onClick={onComplete}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0a0a0a] to-[#0a0a0a]" />
      
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-10 relative z-10"
      >
        <Sparkles className="text-white" size={48} />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center relative z-10"
      >
        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tighter">FlowForge AI</h1>
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={20} />
          <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.2em]">Initializing Engine</p>
        </div>
      </motion.div>

      <div className="absolute bottom-12 left-0 right-0 text-center opacity-20">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Version 2.0.4 • Production Ready</p>
      </div>
    </div>
  );
}


