import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { ToastProvider } from './Toast';

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

describe('Dashboard', () => {
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
});
