import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const getAuthErrorMessage = (error: unknown) => {
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'auth/unauthorized-domain':
          return 'Google sign-in is blocked for this app URL. Add localhost, 127.0.0.1, and any active dev hostnames to Firebase Authentication > Settings > Authorized domains.';
        case 'auth/popup-blocked':
          return 'The Google sign-in popup was blocked by the browser. Allow popups for this site and try again.';
        case 'auth/popup-closed-by-user':
          return 'The Google sign-in popup was closed before authentication completed.';
        case 'auth/cancelled-popup-request':
          return null;
        default:
          return error.message;
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Google sign-in failed. Check the browser console and Firebase Authentication settings.';
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthError(null);
      
      if (firebaseUser) {
        // Fetch or create profile
        const profileRef = doc(db, 'users', firebaseUser.uid);
        
        // Use onSnapshot for real-time profile updates
        const unsubscribeProfile = onSnapshot(profileRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const isAdmin = firebaseUser.email === 'lacometta33@gmail.com';
            
            if (isAdmin && data.role !== 'Admin') {
              await updateDoc(profileRef, { 
                role: 'Admin',
                onboarded: true,
                storytellingCompleted: true
              });
            }
            setProfile(data);
          } else {
            // Create initial profile
            const isAdmin = firebaseUser.email === 'lacometta33@gmail.com';
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Anonymous',
              photoURL: firebaseUser.photoURL || undefined,
              role: isAdmin ? 'Admin' : 'Builder', // Default role
              onboarded: isAdmin, // Admins don't need onboarding
              storytellingCompleted: isAdmin, // Admins don't need storytelling
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              settings: {
                theme: 'dark',
                notifications: true
              }
            };
            await setDoc(profileRef, newProfile);
            setProfile(newProfile);
          }
          setLoading(false);
        }, (error) => {
          console.error('AuthContext: Profile snapshot error:', error);
          setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      setAuthError(null);
      await signInWithPopup(auth, provider);
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    }
  };

  const logout = async () => {
    setAuthError(null);
    await signOut(auth);
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
