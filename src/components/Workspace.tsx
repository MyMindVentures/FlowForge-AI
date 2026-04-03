import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Check, X, RefreshCw, Loader2, MessageSquare, User, Bot, Plus, History, Calendar, ChevronRight, Trash2, AlertCircle, ArrowLeft } from 'lucide-react';
import { collection, addDoc, query, where, onSnapshot, orderBy, limit, writeBatch, doc, updateDoc, deleteDoc, setDoc } from '../lib/db/supabaseData';
import { db, auth } from '../lib/supabase/appClient';
import { Project, ChatMessage, Suggestion, Session, Feature } from '../types';
import { generateSuggestions, generateFeatureDetails } from '../services/geminiService';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { handleDataOperationError, DataOperationType } from '../lib/databaseErrorHandler';
import { useToast } from './Toast';
import ConfirmModal from './ConfirmModal';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface WorkspaceProps {
  project: Project;
  onApproveSuggestion: (suggestion: Suggestion) => void;
}

export default function Workspace({ project, onApproveSuggestion }: WorkspaceProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; suggestionId: string | null }>({
    isOpen: false,
    suggestionId: null
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<'chat' | 'suggestions'>('chat');

  const { showToast } = useToast();

  // Fetch all sessions for this project
  useEffect(() => {
    if (!project?.id) return;

    setLoading(true);
    const q = query(
      collection(db, 'projects', project.id, 'sessions'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sess = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Session[];
      setSessions(sess);
      
      // If no current session is set, try to set the one from project or the latest one
      if (!currentSession) {
        const activeId = project.currentSessionId;
        const active = sess.find(s => s.id === activeId) || sess[0];
        if (active) {
          setCurrentSession(active);
        } else if (sess.length === 0 && !isCreatingSession) {
          handleCreateSession();
        }
      }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching sessions:', err);
      setError('Failed to load sessions. Please check your connection.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [project?.id]);

  // Fetch messages for current session
  useEffect(() => {
    if (!project?.id || !currentSession?.id) return;

    const q = query(
      collection(db, 'projects', project.id, 'chats'),
      where('sessionId', '==', currentSession.id),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatMessage[];
      setMessages(msgs);
    }, (error) => handleDataOperationError(error, DataOperationType.GET, `projects/${project.id}/chats`));

    return () => unsubscribe();
  }, [project?.id, currentSession?.id]);

  // Fetch suggestions for current session
  useEffect(() => {
    if (!project?.id || !currentSession?.id) return;

    const q = query(
      collection(db, 'projects', project.id, 'suggestions'),
      where('sessionId', '==', currentSession.id),
      where('status', '==', 'pending'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sugs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Suggestion[];
      setSuggestions(sugs);
    }, (error) => handleDataOperationError(error, DataOperationType.GET, `projects/${project.id}/suggestions`));

    return () => unsubscribe();
  }, [project?.id, currentSession?.id]);

  // Fetch all features for context
  useEffect(() => {
    if (!project?.id) return;
    const q = query(collection(db, 'projects', project.id, 'features'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const feats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Feature[];
      setAllFeatures(feats);
    }, (error) => {
      console.error('Workspace: Features snapshot error:', error);
    });
    return () => unsubscribe();
  }, [project?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCreateSession = async () => {
    if (isCreatingSession || !project?.id) return;
    setIsCreatingSession(true);
    try {
      const sessionName = `Session ${sessions.length + 1}`;
      const sessionRef = await addDoc(collection(db, 'projects', project.id, 'sessions'), {
        projectId: project.id,
        name: sessionName,
        createdAt: new Date().toISOString(),
      });

      await updateDoc(doc(db, 'projects', project.id), {
        currentSessionId: sessionRef.id
      });

      setCurrentSession({
        id: sessionRef.id,
        projectId: project.id,
        name: sessionName,
        createdAt: new Date().toISOString(),
      });
      
      showToast('New session started');
      setIsHistoryOpen(false);
    } catch (error) {
      console.error('Error creating session:', error);
      showToast('Failed to create session', 'error');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleSwitchSession = async (session: Session) => {
    if (!project?.id) return;
    setCurrentSession(session);
    await updateDoc(doc(db, 'projects', project.id), {
      currentSessionId: session.id
    });
    setIsHistoryOpen(false);
    showToast(`Switched to ${session.name}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!project?.id) return;
    try {
      await deleteDoc(doc(db, 'projects', project.id, 'sessions', sessionId));
      
      if (currentSession?.id === sessionId) {
        const remaining = sessions.filter(s => s.id !== sessionId);
        if (remaining.length > 0) {
          handleSwitchSession(remaining[0]);
        } else {
          handleCreateSession();
        }
      }
      showToast('Session deleted');
    } catch (error) {
      console.error('Error deleting session:', error);
      showToast('Failed to delete session', 'error');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating || !currentSession || !project?.id) return;

    const userMsg = input.trim();
    setInput('');
    setIsGenerating(true);

    try {
      await addDoc(collection(db, 'projects', project.id, 'chats'), {
        projectId: project.id,
        sessionId: currentSession.id,
        userId: auth.currentUser?.uid,
        role: 'user',
        content: userMsg,
        timestamp: new Date().toISOString(),
      }).catch(e => handleDataOperationError(e, DataOperationType.CREATE, `projects/${project.id}/chats`));

      const aiSuggestions = await generateSuggestions(
        userMsg, 
        { id: project.id, name: project.name, description: project.description },
        allFeatures
      );

      await addDoc(collection(db, 'projects', project.id, 'chats'), {
        projectId: project.id,
        sessionId: currentSession.id,
        userId: auth.currentUser?.uid,
        role: 'assistant',
        content: `I've analyzed your idea and generated ${aiSuggestions.length} feature suggestions for you to review.`,
        timestamp: new Date().toISOString(),
      }).catch(e => handleDataOperationError(e, DataOperationType.CREATE, `projects/${project.id}/chats`));

      const batch = writeBatch(db);
      aiSuggestions.forEach((sug) => {
        const newSugRef = doc(collection(db, 'projects', project.id, 'suggestions'));
        batch.set(newSugRef, {
          ...sug,
          projectId: project.id,
          sessionId: currentSession.id,
          status: 'pending',
          timestamp: new Date().toISOString(),
        });
      });
      await batch.commit().catch(e => handleDataOperationError(e, DataOperationType.WRITE, `projects/${project.id}/suggestions`));
      
      showToast('New suggestions generated!');
      if (window.innerWidth < 1024) {
        setActiveMobileTab('suggestions');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      showToast('Failed to generate suggestions', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async (suggestion: Suggestion) => {
    if (!project?.id) return;
    setIsApproving(suggestion.id);
    try {
      const details = await generateFeatureDetails(project.id, suggestion);
      const featureCode = `FC-${Math.floor(1000 + Math.random() * 9000)}`;
      const featureRef = doc(collection(db, 'projects', project.id, 'features'));
      
      const featureData = {
        projectId: project.id,
        featureCode,
        title: suggestion.title,
        status: 'Pending',
        priority: details.priority,
        problem: details.problem,
        solution: details.solution,
        why: details.why,
        nonTechnicalDescription: details.nonTechnicalDescription,
        technicalDescription: details.technicalDescription,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archived: false,
      };

      await setDoc(featureRef, featureData)
        .catch(e => handleDataOperationError(e, DataOperationType.CREATE, `projects/${project.id}/features`));

      const batch = writeBatch(db);
      details.comments.forEach((comment) => {
        const commentRef = doc(collection(db, 'projects', project.id, 'features', featureRef.id, 'comments'));
        batch.set(commentRef, {
          ...comment,
          featureId: featureRef.id,
          createdAt: new Date().toISOString(),
        });
      });

      const sugRef = doc(db, 'projects', project.id, 'suggestions', suggestion.id);
      batch.update(sugRef, { status: 'approved' });

      await batch.commit().catch(e => handleDataOperationError(e, DataOperationType.WRITE, `projects/${project.id}/features`));
      
      showToast('Feature card forged!');
      onApproveSuggestion(suggestion);
    } catch (error) {
      console.error('Error approving suggestion:', error);
      showToast('Failed to approve suggestion', 'error');
    } finally {
      setIsApproving(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.suggestionId || !project?.id) return;
    try {
      const sugRef = doc(db, 'projects', project.id, 'suggestions', rejectModal.suggestionId);
      const batch = writeBatch(db);
      batch.update(sugRef, { status: 'rejected' });
      await batch.commit().catch(e => handleDataOperationError(e, DataOperationType.WRITE, `projects/${project.id}/suggestions`));
      showToast('Suggestion rejected');
      setRejectModal({ isOpen: false, suggestionId: null });
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      showToast('Failed to reject suggestion', 'error');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-500 mx-auto mb-4" size={32} />
          <p className="text-gray-400 font-medium">Initializing workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0a] p-6">
        <div className="max-w-md text-center p-8 rounded-3xl bg-red-500/5 border border-red-500/10">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={40} />
          <h3 className="text-xl font-bold text-white mb-2">Workspace Error</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0a0a0a]">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-[#0d0d0d]/50 backdrop-blur-md">
        <button 
          onClick={() => navigate('/projects')}
          className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Feature Ideation</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{project.name}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-full overflow-hidden">
        {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex border-b border-white/10 bg-[#0f0f0f] sticky top-0 z-20">
        <button
          onClick={() => setActiveMobileTab('chat')}
          className={cn(
            "flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2",
            activeMobileTab === 'chat' ? "text-indigo-400 border-indigo-500 bg-indigo-500/5" : "text-gray-500 border-transparent"
          )}
        >
          Ideation
        </button>
        <button
          onClick={() => setActiveMobileTab('suggestions')}
          className={cn(
            "flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2",
            activeMobileTab === 'suggestions' ? "text-amber-400 border-amber-500 bg-amber-500/5" : "text-gray-500 border-transparent"
          )}
        >
          Suggestions {suggestions.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500 text-black rounded-full text-[10px]">{suggestions.length}</span>}
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <AnimatePresence mode="wait">
          {/* Chat Interface */}
          {(activeMobileTab === 'chat' || window.innerWidth >= 1024) && (
            <motion.div
              key="chat"
              initial={window.innerWidth < 1024 ? { opacity: 0, x: -20 } : {}}
              animate={{ opacity: 1, x: 0 }}
              exit={window.innerWidth < 1024 ? { opacity: 0, x: 20 } : {}}
              transition={{ duration: 0.2 }}
              className={cn(
                "w-full lg:w-1/2 border-r border-white/10 flex flex-col bg-[#0d0d0d] h-full",
                activeMobileTab === 'chat' ? "flex" : "hidden lg:flex"
              )}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0f0f0f]/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-indigo-400" />
                  <h3 className="font-bold text-white uppercase tracking-widest text-[10px] lg:text-xs">
                    {currentSession?.name || 'Ideation Chat'}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsHistoryOpen(true)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    title="Chat History"
                  >
                    <History size={18} />
                  </button>
                  <button
                    onClick={handleCreateSession}
                    disabled={isCreatingSession}
                    className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-all"
                    title="New Session"
                  >
                    {isCreatingSession ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  </button>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 overscroll-contain scroll-smooth">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 lg:p-10">
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                      <Sparkles size={32} className="text-indigo-400" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">Start Forging</h4>
                    <p className="text-gray-500 text-sm max-w-xs">Describe a feature idea in plain language and FlowForge will help you structure it.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={cn("flex gap-3 lg:gap-4", msg.role === 'assistant' ? "flex-row" : "flex-row-reverse")}>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        msg.role === 'assistant' ? "bg-indigo-600 text-white" : "bg-white/10 text-gray-300"
                      )}>
                        {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                      </div>
                      <div className={cn(
                        "max-w-[85%] lg:max-w-[80%] p-3 lg:p-4 rounded-2xl text-sm leading-relaxed",
                        msg.role === 'assistant' 
                          ? "bg-white/5 border border-white/10 text-gray-200" 
                          : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10"
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                {isGenerating && (
                  <div className="flex gap-4 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/50 flex items-center justify-center">
                      <Bot size={16} className="text-white/50" />
                    </div>
                    <div className="max-w-[80%] p-4 rounded-2xl bg-white/5 border border-white/10 text-gray-500 text-sm italic">
                      Forging suggestions...
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/10 bg-[#0f0f0f] pb-safe">
                <form onSubmit={handleSendMessage} className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe your feature idea..."
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    disabled={isGenerating || !currentSession}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isGenerating || !currentSession}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Suggestions Panel */}
          {(activeMobileTab === 'suggestions' || window.innerWidth >= 1024) && (
            <motion.div
              key="suggestions"
              initial={window.innerWidth < 1024 ? { opacity: 0, x: 20 } : {}}
              animate={{ opacity: 1, x: 0 }}
              exit={window.innerWidth < 1024 ? { opacity: 0, x: -20 } : {}}
              transition={{ duration: 0.2 }}
              className={cn(
                "w-full lg:w-1/2 flex flex-col bg-[#0a0a0a] h-full",
                activeMobileTab === 'suggestions' ? "flex" : "hidden lg:flex"
              )}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0f0f0f]/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-400" />
                  <h3 className="font-bold text-white uppercase tracking-widest text-[10px] lg:text-xs">AI Suggestions</h3>
                </div>
                {suggestions.length > 0 && (
                  <span className="text-[10px] font-bold bg-white/5 px-2 py-1 rounded border border-white/10 text-gray-400">
                    {suggestions.length} NEW
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 overscroll-contain">
                {suggestions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 lg:p-10 opacity-30">
                    <RefreshCw size={48} className="text-gray-600 mb-4" />
                    <p className="text-gray-500 text-sm">No suggestions yet. Use the chat to generate some.</p>
                  </div>
                ) : (
                  suggestions.map((sug) => (
                    <div key={sug.id} className="group p-4 lg:p-5 rounded-2xl bg-[#141414] border border-white/5 hover:border-indigo-500/30 transition-all animate-in fade-in slide-in-from-right-4">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors text-base">{sug.title}</h4>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                          sug.scope === 'Small' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                          sug.scope === 'Medium' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-red-500/10 text-red-400 border border-red-500/20"
                        )}>
                          {sug.scope}
                        </span>
                      </div>
                      
                      <div className="space-y-4 mb-6">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Problem</p>
                          <p className="text-xs text-gray-300 leading-relaxed">{sug.problem}</p>
                        </div>
                        
                        <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                          <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold mb-1">Solution</p>
                          <p className="text-xs text-indigo-100/80 leading-relaxed font-medium">{sug.solution}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                          <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold mb-1">Value</p>
                          <p className="text-xs text-emerald-100/80 italic">"{sug.userValue}"</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(sug)}
                          disabled={!!isApproving}
                          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 active:scale-95"
                        >
                          {isApproving === sug.id ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectModal({ isOpen: true, suggestionId: sug.id })}
                          disabled={!!isApproving}
                          className="p-3 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all disabled:opacity-50 active:scale-95"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="text-indigo-400" size={20} />
                  <h3 className="text-lg font-bold text-white">Session History</h3>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-2 text-gray-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSwitchSession(session)}
                    className={cn(
                      "w-full p-4 rounded-2xl flex items-center justify-between transition-all group cursor-pointer",
                      currentSession?.id === session.id 
                        ? "bg-indigo-600 text-white" 
                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        currentSession?.id === session.id ? "bg-white/20" : "bg-white/5"
                      )}>
                        <MessageSquare size={20} />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm">{session.name}</p>
                          {currentSession?.id === session.id && (
                            <span className="px-1.5 py-0.5 bg-white/20 text-[8px] uppercase tracking-widest rounded font-bold">Current</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] opacity-60">
                          <Calendar size={10} />
                          {format(new Date(session.createdAt), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          currentSession?.id === session.id 
                            ? "text-white/40 hover:text-white hover:bg-white/10" 
                            : "text-gray-600 hover:text-red-400 hover:bg-red-400/10"
                        )}
                        title="Delete Session"
                      >
                        <Trash2 size={16} />
                      </button>
                      <ChevronRight size={18} className={cn(
                        "transition-transform",
                        currentSession?.id === session.id ? "translate-x-0" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                      )} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-[#0f0f0f] border-t border-white/10">
                <button
                  onClick={handleCreateSession}
                  disabled={isCreatingSession}
                  className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-2xl text-sm font-bold transition-all"
                >
                  {isCreatingSession ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  Start New Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, suggestionId: null })}
        onConfirm={handleReject}
        title="Reject Suggestion"
        message="Are you sure you want to reject this suggestion? It will be removed from your pending list."
        confirmText="Reject"
        type="warning"
      />
    </div>
    </div>
  );
}


