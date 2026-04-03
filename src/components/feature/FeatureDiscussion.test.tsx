import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FeatureDiscussion from './FeatureDiscussion';

const baseProps = {
  comments: [
    {
      id: 'comment-1',
      featureId: 'feature-1',
      authorRole: 'Architect' as const,
      authorName: 'Concept Thinker',
      summary: 'Clarify auth edge case',
      content: 'We should define what happens when the callback URL is invalid.',
      type: 'Question' as const,
      status: 'open' as const,
      createdAt: new Date().toISOString(),
    },
  ],
  newComment: '',
  setNewComment: vi.fn(),
  commentSummary: '',
  setCommentSummary: vi.fn(),
  commentFilter: 'all' as const,
  setCommentFilter: vi.fn(),
  commentRole: 'Architect' as const,
  setCommentRole: vi.fn(),
  commentType: 'Question' as const,
  setCommentType: vi.fn(),
  onAddComment: vi.fn((event) => event.preventDefault()),
  onUpdateCommentStatus: vi.fn(),
};

describe('FeatureDiscussion', () => {
  it('renders collaboration hub content', () => {
    render(<FeatureDiscussion {...baseProps} />);

    expect(screen.getByText('Collaboration Hub')).toBeInTheDocument();
    expect(screen.getByText('Clarify auth edge case')).toBeInTheDocument();
    expect(screen.getByText('Resolve')).toBeInTheDocument();
  });

  it('allows resolving an open comment', () => {
    render(<FeatureDiscussion {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Resolve' }));
    expect(baseProps.onUpdateCommentStatus).toHaveBeenCalledWith('comment-1', 'resolved');
  });
});