import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Sparkles, Paperclip, Smile, MoreVertical, ChevronLeft, Search, Loader2, Check, Plus, X } from 'lucide-react';
import { Feature, Project } from '../types';
import { AgentOrchestrator, AgentTaskType } from '../services/ai/orchestrator';
import { FeatureSuggestion } from '../services/ai/types';
import { useProject } from '../context/ProjectContext';
import { useToast } from './Toast';
import { collection, addDoc } from '../lib/db/firestoreCompat';
import { db } from '../firebase';

interface FeatureChatProps {
  project: Project;
  feature: Feature;
  onBack: () => void;
}

export default function FeatureChat({ project, feature, onBack }: FeatureChatProps) {
  const { features } = useProject();
  const { showToast } = useToast();
  const [messages, setMessages] = useState([
    { id: '1', role: 'assistant', content: `Hello! I'm your AI assistant for **${feature.title}**. How can I help you refine this feature today?`, timestamp: new Date().toISOString() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<FeatureSuggestion[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, suggestions]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setSuggestions([]);

    try {
      // 1. Resolve App Context
      const context = await AgentOrchestrator.runTask(AgentTaskType.RESOLVE_CONTEXT, { project, features });
      
      // 2. Generate Feature Suggestions
      const aiSuggestions = await AgentOrchestrator.runTask(AgentTaskType.SUGGEST_FEATURES, { context, userInput: input, projectId: project.id });
      
      setSuggestions(aiSuggestions);
      
      const aiResponse = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: "I've analyzed your request based on the project context. Here are 5 feature suggestions that could enhance this module:", 
        timestamp: new Date().toISOString() 
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      showToast('AI failed to generate suggestions. Please try again.', 'error');
      const errorMsg = { id: Date.now().toString(), role: 'assistant', content: "I'm sorry, I encountered an error while processing your request.", timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = async (suggestion: FeatureSuggestion) => {
    try {
      setLoading(true);
      // 3. FeatureStoreSync (Save to DB)
      const featureCode = `FEAT-${Math.floor(1000 + Math.random() * 9000)}`;
      await addDoc(collection(db, 'projects', project.id, 'features'), {
        title: suggestion.title,
        nonTechnicalDescription: suggestion.description,
        priority: suggestion.priority,
        status: 'Pending',
        featureCode,
        problem: suggestion.userValue,
        solution: suggestion.description,
        why: suggestion.userValue,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archived: false
      });

      showToast(`Feature "${suggestion.title}" added to backlog!`, 'success');
      setSuggestions(prev => prev.filter(s => s.title !== suggestion.title));
      
      const confirmationMsg = { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: `Excellent choice! I've added **${suggestion.title}** (${featureCode}) to your project backlog.`, 
        timestamp: new Date().toISOString() 
      };
      setMessages(prev => [...prev, confirmationMsg]);
    } catch (error) {
      showToast('Failed to save feature.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-white/5 flex items-center justify-between bg-[#0f0f0f]">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all">
            <ChevronLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Sparkles className="text-indigo-400" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-none mb-1">{feature.title}</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{feature.featureCode} • Feature Chat</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              {loading ? 'AI Thinking' : 'AI Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 no-scrollbar">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-white/10' : 'bg-indigo-500/10'
            }`}>
              {msg.role === 'user' ? <User size={20} className="text-white" /> : <Bot size={20} className="text-indigo-400" />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-[#141414] border border-white/5 text-gray-300'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <p className="text-[10px] opacity-40 mt-2 font-bold uppercase tracking-widest">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}

        {/* AI Suggestions Grid */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-14"
            >
              {suggestions.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-5 rounded-2xl bg-[#141414] border border-white/5 hover:border-indigo-500/30 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleSelectSuggestion(s)}
                      className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 shadow-lg"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${
                      s.priority === 'Critical' ? 'bg-red-500/10 text-red-400' :
                      s.priority === 'High' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-indigo-500/10 text-indigo-400'
                    }`}>
                      {s.priority}
                    </span>
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{s.complexity}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{s.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{s.description}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Bot size={20} className="text-indigo-400 animate-pulse" />
            </div>
            <div className="bg-[#141414] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
              <Loader2 size={16} className="animate-spin text-indigo-500" />
              <span className="text-xs text-gray-500 font-medium">AI is forging suggestions...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 lg:p-8 bg-[#0f0f0f] border-t border-white/5">
        <div className="max-w-4xl mx-auto relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Ask AI to refine ${feature.featureCode}...`}
            disabled={loading}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-6 pr-16 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner disabled:opacity-50"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
