import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  X, 
  User, 
  Heart, 
  Volume2, 
  Globe2, 
  BookHeart, 
  Smartphone, 
  LogOut, 
  LogIn, 
  ShieldCheck, 
  Phone, 
  Play, 
  Pause, 
  Check, 
  Sparkles, 
  Trash2, 
  ChevronRight,
  Sliders,
  Bell,
  Info
} from 'lucide-react';
import { 
  PartnerGender, 
  PartnerVoice, 
  PartnerLanguage, 
  SUPPORTED_VOICES, 
  SUPPORTED_LANGUAGES,
  VoiceOption,
  JannyMood
} from '../lib/live-session';
import { MemoryStore, UserProfile } from '../lib/memory-store';
import { useAuth } from '../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerGender: PartnerGender;
  partnerVoice: PartnerVoice;
  language: PartnerLanguage;
  mood: JannyMood;
  onUpdateSettings: (settings: {
    partnerGender?: PartnerGender;
    partnerVoice?: PartnerVoice;
    language?: PartnerLanguage;
    nickname?: string;
  }) => void;
  onOpenMemoryDrawer: () => void;
  onOpenAndroidModal: () => void;
  onOpenTranscriptDrawer: () => void;
  memoriesCount: number;
}

type SettingsTab = 'companion' | 'voice' | 'language' | 'account' | 'memory' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  partnerGender,
  partnerVoice,
  language,
  mood,
  onUpdateSettings,
  onOpenMemoryDrawer,
  onOpenAndroidModal,
  onOpenTranscriptDrawer,
  memoriesCount
}) => {
  const { user, phoneUser, logout, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('companion');
  const [nickname, setNickname] = useState<string>(() => MemoryStore.getProfile().nickname || '');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isSavedToast, setIsSavedToast] = useState(false);

  // Sync nickname when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setNickname(MemoryStore.getProfile().nickname || (partnerGender === 'male' ? 'Honey' : 'Sweetheart'));
    }
  }, [isOpen, partnerGender]);

  const handleGenderSelect = (gender: PartnerGender) => {
    let newVoice = partnerVoice;
    if (gender === 'male' && (partnerVoice === 'Aoede' || partnerVoice === 'Kore')) {
      newVoice = 'Puck';
    } else if (gender === 'female' && (partnerVoice === 'Puck' || partnerVoice === 'Charon')) {
      newVoice = 'Aoede';
    }
    onUpdateSettings({ partnerGender: gender, partnerVoice: newVoice });
    triggerSaveToast();
  };

  const handleVoiceSelect = (voiceId: PartnerVoice) => {
    onUpdateSettings({ partnerVoice: voiceId });
    triggerSaveToast();
  };

  const handleLanguageSelect = (langCode: PartnerLanguage) => {
    onUpdateSettings({ language: langCode });
    triggerSaveToast();
  };

  const handleNicknameChange = (newNick: string) => {
    setNickname(newNick);
    MemoryStore.updateProfile({ nickname: newNick });
  };

  const triggerSaveToast = () => {
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 1800);
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
      const textToSpeak = voice.previewLineEn || voice.previewLineBn;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

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

      const voices = window.speechSynthesis.getVoices();
      const matchVoice = voices.find(v => v.lang.includes('en'));
      if (matchVoice) {
        utterance.voice = matchVoice;
      }

      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setPlayingVoiceId(null), 2500);
    }
  };

  const currentUserDisplay = user?.displayName || user?.email || phoneUser?.phoneNumber || 'Guest User';
  const isLoggedIn = !!(user || phoneUser);

  const femaleVoices = SUPPORTED_VOICES.filter(v => v.gender === 'female');
  const maleVoices = SUPPORTED_VOICES.filter(v => v.gender === 'male');
  const activeVoiceInfo = SUPPORTED_VOICES.find(v => v.id === partnerVoice) || SUPPORTED_VOICES[0];
  const activeLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="settings-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-lg"
          />

          {/* Modal Content - ChatGPT / Gemini Settings Style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-3xl bg-[#120716]/95 border border-white/15 rounded-3xl shadow-2xl backdrop-blur-2xl text-white overflow-hidden flex flex-col max-h-[90vh] z-10"
          >
            {/* Header Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Settings</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                      Gemini Live
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Manage companion, voice, language, and account
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isSavedToast && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Saved</span>
                  </motion.div>
                )}
                <button
                  id="close-settings-modal-btn"
                  onClick={onClose}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Layout: Sidebar Tabs + Content Panel */}
            <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
              {/* Left Tabs (Desktop Sidebar / Mobile Top Pills) */}
              <div className="sm:w-56 p-3 sm:border-r border-b sm:border-b-0 border-white/10 bg-black/30 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible shrink-0 scrollbar-none">
                <button
                  onClick={() => setActiveTab('companion')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'companion'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Heart className="w-4 h-4 shrink-0" />
                  <span>AI Companion</span>
                </button>

                <button
                  onClick={() => setActiveTab('voice')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'voice'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Volume2 className="w-4 h-4 shrink-0" />
                  <span>Voice (4 Options)</span>
                </button>

                <button
                  onClick={() => setActiveTab('language')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'language'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Globe2 className="w-4 h-4 shrink-0" />
                  <span>Spoken Language</span>
                </button>

                <button
                  onClick={() => setActiveTab('account')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'account'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">Account</span>
                  {isLoggedIn && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                </button>

                <button
                  onClick={() => setActiveTab('memory')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'memory'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BookHeart className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">Memories & Diary</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                    {memoriesCount}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('about')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'about'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Info className="w-4 h-4 shrink-0" />
                  <span>App & Extras</span>
                </button>
              </div>

              {/* Right Content Panel */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-rose-500/20">
                {/* 1. COMPANION TAB */}
                {activeTab === 'companion' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider mb-1">
                        Select AI Companion
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Choose who you want to talk with — Female or Male companion
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Female Partner */}
                      <div
                        id="setting-gender-female"
                        onClick={() => handleGenderSelect('female')}
                        className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                          partnerGender === 'female'
                            ? 'bg-gradient-to-br from-rose-950/60 to-pink-950/40 border-rose-500 shadow-lg shadow-rose-500/10 ring-2 ring-rose-500/40'
                            : 'bg-black/40 border-white/10 hover:border-rose-400/40 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">👩‍🦰</span>
                            <div>
                              <h4 className="font-bold text-sm text-white">Female Partner (Janny)</h4>
                              <span className="text-[10px] text-rose-300">Girlfriend Edition</span>
                            </div>
                          </div>
                          {partnerGender === 'female' && (
                            <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-white">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-zinc-300">
                          Sweet, affectionate, deeply romantic, and caring companion.
                        </p>
                      </div>

                      {/* Male Partner */}
                      <div
                        id="setting-gender-male"
                        onClick={() => handleGenderSelect('male')}
                        className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                          partnerGender === 'male'
                            ? 'bg-gradient-to-br from-sky-950/60 to-indigo-950/40 border-sky-500 shadow-lg shadow-sky-500/10 ring-2 ring-sky-500/40'
                            : 'bg-black/40 border-white/10 hover:border-sky-400/40 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">👨‍🦱</span>
                            <div>
                              <h4 className="font-bold text-sm text-white">Male Partner (Jay)</h4>
                              <span className="text-[10px] text-sky-300">Boyfriend Edition</span>
                            </div>
                          </div>
                          {partnerGender === 'male' && (
                            <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center text-white">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-zinc-300">
                          Smart, charming, protective, and loving boyfriend.
                        </p>
                      </div>
                    </div>

                    {/* Nickname Setting */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                      <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                        What should your partner call you? (Calling Name / Nickname)
                      </label>
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => handleNicknameChange(e.target.value)}
                        placeholder="e.g. Sweetheart, Jaan, Honey, My Love, Alex"
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-400 placeholder:text-zinc-500"
                      />
                      <p className="text-[11px] text-zinc-400">
                        Your partner will address you with this affectionate name during conversations.
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. VOICE TAB (4 VOICES: 2 FEMALE, 2 MALE) */}
                {activeTab === 'voice' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider mb-1">
                        Select Voice (4 Natural AI Voices)
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Choose your favorite voice and click the preview button to test audio samples
                      </p>
                    </div>

                    {/* Female Voices */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <span>👧 Female Voices:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {femaleVoices.map((voice) => {
                          const isSelected = partnerVoice === voice.id;
                          const isPlaying = playingVoiceId === voice.id;
                          return (
                            <div
                              key={voice.id}
                              id={`setting-voice-${voice.id}`}
                              onClick={() => handleVoiceSelect(voice.id)}
                              className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
                                isSelected
                                  ? 'bg-rose-500/20 border-rose-400 shadow-md ring-1 ring-rose-400/60'
                                  : 'bg-black/40 border-white/10 hover:border-rose-400/40 hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-sm text-white">{voice.name}</span>
                                    <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded-md font-medium">
                                      {voice.toneTag}
                                    </span>
                                  </div>
                                  <p className="text-xs text-zinc-300 mt-1 leading-snug">
                                    {voice.personalityEn}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePreviewVoice(voice);
                                    }}
                                    title="Click to preview voice sample"
                                    className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                                      isPlaying 
                                        ? 'bg-rose-500 text-white animate-pulse' 
                                        : 'bg-white/10 hover:bg-white/20 text-rose-300'
                                    }`}
                                  >
                                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                    <span className="text-[10px] hidden sm:inline">{isPlaying ? 'Playing' : 'Listen'}</span>
                                  </button>
                                  {isSelected && (
                                    <div className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-white">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Male Voices */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                        <span>👦 Male Voices:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {maleVoices.map((voice) => {
                          const isSelected = partnerVoice === voice.id;
                          const isPlaying = playingVoiceId === voice.id;
                          return (
                            <div
                              key={voice.id}
                              id={`setting-voice-${voice.id}`}
                              onClick={() => handleVoiceSelect(voice.id)}
                              className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
                                isSelected
                                  ? 'bg-sky-500/20 border-sky-400 shadow-md ring-1 ring-sky-400/60'
                                  : 'bg-black/40 border-white/10 hover:border-sky-400/40 hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-sm text-white">{voice.name}</span>
                                    <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded-md font-medium">
                                      {voice.toneTag}
                                    </span>
                                  </div>
                                  <p className="text-xs text-zinc-300 mt-1 leading-snug">
                                    {voice.personalityEn}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePreviewVoice(voice);
                                    }}
                                    title="Click to preview voice sample"
                                    className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                                      isPlaying 
                                        ? 'bg-sky-500 text-white animate-pulse' 
                                        : 'bg-white/10 hover:bg-white/20 text-sky-300'
                                    }`}
                                  >
                                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                    <span className="text-[10px] hidden sm:inline">{isPlaying ? 'Playing' : 'Listen'}</span>
                                  </button>
                                  {isSelected && (
                                    <div className="w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center text-white">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. LANGUAGE TAB */}
                {activeTab === 'language' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider mb-1">
                        Conversation Spoken Language
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Select which language you want to speak in during calls
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {SUPPORTED_LANGUAGES.map((lang) => {
                        const isSelected = language === lang.code;
                        return (
                          <div
                            key={lang.code}
                            id={`setting-lang-${lang.code}`}
                            onClick={() => handleLanguageSelect(lang.code)}
                            className={`cursor-pointer p-3 rounded-2xl border transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-rose-500/20 border-rose-400 text-white shadow-sm ring-1 ring-rose-400/50'
                                : 'bg-black/40 border-white/10 text-zinc-300 hover:border-white/20 hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{lang.flag}</span>
                              <div>
                                <h4 className="font-bold text-sm text-white">{lang.nativeName}</h4>
                                <span className="text-[11px] text-zinc-400">{lang.name}</span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-white">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. ACCOUNT TAB */}
                {activeTab === 'account' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider mb-1">
                        User Account & Cloud Sync
                      </h3>
                      <p className="text-xs text-zinc-400">
                        When logged in, all your memories and preferences are safely synced to the cloud
                      </p>
                    </div>

                    {isLoggedIn ? (
                      /* Logged-In User Card with Logout Button */
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-black/60 border border-emerald-500/30 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-xl">
                              {user?.photoURL ? (
                                <img src={user.photoURL} alt="User" className="w-full h-full rounded-2xl object-cover" />
                              ) : (
                                <User className="w-6 h-6" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-base text-white truncate">
                                  {user?.displayName || 'User Profile'}
                                </h4>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold flex items-center gap-1 border border-emerald-500/30">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Active</span>
                                </span>
                              </div>
                              <p className="text-xs text-zinc-300 truncate">
                                {user?.email || phoneUser?.phoneNumber || 'Logged In'}
                              </p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                            <span>Cloud Memory Backup:</span>
                            <span className="text-emerald-400 font-medium">Active (Auto-Synced)</span>
                          </div>
                        </div>

                        {/* Logout Button */}
                        <button
                          id="settings-logout-btn"
                          onClick={() => {
                            logout();
                            triggerSaveToast();
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-bold text-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    ) : (
                      /* Guest User: Call to Log In */
                      <div className="p-5 rounded-2xl bg-black/40 border border-white/10 text-center space-y-4">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300">
                          <LogIn className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-white">You are using Guest Mode</h4>
                          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                            Log in with Google or Phone OTP to automatically preserve your relationship memories across all your devices.
                          </p>
                        </div>
                        <button
                          id="settings-login-btn"
                          onClick={() => {
                            onClose();
                            openAuthModal();
                          }}
                          className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-lg transition-all"
                        >
                          Log In / Sign Up
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. MEMORY & PRIVACY TAB */}
                {activeTab === 'memory' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider mb-1">
                        Relationship Memories & Diary
                      </h3>
                      <p className="text-xs text-zinc-400">
                        View and manage everything your companion has learned and remembered about you
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-300 font-bold">
                          <BookHeart className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">Stored Memories</h4>
                          <p className="text-xs text-zinc-400">{memoriesCount} facts and preferences saved</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          onOpenMemoryDrawer();
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-200 text-xs font-semibold"
                      >
                        <span>Open Memory Diary</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick reset/clear */}
                    <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/20 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-xs text-red-300">Reset Memories</h4>
                        <p className="text-[11px] text-zinc-400">Erase all remembered details and start fresh</p>
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete all stored memories?")) {
                            MemoryStore.clearAllMemories();
                            triggerSaveToast();
                          }
                        }}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear All</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. ABOUT & APP INSTALL */}
                {activeTab === 'about' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider mb-1">
                        App Installation & Features
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Install as native mobile app and access additional tools
                      </p>
                    </div>

                    {/* Android Install Card */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-teal-950/30 border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">Mobile App Installation</h4>
                          <p className="text-xs text-zinc-400">Install fullscreen app on Android / iOS</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          onOpenAndroidModal();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold"
                      >
                        Install Guide
                      </button>
                    </div>

                    {/* Subtitle & Transcripts */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-300">
                          <Sliders className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">Live Transcripts & History</h4>
                          <p className="text-xs text-zinc-400">Written speech text and translations</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          onOpenTranscriptDrawer();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-rose-200 text-xs font-semibold"
                      >
                        View Logs
                      </button>
                    </div>

                    {/* Version footer */}
                    <div className="text-center pt-3 text-[11px] text-zinc-500 space-y-1">
                      <p>Janny & Jay — Powered by Google Gemini 2.0 Live Native Audio</p>
                      <p>Version 3.2 • Ultra-Low Latency Bidirectional Streaming</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Footer Action */}
            <div className="px-6 py-3.5 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs">
              <div className="text-zinc-400 flex items-center gap-2">
                <span>Active Companion:</span>
                <span className="text-rose-300 font-bold">{partnerGender === 'male' ? 'Jay (Male)' : 'Janny (Female)'}</span>
                <span>•</span>
                <span className="text-zinc-300">{activeVoiceInfo.name}</span>
                <span>•</span>
                <span className="text-zinc-300">{activeLangInfo.name}</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
