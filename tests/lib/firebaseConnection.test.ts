import { deleteApp, getApps } from "firebase/app";
import { afterEach, describe, expect, it } from "vitest";
import { checkFirebaseConnection } from "@/lib/firebase-connection-check";

const PUBLIC_ENV_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

afterEach(async () => {
  for (const key of PUBLIC_ENV_KEYS) {
    delete process.env[key];
  }
  await Promise.all(getApps().map((app) => deleteApp(app)));
});

describe("Firebase client connection", () => {
  it("reports missing web app configuration without initializing an app", () => {
    const report = checkFirebaseConnection();

    expect(report.initialized).toBe(false);
    expect(report.appCount).toBe(0);
    expect(report.duplicateInitialization).toBe(false);
    expect(report.services).toEqual([]);
    expect(report.error).toContain("NEXT_PUBLIC_FIREBASE_API_KEY");
    expect(report.error).toContain("NEXT_PUBLIC_FIREBASE_APP_ID");
  });

  it("initializes Auth, Firestore, and Storage once", () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "local-singleton-check";
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "local-singleton-check.firebaseapp.com";
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "local-singleton-check";
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "local-singleton-check.appspot.com";
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "000000000000";
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = "1:000000000000:web:local";

    const report = checkFirebaseConnection();

    expect(report.error).toBeNull();
    expect(report.initialized).toBe(true);
    expect(report.projectId).toBe("local-singleton-check");
    expect(report.appCount).toBe(1);
    expect(report.duplicateInitialization).toBe(false);
    expect(report.services.map((service) => service.name)).toEqual([
      "Authentication",
      "Firestore",
      "Storage",
    ]);
    expect(report.services.every((service) => service.accessible)).toBe(true);
  });
});
