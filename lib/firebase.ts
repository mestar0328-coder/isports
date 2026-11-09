import { type FirebaseApp, type FirebaseOptions, getApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import { type Firestore, getFirestore } from "firebase/firestore";
import { type FirebaseStorage, getStorage } from "firebase/storage";

/**
 * Client Firebase configuration.
 * Next.js only inlines NEXT_PUBLIC_* values when each variable is read directly.
 * This module must stay free of secrets. Service-account credentials are not used here.
 */
function readFirebaseConfig(): FirebaseOptions {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  const missing = [
    ["NEXT_PUBLIC_FIREBASE_API_KEY", apiKey],
    ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", authDomain],
    ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", projectId],
    ["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", storageBucket],
    ["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", messagingSenderId],
    ["NEXT_PUBLIC_FIREBASE_APP_ID", appId],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase web app configuration: ${missing.join(", ")}. Add these to .env.local and restart the dev server.`,
    );
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

/**
 * Returns the existing Firebase app when one is already registered.
 * getApps() survives Next.js Fast Refresh, so this does not create a second app.
 */
export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(readFirebaseConfig());
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getFirebaseFirestore(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp());
}
