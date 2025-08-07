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
import { updateUserProfilePublicStatus } from '@/lib/db';
import { doc, serverTimestamp, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const SUPER_ADMIN_EMAIL = 'esxy26@gmail.com';

interface AppUser extends User {
  isProfilePublic?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isSuperAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfileName: (newName: string) => Promise<void>;
  updateProfilePublicStatus: (isPublic: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    // Only subscribe if auth is initialized
    if (auth && db) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            // User exists, update last login and get their public status
            await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
            const userData = userSnap.data();
            setUser({
              ...user,
              isProfilePublic: userData.isProfilePublic || false,
            });
            setIsSuperAdmin(userData.isSuperAdmin || false);
          } else if (!user.isAnonymous) {
            // New user, create their document
            const isUserSuperAdmin = user.email === SUPER_ADMIN_EMAIL;
            const newUserDoc = {
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
              isSuperAdmin: isUserSuperAdmin,
              isProfilePublic: false, // Default to private
            };
            await setDoc(userRef, newUserDoc);
            setUser({ ...user, isProfilePublic: false });
            setIsSuperAdmin(isUserSuperAdmin);
          } else {
            // Anonymous user
            setUser(user);
            setIsSuperAdmin(false);
          }
        } else {
          setUser(null);
          setIsSuperAdmin(false);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
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
      await updateProfile(currentUser, { displayName: newName });
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { displayName: newName });
      setUser((prevUser) =>
        prevUser ? { ...prevUser, displayName: newName } : null
      );
    } catch (error) {
      console.error('Error updating profile name:', error);
      throw new Error('Failed to update profile name.');
    }
  };

  const _updateProfilePublicStatus = async (isPublic: boolean) => {
    if (!user || user.isAnonymous) {
      throw new Error('User not authenticated.');
    }
    try {
      await updateUserProfilePublicStatus(user.uid, isPublic);
      setUser((prevUser) =>
        prevUser ? { ...prevUser, isProfilePublic: isPublic } : null
      );
    } catch (error) {
      console.error('Error updating profile public status:', error);
      throw new Error('Could not update profile status.');
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
    updateProfilePublicStatus: _updateProfilePublicStatus,
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
