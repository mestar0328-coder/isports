import { getApps } from "firebase/app";
import { getFirebaseApp, getFirebaseAuth, getFirebaseFirestore, getFirebaseStorage } from "@/lib/firebase";

export type FirebaseServiceCheck = {
  name: "Authentication" | "Firestore" | "Storage";
  accessible: boolean;
  detail: string;
};

export type FirebaseConnectionReport = {
  initialized: boolean;
  projectId: string | null;
  appCount: number;
  duplicateInitialization: boolean;
  services: FirebaseServiceCheck[];
  error: string | null;
};

/**
 * Confirms the client SDK can construct Auth, Firestore, and Storage.
 * It does not read or write project data and does not require open security rules.
 */
export function checkFirebaseConnection(): FirebaseConnectionReport {
  try {
    const first = getFirebaseApp();
    const second = getFirebaseApp();
    const appCount = getApps().length;

    const auth = getFirebaseAuth();
    const firestore = getFirebaseFirestore();
    const storage = getFirebaseStorage();

    return {
      initialized: first.name === second.name && Boolean(first.options.projectId),
      projectId: first.options.projectId ?? null,
      appCount,
      duplicateInitialization: appCount !== 1 || first !== second,
      services: [
        {
          name: "Authentication",
          accessible: auth.app.name === first.name,
          detail: "Auth instance is bound to the Firebase app.",
        },
        {
          name: "Firestore",
          accessible: firestore.app.name === first.name,
          detail: "Firestore instance is bound to the Firebase app. No document was read or written.",
        },
        {
          name: "Storage",
          accessible: storage.app.name === first.name,
          detail: "Storage instance is bound to the Firebase app. No file was uploaded or downloaded.",
        },
      ],
      error: null,
    };
  } catch (error) {
    return {
      initialized: false,
      projectId: null,
      appCount: getApps().length,
      duplicateInitialization: getApps().length > 1,
      services: [],
      error: error instanceof Error ? error.message : "Unknown Firebase initialization error.",
    };
  }
}
