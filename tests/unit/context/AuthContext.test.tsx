import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../../../src/context/AuthContext';

const mockOnSnapshot = vi.fn();
const mockUpdateDoc = vi.fn().mockResolvedValue({});
const mockSignInWithGoogle = vi.fn().mockResolvedValue(undefined);
const mockSignInWithPassword = vi.fn().mockResolvedValue(undefined);
const mockSignInWithProvider = vi.fn().mockResolvedValue(undefined);
const mockRequestMagicLink = vi.fn().mockResolvedValue(undefined);
const mockRequestEmailOneTimeCode = vi.fn().mockResolvedValue(undefined);
const mockVerifyEmailOneTimeCode = vi.fn().mockResolvedValue(undefined);
const mockSignOutCurrentUser = vi.fn().mockResolvedValue(undefined);
const mockSetCurrentUser = vi.fn();
const mockEnsureUserProfile = vi.fn();
const mockOnAuthSessionChange = vi.fn();
const mockGetInitialSession = vi.fn();
const mockGetRolePermissions = vi.fn().mockResolvedValue([]);
const mockIsPasswordRecoveryCallback = vi.fn().mockReturnValue(false);
const mockGetSupportedAuthProviders = vi.fn().mockReturnValue([
  { id: 'google', label: 'Google', description: 'OAuth2 / OpenID Connect via your Google account.', kind: 'oauth', oauthProvider: 'google' },
  { id: 'github', label: 'GitHub', description: 'OAuth2 via GitHub for engineering teams and maintainers.', kind: 'oauth', oauthProvider: 'github' },
]);
const mockListDefaultLoginProfiles = vi.fn().mockResolvedValue([
  {
    id: 'kevin',
    slug: 'kevin',
    displayName: 'Kevin De Vlieger',
    aliasName: 'The Architect',
    email: 'hello@mymindventures.io',
    role: 'Admin',
    passwordStatus: 'active',
    passwordLoginEnabled: true,
  },
]);

vi.mock('../../../src/lib/supabase/appClient', () => ({
  auth: {},
  db: {},
  supabase: {},
  onAuthSessionChange: (...args: any[]) => mockOnAuthSessionChange(...args),
  getInitialSession: (...args: any[]) => mockGetInitialSession(...args),
  getRolePermissions: (...args: any[]) => mockGetRolePermissions(...args),
  getSupportedAuthProviders: (...args: any[]) => mockGetSupportedAuthProviders(...args),
  isPasswordRecoveryCallback: (...args: any[]) => mockIsPasswordRecoveryCallback(...args),
  clearAuthRecoveryParams: vi.fn(),
  listDefaultLoginProfiles: (...args: any[]) => mockListDefaultLoginProfiles(...args),
  signInWithGoogle: (...args: any[]) => mockSignInWithGoogle(...args),
  signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
  signInWithProvider: (...args: any[]) => mockSignInWithProvider(...args),
  requestMagicLink: (...args: any[]) => mockRequestMagicLink(...args),
  requestEmailOneTimeCode: (...args: any[]) => mockRequestEmailOneTimeCode(...args),
  verifyEmailOneTimeCode: (...args: any[]) => mockVerifyEmailOneTimeCode(...args),
  signOutCurrentUser: (...args: any[]) => mockSignOutCurrentUser(...args),
  setCurrentUser: (...args: any[]) => mockSetCurrentUser(...args),
}));

vi.mock('../../../src/lib/db/supabaseData', () => ({
  doc: vi.fn(),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
}));

