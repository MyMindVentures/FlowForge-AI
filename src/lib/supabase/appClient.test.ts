import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithPasswordMock = vi.fn();
const resetPasswordForEmailMock = vi.fn();
const updateUserMock = vi.fn();
const onAuthStateChangeMock = vi.fn();
const rpcMock = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: signInWithPasswordMock,
      resetPasswordForEmail: resetPasswordForEmailMock,
      updateUser: updateUserMock,
      onAuthStateChange: onAuthStateChangeMock,
    },
    rpc: rpcMock,
    from: vi.fn(),
  })),
}));

vi.mock('../auth/providers', () => ({
  getAuthProviderCatalog: vi.fn(() => []),
  getOAuthProvider: vi.fn(() => 'google'),
  isOAuthProviderId: vi.fn(() => true),
  supportsEmailOtp: vi.fn(() => true),
}));

describe('appClient auth helpers', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubEnv('VITE_AUTH_REDIRECT_URL', 'http://localhost:3000');
    window.history.replaceState({}, '', 'http://localhost:3000/');
    signInWithPasswordMock.mockResolvedValue({ error: null });
    resetPasswordForEmailMock.mockResolvedValue({ error: null });
    updateUserMock.mockResolvedValue({ error: null });
    rpcMock.mockResolvedValue({ data: ['auth.providers.read'], error: null });
    onAuthStateChangeMock.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
  });

  it('forwards password sign-in to Supabase Auth', async () => {
    const module = await import('./appClient');

    await module.signInWithPassword('hello@mymindventures.io', 'FlowForge!Access2026#');

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: 'hello@mymindventures.io',
      password: 'FlowForge!Access2026#',
    });
  });

  it('uses the recovery route when requesting a password reset', async () => {
    const module = await import('./appClient');

    await module.requestPasswordReset('hello@mymindventures.io');

    expect(resetPasswordForEmailMock).toHaveBeenCalledWith('hello@mymindventures.io', {
      redirectTo: 'http://localhost:3000/auth/recovery',
    });
  });

  it('updates the current user password through Supabase Auth', async () => {
    const module = await import('./appClient');

    await module.updatePassword('A-new-password-2026');

    expect(updateUserMock).toHaveBeenCalledWith({
      password: 'A-new-password-2026',
    });
  });

  it('detects Supabase recovery callbacks from the URL hash', async () => {
    window.history.replaceState({}, '', 'http://localhost:3000/auth/recovery#type=recovery&access_token=test');
    const module = await import('./appClient');

    expect(module.isPasswordRecoveryCallback()).toBe(true);
  });

  it('loads role permissions through the Supabase RPC helper', async () => {
    const module = await import('./appClient');

    await expect(module.getRolePermissions('Admin')).resolves.toEqual(['auth.providers.read']);
    expect(rpcMock).toHaveBeenCalledWith('get_role_permissions', {
      target_role: 'Admin',
    });
  });
});
