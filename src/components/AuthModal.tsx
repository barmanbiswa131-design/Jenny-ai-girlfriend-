import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Phone, 
  ShieldCheck, 
  KeyRound, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  Info,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth, RecaptchaVerifier, ConfirmationResult } from '../lib/firebase';

interface AuthModalProps {
  onLoginSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess }) => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    loginWithGoogle, 
    loginWithFacebook, 
    sendPhoneOtp, 
    verifyPhoneOtp,
    authError, 
    setAuthError 
  } = useAuth();

  const [authMethod, setAuthMethod] = useState<'options' | 'phone'>('options');
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationState, setVerificationState] = useState<{
    isSimulated: boolean;
    simulatedCode?: string;
    confirmationResult?: ConfirmationResult;
    phoneNumber: string;
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isAuthModalOpen) {
      setAuthMethod('options');
      setOtpSent(false);
      setVerificationCode('');
      setVerificationState(null);
      setSuccessMessage(null);
      setCopied(false);
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {}
        recaptchaVerifierRef.current = null;
      }
    }
  }, [isAuthModalOpen]);

  const initRecaptcha = () => {
    if (!auth) return;
    if (!recaptchaVerifierRef.current && recaptchaContainerRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => {
            setAuthError('reCAPTCHA expired. Please try again.');
          }
        });
      } catch (e: any) {
        console.warn("Recaptcha note:", e);
      }
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setAuthError('Please enter a valid phone number (e.g. +91 9876543210)');
      return;
    }

    setIsLoading(true);
    try {
      initRecaptcha();
      const result = await sendPhoneOtp(phoneNumber.trim(), recaptchaVerifierRef.current || undefined);
      setVerificationState({
        isSimulated: result.isSimulated,
        simulatedCode: result.simulatedCode,
        confirmationResult: result.confirmationResult,
        phoneNumber: phoneNumber.trim(),
      });
      setOtpSent(true);
      if (result.isSimulated && result.simulatedCode) {
        setSuccessMessage(`Verification code generated for ${phoneNumber.trim()}: ${result.simulatedCode}`);
      } else {
        setSuccessMessage(`OTP sent via SMS to ${phoneNumber.trim()}! Please check your messages.`);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationState) return;
    if (!verificationCode || verificationCode.trim().length < 6) {
      setAuthError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    try {
      await verifyPhoneOtp(verificationCode.trim(), verificationState);
      setSuccessMessage('Successfully verified and logged in!');
      setTimeout(() => {
        closeAuthModal();
        onLoginSuccess?.();
      }, 700);
    } catch (err: any) {
      console.error("OTP verification error:", err);
      setAuthError(err?.message || 'Invalid or expired verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoFillCode = () => {
    if (verificationState?.simulatedCode) {
      setVerificationCode(verificationState.simulatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      onLoginSuccess?.();
    } catch (e) {
      // Handled in context
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setIsLoading(true);
    try {
      await loginWithFacebook();
      onLoginSuccess?.();
    } catch (e) {
      // Handled in context
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    closeAuthModal();
    onLoginSuccess?.();
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div id="auth-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#120814]/95 border border-rose-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-wide">
                    Sync & Save Memories
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Never lose your conversations, meals & bond
                  </p>
                </div>
              </div>
              <button
                id="close-auth-modal-btn"
                onClick={closeAuthModal}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message Banner */}
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex flex-col gap-2.5"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{authError}</span>
                </div>

                {authError.includes('Authorized domains') ? (
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          navigator.clipboard.writeText(window.location.hostname);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2500);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors border border-white/20"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-300" />}
                      <span>{copied ? 'Domain Copied to Clipboard!' : `Copy Domain: ${typeof window !== 'undefined' ? window.location.hostname : ''}`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleContinueAsGuest}
                      className="w-full py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold text-xs transition-colors border border-rose-500/40 text-center"
                    >
                      Continue as Guest (Keep Local Memory)
                    </button>
                  </div>
                ) : (
                  /* Quick 1-Click Fallback to Google */
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs transition-all shadow-md active:scale-98"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Try again with Google</span>
                  </button>
                )}
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </motion.div>
            )}

            {/* Method Selection Screen */}
            {authMethod === 'options' ? (
              <div className="space-y-3 pt-1">
                {/* Google Sign-in (Recommended) */}
                <div className="relative group">
                  <div className="absolute -top-2 right-3 z-10 bg-emerald-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                    Instant 1-Click
                  </div>
                  <button
                    id="google-login-btn"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-sm transition-all duration-200 shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>

                {/* Phone Number OTP Button */}
                <button
                  id="phone-login-btn"
                  onClick={() => setAuthMethod('phone')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold text-sm transition-all duration-200 shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Login with Phone Number (SMS OTP)</span>
                </button>

                {/* Facebook Login */}
                <button
                  id="facebook-login-btn"
                  onClick={handleFacebookSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-[#1877F2]/20 hover:bg-[#1877F2]/30 border border-[#1877F2]/40 text-blue-300 font-semibold text-sm transition-all duration-200 shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Continue with Facebook</span>
                </button>

                {/* Continue as Guest (Skip login) */}
                <button
                  id="guest-login-btn"
                  onClick={handleContinueAsGuest}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-medium text-xs transition-all duration-200"
                >
                  <span>Continue as Guest</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {/* Informational Footer */}
                <div className="pt-3 text-center border-t border-white/10 text-[11px] text-zinc-400 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span>Synced securely with Firestore Database</span>
                </div>
              </div>
            ) : (
              /* Phone Number OTP Screen */
              <div className="space-y-4 pt-1">
                <button
                  onClick={() => {
                    setAuthMethod('options');
                    setOtpSent(false);
                    setAuthError(null);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
                >
                  ← Back to login options
                </button>

                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">
                        Mobile Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 9876543210 or +880 1712345678"
                        className="w-full bg-black/50 border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-400 font-mono"
                        required
                      />
                      <span className="text-[10px] text-zinc-400 block mt-1">
                        Enter any phone number to login and save your relationship diary
                      </span>
                    </div>

                    {/* Invisible ReCAPTCHA placeholder */}
                    <div ref={recaptchaContainerRef} id="recaptcha-container" />

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm transition-all shadow-md disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send 6-Digit OTP Code</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3">
                    {/* Simulated Code Quick Action Box if generated */}
                    {verificationState?.isSimulated && verificationState.simulatedCode && (
                      <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-zinc-400 block uppercase font-bold tracking-wider">
                            Your Verification Code
                          </span>
                          <span className="text-lg font-mono font-bold text-rose-300 tracking-widest">
                            {verificationState.simulatedCode}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleAutoFillCode}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow transition-all active:scale-95"
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied ? "Auto-Filled" : "Auto-Fill"}</span>
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">
                        Enter 6-Digit Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder={verificationState?.simulatedCode || "123456"}
                        className="w-full text-center tracking-[0.4em] font-mono text-lg bg-black/50 border border-rose-500/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-400"
                        autoFocus
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || verificationCode.length < 6}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-all shadow-md disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Verify & Log In</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoading}
                      className="w-full text-center text-xs text-zinc-400 hover:text-white pt-1 underline"
                    >
                      Didn't get code? Resend Code
                    </button>
                  </form>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
