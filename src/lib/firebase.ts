// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  getFirestore,
  type Firestore,
  enableIndexedDbPersistence,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

// Check if the API key is provided before initializing
if (firebaseConfig.apiKey) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);

    // Enable offline persistence for Firestore
    if (typeof window !== 'undefined' && db) {
      enableIndexedDbPersistence(db, {
        forceOwnership: false,
      }).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn(
            'Firebase: Multiple tabs open, persistence can only be enabled in one tab at a time.'
          );
        } else if (err.code === 'unimplemented') {
          console.warn(
            'Firebase: The current browser does not support all of the features required to enable persistence (common on iOS Safari)'
          );
          // Continue without persistence on iOS Safari
        } else {
          console.error('Firebase persistence error:', err);
        }
      });
    }

    console.log(
      '✅ Firebase initialized successfully with offline persistence'
    );
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
  }
} else {
  // You can handle the case where firebase config is not provided.
  // For now, we will let the app run, but Firebase features will not work.
  // The AuthProvider will show a loading state.
  console.warn(
    '⚠️ Firebase config is missing. Firebase features will be disabled.'
  );
}

export { app, auth, db };
