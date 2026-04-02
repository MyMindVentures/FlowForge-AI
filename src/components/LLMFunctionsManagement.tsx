import React, { useState } from 'react';
import { 
  Cpu, 
  Code, 
  Settings, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Shield, 
  AlertCircle, 
  Loader2, 
  Save, 
  X, 
  Check,
  Zap,
  RefreshCw,
  FileCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LLMFunction, AIModelConfig, PromptTemplate } from '../types';
import { useFirestore } from '../hooks/useFirestore';
import { cn } from '../lib/utils';
import { useToast } from './Toast';
import { AIFunctions } from '../services/ai/functions';

interface LLMFunctionsManagementProps {
  onBack?: () => void;
}

export default function LLMFunctionsManagement({ onBack }: LLMFunctionsManagementProps) {
  const { data: functions, loading, error, add, update, remove } = useFirestore<LLMFunction>('admin/ai/functions');
  const { data: models } = useFirestore<AIModelConfig>('admin/ai/models');
  const { data: prompts } = useFirestore<PromptTemplate>('admin/ai/prompts');
  
  const [editingFunction, setEditingFunction] = useState<LLMFunction | null>(null);
  const [testingFunction, setTestingFunction] = useState<LLMFunction | null>(null);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { showToast } = useToast();

  const handleToggle = async (fn: LLMFunction) => {
    try {
      await update(fn.id, { isEnabled: !fn.isEnabled });
      showToast(`Function ${fn.isEnabled ? 'disabled' : 'enabled'}`);
    } catch (err) {
      showToast('Failed to toggle function', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this function?')) return;
    try {
      await remove(id);
      showToast('Function deleted');
    } catch (err) {
      showToast('Failed to delete function', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFunction) return;
    
    setIsSubmitting(true);
    try {
      if (isCreating) {
        const { id, ...rest } = editingFunction;
        await add(rest as any);
        showToast('Function created');
      } else {
        await update(editingFunction.id, editingFunction);
        showToast('Function updated');
      }
      setEditingFunction(null);
      setIsCreating(false);
    } catch (err) {
      showToast('Failed to save function', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTest = async () => {
    if (!testingFunction) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await AIFunctions.runFunction(testingFunction.name, testInput);
      setTestResult(result);
      showToast('Test completed successfully');
    } catch (err) {
      console.error('Test failed:', err);
      showToast('Test failed', 'error');
      setTestResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
        <p className="text-gray-400 font-medium">Retrieving LLM functions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 mb-6 mx-auto">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Retrieval Failure</h3>
        <p className="text-gray-500 max-w-md mb-8">
          We encountered an error while fetching the AI governance data. Please check your permissions and try again.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto h-full overflow-y-auto">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <ChevronRight className="rotate-180" size={20} />
            </button>
          )}
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">LLM Functions</h2>
            <p className="text-gray-400 mt-1">AI Governance & Internal Function Management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
            <Shield size={12} />
            Authorized Access
          </div>
          <button 
            onClick={() => {
              setEditingFunction({
                id: '',
                name: '',
                description: '',
                parameters: { type: 'object', properties: {}, required: [] },
                modelId: models[0]?.id || '',
                isEnabled: true,
                systemPrompt: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              setIsCreating(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus size={18} />
            Add Function
          </button>
        </div>
      </header>

      {functions.length === 0 ? (
        <div className="p-12 text-center bg-[#141414] border border-white/5 rounded-[32px] border-dashed">
          <Code size={48} className="mx-auto text-gray-700 mb-4" />
          <h3 className="text-white font-bold text-lg">Empty Function Set</h3>
          <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
            No internal LLM functions have been defined yet. Start by creating a function to govern your AI interactions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {functions.map((fn) => (
            <div 
              key={fn.id} 
              className="p-6 rounded-[24px] bg-[#141414] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-indigo-500/30 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                  fn.isEnabled ? "bg-indigo-500/10 text-indigo-400" : "bg-gray-500/10 text-gray-500"
                )}>
                  <Zap size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-bold text-lg">{fn.name}</h4>
                    {!fn.isEnabled && (
                      <span className="px-2 py-0.5 rounded-md bg-gray-500/10 border border-gray-500/20 text-[10px] text-gray-500 font-bold uppercase">Disabled</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-1">{fn.description}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                      <Cpu size={12} />
                      {models.find(m => m.id === fn.modelId)?.name || 'Unknown Model'}
                    </div>
                    {fn.promptTemplateId && (
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                        <FileCode size={12} />
                        Linked Prompt
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 self-end md:self-auto">
                <button 
                  onClick={() => handleToggle(fn)}
                  className={cn(
                    "w-12 h-6 rounded-full relative transition-all",
                    fn.isEnabled ? "bg-emerald-500" : "bg-gray-700"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    fn.isEnabled ? "right-1" : "left-1"
                  )} />
                </button>
                <button 
                  onClick={() => {
                    setTestingFunction(fn);
                    setTestInput('');
                    setTestResult(null);
                  }}
                  className="p-2 text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition-all"
                  title="Test Function"
                >
                  <RefreshCw size={20} className={cn(isTesting && testingFunction?.id === fn.id && "animate-spin")} />
                </button>
                <button 
                  onClick={() => setEditingFunction(fn)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  <Settings size={20} />
                </button>
                <button 
                  onClick={() => handleDelete(fn.id)}
                  className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Test Modal */}
      <AnimatePresence>
        {testingFunction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isTesting) {
                  setTestingFunction(null);
                  setTestResult(null);
                }
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#141414] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#1a1a1a]">
                <div>
                  <h3 className="text-xl font-bold text-white">Test Function: {testingFunction.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">Execute the function with custom input</p>
                </div>
                <button 
                  onClick={() => {
                    setTestingFunction(null);
                    setTestResult(null);
                  }} 
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Test Input (Text or JSON)</label>
                  <textarea
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-32 font-mono text-xs resize-none"
                    placeholder="Enter input for the function..."
                  />
                </div>

                {testResult && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Result</label>
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs text-gray-300 overflow-x-auto max-h-64 overflow-y-auto">
                      <pre>{typeof testResult === 'object' ? JSON.stringify(testResult, null, 2) : testResult}</pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/10 bg-[#1a1a1a] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTestingFunction(null);
                    setTestResult(null);
                  }}
                  className="px-6 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition-all"
                >
                  Close
                </button>
                <button
                  onClick={handleTest}
                  disabled={isTesting || !testInput.trim()}
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {isTesting ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                  <span>{isTesting ? 'Executing...' : 'Run Test'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit/Create Modal */}
      <AnimatePresence>
        {editingFunction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isSubmitting) {
                  setEditingFunction(null);
                  setIsCreating(false);
                }
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#141414] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#1a1a1a]">
                <div>
                  <h3 className="text-xl font-bold text-white">{isCreating ? 'Define LLM Function' : 'Governance Controls'}</h3>
                  <p className="text-xs text-gray-500 mt-1">{isCreating ? 'Create a new internal function' : `Editing ${editingFunction.name}`}</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingFunction(null);
                    setIsCreating(false);
                  }} 
                  className="p-2 text-gray-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Basic Configuration</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Function Name</label>
                      <input
                        type="text"
                        value={editingFunction.name}
                        onChange={(e) => setEditingFunction({ ...editingFunction, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        placeholder="e.g. analyze_code_quality"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Description</label>
                      <textarea
                        value={editingFunction.description}
                        onChange={(e) => setEditingFunction({ ...editingFunction, description: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-24 resize-none"
                        placeholder="What does this function do?"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Model & Routing */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Model Assignment & Routing</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Primary Model</label>
                      <select
                        value={editingFunction.modelId}
                        onChange={(e) => setEditingFunction({ ...editingFunction, modelId: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                      >
                        {models.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Linked Prompt</label>
                      <select
                        value={editingFunction.promptTemplateId || ''}
                        onChange={(e) => setEditingFunction({ ...editingFunction, promptTemplateId: e.target.value || undefined })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                      >
                        <option value="">No linked prompt</option>
                        {prompts.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* System Prompt */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">System Prompt Override</h4>
                  <div className="relative">
                    <textarea
                      value={editingFunction.systemPrompt || ''}
                      onChange={(e) => setEditingFunction({ ...editingFunction, systemPrompt: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-32 resize-none font-mono text-xs"
                      placeholder="Enter a custom system prompt for this function. This will override or complement the linked template."
                    />
                    {editingFunction.promptTemplateId && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-[8px] font-bold uppercase tracking-widest border border-amber-500/20">
                        <AlertCircle size={10} />
                        Template Override
                      </div>
                    )}
                  </div>
                </div>

                {/* Fallback Configuration */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Fallback Configuration</h4>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-300">Strategy</label>
                      <select
                        value={editingFunction.fallbackConfig?.strategy || 'error'}
                        onChange={(e) => setEditingFunction({ 
                          ...editingFunction, 
                          fallbackConfig: { 
                            ...editingFunction.fallbackConfig, 
                            strategy: e.target.value as any 
                          } 
                        })}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="error">Fail on Error</option>
                        <option value="retry">Retry with Backoff</option>
                        <option value="fallback_model">Switch to Fallback Model</option>
                      </select>
                    </div>
                    
                    {editingFunction.fallbackConfig?.strategy === 'fallback_model' && (
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <label className="text-sm font-medium text-gray-300">Fallback Model</label>
                        <select
                          value={editingFunction.fallbackConfig?.fallbackModelId || ''}
                          onChange={(e) => setEditingFunction({ 
                            ...editingFunction, 
                            fallbackConfig: { 
                              ...editingFunction.fallbackConfig, 
                              fallbackModelId: e.target.value 
                            } 
                          })}
                          className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                        >
                          <option value="">Select model...</option>
                          {models.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {editingFunction.fallbackConfig?.strategy === 'retry' && (
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <label className="text-sm font-medium text-gray-300">Max Retries</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={editingFunction.fallbackConfig?.maxRetries || 3}
                          onChange={(e) => setEditingFunction({ 
                            ...editingFunction, 
                            fallbackConfig: { 
                              ...editingFunction.fallbackConfig, 
                              maxRetries: parseInt(e.target.value) 
                            } 
                          })}
                          className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none w-20 text-center"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Parameters (Simplified for now) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Function Parameters</h4>
                    <button type="button" className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                      <Plus size={12} />
                      Add Property
                    </button>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/30 border border-white/5 font-mono text-[10px] text-gray-400">
                    <pre>{JSON.stringify(editingFunction.parameters, null, 2)}</pre>
                  </div>
                  <p className="text-[10px] text-gray-600 italic">Advanced JSON schema editing coming in next iteration.</p>
                </div>
              </form>

              <div className="p-6 border-t border-white/10 bg-[#1a1a1a] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingFunction(null);
                    setIsCreating(false);
                  }}
                  className="px-6 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  <span>{isCreating ? 'Create Function' : 'Save Changes'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
