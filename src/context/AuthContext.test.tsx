import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

const authContextMocks = vi.hoisted(() => ({
  getInitialSessionMock: vi.fn(),
  listDefaultLoginProfilesMock: vi.fn(),
  onAuthSessionChangeMock: vi.fn(),
  getRolePermissionsMock: vi.fn(),
  signInWithPasswordMock: vi.fn(),
  requestPasswordResetMock: vi.fn(),
  updatePasswordMock: vi.fn(),
  setCurrentUserMock: vi.fn(),
  clearAuthRecoveryParamsMock: vi.fn(),
  ensureUserProfileMock: vi.fn(),
  syncAuthSessionRecordMock: vi.fn(),
  revokeAllAuthDeviceSessionsMock: vi.fn(),
  auditLogMock: vi.fn(),
  docMock: vi.fn(() => ({ path: 'users/user-1' })),
  onSnapshotMock: vi.fn((_ref, onNext) => {
    onNext({
      exists: () => true,
      data: () => ({
        email: 'hello@mymindventures.io',
        displayName: 'Kevin De Vlieger',
        photoURL: null,
        role: 'Admin',
        onboarded: true,
        storytellingCompleted: true,
      }),
    });
    return vi.fn();
  }),
}));

const {
  getInitialSessionMock,
  listDefaultLoginProfilesMock,
  onAuthSessionChangeMock,
  getRolePermissionsMock,
  signInWithPasswordMock,
  requestPasswordResetMock,
  updatePasswordMock,
  setCurrentUserMock,
  clearAuthRecoveryParamsMock,
  ensureUserProfileMock,
  syncAuthSessionRecordMock,
  revokeAllAuthDeviceSessionsMock,
  auditLogMock,
  docMock,
  onSnapshotMock,
} = authContextMocks;

let authSessionChangeCallback: ((sessionUser: any, session: any, event: any) => Promise<void> | void) | null = null;

vi.mock('../lib/supabase/appClient', () => ({
  auth: { currentUser: null },
  db: { provider: 'supabase' },
  getInitialSession: authContextMocks.getInitialSessionMock,
  getRolePermissions: authContextMocks.getRolePermissionsMock,
  getSupportedAuthProviders: vi.fn(() => []),
  listDefaultLoginProfiles: authContextMocks.listDefaultLoginProfilesMock,
  onAuthSessionChange: authContextMocks.onAuthSessionChangeMock,
  requestEmailOneTimeCode: vi.fn(),
  requestMagicLink: vi.fn(),
  requestPasswordReset: authContextMocks.requestPasswordResetMock,
  setCurrentUser: authContextMocks.setCurrentUserMock,
  signInWithEnterpriseSso: vi.fn(),
  signInWithGoogle: vi.fn(),
  signInWithPassword: authContextMocks.signInWithPasswordMock,
  signInWithProvider: vi.fn(),
  signOutCurrentUser: vi.fn(),
  updatePassword: authContextMocks.updatePasswordMock,
  verifyEmailOneTimeCode: vi.fn(),
  isPasswordRecoveryCallback: vi.fn(() => false),
  clearAuthRecoveryParams: authContextMocks.clearAuthRecoveryParamsMock,
}));

vi.mock('../lib/auth/sessionRegistry', () => ({
  revokeAllAuthDeviceSessions: authContextMocks.revokeAllAuthDeviceSessionsMock,
  syncAuthSessionRecord: authContextMocks.syncAuthSessionRecordMock,
}));

vi.mock('../lib/db/profile', () => ({
  ensureUserProfile: authContextMocks.ensureUserProfileMock,
}));

vi.mock('../lib/db/supabaseData', () => ({
  doc: authContextMocks.docMock,
  updateDoc: vi.fn(),
  onSnapshot: authContextMocks.onSnapshotMock,
}));

vi.mock('../services/audit', () => ({
  AuditAction: {
    AUTH_PROVIDER_INITIATED: 'AUTH_PROVIDER_INITIATED',
    AUTH_PASSWORD_RESET_REQUESTED: 'AUTH_PASSWORD_RESET_REQUESTED',
    AUTH_SIGN_IN: 'AUTH_SIGN_IN',
    AUTH_SIGN_OUT: 'AUTH_SIGN_OUT',
    AUTH_LOGOUT_ALL: 'AUTH_LOGOUT_ALL',
    AUTH_MAGIC_LINK_REQUESTED: 'AUTH_MAGIC_LINK_REQUESTED',
    AUTH_OTP_REQUESTED: 'AUTH_OTP_REQUESTED',
    AUTH_OTP_VERIFIED: 'AUTH_OTP_VERIFIED',
    AUTH_ENTERPRISE_SSO_INITIATED: 'AUTH_ENTERPRISE_SSO_INITIATED',
  },
  AuditService: {
    log: authContextMocks.auditLogMock,
  },
}));

