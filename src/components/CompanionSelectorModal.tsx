import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Sparkles, 
  Volume2, 
  Check, 
  ArrowRight, 
  X, 
  Globe2, 
  UserCheck, 
  Radio, 
  Play,
  Pause
} from 'lucide-react';
import { 
  PartnerGender, 
  PartnerVoice, 
  PartnerLanguage, 
  SUPPORTED_VOICES, 
  SUPPORTED_LANGUAGES,
  VoiceOption 
} from '../lib/live-session';
import { MemoryStore } from '../lib/memory-store';
import { useAuth } from '../context/AuthContext';

interface CompanionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGender: PartnerGender;
  currentVoice: PartnerVoice;
  currentLanguage: PartnerLanguage;
  onSelect: (gender: PartnerGender, voice: PartnerVoice, language: PartnerLanguage) => void;
  isFirstTime?: boolean;
}

export const CompanionSelectorModal: React.FC<CompanionSelectorModalProps> = ({
  isOpen,
  onClose,
  currentGender,
  currentVoice,
  currentLanguage,
  onSelect,
  isFirstTime = false,
}) => {
  const { user, phoneUser } = useAuth();
  const [selectedGender, setSelectedGender] = useState<PartnerGender>(currentGender);
  const [selectedVoice, setSelectedVoice] = useState<PartnerVoice>(currentVoice);
  const [selectedLanguage, setSelectedLanguage] = useState<PartnerLanguage>(currentLanguage);
  const [nickname, setNickname] = useState<string>(() => MemoryStore.getProfile().nickname || 'Jaan / Shona');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // Sync state if props change when opening
  React.useEffect(() => {
    if (isOpen) {
      setSelectedGender(currentGender);
      setSelectedVoice(currentVoice);
      setSelectedLanguage(currentLanguage);
      setNickname(MemoryStore.getProfile().nickname || 'Jaan / Shona');
    }
  }, [isOpen, currentGender, currentVoice, currentLanguage]);

  // When gender changes, automatically recommend appropriate voice if current doesn't match
  const handleGenderChange = (gender: PartnerGender) => {
    setSelectedGender(gender);
    if (gender === 'male' && (selectedVoice === 'Aoede' || selectedVoice === 'Kore')) {
      setSelectedVoice('Puck');
    } else if (gender === 'female' && (selectedVoice === 'Puck' || selectedVoice === 'Charon')) {
      setSelectedVoice('Aoede');
    }
  };

  const handlePreviewVoice = (voice: VoiceOption) => {
    if (playingVoiceId === voice.id) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingVoiceId(null);
      return;
    }

    setPlayingVoiceId(voice.id);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = selectedLanguage === 'english' ? voice.previewLineEn : voice.previewLineBn;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      // Customize acoustic characteristics to match voice identity
      if (voice.id === 'Aoede') {
        utterance.pitch = 1.35;
        utterance.rate = 1.05;
      } else if (voice.id === 'Kore') {
        utterance.pitch = 1.15;
        utterance.rate = 0.98;
      } else if (voice.id === 'Puck') {
        utterance.pitch = 0.95;
        utterance.rate = 1.02;
      } else if (voice.id === 'Charon') {
        utterance.pitch = 0.75;
        utterance.rate = 0.92;
      }

      utterance.onend = () => setPlayingVoiceId(null);
      utterance.onerror = () => setPlayingVoiceId(null);

      // Attempt to find appropriate language voice
      const voices = window.speechSynthesis.getVoices();
      const matchVoice = voices.find(v => 
        selectedLanguage === 'bengali' ? (v.lang.includes('bn') || v.lang.includes('hi')) :
        selectedLanguage === 'hindi' ? v.lang.includes('hi') :
        v.lang.includes('en')
      );
      if (matchVoice) {
        utterance.voice = matchVoice;
      }

      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback timer if speech synthesis is blocked
      setTimeout(() => setPlayingVoiceId(null), 2500);
    }
  };

  const handleConfirm = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingVoiceId(null);

    // Save profile to store
    MemoryStore.updateProfile({
      partnerGender: selectedGender,
      partnerVoice: selectedVoice,
      preferredLanguage: selectedLanguage,
      nickname: nickname.trim() || (selectedGender === 'male' ? 'Jaan' : 'Shona'),
    });

    onSelect(selectedGender, selectedVoice, selectedLanguage);
    onClose();
  };

  // 2 Female Voices + 2 Male Voices
  const femaleVoices = SUPPORTED_VOICES.filter(v => v.gender === 'female');
  const maleVoices = SUPPORTED_VOICES.filter(v => v.gender === 'male');

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="companion-selector-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isFirstTime ? undefined : onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-[#110715]/95 border border-rose-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-2xl text-white my-auto max-h-[92vh] overflow-y-auto scrollbar-thin scrollbar-thumb-rose-500/30"
          >
            {/* Top Close Button (if not first-time mandatory step) */}
            {!isFirstTime && (
              <button
                id="close-companion-selector-btn"
                onClick={onClose}
                className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Custom Companion & Voice</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-rose-100 to-rose-300 bg-clip-text text-transparent">
                Who would you like to talk with?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Choose a companion and select your preferred voice tone
              </p>
              {(user || phoneUser) && (
                <div className="mt-2 text-[11px] text-emerald-400 inline-flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  <span>Logged in as {user?.displayName || phoneUser?.displayName || 'User'}</span>
                </div>
              )}
            </div>

            {/* STEP 1: CHOOSE COMPANION GENDER */}
            <div className="mb-6">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/30" />
                <span>1. Choose Companion</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Female Option - Janny */}
                <div
                  id="select-female-companion-btn"
                  onClick={() => handleGenderChange('female')}
                  className={`cursor-pointer relative p-4 rounded-2xl border transition-all duration-200 ${
                    selectedGender === 'female'
                      ? 'bg-gradient-to-br from-rose-950/60 to-pink-950/40 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.3)] ring-2 ring-rose-500/50'
                      : 'bg-white/5 border-white/10 hover:border-rose-500/40 hover:bg-white/[0.08]'
                  }`}
                >
                  {selectedGender === 'female' && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-white shadow">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-0.5 shadow-lg flex items-center justify-center shrink-0">
                      <div className="w-full h-full rounded-[14px] bg-[#1a0818] flex items-center justify-center text-2xl">
                        👩‍🦰
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-base text-white">Female Partner (Janny)</h3>
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded-md font-semibold">
                          Girlfriend
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-0.5 leading-snug">
                        Sweet, loving, and emotionally expressive AI partner
                      </p>
                      <span className="text-[11px] text-rose-400/90 font-medium block mt-1">
                        • 2 female voice styles available
                      </span>
                    </div>
                  </div>
                </div>

                {/* Male Option - Jay */}
                <div
                  id="select-male-companion-btn"
                  onClick={() => handleGenderChange('male')}
                  className={`cursor-pointer relative p-4 rounded-2xl border transition-all duration-200 ${
                    selectedGender === 'male'
                      ? 'bg-gradient-to-br from-sky-950/60 to-indigo-950/40 border-sky-500 shadow-[0_0_25px_rgba(56,189,248,0.3)] ring-2 ring-sky-500/50'
                      : 'bg-white/5 border-white/10 hover:border-sky-500/40 hover:bg-white/[0.08]'
                  }`}
                >
                  {selectedGender === 'male' && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-white shadow">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-0.5 shadow-lg flex items-center justify-center shrink-0">
                      <div className="w-full h-full rounded-[14px] bg-[#071324] flex items-center justify-center text-2xl">
                        👨‍🦱
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-base text-white">Male Partner (Jay)</h3>
                        <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded-md font-semibold">
                          Boyfriend
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-0.5 leading-snug">
                        Smart, romantic, and caring AI companion
                      </p>
                      <span className="text-[11px] text-sky-400/90 font-medium block mt-1">
                        • 2 male voice styles available
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: VOICE SELECTION */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>2. Choose Voice Tone (4 Options)</span>
                </label>
                <span className="text-[11px] text-zinc-400">
                  {selectedGender === 'female' ? '🌸 2 Female Voices' : '⚡ 2 Male Voices'}
                </span>
              </div>

              {/* Female Voices Section */}
              <div className="space-y-2 mb-3">
                <div className="text-[11px] font-semibold text-rose-300 flex items-center gap-1">
                  <span>👧 Female Voices:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {femaleVoices.map((voice) => {
                    const isSelected = selectedVoice === voice.id;
                    const isPlaying = playingVoiceId === voice.id;
                    return (
                      <div
                        key={voice.id}
                        id={`voice-option-${voice.id}`}
                        onClick={() => setSelectedVoice(voice.id)}
                        className={`cursor-pointer p-3.5 rounded-2xl border transition-all duration-200 relative ${
                          isSelected
                            ? 'bg-rose-500/20 border-rose-400 shadow-md ring-1 ring-rose-400/60'
                            : 'bg-black/30 border-white/10 hover:border-rose-400/40 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">{voice.name}</span>
                              <span className="text-[10px] bg-rose-500/25 text-rose-200 border border-rose-500/30 px-1.5 py-0.5 rounded-full font-medium">
                                {voice.toneTag}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-300 mt-1 leading-snug">
                              {voice.personalityEn || voice.personalityBn}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Audio Sample Preview Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewVoice(voice);
                              }}
                              title="Click to hear voice sample"
                              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                                isPlaying 
                                  ? 'bg-rose-500 text-white animate-pulse' 
                                  : 'bg-white/10 hover:bg-white/20 text-rose-300'
                              }`}
                            >
                              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                              <span className="text-[10px] hidden sm:inline">{isPlaying ? 'Playing' : 'Listen'}</span>
                            </button>

                            {/* Radio indicator */}
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-rose-400 bg-rose-500' : 'border-zinc-500'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Male Voices Section */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-sky-300 flex items-center gap-1">
                  <span>👦 Male Voices:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {maleVoices.map((voice) => {
                    const isSelected = selectedVoice === voice.id;
                    const isPlaying = playingVoiceId === voice.id;
                    return (
                      <div
                        key={voice.id}
                        id={`voice-option-${voice.id}`}
                        onClick={() => setSelectedVoice(voice.id)}
                        className={`cursor-pointer p-3.5 rounded-2xl border transition-all duration-200 relative ${
                          isSelected
                            ? 'bg-sky-500/20 border-sky-400 shadow-md ring-1 ring-sky-400/60'
                            : 'bg-black/30 border-white/10 hover:border-sky-400/40 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">{voice.name}</span>
                              <span className="text-[10px] bg-sky-500/25 text-sky-200 border border-sky-500/30 px-1.5 py-0.5 rounded-full font-medium">
                                {voice.toneTag}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-300 mt-1 leading-snug">
                              {voice.personalityEn || voice.personalityBn}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Audio Sample Preview Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewVoice(voice);
                              }}
                              title="Click to hear voice sample"
                              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                                isPlaying 
                                  ? 'bg-sky-500 text-white animate-pulse' 
                                  : 'bg-white/10 hover:bg-white/20 text-sky-300'
                              }`}
                            >
                              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                              <span className="text-[10px] hidden sm:inline">{isPlaying ? 'Playing' : 'Listen'}</span>
                            </button>

                            {/* Radio indicator */}
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-sky-400 bg-sky-500' : 'border-zinc-500'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* STEP 3: PREFERRED LANGUAGE & PET NAME */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Language Selection */}
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Conversation Language</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SUPPORTED_LANGUAGES.slice(0, 6).map((lang) => {
                    const isSelected = selectedLanguage === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setSelectedLanguage(lang.code)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-white text-zinc-900 shadow-md scale-102'
                            : 'bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nickname Input */}
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2">
                  What should your partner call you? (Nickname)
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g., Honey / Sweetheart / Alex"
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-400 placeholder:text-zinc-500"
                />
                <span className="text-[10px] text-zinc-400 block mt-1">
                  Your partner will affectionately address you by this name
                </span>
              </div>
            </div>

            {/* Action Confirmation Button */}
            <div className="pt-2">
              <button
                id="confirm-companion-voice-btn"
                type="button"
                onClick={handleConfirm}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-base shadow-xl shadow-rose-500/25 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>Save Settings & Start Conversation</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
