import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { doc, updateDoc, onSnapshot } from '../lib/db/supabaseData';
import {
  auth,
  db,
  getInitialSession,
  getSupportedAuthProviders,
  listDefaultLoginProfiles,
  onAuthSessionChange,
  requestEmailOneTimeCode,
  requestMagicLink,
  requestPasswordReset,
  setCurrentUser,
  signInWithEnterpriseSso,
  signInWithGoogle,
  signInWithPassword,
  signInWithProvider,
  signOutCurrentUser,
  verifyEmailOneTimeCode,
  type AuthenticatedUser,
  type AuthProviderDescriptor,
  type AuthProviderId,
  type DefaultLoginProfile,
} from '../lib/supabase/appClient';
import {
  revokeAllAuthDeviceSessions,
  syncAuthSessionRecord,
} from '../lib/auth/sessionRegistry';
import { UserProfile, UserRole } from '../types';
import { ensureUserProfile } from '../lib/db/profile';
import { AuditAction, AuditService } from '../services/audit';

interface AuthContextType {
  user: AuthenticatedUser | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  authNotice: string | null;
  availableProviders: AuthProviderDescriptor[];
  defaultLoginProfiles: DefaultLoginProfile[];
  login: () => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  loginWithProvider: (provider: AuthProviderId) => Promise<void>;
  loginWithEnterpriseSso: (identifier: string) => Promise<void>;
  requestMagicLink: (email: string) => Promise<void>;
  requestOneTimeCode: (email: string) => Promise<void>;
  verifyOneTimeCode: (email: string, token: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAllSessions: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [defaultLoginProfiles, setDefaultLoginProfiles] = useState<DefaultLoginProfile[]>([]);
  const availableProviders = getSupportedAuthProviders();
  const lastAuditedSignInRef = useRef<string | null>(null);

  const getAuthErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
      if (error.message.includes('provider is not enabled')) {
        return 'That sign-in option is not configured yet. Enable the provider in Supabase Auth first.';
      }

      if (error.message.includes('Email rate limit exceeded')) {
        return 'Too many auth requests were sent. Wait a moment and try again.';
      }

      if (error.message.includes('Email one-time codes are disabled')) {
        return error.message;
      }

      if (error.message.includes('Invalid login credentials')) {
        return 'Invalid email or password.';
      }

      if (error.message.includes('SAML') || error.message.includes('SSO')) {
        return 'Enterprise SSO is not configured for that company domain yet. Confirm the SAML or OIDC connection in Supabase Auth.';
      }

      if (error.message.includes('revoked')) {
        return error.message;
      }

      return error.message;
    }

