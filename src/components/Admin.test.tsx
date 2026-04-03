import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Admin from './Admin';
import { ToastProvider } from './Toast';

const feedbackUpdateMock = vi.fn();

// Mock the hooks
vi.mock('../context/ProjectContext', () => ({
  useProject: () => ({
    projects: [],
    selectedProject: { id: 'p1', name: 'FlowForge AI' },
    setSelectedProject: vi.fn(),
    pages: [],
    features: [],
    components: [],
    layouts: [],
    functions: [],
    styleSystem: null,
    prdSections: [],
    auditFindings: [],
    readinessChecks: [],
    tasks: [],
    addPage: vi.fn(),
    updatePage: vi.fn(),
    addFeature: vi.fn(),
    updateFeature: vi.fn(),
    addComponent: vi.fn(),
    updateComponent: vi.fn(),
    addLayout: vi.fn(),
    updateLayout: vi.fn(),
    addPRDSection: vi.fn(),
    addAuditFinding: vi.fn(),
    updateAuditFinding: vi.fn(),
    addReadinessCheck: vi.fn(),
    updateReadinessCheck: vi.fn(),
    addTask: vi.fn(),
    updateTask: vi.fn(),
    updateLLMFunction: vi.fn()
  })
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'admin-id', email: 'admin@test.com' },
    isAdmin: true,
    loading: false
  })
}));

vi.mock('../hooks/useSupabaseCollection', () => ({
  useSupabaseCollection: (path: string) => ({
    data: path === 'feedback' ? [{
      id: 'fb-1',
      userId: 'user-1',
      userEmail: 'user@test.com',
      category: 'bug',
      status: 'new',
      subject: 'Broken onboarding step',
      message: 'The continue button does not preserve state.',
      contextPath: '/projects/p1/workspace',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }] : [],
    loading: false,
    error: null,
    add: vi.fn(),
    update: path === 'feedback' ? feedbackUpdateMock : vi.fn(),
    remove: vi.fn(),
    syncStatus: { status: 'synced' }
  })
}));

describe('Admin', () => {
  it('renders correctly', () => {
    render(
      <ToastProvider>
        <Admin />
      </ToastProvider>
    );
    expect(screen.getByText('AI Control Center')).toBeInTheDocument();
  });

  it('allows admins to review feedback and update status', async () => {
    render(
      <ToastProvider>
        <Admin />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /feedback/i }));

    expect(screen.getByText('User Feedback Inbox')).toBeInTheDocument();
    expect(screen.getByText('Broken onboarding step')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mark reviewed' }));

    await waitFor(() => {
      expect(feedbackUpdateMock).toHaveBeenCalledWith('fb-1', { status: 'reviewed' });
    });
  });
});