function AuthContextHarness() {
  const auth = useAuth();

  return (
    <div>
      <div data-testid="auth-error">{auth.authError || ''}</div>
      <div data-testid="auth-notice">{auth.authNotice || ''}</div>
      <div data-testid="recovery-mode">{auth.isPasswordRecovery ? 'yes' : 'no'}</div>
      <button onClick={() => void auth.loginWithPassword('  HELLO@MYMINDVENTURES.IO  ', '  secret-123  ')}>
        Password login
      </button>
      <button onClick={() => void auth.requestPasswordReset('  HELLO@MYMINDVENTURES.IO  ')}>
        Password reset
      </button>
      <button onClick={() => void auth.completePasswordRecovery('  FreshSecret2026  ')}>
        Complete recovery
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authSessionChangeCallback = null;
    getInitialSessionMock.mockResolvedValue(null);
    listDefaultLoginProfilesMock.mockResolvedValue([]);
    onAuthSessionChangeMock.mockImplementation((callback) => {
      authSessionChangeCallback = callback;
      return { unsubscribe: vi.fn() };
    });
    getRolePermissionsMock.mockResolvedValue(['auth.providers.read']);
    signInWithPasswordMock.mockResolvedValue(undefined);
    requestPasswordResetMock.mockResolvedValue(undefined);
    updatePasswordMock.mockResolvedValue(undefined);
    ensureUserProfileMock.mockResolvedValue({
      profile: {
        uid: 'user-1',
        email: 'hello@mymindventures.io',
        displayName: 'Kevin De Vlieger',
        photoURL: null,
        role: 'Admin',
        onboarded: true,
        storytellingCompleted: true,
      },
      authUser: {
        uid: 'user-1',
        authUserId: 'user-1',
        email: 'hello@mymindventures.io',
        displayName: 'Kevin De Vlieger',
        photoURL: null,
        emailVerified: true,
        isAnonymous: false,
        tenantId: null,
        providerData: [],
      },
    });
    syncAuthSessionRecordMock.mockResolvedValue(null);
    auditLogMock.mockResolvedValue(undefined);
  });

  it('normalizes email and password sign-in input before calling Supabase', async () => {
    render(
      <AuthProvider>
        <AuthContextHarness />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Password login'));

    await waitFor(() => {
      expect(signInWithPasswordMock).toHaveBeenCalledWith('hello@mymindventures.io', 'secret-123');
    });
  });

  it('shows a success notice after requesting a password reset', async () => {
    render(
      <AuthProvider>
        <AuthContextHarness />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Password reset'));

    await waitFor(() => {
      expect(requestPasswordResetMock).toHaveBeenCalledWith('hello@mymindventures.io');
    });
    expect(screen.getByTestId('auth-notice')).toHaveTextContent('Password reset instructions were sent to hello@mymindventures.io. Open the email link, then choose a new password in FlowForge.');
  });

  it('enters recovery mode and completes the password update', async () => {
    render(
      <AuthProvider>
        <AuthContextHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('recovery-mode')).toHaveTextContent('no');
    });

    const recoverySession = {
      user: {
        id: 'user-1',
        email: 'hello@mymindventures.io',
        last_sign_in_at: '2026-04-04T00:00:00Z',
        email_confirmed_at: '2026-04-04T00:00:00Z',
        user_metadata: {},
        app_metadata: {},
        identities: [],
      },
      access_token: 'header.payload.signature',
    };

    expect(authSessionChangeCallback).not.toBeNull();
    await act(async () => {
      await authSessionChangeCallback?.(recoverySession.user, recoverySession as any, 'PASSWORD_RECOVERY');
    });

    await waitFor(() => {
      expect(screen.getByTestId('recovery-mode')).toHaveTextContent('yes');
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Complete recovery'));
    });

    await waitFor(() => {
      expect(updatePasswordMock).toHaveBeenCalledWith('FreshSecret2026');
    });
    expect(clearAuthRecoveryParamsMock).toHaveBeenCalled();
    expect(screen.getByTestId('auth-notice')).toHaveTextContent('Password updated.');
  });
});
