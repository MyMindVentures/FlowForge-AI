import { describe, expect, it, vi } from 'vitest';

describe('auth provider catalog', () => {
  it('includes Apple and enterprise providers with provider-agnostic metadata', async () => {
    vi.stubEnv('VITE_SUPABASE_APPLE_OAUTH_ENABLED', 'true');
    vi.stubEnv('VITE_SUPABASE_ENTERPRISE_SSO_ENABLED', 'true');
    vi.stubEnv('VITE_SUPABASE_EMAIL_OTP_ENABLED', 'true');

    const providersModule = await import('./providers');
    const catalog = providersModule.getAuthProviderCatalog();

    expect(catalog.some((provider) => provider.id === 'apple' && provider.kind === 'oauth')).toBe(true);
    expect(catalog.some((provider) => provider.id === 'enterprise_oidc' && provider.kind === 'sso')).toBe(true);
    expect(catalog.some((provider) => provider.id === 'enterprise_saml' && provider.kind === 'sso')).toBe(true);
    expect(catalog.some((provider) => provider.id === 'email_otp' && provider.availability === 'available')).toBe(true);

    vi.unstubAllEnvs();
  });

  it('recognizes Apple as an OAuth provider id', async () => {
    const providersModule = await import('./providers');

    expect(providersModule.isOAuthProviderId('apple')).toBe(true);
    expect(providersModule.getOAuthProvider('apple')).toBe('apple');
    expect(providersModule.isOAuthProviderId('enterprise_oidc')).toBe(false);
  });
});