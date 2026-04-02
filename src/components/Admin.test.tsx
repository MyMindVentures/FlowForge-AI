import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Admin from './Admin';
import { ToastProvider } from './Toast';

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

vi.mock('../hooks/useFirestore', () => ({
  useFirestore: () => ({
    data: [],
    loading: false,
    error: null,
    add: vi.fn(),
    update: vi.fn(),
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
});
