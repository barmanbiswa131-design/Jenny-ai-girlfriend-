import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Download, 
  X, 
  CheckCircle, 
  Sparkles, 
  ShieldCheck
} from 'lucide-react';
import { PartnerLanguage } from '../lib/live-session';
import { getUIStrings } from '../lib/i18n';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: PartnerLanguage;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
  language = "banglish",
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  const t = getUIStrings(language);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallSuccess(true);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative z-10 w-full max-w-md bg-[#120a16] border border-emerald-500/30 rounded-3xl p-6 shadow-2xl text-white flex flex-col max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-emerald-200">
                  {t.androidModalTitle}
                </h2>
                <p className="text-xs text-zinc-400">
                  {t.androidModalSubtitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content */}
          <div className="py-4 space-y-4 text-sm text-zinc-300">
            {installSuccess || isInstalled ? (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex flex-col items-center text-center gap-2">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
                <h3 className="font-bold text-emerald-200 text-base">
                  {t.androidInstalledTitle}
                </h3>
                <p className="text-xs text-zinc-300">
                  {t.androidInstalledDesc}
                </p>
              </div>
            ) : (
              <>
                {/* 1-Tap Prompt if supported */}
                {deferredPrompt && (
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-102 active:scale-98"
                  >
                    <Download className="w-5 h-5" />
                    <span>{t.oneTapInstallBtn}</span>
                  </button>
                )}

                {/* Android Chrome Install Steps */}
                <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <h4 className="font-bold text-white flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t.androidGuideTitle}
                  </h4>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-white">{t.step1Title}</p>
                      <p className="text-xs text-zinc-400">{t.step1Desc}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-white">{t.step2Title}</p>
                      <p className="text-xs text-zinc-400">{t.step2Desc}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-white">{t.step3Title}</p>
                      <p className="text-xs text-zinc-400">{t.step3Desc}</p>
                    </div>
                  </div>
                </div>

                {/* Features banner */}
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>No Play Store needed</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Offline & Fullscreen</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
            >
              {t.closeBtn}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
