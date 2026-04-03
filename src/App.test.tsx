import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock the contexts
vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }: any) => <>{children}</>,
  useAuth: () => ({
    user: null,
    profile: null,
    loading: false,
    authError: null,
    authNotice: null,
    isPasswordRecovery: false,
    permissions: [],
    availableProviders: [],
    defaultLoginProfiles: [],
    login: vi.fn(),
    loginWithPassword: vi.fn(),
    loginWithProvider: vi.fn(),
    loginWithEnterpriseSso: vi.fn(),
    requestMagicLink: vi.fn(),
    requestOneTimeCode: vi.fn(),
    verifyOneTimeCode: vi.fn(),
    requestPasswordReset: vi.fn(),
    completePasswordRecovery: vi.fn(),
    hasPermission: vi.fn(() => false),
    logout: vi.fn(),
    logoutAllSessions: vi.fn(),
    updateProfile: vi.fn(),
    setRole: vi.fn(),
  }),
}));

vi.mock('./context/ProjectContext', () => ({
  ProjectProvider: ({ children }: any) => <>{children}</>,
  useProject: () => ({
    projects: [],
    loading: false,
  }),
}));

// Mock the components to avoid rendering the whole app tree
vi.mock('./components/Splash', () => ({
  default: ({ onComplete }: any) => {
    // Immediately complete splash
    setTimeout(onComplete, 0);
    return <div data-testid="splash">Splash</div>;
  }
}));

vi.mock('./components/Auth', () => ({
  default: () => <div data-testid="auth">Auth</div>
}));

describe('App', () => {
  it('renders splash then auth when not logged in', async () => {
    render(<App />);
    
    // Initially shows splash
    expect(screen.getByTestId('splash')).toBeInTheDocument();
    
    // Then shows auth
    const auth = await screen.findByTestId('auth');
    expect(auth).toBeInTheDocument();
  });
});