vi.mock('../../../src/lib/db/profile', () => ({
  ensureUserProfile: (...args: any[]) => mockEnsureUserProfile(...args),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthSessionChange.mockImplementation((callback: (user: any) => void) => {
      callback(null);
      return { unsubscribe: vi.fn() };
    });
    mockGetInitialSession.mockResolvedValue(null);
    mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snapshot: any) => void) => {
      callback({
        exists: () => false,
        data: () => undefined,
      });
      return vi.fn();
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('initializes with null user and profile when there is no session', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it('hydrates user and profile for an authenticated session', async () => {
    const sessionUser = { id: 'auth-user-1', email: 'test@example.com', user_metadata: {} };
    const authUser = {
      uid: 'legacy-user-1',
      authUserId: 'auth-user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
      emailVerified: true,
      isAnonymous: false,
      tenantId: null,
      providerData: [],
    };

    mockOnAuthSessionChange.mockImplementation((callback: (user: any) => void) => {
      callback(sessionUser);
      return { unsubscribe: vi.fn() };
    });
    mockGetInitialSession.mockResolvedValue({ user: sessionUser });
    mockEnsureUserProfile.mockResolvedValue({
      authUser,
      profile: {
        uid: 'legacy-user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'Builder',
        onboarded: false,
        storytellingCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        settings: { theme: 'dark', notifications: true },
      },
    });
    mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snapshot: any) => void) => {
      callback({
        exists: () => true,
        data: () => ({
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'Builder',
          onboarded: false,
          storytellingCompleted: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          lastLogin: '2026-01-01T00:00:00.000Z',
          settings: { theme: 'dark', notifications: true },
        }),
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user?.uid).toBe('legacy-user-1');
    });

    expect(result.current.profile).toEqual(expect.objectContaining({ uid: 'legacy-user-1', role: 'Builder' }));
    expect(mockSetCurrentUser).toHaveBeenCalled();
  });

  it('login delegates to Supabase Google OAuth', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login();
    });

    expect(mockSignInWithProvider).toHaveBeenCalledWith('google');
  });

  it('loginWithPassword delegates to Supabase email and password auth', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.loginWithPassword('test@example.com', 'secret-123');
    });

    expect(mockSignInWithPassword).toHaveBeenCalledWith('test@example.com', 'secret-123');
  });

  it('loginWithProvider delegates to the configured provider flow', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.loginWithProvider('github');
    });

    expect(mockSignInWithProvider).toHaveBeenCalledWith('github');
  });

  it('requestMagicLink sends a passwordless email', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.requestMagicLink('test@example.com');
    });

    expect(mockRequestMagicLink).toHaveBeenCalledWith('test@example.com');
    expect(result.current.authNotice).toContain('Magic link sent');
  });

  it('requestOneTimeCode sends an email verification code', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.requestOneTimeCode('test@example.com');
    });

    expect(mockRequestEmailOneTimeCode).toHaveBeenCalledWith('test@example.com');
    expect(result.current.authNotice).toContain('one-time code');
  });

  it('verifyOneTimeCode verifies the submitted code', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.verifyOneTimeCode('test@example.com', '123456');
    });

    expect(mockVerifyEmailOneTimeCode).toHaveBeenCalledWith('test@example.com', '123456');
  });

  it('logout delegates to Supabase sign out', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockSignOutCurrentUser).toHaveBeenCalled();
  });

  it('exposes the configured auth provider catalog', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.availableProviders).toHaveLength(2);
  });

  it('loads the default login profiles for the auth screen', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.defaultLoginProfiles).toHaveLength(1);
    });

    expect(result.current.defaultLoginProfiles[0]).toEqual(expect.objectContaining({
      slug: 'kevin',
      email: 'hello@mymindventures.io',
    }));
  });

  it('updateProfile updates the current linked profile document', async () => {
    const sessionUser = { id: 'auth-user-1', email: 'test@example.com', user_metadata: {} };
    mockOnAuthSessionChange.mockImplementation((callback: (user: any) => void) => {
      callback(sessionUser);
      return { unsubscribe: vi.fn() };
    });
    mockGetInitialSession.mockResolvedValue({ user: sessionUser });
    mockEnsureUserProfile.mockResolvedValue({
      authUser: {
        uid: 'legacy-user-1',
        authUserId: 'auth-user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        emailVerified: true,
        isAnonymous: false,
        tenantId: null,
        providerData: [],
      },
      profile: {
        uid: 'legacy-user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'Builder',
        onboarded: false,
        storytellingCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        settings: { theme: 'dark', notifications: true },
      },
    });
    mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snapshot: any) => void) => {
      callback({
        exists: () => true,
        data: () => ({
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'Builder',
          onboarded: false,
          storytellingCompleted: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          lastLogin: '2026-01-01T00:00:00.000Z',
          settings: { theme: 'dark', notifications: true },
        }),
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user?.uid).toBe('legacy-user-1');
    });

    await act(async () => {
      await result.current.updateProfile({ displayName: 'Updated Name' });
    });

    expect(mockUpdateDoc).toHaveBeenCalled();
  });

  it('useAuth throws outside the provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
    consoleSpy.mockRestore();
  });
});


