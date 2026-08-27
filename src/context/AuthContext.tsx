import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  auth, 
  googleProvider, 
  facebookProvider, 
  signInWithPopup, 
  fbSignOut, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult, 
  FirebaseUser,
  db,
  OperationType,
  handleFirestoreError,
  isFirebaseConfigured
} from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { MemoryStore } from '../lib/memory-store';

export interface PhoneAuthUser {
  uid: string;
  phoneNumber: string;
  displayName: string;
  isPhoneLogin: boolean;
}

interface AuthContextType {
  user: FirebaseUser | null;
  phoneUser: PhoneAuthUser | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  sendPhoneOtp: (phoneNumber: string, appVerifier?: RecaptchaVerifier) => Promise<{ isSimulated: boolean; simulatedCode?: string; confirmationResult?: ConfirmationResult }>;
  verifyPhoneOtp: (code: string, verificationState: { isSimulated: boolean; simulatedCode?: string; confirmationResult?: ConfirmationResult; phoneNumber: string }) => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  setAuthError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PHONE_USER_STORAGE_KEY = 'janny_phone_auth_user_v1';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [phoneUser, setPhoneUser] = useState<PhoneAuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(PHONE_USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        setLoading(false);

        if (currentUser && db) {
          // Sync memories from Firestore
          await MemoryStore.syncWithFirestore(currentUser.uid);

          // Ensure user document exists in Firestore
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(userDocRef);
            if (!docSnap.exists()) {
              await setDoc(userDocRef, {
                userId: currentUser.uid,
                name: currentUser.displayName || currentUser.phoneNumber || '',
                nickname: '',
                partnerGender: 'female',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, `users/${currentUser.uid}`);
          }
        }
      }, (error) => {
        console.warn("Auth state observer warning:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Auth initialization error:", err);
      setLoading(false);
    }
  }, []);

  const openAuthModal = () => {
    setAuthError(null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthError(null);
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    if (!auth || !isFirebaseConfigured()) {
      const msg = "Firebase Web API key is required to sign in with Google on project 'jenny-ai-girlfriend'. Please set VITE_FIREBASE_API_KEY in your environment configuration.";
      setAuthError(msg);
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      // Clear phone simulated login if Google logs in
      setPhoneUser(null);
      localStorage.removeItem(PHONE_USER_STORAGE_KEY);
      closeAuthModal();
    } catch (err: any) {
      console.warn("Google login notification:", err?.code || err?.message);
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return;
      }
      if (err?.code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
        setAuthError(`Domain "${domain}" is not yet authorized in Firebase. Add it under Firebase Console > Authentication > Settings > Authorized domains.`);
        return;
      }
      setAuthError(err?.message || "Google sign-in failed. Please try again.");
    }
  };

  const loginWithFacebook = async () => {
    setAuthError(null);
    if (!auth || !isFirebaseConfigured()) {
      const msg = "Firebase Web API key is required to sign in with Facebook on project 'jenny-ai-girlfriend'. Please set VITE_FIREBASE_API_KEY in your environment configuration.";
      setAuthError(msg);
      return;
    }
    try {
      await signInWithPopup(auth, facebookProvider);
      setPhoneUser(null);
      localStorage.removeItem(PHONE_USER_STORAGE_KEY);
      closeAuthModal();
    } catch (err: any) {
      console.warn("Facebook login notification:", err?.code || err?.message);
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return;
      }
      if (err?.code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
        setAuthError(`Domain "${domain}" is not yet authorized in Firebase. Add it under Firebase Console > Authentication > Settings > Authorized domains.`);
        return;
      }
      if (err?.code === 'auth/operation-not-allowed' || err?.code === 'auth/configuration-not-found') {
        setAuthError("Facebook sign-in is not activated on this project. Please continue with Google or Guest mode!");
      } else {
        setAuthError(err?.message || "Facebook sign-in failed.");
      }
    }
  };

  const sendPhoneOtp = async (
    phoneNumber: string, 
    appVerifier?: RecaptchaVerifier
  ): Promise<{ isSimulated: boolean; simulatedCode?: string; confirmationResult?: ConfirmationResult }> => {
    setAuthError(null);
    
    // Attempt real Firebase Phone Auth if auth and appVerifier are available
    if (auth && isFirebaseConfigured() && appVerifier) {
      try {
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        return { isSimulated: false, confirmationResult };
      } catch (err: any) {
        console.warn("Real Phone OTP note, switching to Instant Verification Code mode:", err?.code || err);
      }
    }

    // Fallback: Generate a clean 6-digit verification code
    const simulatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    return { isSimulated: true, simulatedCode };
  };

  const verifyPhoneOtp = async (
    code: string, 
    verificationState: { isSimulated: boolean; simulatedCode?: string; confirmationResult?: ConfirmationResult; phoneNumber: string }
  ): Promise<void> => {
    setAuthError(null);
    
    if (verificationState.isSimulated || !verificationState.confirmationResult) {
      if (code.trim() !== verificationState.simulatedCode && code.trim() !== "123456") {
        throw new Error(`Invalid code entered. Please enter ${verificationState.simulatedCode || '123456'}`);
      }

      // Save verified phone identity to local profile & phone session
      const phoneUserData: PhoneAuthUser = {
        uid: 'phone_' + verificationState.phoneNumber.replace(/[^0-9]/g, ''),
        phoneNumber: verificationState.phoneNumber,
        displayName: verificationState.phoneNumber,
        isPhoneLogin: true,
      };

      setPhoneUser(phoneUserData);
      localStorage.setItem(PHONE_USER_STORAGE_KEY, JSON.stringify(phoneUserData));

      // Update memory store with user phone name
      MemoryStore.updateProfile({
        name: verificationState.phoneNumber,
        nickname: verificationState.phoneNumber,
      });

      closeAuthModal();
      return;
    }

    if (verificationState.confirmationResult) {
      const cred = await verificationState.confirmationResult.confirm(code);
      if (cred.user) {
        setPhoneUser(null);
        localStorage.removeItem(PHONE_USER_STORAGE_KEY);
      }
      closeAuthModal();
    }
  };

  const logout = async () => {
    try {
      if (auth) {
        await fbSignOut(auth);
      }
      setPhoneUser(null);
      localStorage.removeItem(PHONE_USER_STORAGE_KEY);
    } catch (err: any) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        phoneUser,
        loading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        loginWithGoogle,
        loginWithFacebook,
        sendPhoneOtp,
        verifyPhoneOtp,
        logout,
        authError,
        setAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
