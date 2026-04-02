import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, LogIn, Shield, Zap, Globe, ArrowRight } from 'lucide-react';

interface AuthProps {
  onLogin: () => void;
}

export default function Auth({ onLogin }: AuthProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0a0a0a] to-[#0a0a0a] overflow-hidden relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />
      
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-10 relative z-10"
      >
        <Sparkles className="text-white" size={40} />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center relative z-10"
      >
        <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tighter">FlowForge AI</h1>
        <p className="text-gray-400 text-center max-w-lg mb-12 text-lg lg:text-xl leading-relaxed font-medium">
          The translation layer between product thinking and implementation thinking. Turn vague ideas into structured feature cards.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 max-w-2xl mx-auto">
          {[
            { icon: Shield, label: 'Secure PRDs', color: 'text-indigo-400' },
            { icon: Zap, label: 'AI Roadmap', color: 'text-amber-400' },
            { icon: Globe, label: 'Team Sync', color: 'text-emerald-400' },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-2"
            >
              <item.icon className={item.color} size={20} />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
            </motion.div>
          ))}
        </div>

        <button
          onClick={onLogin}
          className="group flex items-center gap-3 bg-white text-black px-10 py-5 rounded-2xl font-bold text-xl hover:bg-gray-200 transition-all shadow-xl active:scale-95 relative"
        >
          <LogIn size={24} />
          Sign in with Google
          <ArrowRight className="ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={20} />
        </button>
      </motion.div>

      <div className="absolute bottom-12 left-0 right-0 text-center opacity-40">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Trusted by 10,000+ Product Teams</p>
      </div>
    </div>
  );
}
