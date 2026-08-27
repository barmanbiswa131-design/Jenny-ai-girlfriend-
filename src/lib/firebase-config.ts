/**
 * Firebase Client Configuration for Project: jenny-ai-girlfriend
 * Configured via environment variables with fallback defaults for jenny-ai-girlfriend.
 */

export interface FirebaseAppConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}

// Read from Vite environment variables (VITE_FIREBASE_*) with sensible defaults for jenny-ai-girlfriend
export const getFirebaseConfig = (): FirebaseAppConfig => {
  const env = (import.meta as any).env || {};
  
  return {
    apiKey: env.VITE_FIREBASE_API_KEY || "",
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "jenny-ai-girlfriend.firebaseapp.com",
    projectId: env.VITE_FIREBASE_PROJECT_ID || "jenny-ai-girlfriend",
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "jenny-ai-girlfriend.firebasestorage.app",
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: env.VITE_FIREBASE_APP_ID || "",
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "",
    firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || "(default)",
  };
};

export const TARGET_FIREBASE_PROJECT_ID = "jenny-ai-girlfriend";
