import React, { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bug, Lightbulb, MessageSquareQuote, Send, Sparkles } from 'lucide-react';
import { limit, orderBy, where } from '../lib/db/supabaseData';
import { useSupabaseCollection } from '../hooks/useSupabaseCollection';
import { FeedbackItem } from '../types';
import { useToast } from './Toast';
import { AuditAction, AuditService } from '../services/audit';
import { cn } from '../lib/utils';

type FeedbackCategory = FeedbackItem['category'];

interface FeedbackPanelProps {
  userId: string;
  userEmail: string;
  currentProject?: {
    id: string;
    name: string;
  };
}

const categoryOptions: Array<{
  value: FeedbackCategory;
  label: string;
  description: string;
  icon: typeof Bug;
}> = [
  {
    value: 'bug',
    label: 'Bug',
    description: 'Something is broken or misleading.',
    icon: Bug,
  },
  {
    value: 'feature',
    label: 'Feature',
    description: 'A product capability you want added.',
    icon: Lightbulb,
  },
  {
    value: 'ux',
    label: 'UX',
    description: 'A workflow, layout, or usability issue.',
    icon: Sparkles,
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Anything else worth capturing.',
    icon: MessageSquareQuote,
  },
];

const statusTone: Record<FeedbackItem['status'], string> = {
  new: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  reviewed: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  planned: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
};

export default function FeedbackPanel({ userId, userEmail, currentProject }: FeedbackPanelProps) {
  const { showToast } = useToast();
  const { data: feedbackItems, loading, add } = useSupabaseCollection<FeedbackItem>('feedback', [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(5),
  ]);

  const [category, setCategory] = useState<FeedbackCategory>('feature');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachProjectContext, setAttachProjectContext] = useState(Boolean(currentProject));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recentItems = useMemo(() => {
    return [...feedbackItems].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }, [feedbackItems]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!subject.trim() || !message.trim()) {
      showToast('Subject and details are required.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const linkedProjectId = attachProjectContext ? currentProject?.id : undefined;
      const contextPath = linkedProjectId ? `/projects/${linkedProjectId}/workspace` : '/settings';

      await add({
        userId,
        userEmail,
        projectId: linkedProjectId,
        category,
        status: 'new',
        subject: subject.trim(),
        message: message.trim(),
        contextPath,
      } as Omit<FeedbackItem, 'id'>);

      await AuditService.log(
        AuditAction.USER_FEEDBACK_SUBMITTED,
        {
          category,
          subject: subject.trim(),
          contextPath,
          attachedProjectId: linkedProjectId || null,
        },
        linkedProjectId,
      );

      setSubject('');
      setMessage('');
      showToast('Feedback submitted. It is now visible in your recent submissions.');
    } catch (error) {
      showToast('Failed to submit feedback.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl lg:rounded-3xl bg-[#141414] border border-white/5 p-6 lg:p-8 text-left">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Feedback Loop</h3>
          <p className="text-sm text-gray-400 mt-1">
            Capture bugs, friction, and product ideas without leaving the app.
          </p>
        </div>
        <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest text-indigo-300">
          Live
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {categoryOptions.map((option) => {
            const Icon = option.icon;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setCategory(option.value)}
                className={cn(
                  'rounded-2xl border p-4 text-left transition-all',
                  category === option.value
                    ? 'border-indigo-500/40 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                    : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10'
                )}
              >
                <div className="flex items-center gap-2 mb-2 text-white">
                  <Icon size={16} className={category === option.value ? 'text-indigo-300' : 'text-gray-400'} />
                  <span className="text-sm font-semibold">{option.label}</span>
                </div>
                <p className="text-xs leading-relaxed text-gray-400">{option.description}</p>
              </button>
            );
          })}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Subject
          </label>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Short summary of the issue or idea"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Details
          </label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Describe what happened, what you expected, or what would make the workflow better."
            rows={5}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={attachProjectContext}
            disabled={!currentProject}
            onChange={(event) => setAttachProjectContext(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-white/10 bg-transparent text-indigo-500"
          />
          <div>
            <p className="text-sm font-medium text-white">Attach current project context</p>
            <p className="text-xs text-gray-400 mt-1">
              {currentProject
                ? `Link this submission to ${currentProject.name} for faster triage.`
                : 'Open a project first if you want feedback linked to a workspace.'}
            </p>
          </div>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Send size={16} />
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>

      <div className="mt-8 border-t border-white/5 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500">Recent Submissions</h4>
          {loading && <span className="text-xs text-gray-500">Loading...</span>}
        </div>

        <div className="space-y-3">
          {!loading && recentItems.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#101010] px-4 py-6 text-center">
              <p className="text-sm text-gray-400">No feedback submitted yet.</p>
            </div>
          )}

          {recentItems.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/5 bg-[#101010] p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h5 className="text-sm font-semibold text-white">{item.subject}</h5>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest', statusTone[item.status])}>
                  {item.status}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-gray-300 mb-3">{item.message}</p>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <span>{item.category}</span>
                {item.projectId && <span>Project linked</span>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}