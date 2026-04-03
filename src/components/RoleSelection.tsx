import React from 'react';
import { motion } from 'motion/react';
import { User, Shield, ChevronRight } from 'lucide-react';

interface RoleSelectionProps {
  onSelect: (role: 'Architect' | 'Builder') => void;
}

export default function RoleSelection({ onSelect }: RoleSelectionProps) {
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-[100] flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent opacity-50" />
      
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Select Your Role</h2>
        <p className="text-gray-400 text-lg leading-relaxed">Choose how you'll interact with FlowForge AI.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('Architect')}
          className="group relative p-8 rounded-3xl bg-[#141414] border border-white/5 hover:border-indigo-500/30 transition-all text-left shadow-2xl"
        >
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
            <Shield size={32} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">Architect</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">Focus on product thinking, high-level goals, and defining feature scope.</p>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            Select Role <ChevronRight size={16} />
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('Builder')}
          className="group relative p-8 rounded-3xl bg-[#141414] border border-white/5 hover:border-indigo-500/30 transition-all text-left shadow-2xl"
        >
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-all">
            <User size={32} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">Builder</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">Focus on implementation details, UI guidance, and technical specifications.</p>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            Select Role <ChevronRight size={16} />
          </div>
        </motion.button>
      </div>
    </div>
  );
}