    return 'Authentication failed. Check Supabase Auth provider settings and the browser console.';
  };

  const normalizeEmail = (email: string) => email.trim().toLowerCase();

  const requireValidEmail = (email: string) => {
    const normalizedEmail = normalizeEmail(email);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('Enter a valid email address.');
    }

    return normalizedEmail;
  };

  useEffect(() => {
    let isSubscribed = true;

    void listDefaultLoginProfiles()
      .then((profiles) => {
        if (isSubscribed) {
          setDefaultLoginProfiles(profiles);
        }
      })
      .catch((error) => {
        console.error('AuthContext: Failed to load default login profiles:', error);
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const applySessionUser = async (sessionUser: SupabaseUser | null, session: import('@supabase/supabase-js').Session | null) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setAuthError(null);

      if (!sessionUser) {
        lastAuditedSignInRef.current = null;
        setUser(null);
        setProfile(null);
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { profile: ensuredProfile, authUser } = await ensureUserProfile(sessionUser);

        if (session) {
          await syncAuthSessionRecord(session, authUser);
        }

        setUser(authUser);
        setProfile(ensuredProfile);
        setAuthNotice(null);

        const signInAuditKey = `${sessionUser.id}:${sessionUser.last_sign_in_at || ''}`;
        if (lastAuditedSignInRef.current !== signInAuditKey) {
          lastAuditedSignInRef.current = signInAuditKey;
          void AuditService.log(AuditAction.AUTH_SIGN_IN, {
            providerIds: authUser.providerData.map((provider) => provider.providerId),
            emailVerified: authUser.emailVerified,
          });
        }

        const profileRef = doc(db, 'users', ensuredProfile.uid);
        unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
          if (!docSnap.exists()) {
            setProfile(null);
            setUser(null);
            setCurrentUser(null);
            setLoading(false);
            return;
          }

          const nextProfile = {
            uid: ensuredProfile.uid,
            ...(docSnap.data() as UserProfile),
          } as UserProfile;

          const nextUser: AuthenticatedUser = {
            ...authUser,
            uid: nextProfile.uid,
            email: nextProfile.email,
            displayName: nextProfile.displayName,
            photoURL: nextProfile.photoURL || null,
          };

          setProfile(nextProfile);
          setUser(nextUser);
          setCurrentUser(nextUser);
          setLoading(false);
        }, (error) => {
          console.error('AuthContext: Profile snapshot error:', error);
          setLoading(false);
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('revoked')) {
          await signOutCurrentUser();
        }
        setAuthNotice(null);
        setAuthError(getAuthErrorMessage(error));
        setLoading(false);
      }
    };

    const subscription = onAuthSessionChange((sessionUser, session) => {
      void applySessionUser(sessionUser, session);
    });

    void getInitialSession().then((session) => {
      void applySessionUser(session?.user ?? null, session ?? null);
    }).catch((error) => {
      setAuthError(getAuthErrorMessage(error));
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const login = async () => {
    await loginWithProvider('google');
  };

  const loginWithEmailAndPassword = async (email: string, password: string) => {
    try {
      const normalizedEmail = requireValidEmail(email);
      const normalizedPassword = password.trim();

      if (!normalizedPassword) {
        throw new Error('Enter your password.');
      }

      setAuthError(null);
      setAuthNotice(null);
      await signInWithPassword(normalizedEmail, normalizedPassword);
      void AuditService.log(AuditAction.AUTH_PROVIDER_INITIATED, {
        provider: 'password',
      });
    } catch (error) {
      setAuthNotice(null);
      setAuthError(getAuthErrorMessage(error));
    }
  };

  const loginWithProvider = async (provider: AuthProviderId) => {
    try {
      setAuthError(null);
      setAuthNotice(null);
      await signInWithProvider(provider);
      void AuditService.log(AuditAction.AUTH_PROVIDER_INITIATED, {
        provider,
      });
    } catch (error) {
      setAuthNotice(null);
      setAuthError(getAuthErrorMessage(error));
    }
  };

  const loginWithEnterpriseProvider = async (identifier: string) => {
    try {
      const normalizedIdentifier = identifier.trim().toLowerCase();

      if (!normalizedIdentifier) {
        throw new Error('Enter your work email or company domain.');
      }

      setAuthError(null);
      setAuthNotice(null);
      await signInWithEnterpriseSso(normalizedIdentifier);
      void AuditService.log(AuditAction.AUTH_ENTERPRISE_SSO_INITIATED, {
        identifier: normalizedIdentifier,
      });
    } catch (error) {
      setAuthNotice(null);
      setAuthError(getAuthErrorMessage(error));
    }
  };

  const sendMagicLink = async (email: string) => {
    try {
      const normalizedEmail = requireValidEmail(email);
      setAuthError(null);
      await requestMagicLink(normalizedEmail);
      setAuthNotice(`Magic link sent to ${normalizedEmail}. Open it on this device to finish signing in.`);
      void AuditService.log(AuditAction.AUTH_MAGIC_LINK_REQUESTED, {
        email: normalizedEmail,
      });
    } catch (error) {
      setAuthNotice(null);
      setAuthError(getAuthErrorMessage(error));
    }
  };

  const sendOneTimeCode = async (email: string) => {
    try {
      const normalizedEmail = requireValidEmail(email);
      setAuthError(null);
      const otpResponse = await requestEmailOneTimeCode(normalizedEmail);
      if (otpResponse?.emailOtp) {
        setAuthNotice(`A development one-time code was generated for ${normalizedEmail}: ${otpResponse.emailOtp}. Enter it below to complete sign-in.`);
      } else {
        setAuthNotice(`A one-time code was sent to ${normalizedEmail}. Enter it below to complete sign-in.`);
      }
      void AuditService.log(AuditAction.AUTH_OTP_REQUESTED, {
        email: normalizedEmail,
      });
    } catch (error) {
      setAuthNotice(null);
      setAuthError(getAuthErrorMessage(error));
    }
  };

  const confirmOneTimeCode = async (email: string, token: string) => {
    try {
      const normalizedEmail = requireValidEmail(email);
      const normalizedToken = token.trim();

      if (!normalizedToken) {
        throw new Error('Enter the verification code from your email.');
      }

      setAuthError(null);
      await verifyEmailOneTimeCode(normalizedEmail, normalizedToken);
      setAuthNotice('Verification code accepted. Completing sign-in...');
      void AuditService.log(AuditAction.AUTH_OTP_VERIFIED, {
        email: normalizedEmail,
      });
    } catch (error) {
      setAuthNotice(null);
      setAuthError(getAuthErrorMessage(error));
    }
  };

  const sendPasswordResetLink = async (email: string) => {
    try {
      const normalizedEmail = requireValidEmail(email);
      setAuthError(null);
      await requestPasswordReset(normalizedEmail);
      setAuthNotice(`Password reset instructions were sent to ${normalizedEmail}.`);
      void AuditService.log(AuditAction.AUTH_PASSWORD_RESET_REQUESTED, {
        email: normalizedEmail,
      });
    } catch (error) {
      setAuthNotice(null);
      setAuthError(getAuthErrorMessage(error));
    }
  };

  const logout = async () => {
    setAuthError(null);
    setAuthNotice(null);
    await AuditService.log(AuditAction.AUTH_SIGN_OUT, {});
    await signOutCurrentUser('local');
    setAuthNotice('Signed out successfully.');
  };

  const logoutAllSessions = async () => {
    if (!user) {
      return;
    }

    setAuthError(null);
    setAuthNotice(null);

    await revokeAllAuthDeviceSessions(user.authUserId, 'logout_all');
    await AuditService.log(AuditAction.AUTH_LOGOUT_ALL, {});
    await signOutCurrentUser('global');
    setAuthNotice('Signed out on all devices.');
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const profileRef = doc(db, 'users', user.uid);
    await updateDoc(profileRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  };

  const setRole = async (role: UserRole) => {
    await updateProfile({ role });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        authError,
        authNotice,
        availableProviders,
        defaultLoginProfiles,
        login,
        loginWithPassword: loginWithEmailAndPassword,
        loginWithProvider,
        loginWithEnterpriseSso: loginWithEnterpriseProvider,
        requestMagicLink: sendMagicLink,
        requestOneTimeCode: sendOneTimeCode,
        verifyOneTimeCode: confirmOneTimeCode,
        requestPasswordReset: sendPasswordResetLink,
        logout,
        logoutAllSessions,
        updateProfile,
        setRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


