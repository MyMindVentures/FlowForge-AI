import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { ToastProvider } from './Toast';

const { useSupabaseCollectionMock } = vi.hoisted(() => ({
  useSupabaseCollectionMock: vi.fn(() => ({
    data: [],
    loading: false,
    error: null,
    add: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    syncStatus: 'synced',
  })),
}));

// Mock the hooks
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: '123', email: 'test@example.com' },
    profile: { id: '123', role: 'Product Manager', onboardingCompleted: true },
    loading: false,
    error: null,
    signInWithGoogle: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn()
  })
}));

vi.mock('../hooks/useSupabaseCollection', () => ({
  useSupabaseCollection: useSupabaseCollectionMock
}));

describe('Dashboard', () => {
  it('queries projects without a client-side owner filter', () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <Dashboard onSelectProject={vi.fn()} />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(useSupabaseCollectionMock).toHaveBeenCalledWith('projects', []);
  });

  it('renders correctly with no projects', () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <Dashboard onSelectProject={vi.fn()} />
        </ToastProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('No projects found')).toBeInTheDocument();
  });

  it('renders a Supabase product-model project row in the overview', () => {
    useSupabaseCollectionMock.mockImplementationOnce(() => ({
      data: [
        {
          id: 'project-1',
          name: 'FlowForge AI',
          description: 'Internal product workspace',
          ownerAuthId: 'owner-1',
          status: 'active',
          createdAt: '2026-04-04T00:00:00.000Z',
          updatedAt: '2026-04-04T00:00:00.000Z',
        },
      ],
      loading: false,
      error: null,
      add: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      syncStatus: 'synced',
    }));

    render(
      <MemoryRouter>
        <ToastProvider>
          <Dashboard onSelectProject={vi.fn()} />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('FlowForge AI')).toBeInTheDocument();
    expect(screen.getAllByText('Active')).toHaveLength(2);
  });
});



