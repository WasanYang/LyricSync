// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInAnonymously as firebaseSignInAnonymously, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only subscribe if auth is initialized
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // If auth is not initialized, stop loading and show the app
      // The user will be null, so public content is visible.
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) {
      throw new Error("Firebase is not configured correctly. Please check your API keys.");
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      throw new Error("Failed to sign in with Google.");
    }
  };

  const signInAnonymously = async () => {
    if (!auth) {
      throw new Error("Firebase is not configured correctly. Please check your API keys.");
    }
    try {
      await firebaseSignInAnonymously(auth);
    } catch (error) {
      console.error("Error signing in anonymously: ", error);
      throw new Error("Failed to sign in as guest.");
    }
  };

  const logout = async () => {
     if (!auth) {
        throw new Error("Firebase is not configured correctly. Please check your API keys.");
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
      throw new Error("Failed to sign out.");
    }
  };

  const value = { user, loading, signInWithGoogle, signInAnonymously, logout };
  
  // Render a loading screen while auth state is being determined
  if (loading) {
    return (
      <div className="flex flex-col h-screen">
          <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-16 items-center justify-between px-4">
                  <div className="flex items-center">
                       <Skeleton className="h-6 w-40" />
                  </div>
                   <div className="flex items-center justify-end space-x-2">
                       <Skeleton className="h-8 w-8 rounded-full" />
                   </div>
              </div>
          </header>
          <main className="flex-grow container mx-auto p-8">
              <Skeleton className="h-48 w-full" />
          </main>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
