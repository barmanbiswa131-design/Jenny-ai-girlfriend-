import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  doc, 
  getDocFromServer,
  collection,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';
import { getFirebaseConfig, TARGET_FIREBASE_PROJECT_ID } from './firebase-config';

// Resolve configuration: prefer Vite environment variables, then fallback to config JSON
const envConfig = getFirebaseConfig();
export const activeFirebaseConfig = {
  projectId: envConfig.projectId || appletConfig.projectId || TARGET_FIREBASE_PROJECT_ID,
  apiKey: envConfig.apiKey || appletConfig.apiKey || '',
  authDomain: envConfig.authDomain || appletConfig.authDomain || `${TARGET_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  storageBucket: envConfig.storageBucket || appletConfig.storageBucket || `${TARGET_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: envConfig.messagingSenderId || appletConfig.messagingSenderId || '',
  appId: envConfig.appId || appletConfig.appId || '',
  measurementId: envConfig.measurementId || appletConfig.measurementId || '',
  firestoreDatabaseId: envConfig.firestoreDatabaseId || appletConfig.firestoreDatabaseId || '(default)',
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    activeFirebaseConfig.apiKey && 
    activeFirebaseConfig.apiKey.trim().length > 10 &&
    !activeFirebaseConfig.apiKey.includes('Dummy') &&
    activeFirebaseConfig.projectId
  );
};

// Initialize Firebase App safely
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  if (isFirebaseConfigured()) {
    if (!getApps().length) {
      app = initializeApp(activeFirebaseConfig);
    } else {
      app = getApp();
    }
    
    auth = getAuth(app);
    if (activeFirebaseConfig.firestoreDatabaseId && activeFirebaseConfig.firestoreDatabaseId !== '(default)') {
      db = getFirestore(app, activeFirebaseConfig.firestoreDatabaseId);
    } else {
      db = getFirestore(app);
    }
    console.log(`[Firebase] Successfully connected to project: ${activeFirebaseConfig.projectId}`);
  } else {
    console.info(`[Firebase] Project '${TARGET_FIREBASE_PROJECT_ID}' configured. Waiting for VITE_FIREBASE_API_KEY in environment variables.`);
  }
} catch (e: any) {
  console.warn(`[Firebase] Initialization note for '${TARGET_FIREBASE_PROJECT_ID}':`, e?.message || e);
  auth = null;
  db = null;
}

export { app, auth, db };

// Auth Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const facebookProvider = new FacebookAuthProvider();

// Error Handling Enum and Function mandated by Firebase Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Connection test on boot as required by Firebase skill
export async function testConnection() {
  try {
    if (auth?.currentUser && db) {
      await getDocFromServer(doc(db, 'users', auth.currentUser.uid));
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is offline or network is disconnected.");
    }
  }
}

export { 
  signInWithPopup, 
  fbSignOut, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  type ConfirmationResult,
  type FirebaseUser
};
