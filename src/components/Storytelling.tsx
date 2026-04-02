import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  Lightbulb, 
  Zap, 
  Users, 
  Code2, 
  Rocket, 
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { cn } from '../lib/utils';

interface StorytellingProps {
  onComplete: () => void;
}

const STORY_STEPS = [
  {
    id: 'founder',
    title: 'The Founder\'s Vision',
    subtitle: 'Born from a No-Coder\'s Journey',
    content: 'FlowForge AI was invented by a founder who is a no-coder at heart. Someone with a mind full of strong app ideas, but without the technical syntax to bring them to life alone.',
    icon: Lightbulb,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10'
  },
  {
    id: 'struggle',
    title: 'The Core Struggle',
    subtitle: 'Where Ideas Often Stay Stuck',
    content: 'For too long, brilliant concepts remained trapped in notes and sketches. The gap between a visionary idea and a buildable technical specification felt like an unbridgeable chasm.',
    icon: Zap,
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10'
  },
  {
    id: 'purpose',
    title: 'The Product Purpose',
    subtitle: 'Bridging the Collaboration Gap',
    content: 'FlowForge AI exists to solve exactly that. It structures raw ideas into features, prompts, pages, and workflows—translating vision into a language that developers and AI can actually build from.',
    icon: Code2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10'
  },
  {
    id: 'collaboration',
    title: 'The Collaboration Vision',
    subtitle: 'Founder + Developer Partnership',
    content: 'The heart of this platform is the relationship between founder and developer. We believe the best products are built when both work from the same structured, future-proof foundation.',
    icon: Users,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10'
  }
];

export default function Storytelling({ onComplete }: StorytellingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STORY_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const step = STORY_STEPS[currentStep];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-2xl w-full relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Zap size={18} className="text-white fill-white" />
            </div>
            <span className="font-bold tracking-tight text-lg">FlowForge AI</span>
          </div>
          <div className="flex gap-1">
            {STORY_STEPS.map((_, idx) => (
              <div 
                key={idx}
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  idx === currentStep ? "w-8 bg-indigo-500" : "w-2 bg-white/10"
                )}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest", step.bg, step.color)}>
                <step.icon size={12} />
                {step.subtitle}
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                {step.title}
              </h1>
              <p className="text-lg lg:text-xl text-gray-400 leading-relaxed font-medium">
                {step.content}
              </p>
            </div>

            <div className="pt-8 flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleNext}
                className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all group"
              >
                {currentStep === STORY_STEPS.length - 1 ? 'Enter Workspace' : 'Continue Story'}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              {currentStep < STORY_STEPS.length - 1 && (
                <button
                  onClick={onComplete}
                  className="w-full sm:w-auto px-8 py-4 bg-white/5 text-gray-400 rounded-2xl font-bold hover:bg-white/10 hover:text-white transition-all"
                >
                  Skip to App
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer Quote */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-24 pt-8 border-t border-white/5 flex items-start gap-4"
        >
          <div className="p-2 bg-white/5 rounded-lg">
            <MessageSquare size={16} className="text-indigo-400" />
          </div>
          <p className="text-sm text-gray-500 italic leading-relaxed">
            "The missing piece was never the idea itself, but the bridge to build it. FlowForge AI is that bridge."
          </p>
        </motion.div>
      </div>
    </div>
  );
}
