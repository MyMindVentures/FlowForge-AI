import { createClient, type AuthChangeEvent, type Session, type User as SupabaseUser } from '@supabase/supabase-js';
import {
  getAuthProviderCatalog,
  getOAuthProvider,
  isOAuthProviderId,
  supportsEmailOtp,
  type AuthProviderDescriptor,
  type AuthProviderId,
  type OAuthProviderId,
} from '../auth/providers';
import type { UserRole } from '../../types';

type ProviderInfo = {
  providerId: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

export type AuthenticatedUser = {
  uid: string;
  authUserId: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  tenantId: string | null;
  providerData: ProviderInfo[];
};

export type DefaultLoginProfile = {
  id: string;
  slug: string;
  displayName: string;
  aliasName: string | null;
  email: string;
  role: string;
  passwordStatus: string;
  passwordLoginEnabled: boolean;
};

export type { AuthProviderDescriptor, AuthProviderId, OAuthProviderId };

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const missingSupabaseConfigMessage = 'Supabase environment variables are missing. Set VITE_SUPABASE_URL and either VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_PUBLISHABLE_KEY, or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY.';

/**
 * Returns whether the client has enough environment configuration to initialize Supabase.
 */
export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

function requireSupabaseConfig() {
  if (!isSupabaseConfigured()) {
    throw new Error(missingSupabaseConfigMessage);
  }
}

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

let currentUser: AuthenticatedUser | null = null;

export const auth = {
  get currentUser() {
    return currentUser;
  },
};

export const db = {
  provider: 'supabase',
} as const;

function getConfiguredAuthBaseUrl() {
  if (import.meta.env.VITE_AUTH_REDIRECT_URL) {
    return import.meta.env.VITE_AUTH_REDIRECT_URL;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return undefined;
}

function getAuthRedirectUrl(path = '/') {
  const baseUrl = getConfiguredAuthBaseUrl();
  if (!baseUrl) {
    return undefined;
  }

  return new URL(path, baseUrl).toString();
}

/**
 * Stores the current authenticated app user for non-React helpers.
 */
export function setCurrentUser(user: AuthenticatedUser | null) {
  currentUser = user;
}

/**
 * Returns the configured admin email used for bootstrap and fallback logic.
 */
export function getDefaultAdminEmail() {
  return import.meta.env.VITE_SUPABASE_ADMIN_EMAIL || 'lacometta33@gmail.com';
}

/**
 * Maps Supabase identity records into the app's provider metadata shape.
 */
export function mapSupabaseUserToProviderData(user: SupabaseUser): ProviderInfo[] {
  const identities = user.identities || [];
  if (!identities.length) {
    return [];
  }

  return identities.map((identity) => ({
    providerId: identity.provider,
    displayName:
      (identity.identity_data?.full_name as string | undefined) ||
      (identity.identity_data?.name as string | undefined) ||
      null,
    email: (identity.identity_data?.email as string | undefined) || user.email || null,
    photoURL: (identity.identity_data?.avatar_url as string | undefined) || null,
  }));
}

/**
 * Returns the enabled authentication providers for the current deployment.
 */
export function getSupportedAuthProviders(): AuthProviderDescriptor[] {
  return getAuthProviderCatalog();
}

/**
 * Loads the permission keys associated with an application role.
 */
export async function getRolePermissions(role: UserRole): Promise<string[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.rpc('get_role_permissions', {
    target_role: role,
  });

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data : [];
}

/**
 * Detects whether the current browser URL represents a password recovery flow.
 */
export function isPasswordRecoveryCallback() {
  if (typeof window === 'undefined') {
    return false;
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(window.location.search);
  return hashParams.get('type') === 'recovery' || searchParams.get('type') === 'recovery';
}

/**
 * Removes password recovery markers from the current browser URL.
 */
export function clearAuthRecoveryParams() {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  url.hash = '';
  url.searchParams.delete('type');
  window.history.replaceState({}, document.title, url.toString());
}

/**
 * Returns the current Supabase auth session.
 */
export async function getInitialSession() {
  requireSupabaseConfig();
  const { data, error } = await supabase!.auth.getSession();
  if (error) {
    throw error;
  }

  return data.session;
}

/**
 * Lists enabled default login profiles for the auth screen.
 */
export async function listDefaultLoginProfiles(): Promise<DefaultLoginProfile[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('auth_login_profiles')
    .select('id, slug, display_name, alias_name, email, role, password_status, password_login_enabled')
    .eq('is_enabled', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map((profile) => ({
    id: profile.id,
    slug: profile.slug,
    displayName: profile.display_name,
    aliasName: profile.alias_name,
    email: profile.email,
    role: profile.role,
    passwordStatus: profile.password_status,
    passwordLoginEnabled: profile.password_login_enabled,
  }));
}

async function requestDevelopmentEmailOtp(email: string) {
  if (typeof window === 'undefined' || !import.meta.env.DEV) {
    return null;
  }

  const response = await fetch('/api/dev-auth/email-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (response.status === 404) {
    return null;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to generate a development email one-time code.');
  }

  return payload as { emailOtp?: string | null };
}

/**
 * Starts an OAuth sign-in flow for a specific provider.
 */
export async function signInWithOAuthProvider(provider: OAuthProviderId) {
  requireSupabaseConfig();
  const redirectTo = getAuthRedirectUrl();
  const { error } = await supabase!.auth.signInWithOAuth({
    provider,
    options: redirectTo ? { redirectTo } : undefined,
  });

  if (error) {
    throw error;
  }
}

/**
 * Starts Google OAuth sign-in.
 */
export async function signInWithGoogle() {
  await signInWithOAuthProvider('google');
}

/**
 * Starts sign-in for a supported provider identifier.
 */
export async function signInWithProvider(providerId: AuthProviderId) {
  const oauthProvider = getOAuthProvider(providerId);
  if (!oauthProvider || !isOAuthProviderId(oauthProvider)) {
    throw new Error(`Unsupported OAuth provider: ${providerId}`);
  }

  await signInWithOAuthProvider(oauthProvider);
}

/**
 * Signs a user in with an email and password.
 */
export async function signInWithPassword(email: string, password: string) {
  requireSupabaseConfig();

  const { error } = await supabase!.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }
}

/**
 * Starts enterprise SSO based on a work email or company domain.
 */
export async function signInWithEnterpriseSso(identifier: string) {
  requireSupabaseConfig();

  const normalizedIdentifier = identifier.trim().toLowerCase();
  const domain = normalizedIdentifier.includes('@')
    ? normalizedIdentifier.split('@').pop() || ''
    : normalizedIdentifier;

  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
    throw new Error('Enter your work email or company domain to continue with enterprise SSO.');
  }

  const redirectTo = getAuthRedirectUrl();
  const { error } = await supabase!.auth.signInWithSSO({
    domain,
    options: redirectTo ? { redirectTo } : undefined,
  });

  if (error) {
    throw error;
  }
}

/**
 * Sends a passwordless magic link to the provided email address.
 */
export async function requestMagicLink(email: string) {
  requireSupabaseConfig();
  const redirectTo = getAuthRedirectUrl();
  const { error } = await supabase!.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: redirectTo,
      data: {
        flowforgeAuthMethod: 'magic_link',
      },
    },
  });

  if (error) {
    throw error;
  }
}

