import React from 'react';
import { MessageSquare, User, Bot, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';
import { Comment } from '../../types';

interface FeatureDiscussionProps {
  comments: Comment[];
  newComment: string;
  setNewComment: (val: string) => void;
  commentRole: 'Architect' | 'Builder';
  setCommentRole: (val: 'Architect' | 'Builder') => void;
  commentType: 'Question' | 'Decision' | 'Definition';
  setCommentType: (val: 'Question' | 'Decision' | 'Definition') => void;
  onAddComment: (e: React.FormEvent) => void;
}

export default function FeatureDiscussion({
  comments,
  newComment,
  setNewComment,
  commentRole,
  setCommentRole,
  commentType,
  setCommentType,
  onAddComment
}: FeatureDiscussionProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-4 lg:p-6 rounded-2xl lg:rounded-3xl bg-[#0f0f0f] border border-white/5 min-h-[600px] flex flex-col shadow-2xl">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare size={18} className="text-indigo-400" />
          <h3 className="font-bold text-white">Discussion</h3>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-6 scrollbar-thin scrollbar-thumb-white/10">
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
              <MessageSquare size={40} className="mb-2" />
              <p className="text-xs">No discussion yet.</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-5 h-5 rounded flex items-center justify-center",
                      comment.authorRole === 'Architect' ? "bg-indigo-500/20 text-indigo-400" : "bg-amber-500/20 text-amber-400"
                    )}>
                      {comment.authorRole === 'Architect' ? <User size={12} /> : <Bot size={12} />}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{comment.authorRole}</span>
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                    comment.type === 'Question' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                    comment.type === 'Decision' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                    "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  )}>
                    {comment.type}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-sm text-gray-300 leading-relaxed">
                  {comment.content}
                </div>
                <p className="text-[9px] text-gray-600 text-right">{formatDistanceToNow(new Date(comment.createdAt))} ago</p>
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
          <form onSubmit={onAddComment} className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
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
