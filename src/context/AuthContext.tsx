import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { doc, updateDoc, onSnapshot } from '../lib/db/firestoreCompat';
import { auth, db, getInitialSessionUser, onAuthSessionChange, setCurrentUser, signInWithGoogle, signOutCurrentUser, supabase, type AuthenticatedUser } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { ensureUserProfile } from '../lib/db/profile';

interface AuthContextType {
  user: AuthenticatedUser | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const getAuthErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Google sign-in failed. Check Supabase Auth provider settings and the browser console.';
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const applySessionUser = async (sessionUser: SupabaseUser | null) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setAuthError(null);

      if (!sessionUser) {
        setUser(null);
        setProfile(null);
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { profile: ensuredProfile, authUser } = await ensureUserProfile(sessionUser);
        setUser(authUser);
        setProfile(ensuredProfile);

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
        setAuthError(getAuthErrorMessage(error));
        setLoading(false);
      }
    };

    const subscription = onAuthSessionChange((sessionUser) => {
      void applySessionUser(sessionUser);
    });

    void getInitialSessionUser().then((sessionUser) => {
      void applySessionUser(sessionUser);
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
    try {
      setAuthError(null);
      await signInWithGoogle();
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    }
  };

  const logout = async () => {
    setAuthError(null);
    await signOutCurrentUser();
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
    <AuthContext.Provider value={{ user, profile, loading, authError, login, logout, updateProfile, setRole }}>
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
