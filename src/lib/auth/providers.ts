export type OAuthProviderId = 'google' | 'github' | 'azure' | 'apple';

export type AuthProviderId =
  | OAuthProviderId
  | 'password'
  | 'magic_link'
  | 'email_otp'
  | 'enterprise_oidc'
  | 'enterprise_saml'
  | 'passkey'
  | 'totp'
  | 'sms_otp';

export type AuthProviderKind = 'oauth' | 'password' | 'passwordless' | 'sso' | 'mfa';

export type AuthProviderCategory = 'social' | 'enterprise' | 'passwordless' | 'password' | 'mfa';

export type AuthProviderAvailability = 'available' | 'preview' | 'requires_config';

export interface AuthProviderDescriptor {
  id: AuthProviderId;
  label: string;
  description: string;
  kind: AuthProviderKind;
  category: AuthProviderCategory;
  availability: AuthProviderAvailability;
  featureFlag?: string;
  supportsDirectClientFlow?: boolean;
  oauthProvider?: OAuthProviderId;
}

function isEmailOtpEnabled() {
  return import.meta.env.DEV || import.meta.env.VITE_SUPABASE_EMAIL_OTP_ENABLED === 'true';
}

function isAppleOAuthEnabled() {
  return import.meta.env.VITE_SUPABASE_APPLE_OAUTH_ENABLED === 'true';
}

function isEnterpriseSsoEnabled() {
  return import.meta.env.VITE_SUPABASE_ENTERPRISE_SSO_ENABLED !== 'false';
}

function isPasskeyPreviewEnabled() {
  return import.meta.env.VITE_SUPABASE_PASSKEYS_ENABLED === 'true';
}

function isTotpMfaEnabled() {
  return import.meta.env.VITE_SUPABASE_TOTP_MFA_ENABLED !== 'false';
}

function isSmsFallbackEnabled() {
  return import.meta.env.VITE_SUPABASE_SMS_MFA_FALLBACK_ENABLED === 'true';
}

const AUTH_PROVIDER_CATALOG: AuthProviderDescriptor[] = [
  {
    id: 'google',
    label: 'Google',
    description: 'OAuth2 / OpenID Connect via your Google account.',
    kind: 'oauth',
    category: 'social',
    availability: 'available',
    supportsDirectClientFlow: true,
    oauthProvider: 'google',
  },
  {
    id: 'github',
    label: 'GitHub',
    description: 'OAuth2 via GitHub for engineering teams and maintainers.',
    kind: 'oauth',
    category: 'social',
    availability: 'available',
    supportsDirectClientFlow: true,
    oauthProvider: 'github',
  },
  {
    id: 'azure',
    label: 'Microsoft',
    description: 'OpenID Connect via Microsoft Entra ID / Azure AD.',
    kind: 'oauth',
    category: 'social',
    availability: 'available',
    supportsDirectClientFlow: true,
    oauthProvider: 'azure',
  },
  {
    id: 'apple',
    label: 'Apple',
    description: 'Sign in with Apple for managed device fleets and privacy-conscious teams.',
    kind: 'oauth',
    category: 'social',
    availability: isAppleOAuthEnabled() ? 'available' : 'requires_config',
    featureFlag: 'auth.apple_oauth',
    supportsDirectClientFlow: isAppleOAuthEnabled(),
    oauthProvider: 'apple',
  },
  {
    id: 'enterprise_oidc',
    label: 'Enterprise OIDC',
    description: 'Work-account SSO using your company email domain and OpenID Connect.',
    kind: 'sso',
    category: 'enterprise',
    availability: isEnterpriseSsoEnabled() ? 'available' : 'requires_config',
    featureFlag: 'auth.enterprise_sso',
    supportsDirectClientFlow: isEnterpriseSsoEnabled(),
  },
  {
    id: 'enterprise_saml',
    label: 'Enterprise SAML',
    description: 'Federated SSO for enterprise tenants that rely on SAML 2.0 identity providers.',
    kind: 'sso',
    category: 'enterprise',
    availability: isEnterpriseSsoEnabled() ? 'available' : 'requires_config',
    featureFlag: 'auth.enterprise_sso',
    supportsDirectClientFlow: isEnterpriseSsoEnabled(),
  },
  {
    id: 'password',
    label: 'Password',
    description: 'Email and password sign-in with email verification and password reset support.',
    kind: 'password',
    category: 'password',
    availability: 'available',
    supportsDirectClientFlow: true,
  },
  {
    id: 'magic_link',
    label: 'Magic Link',
    description: 'Passwordless email sign-in using a secure link.',
    kind: 'passwordless',
    category: 'passwordless',
    availability: 'available',
    supportsDirectClientFlow: true,
  },
  {
    id: 'email_otp',
    label: 'Email One-Time Code',
    description: 'Passwordless sign-in using a short-lived verification code.',
    kind: 'passwordless',
    category: 'passwordless',
    availability: isEmailOtpEnabled() ? 'available' : 'requires_config',
    featureFlag: 'auth.email_otp',
    supportsDirectClientFlow: isEmailOtpEnabled(),
  },
  {
    id: 'passkey',
    label: 'Passkeys',
    description: 'WebAuthn-based device credentials for phishing-resistant sign-in.',
    kind: 'mfa',
    category: 'mfa',
    availability: isPasskeyPreviewEnabled() ? 'preview' : 'requires_config',
    featureFlag: 'auth.passkeys_preview',
    supportsDirectClientFlow: false,
  },
  {
    id: 'totp',
    label: 'TOTP MFA',
    description: 'Time-based one-time passwords from authenticator apps such as 1Password or Authy.',
    kind: 'mfa',
    category: 'mfa',
    availability: isTotpMfaEnabled() ? 'preview' : 'requires_config',
    featureFlag: 'auth.totp_mfa',
    supportsDirectClientFlow: false,
  },
  {
    id: 'sms_otp',
    label: 'SMS Fallback',
    description: 'Optional phone-based challenge flow for recovery and MFA fallback.',
    kind: 'mfa',
    category: 'mfa',
    availability: isSmsFallbackEnabled() ? 'preview' : 'requires_config',
    featureFlag: 'auth.sms_mfa_fallback',
    supportsDirectClientFlow: false,
  },
];

export function getAuthProviderCatalog() {
  return AUTH_PROVIDER_CATALOG.map((provider) => ({ ...provider }));
}

export function supportsEmailOtp() {
  return isEmailOtpEnabled();
}

export function isOAuthProviderId(value: string): value is OAuthProviderId {
  return value === 'google' || value === 'github' || value === 'azure' || value === 'apple';
}

export function getOAuthProvider(providerId: AuthProviderId) {
  return AUTH_PROVIDER_CATALOG.find((provider) => provider.id === providerId)?.oauthProvider;
}