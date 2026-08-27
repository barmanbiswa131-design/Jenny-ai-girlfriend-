import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Captions, 
  Globe, 
  MessageSquareText, 
  X, 
  ChevronRight, 
  Sparkles,
  Volume2
} from 'lucide-react';
import { CaptionsStore, CaptionTurn, CaptionsSettings } from '../lib/captions-store';
import { SubtitleLanguage, SUBTITLE_LANGUAGES } from '../lib/translation-engine';
import { PartnerGender } from '../lib/live-session';
import { getUIStrings } from '../lib/i18n';

interface LiveCaptionsOverlayProps {
  onOpenDrawer: () => void;
  partnerGender: PartnerGender;
  isCallActive: boolean;
}

export const LiveCaptionsOverlay: React.FC<LiveCaptionsOverlayProps> = ({
  onOpenDrawer,
  partnerGender,
  isCallActive,
}) => {
  const [settings, setSettings] = useState<CaptionsSettings>(CaptionsStore.getSettings());
  const [currentTurn, setCurrentTurn] = useState<CaptionTurn | null>(CaptionsStore.getCurrentLiveTurn());
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = CaptionsStore.subscribe(() => {
      setSettings(CaptionsStore.getSettings());
      setCurrentTurn(CaptionsStore.getCurrentLiveTurn());
    });
    return () => unsubscribe();
  }, []);

  if (!isCallActive || !settings.enabled || !currentTurn) {
    return null;
  }

  const activeLangInfo = SUBTITLE_LANGUAGES.find((l) => l.code === settings.targetLanguage) || SUBTITLE_LANGUAGES[0];
  const isPartner = currentTurn.sender === 'partner';
  const partnerName = partnerGender === 'male' ? 'Jay' : 'Janny';
  const speakerDisplay = isPartner ? partnerName : 'You';

  // Determine what text to show based on selected subtitle language
  const translatedText = currentTurn.translations[settings.targetLanguage];
  const showRomanized = settings.targetLanguage === 'romanized' || (!translatedText && currentTurn.romanizedText);
  const displayText = translatedText || (showRomanized ? currentTurn.romanizedText : currentTurn.originalText);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.96 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed bottom-36 sm:bottom-40 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-lg pointer-events-auto"
      >
        <div className="relative bg-[#0e0712]/90 hover:bg-[#130b18]/95 border border-rose-500/30 rounded-2xl p-3.5 shadow-2xl backdrop-blur-2xl text-white transition-all">
          {/* Header Line: Speaker Tag, Subtitle Language & Controls */}
          <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 ${
                isPartner 
                  ? (partnerGender === 'male' ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40' : 'bg-rose-500/25 text-rose-300 border border-rose-500/40')
                  : 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
              }`}>
                {isPartner ? <Sparkles className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
                {speakerDisplay}
              </span>

              {/* Subtitle Target Language Pill */}
              <div className="relative">
                <button
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] text-zinc-300 font-medium transition-colors"
                  title="Change Subtitle Language"
                >
                  <span>{activeLangInfo.flag}</span>
                  <span className="font-semibold text-rose-200">{activeLangInfo.name}</span>
                  <Globe className="w-2.5 h-2.5 text-zinc-400 ml-0.5" />
                </button>

                {/* Dropdown Menu for Subtitle Languages */}
                <AnimatePresence>
                  {isLangMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      className="absolute bottom-full left-0 mb-2 w-48 bg-[#180d1f] border border-rose-500/30 rounded-xl p-1 shadow-2xl z-50 flex flex-col gap-0.5 max-h-48 overflow-y-auto"
                    >
                      <div className="px-2 py-1 text-[9px] uppercase tracking-wider text-zinc-400 font-bold border-b border-white/10">
                        Select Subtitle Language
                      </div>
                      {SUBTITLE_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            CaptionsStore.updateSettings({ targetLanguage: lang.code });
                            setIsLangMenuOpen(false);
                          }}
                          className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors text-left ${
                            settings.targetLanguage === lang.code
                              ? 'bg-rose-500/30 text-rose-200 font-bold'
                              : 'hover:bg-white/10 text-zinc-300'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                          </span>
                          <span className="text-[10px] text-zinc-400">{lang.nativeName}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Actions: Full Transcript Drawer & Dismiss */}
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenDrawer}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[10px] text-rose-200 font-semibold transition-colors"
                title="View full conversation transcript on side"
              >
                <MessageSquareText className="w-3 h-3 text-rose-400" />
                <span className="hidden sm:inline">Side Transcript</span>
                <ChevronRight className="w-2.5 h-2.5" />
              </button>

              <button
                onClick={() => CaptionsStore.clearLiveSubtitle()}
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Dismiss current caption"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Subtitle Spoken Content */}
          <div className="space-y-1">
            {/* Primary Subtitle Line */}
            <p className="text-sm sm:text-base font-semibold text-rose-100 leading-snug break-words tracking-wide">
              "{displayText}"
            </p>

            {/* Phonetic / Romanized or Original script comparison if different */}
            {settings.targetLanguage !== 'romanized' && currentTurn.romanizedText && currentTurn.romanizedText !== displayText && (
              <p className="text-[11px] font-mono text-zinc-400 italic">
                Phonetic: "{currentTurn.romanizedText}"
              </p>
            )}

            {settings.targetLanguage !== 'original' && currentTurn.originalText && currentTurn.originalText !== displayText && currentTurn.originalText !== currentTurn.romanizedText && (
              <p className="text-[10px] text-zinc-500">
                Spoken: "{currentTurn.originalText}"
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
