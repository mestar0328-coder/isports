import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

/**
 * Server-only Admin SDK. Do not import this file from client components.
 * Credentials are read from server environment variables and are never prefixed with NEXT_PUBLIC_.
 */
function assertServer() {
  if (typeof window !== "undefined") {
    throw new Error("Firebase Admin SDK can only be used on the server.");
  }
}

function readAdminCredential() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  const missing = [
    ["FIREBASE_ADMIN_PROJECT_ID", projectId],
    ["FIREBASE_ADMIN_CLIENT_EMAIL", clientEmail],
    ["FIREBASE_ADMIN_PRIVATE_KEY", privateKey],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase Admin credentials: ${missing.join(", ")}. Keep the service account on the server only.`,
    );
  }

  return {
    projectId: projectId as string,
    clientEmail: clientEmail as string,
    privateKey: privateKey as string,
  };
}

export function getFirebaseAdminApp(): App {
  assertServer();

  const existing = getApps()[0];
  if (existing) {
    return existing;
  }

  const credential = readAdminCredential();

  return initializeApp({
    credential: cert(credential),
    projectId: credential.projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminFirestore(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}

export function getFirebaseAdminStorage(): Storage {
  return getStorage(getFirebaseAdminApp());
}
