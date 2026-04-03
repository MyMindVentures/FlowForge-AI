import { createClient, type Session, type User as SupabaseUser } from '@supabase/supabase-js';
import { getAuthProviderCatalog, getOAuthProvider, isOAuthProviderId, type AuthProviderDescriptor, type AuthProviderId, type OAuthProviderId } from './lib/auth/providers';

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

export type { AuthProviderDescriptor, AuthProviderId, OAuthProviderId };

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const missingSupabaseConfigMessage = 'Supabase environment variables are missing. Set VITE_SUPABASE_URL and either VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_PUBLISHABLE_KEY, or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY.';

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

function requireSupabaseConfig() {
  if (!isSupabaseConfigured()) {
    throw new Error(missingSupabaseConfigMessage);
  }
}

export const supabase = isSupabaseConfigured() ? createClient(supabaseUrl!, supabasePublishableKey!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
}) : null;

let currentUser: AuthenticatedUser | null = null;

export const auth = {
  get currentUser() {
    return currentUser;
  },
};

export const db = {
  provider: 'supabase',
} as const;

function getAuthRedirectUrl() {
  if (import.meta.env.VITE_AUTH_REDIRECT_URL) {
    return import.meta.env.VITE_AUTH_REDIRECT_URL;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return undefined;
}

export function setCurrentUser(user: AuthenticatedUser | null) {
  currentUser = user;
}

export function getDefaultAdminEmail() {
  return import.meta.env.VITE_SUPABASE_ADMIN_EMAIL || 'lacometta33@gmail.com';
}

export function mapSupabaseUserToProviderData(user: SupabaseUser): ProviderInfo[] {
  const identities = user.identities || [];
  if (!identities.length) {
    return [];
  }

  return identities.map((identity) => ({
    providerId: identity.provider,
    displayName: (identity.identity_data?.full_name as string | undefined) || (identity.identity_data?.name as string | undefined) || null,
    email: (identity.identity_data?.email as string | undefined) || user.email || null,
    photoURL: (identity.identity_data?.avatar_url as string | undefined) || null,
  }));
}

export function getSupportedAuthProviders(): AuthProviderDescriptor[] {
  return getAuthProviderCatalog();
}

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

export async function signInWithGoogle() {
  await signInWithOAuthProvider('google');
}

export async function signInWithProvider(providerId: AuthProviderId) {
  const oauthProvider = getOAuthProvider(providerId);
  if (!oauthProvider || !isOAuthProviderId(oauthProvider)) {
    throw new Error(`Unsupported OAuth provider: ${providerId}`);
  }

  await signInWithOAuthProvider(oauthProvider);
}

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

export async function requestEmailOneTimeCode(email: string) {
  requireSupabaseConfig();
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
}

export async function verifyEmailOneTimeCode(email: string, token: string) {
  requireSupabaseConfig();
  const { error } = await supabase!.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error) {
    throw error;
  }
}

export async function signOutCurrentUser() {
  requireSupabaseConfig();
  const { error } = await supabase!.auth.signOut();
  if (error) {
    throw error;
  }
  setCurrentUser(null);
}

export function onAuthSessionChange(callback: (sessionUser: SupabaseUser | null, session: Session | null) => void) {
  if (!supabase) {
    callback(null, null);
    return {
      unsubscribe() {}
    };
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null, session ?? null);
  });

  return data.subscription;
}

export async function getInitialSessionUser() {
  requireSupabaseConfig();
  const { data, error } = await supabase!.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session?.user ?? null;
}

