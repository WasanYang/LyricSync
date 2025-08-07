
// src/context/AuthContext.tsx
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously as firebaseSignInAnonymously,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

const SUPER_ADMIN_EMAIL = 'esxy26@gmail.com';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSuperAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfileName: (newName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    // Only subscribe if auth is initialized
    if (auth && db) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user && !user.isAnonymous && db) {
          // If user is logged in and not a guest, create/update their doc in Firestore
          const userRef = doc(db, 'users', user.uid);
          try {
            await setDoc(
              userRef,
              {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                lastLoginAt: serverTimestamp(),
                isSuperAdmin: user.email === SUPER_ADMIN_EMAIL,
              },
              { merge: true }
            );
            setIsSuperAdmin(user.email === SUPER_ADMIN_EMAIL);
          } catch (error) {
            console.error('Error updating user document:', error);
          }
        } else {
          setIsSuperAdmin(false);
        }
        setUser(user);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // If auth is not initialized, stop loading and show the app
      // The user will be null, so public content is visible.
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) {
      throw new Error(
        'Firebase is not configured correctly. Please check your API keys.'
      );
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      if ((error as { code?: string }).code === 'auth/popup-closed-by-user') {
        // User closed the popup, do nothing.
        return;
      }
      console.error('Error signing in with Google: ', error);
      throw new Error('Failed to sign in with Google.');
    }
  };

  const signInAnonymously = async () => {
    if (!auth) {
      throw new Error(
        'Firebase is not configured correctly. Please check your API keys.'
      );
    }
    try {
      await firebaseSignInAnonymously(auth);
    } catch (error) {
      console.error('Error signing in anonymously: ', error);
      throw new Error('Failed to sign in as guest.');
    }
  };

  const logout = async () => {
    if (!auth) {
      throw new Error(
        'Firebase is not configured correctly. Please check your API keys.'
      );
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out: ', error);
      throw new Error('Failed to sign out.');
    }
  };

  const updateProfileName = async (newName: string) => {
    if (!auth?.currentUser || !db) {
      throw new Error('User not authenticated or Firebase not available.');
    }

    const currentUser = auth.currentUser;

    try {
      // Update Firebase Auth profile
      await updateProfile(currentUser, { displayName: newName });

      // Update Firestore user document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { displayName: newName });

      // Manually update the user state in the context to reflect changes immediately
      setUser({ ...currentUser, displayName: newName });
    } catch (error) {
      console.error('Error updating profile name:', error);
      throw new Error('Failed to update profile name.');
    }
  };

  const value = {
    user,
    loading,
    isSuperAdmin,
    signInWithGoogle,
    signInAnonymously,
    logout,
    updateProfileName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
