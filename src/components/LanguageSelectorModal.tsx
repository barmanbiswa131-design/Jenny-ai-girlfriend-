import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, X, Check, Sparkles, Heart } from 'lucide-react';
import { PartnerLanguage, SUPPORTED_LANGUAGES, LanguageOption } from '../lib/live-session';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage: PartnerLanguage;
  onSelectLanguage: (lang: PartnerLanguage) => void;
  partnerGender: "female" | "male";
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedLanguage,
  onSelectLanguage,
  partnerGender,
}) => {
  if (!isOpen) return null;

  const partnerName = partnerGender === "male" ? "Jay" : "Janny";

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

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative z-10 w-full max-w-lg bg-[#120a16] border border-rose-500/30 rounded-3xl p-6 shadow-2xl overflow-hidden text-white flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Globe className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-rose-100 flex items-center gap-2">
                  Select Language
                </h2>
                <p className="text-xs text-zinc-400">
                  {partnerName} will speak to you fluently in this language
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

          {/* Quick Filter Highlights */}
          <div className="pt-3 pb-1 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
              Popular:
            </span>
            {[
              { code: 'banglish' as PartnerLanguage, label: '🔤 Banglish' },
              { code: 'hinglish' as PartnerLanguage, label: '🇮🇳 Hinglish' },
              { code: 'nepali' as PartnerLanguage, label: '🇳🇵 Nepali' },
              { code: 'bengali' as PartnerLanguage, label: '🇧🇩 Bengali' },
              { code: 'english' as PartnerLanguage, label: '🇬🇧 English' },
            ].map(item => (
              <button
                key={item.code}
                onClick={() => {
                  onSelectLanguage(item.code);
                  onClose();
                }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  selectedLanguage === item.code
                    ? 'bg-rose-500/30 border-rose-400 text-rose-200 font-bold'
                    : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Full Language List */}
          <div className="overflow-y-auto my-3 pr-1 space-y-2 max-h-[48vh] custom-scrollbar">
            {SUPPORTED_LANGUAGES.map((lang: LanguageOption) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  id={`lang-select-${lang.code}`}
                  onClick={() => {
                    onSelectLanguage(lang.code);
                    onClose();
                  }}
                  className={`w-full p-3.5 rounded-2xl flex items-center justify-between border transition-all text-left group ${
                    isSelected
                      ? 'bg-gradient-to-r from-rose-500/25 to-pink-600/25 border-rose-500/60 ring-1 ring-rose-500/40 shadow-lg'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{lang.name}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-rose-300">
                          {lang.nativeName}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 italic flex items-center gap-1">
                        <span>"{lang.sampleGreeting}"</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-md">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-white/20 group-hover:border-white/40" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 text-rose-300">
              <Sparkles className="w-3.5 h-3.5" />
              Language changes take effect immediately in real-time!
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
