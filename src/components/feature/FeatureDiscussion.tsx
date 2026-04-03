import React from 'react';
import { CheckCircle2, Filter, MessageSquare, RotateCcw, Send, User, Bot } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';
import { Comment } from '../../types';

interface FeatureDiscussionProps {
  comments: Comment[];
  newComment: string;
  setNewComment: (val: string) => void;
  commentSummary: string;
  setCommentSummary: (val: string) => void;
  commentFilter: 'all' | 'open' | 'resolved';
  setCommentFilter: (val: 'all' | 'open' | 'resolved') => void;
  commentRole: 'Architect' | 'Builder';
  setCommentRole: (val: 'Architect' | 'Builder') => void;
  commentType: 'Question' | 'Decision' | 'Definition';
  setCommentType: (val: 'Question' | 'Decision' | 'Definition') => void;
  onAddComment: (e: React.FormEvent) => void;
  onUpdateCommentStatus: (commentId: string, status: 'open' | 'resolved') => void;
}

export default function FeatureDiscussion({
  comments,
  newComment,
  setNewComment,
  commentSummary,
  setCommentSummary,
  commentFilter,
  setCommentFilter,
  commentRole,
  setCommentRole,
  commentType,
  setCommentType,
  onAddComment,
  onUpdateCommentStatus
}: FeatureDiscussionProps) {
  const openComments = comments.filter((comment) => (comment.status || 'open') === 'open');
  const resolvedComments = comments.filter((comment) => comment.status === 'resolved');
  const decisionComments = comments.filter((comment) => comment.type === 'Decision');
  const filteredComments = comments.filter((comment) => {
    if (commentFilter === 'all') {
      return true;
    }

    return (comment.status || 'open') === commentFilter;
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-4 lg:p-6 rounded-2xl lg:rounded-3xl bg-[#0f0f0f] border border-white/5 min-h-[600px] flex flex-col shadow-2xl">
        <div className="flex flex-col gap-6 mb-6">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-indigo-400" />
            <h3 className="font-bold text-white">Collaboration Hub</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Open Threads', value: openComments.length, tone: 'text-amber-400 bg-amber-500/10' },
              { label: 'Resolved', value: resolvedComments.length, tone: 'text-emerald-400 bg-emerald-500/10' },
              { label: 'Decisions', value: decisionComments.length, tone: 'text-indigo-400 bg-indigo-500/10' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', item.tone)}>
                  <MessageSquare size={16} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{item.label}</p>
                <p className="text-xl font-bold text-white mt-1">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 mr-2">
              <Filter size={12} />
              View
            </div>
            {(['all', 'open', 'resolved'] as const).map((value) => (
              <button
                key={value}
                onClick={() => setCommentFilter(value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border',
                  commentFilter === value
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <MessageSquare size={18} className="text-indigo-400" />
          <h3 className="font-bold text-white">Saved Conversation</h3>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-6 scrollbar-thin scrollbar-thumb-white/10">
          {filteredComments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
              <MessageSquare size={40} className="mb-2" />
              <p className="text-xs">No saved collaboration items in this view yet.</p>
            </div>
          ) : (
            filteredComments.map((comment) => (
              <div key={comment.id} className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    {comment.summary && (
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{comment.summary}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                    <div className={cn(
                      "w-5 h-5 rounded flex items-center justify-center",
                      comment.authorRole === 'Architect' ? "bg-indigo-500/20 text-indigo-400" : "bg-amber-500/20 text-amber-400"
                    )}>
                      {comment.authorRole === 'Architect' ? <User size={12} /> : <Bot size={12} />}
                    </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{comment.authorRole}</span>
                      {comment.authorName && (
                        <span className="text-[10px] text-gray-500">{comment.authorName}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                      comment.type === 'Question' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                      comment.type === 'Decision' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                      "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    )}>
                      {comment.type}
                    </span>
                    <span className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border',
                      (comment.status || 'open') === 'resolved'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    )}>
                      {comment.status || 'open'}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-sm text-gray-300 leading-relaxed">
                  {comment.content}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[9px] text-gray-600">{formatDistanceToNow(new Date(comment.createdAt))} ago</p>
                  <button
                    onClick={() => onUpdateCommentStatus(comment.id, (comment.status || 'open') === 'resolved' ? 'open' : 'resolved')}
                    className={cn(
                      'flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg transition-all border',
                      (comment.status || 'open') === 'resolved'
                        ? 'text-gray-400 border-white/10 hover:text-white hover:bg-white/5'
                        : 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'
                    )}
                  >
                    {(comment.status || 'open') === 'resolved' ? <RotateCcw size={12} /> : <CheckCircle2 size={12} />}
                    {(comment.status || 'open') === 'resolved' ? 'Reopen' : 'Resolve'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-6 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <select
              value={commentRole}
              onChange={(e) => setCommentRole(e.target.value as any)}
              className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider focus:outline-none"
            >
              <option value="Architect">Architect</option>
              <option value="Builder">Builder</option>
            </select>
            <select
              value={commentType}
              onChange={(e) => setCommentType(e.target.value as any)}
              className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider focus:outline-none"
            >
              <option value="Question">Question</option>
              <option value="Decision">Decision</option>
              <option value="Definition">Definition</option>
            </select>
          </div>
          <input
            value={commentSummary}
            onChange={(e) => setCommentSummary(e.target.value)}
            placeholder="Short summary, e.g. Clarify auth callback flow"
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
          <form onSubmit={onAddComment} className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Leave a saved note, question, decision, or clarification for the other role..."
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-24 resize-none transition-all"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="absolute right-2 bottom-2 p-2 text-indigo-400 hover:text-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


