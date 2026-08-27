import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Captions, 
  X, 
  Trash2, 
  Copy, 
  Check, 
  Globe, 
  Sparkles, 
  MessageSquareText, 
  Volume2,
  Sliders,
  ArrowRight
} from 'lucide-react';
import { CaptionsStore, CaptionTurn, CaptionsSettings } from '../lib/captions-store';
import { SubtitleLanguage, SUBTITLE_LANGUAGES } from '../lib/translation-engine';
import { PartnerGender, PartnerLanguage } from '../lib/live-session';
import { getUIStrings } from '../lib/i18n';

interface LiveTranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  partnerGender: PartnerGender;
  partnerLanguage: PartnerLanguage;
}

export const LiveTranscriptDrawer: React.FC<LiveTranscriptDrawerProps> = ({
  isOpen,
  onClose,
  partnerGender,
  partnerLanguage,
}) => {
  const [history, setHistory] = useState<CaptionTurn[]>(CaptionsStore.getHistory());
  const [settings, setSettings] = useState<CaptionsSettings>(CaptionsStore.getSettings());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const t = getUIStrings(partnerLanguage);

  useEffect(() => {
    const unsubscribe = CaptionsStore.subscribe(() => {
      setHistory(CaptionsStore.getHistory());
      setSettings(CaptionsStore.getSettings());
    });
    return () => unsubscribe();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    if (window.confirm("Clear current live voice transcript history?")) {
      CaptionsStore.clearHistory();
    }
  };

  const handleSelectSubtitleLang = (lang: SubtitleLanguage) => {
    CaptionsStore.updateSettings({ targetLanguage: lang });
  };

  const partnerName = partnerGender === 'male' ? 'Jay' : 'Janny';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Side Drawer Container */}
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative z-10 w-full sm:max-w-md h-full sm:h-[94vh] bg-[#110816]/95 border-l sm:border border-rose-500/30 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Captions className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Live Subtitles & Transcript
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {history.length} Lines
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Real-time translation side-by-side
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {history.length > 0 && (
                <button
                  onClick={handleClear}
                  className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                  title="Clear Transcript"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subtitle Language Quick Select Tabs */}
          <div className="px-4 py-2.5 bg-black/40 border-b border-white/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1">
                <Globe className="w-3 h-3 text-rose-400" />
                Translate Subtitles Into:
              </span>
              <span className="text-[10px] text-rose-300 font-medium">
                {SUBTITLE_LANGUAGES.find((l) => l.code === settings.targetLanguage)?.name}
              </span>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {SUBTITLE_LANGUAGES.map((lang) => {
                const isSelected = settings.targetLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectSubtitleLang(lang.code)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1 ${
                      isSelected
                        ? 'bg-rose-500 border-rose-400 text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transcript Message List */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="py-20 text-center text-zinc-500 text-xs flex flex-col items-center gap-3">
                <MessageSquareText className="w-10 h-10 text-rose-500/30 animate-pulse" />
                <p className="text-zinc-300 font-medium text-sm">No speech captured yet</p>
                <p className="text-[11px] max-w-xs text-zinc-400 leading-relaxed">
                  Start speaking in voice call (Nepali, Bangla, Hindi, English, etc.). 
                  Whatever {partnerName} or you say will appear right here in real time with phonetic Roman reading and your chosen translation!
                </p>
                <div className="mt-2 p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-rose-200 text-left space-y-1">
                  <p className="font-semibold text-white">✨ Example:</p>
                  <p>• Nepali Voice: <span className="italic text-zinc-300">"म तिमीलाई माया गर्छु"</span></p>
                  <p>• Romanized: <span className="font-mono text-amber-300">"Ma timi lai maya garchhu"</span></p>
                  <p>• English Subtitle: <span className="text-emerald-300">"I love you"</span></p>
                </div>
              </div>
            ) : (
              history.map((turn) => {
                const isPartner = turn.sender === 'partner';
                const speakerLabel = isPartner ? partnerName : 'You';
                const translated = turn.translations[settings.targetLanguage];
                const mainText = translated || (settings.targetLanguage === 'romanized' ? turn.romanizedText : turn.originalText);

                return (
                  <motion.div
                    key={turn.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isPartner
                        ? (partnerGender === 'male' 
                            ? 'bg-blue-950/30 border-blue-500/25 ml-0 mr-4' 
                            : 'bg-rose-950/30 border-rose-500/25 ml-0 mr-4')
                        : 'bg-emerald-950/30 border-emerald-500/25 ml-4 mr-0'
                    }`}
                  >
                    {/* Message Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-bold tracking-wide uppercase ${
                          isPartner 
                            ? (partnerGender === 'male' ? 'text-blue-300' : 'text-rose-300')
                            : 'text-emerald-300'
                        }`}>
                          {speakerLabel}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          • {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopyText(mainText, turn.id)}
                        className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Copy message"
                      >
                        {copiedId === turn.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Main Subtitle Translation Text */}
                    <p className="text-sm font-semibold text-white leading-relaxed break-words">
                      {mainText}
                    </p>

                    {/* Phonetic / Romanized Text if different */}
                    {settings.targetLanguage !== 'romanized' && turn.romanizedText && turn.romanizedText !== mainText && (
                      <div className="mt-1 pt-1 border-t border-white/5 flex items-start gap-1">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider shrink-0 mt-0.5">
                          Roman:
                        </span>
                        <p className="text-xs font-mono text-amber-200/90 italic">
                          "{turn.romanizedText}"
                        </p>
                      </div>
                    )}

                    {/* Original text if different from mainText and romanizedText */}
                    {settings.targetLanguage !== 'original' && turn.originalText && turn.originalText !== mainText && turn.originalText !== turn.romanizedText && (
                      <div className="mt-0.5 flex items-start gap-1">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider shrink-0 mt-0.5">
                          Spoken:
                        </span>
                        <p className="text-[11px] text-zinc-400">
                          "{turn.originalText}"
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer Toggle Controls */}
          <div className="px-5 py-3 border-t border-white/10 bg-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="toggle-floating-subtitles"
                checked={settings.enabled}
                onChange={(e) => CaptionsStore.updateSettings({ enabled: e.target.checked })}
                className="rounded text-rose-500 focus:ring-rose-400 bg-black/40 border-white/20"
              />
              <label htmlFor="toggle-floating-subtitles" className="text-zinc-300 font-medium cursor-pointer">
                Floating Screen Subtitles
              </label>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