/**
 * Requests a one-time email code, using the dev helper when available.
 */
export async function requestEmailOneTimeCode(email: string) {
  requireSupabaseConfig();

  const devOtpPayload = await requestDevelopmentEmailOtp(email);
  if (devOtpPayload) {
    return devOtpPayload;
  }

  if (!supportsEmailOtp()) {
    throw new Error('Email one-time codes are disabled. For local testing, start the Vite dev server with SUPABASE_SERVICE_ROLE_KEY set. Otherwise enable VITE_SUPABASE_EMAIL_OTP_ENABLED and update the Supabase Magic Link email template to use {{ .Token }} instead of {{ .ConfirmationURL }}.');
  }

  const { error } = await supabase!.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: {
        flowforgeAuthMethod: 'email_otp',
      },
    },
  });

  if (error) {
    throw error;
  }

  return { emailOtp: null };
}

/**
 * Sends a password reset email using the configured recovery route.
 */
export async function requestPasswordReset(email: string) {
  requireSupabaseConfig();
  const redirectTo = getAuthRedirectUrl('/auth/recovery');
  const { error } = await supabase!.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);

  if (error) {
    throw error;
  }
}

/**
 * Updates the current authenticated user's password.
 */
export async function updatePassword(password: string) {
  requireSupabaseConfig();

  const { error } = await supabase!.auth.updateUser({ password });

  if (error) {
    throw error;
  }
}

/**
 * Verifies an emailed one-time code and completes sign-in.
 */
export async function verifyEmailOneTimeCode(email: string, token: string) {
  requireSupabaseConfig();

  if (!supportsEmailOtp()) {
    throw new Error('Email one-time codes are disabled. Enable the email OTP flow before attempting verification.');
  }

  const { error } = await supabase!.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error) {
    throw error;
  }
}

/**
 * Signs the current user out using the requested Supabase scope.
 */
export async function signOutCurrentUser(scope: 'local' | 'global' | 'others' = 'local') {
  requireSupabaseConfig();
  const { error } = await supabase!.auth.signOut({ scope });
  if (error) {
    throw error;
  }
  setCurrentUser(null);
}

/**
 * Subscribes to Supabase auth session changes.
 */
export function onAuthSessionChange(callback: (sessionUser: SupabaseUser | null, session: Session | null, event: AuthChangeEvent) => void) {
  if (!supabase) {
    callback(null, null, 'INITIAL_SESSION');
    return {
      unsubscribe() {},
    };
  }

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null, session ?? null, event);
  });

  return data.subscription;
}

/**
 * Returns the current session user when one is available.
 */
export async function getInitialSessionUser() {
  const session = await getInitialSession();
  return session?.user ?? null;
}

