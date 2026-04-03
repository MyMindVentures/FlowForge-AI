import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import FeedbackPanel from './FeedbackPanel';
import { ToastProvider } from './Toast';

const { addMock, logMock } = vi.hoisted(() => ({
  addMock: vi.fn(),
  logMock: vi.fn(),
}));

vi.mock('../hooks/useSupabaseCollection', () => ({
  useSupabaseCollection: () => ({
    data: [],
    loading: false,
    add: addMock,
  }),
}));

vi.mock('../services/audit', () => ({
  AuditAction: {
    USER_FEEDBACK_SUBMITTED: 'USER_FEEDBACK_SUBMITTED',
  },
  AuditService: {
    log: logMock,
  },
}));

describe('FeedbackPanel', () => {
  beforeEach(() => {
    addMock.mockReset();
    logMock.mockReset();
    addMock.mockResolvedValue('feedback-1');
    logMock.mockResolvedValue(undefined);
  });

  it('submits feedback with attached project context', async () => {
    render(
      <ToastProvider>
        <FeedbackPanel
          userId="user-1"
          userEmail="user@example.com"
          currentProject={{ id: 'project-1', name: 'FlowForge AI' }}
        />
      </ToastProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('Short summary of the issue or idea'), {
      target: { value: 'Search loses state' },
    });
    fireEvent.change(screen.getByPlaceholderText('Describe what happened, what you expected, or what would make the workflow better.'), {
      target: { value: 'Returning from a feature resets the previous backlog filters.' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit Feedback' }));

    await waitFor(() => {
      expect(addMock).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-1',
        userEmail: 'user@example.com',
        category: 'feature',
        subject: 'Search loses state',
        message: 'Returning from a feature resets the previous backlog filters.',
        projectId: 'project-1',
        contextPath: '/projects/project-1/workspace',
        status: 'new',
      }));
    });

    expect(logMock).toHaveBeenCalledWith(
      'USER_FEEDBACK_SUBMITTED',
      expect.objectContaining({
        category: 'feature',
        subject: 'Search loses state',
        contextPath: '/projects/project-1/workspace',
        attachedProjectId: 'project-1',
      }),
      'project-1'
    );
  });
});