import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Cpu, Globe, ChevronRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Ideation to Structure",
    description: "Transform raw concepts into high-fidelity feature definitions. Our AI architect bridges the gap between vision and execution.",
    visual: "A constellation of dots aligning into a clean, structured grid.",
    icon: Sparkles,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10"
  },
  {
    title: "Design to Implementation",
    description: "Seamlessly transition from feature cards to visual assets and technical specifications. One source of truth for design and development.",
    visual: "A wireframe morphing into a high-fidelity UI component with floating code.",
    icon: Cpu,
    color: "text-amber-400",
    bg: "bg-amber-400/10"
  },
  {
    title: "The Product Lifecycle",
    description: "Manage your entire journey from initial roadmap to marketing launch. A unified hub for assets, documentation, and strategic growth.",
    visual: "A circular orbit representing continuous growth from backlog to release.",
    icon: Globe,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10"
  }
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-[100] flex flex-col items-center justify-center p-6 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent opacity-50" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg text-center"
        >
          {(() => {
            const Icon = steps[currentStep].icon;
            return (
              <div className="relative mb-12">
                <div className={`w-24 h-24 ${steps[currentStep].bg} rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl border border-white/5`}>
                  <Icon className={steps[currentStep].color} size={48} />
                </div>
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -inset-4 bg-indigo-500/5 blur-3xl -z-10 rounded-full"
                />
              </div>
            );
          })()}
          
          <h2 className="text-4xl font-bold text-white mb-6 tracking-tight uppercase italic">
            {steps[currentStep].title}
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-4 max-w-md mx-auto">
            {steps[currentStep].description}
          </p>
          <p className="text-indigo-500/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-16">
            Visual Concept: {steps[currentStep].visual}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3 mb-12">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === currentStep ? "w-12 bg-indigo-500" : "w-3 bg-white/5"
            }`}
          />
        ))}
      </div>

      <button
        onClick={next}
        type="button"
        className="w-full max-w-md bg-white text-black py-5 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-95 shadow-2xl relative z-[110] uppercase tracking-widest"
      >
        {currentStep === steps.length - 1 ? "Begin Journey" : "Next Phase"}
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
