import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Power, 
  PowerOff, 
  Sparkles, 
  Heart, 
  Volume2, 
  VolumeX, 
  Smile, 
  Flame, 
  HeartHandshake, 
  MessageCircleHeart,
  FlameKindling,
  HeartCrack,
  Eye,
  Phone,
  Captions,
  Settings,
  MessageSquare,
  Radio,
  SlidersHorizontal
} from 'lucide-react';
import { 
  LiveSession, 
  JannyMood, 
  PartnerGender, 
  PartnerVoice,
  PartnerLanguage, 
  SUPPORTED_LANGUAGES, 
  SUPPORTED_VOICES,
  MOOD_DESCRIPTIONS 
} from '../lib/live-session';
import { AudioStreamer } from '../lib/audio-streamer';
import { MemoryStore, MemoryItem, UserProfile } from '../lib/memory-store';
import { useAuth } from '../context/AuthContext';
import { getUIStrings, UIStrings } from '../lib/i18n';
import { CaptionsStore } from '../lib/captions-store';
import JannyAvatar from './JannyAvatar';
import { JannyMemoryDrawer } from './JannyMemoryDrawer';
import { LanguageSelectorModal } from './LanguageSelectorModal';
import { AndroidInstallModal } from './AndroidInstallModal';
import { LiveCaptionsOverlay } from './LiveCaptionsOverlay';
import { LiveTranscriptDrawer } from './LiveTranscriptDrawer';
import { CompanionSelectorModal } from './CompanionSelectorModal';
import { SettingsModal } from './SettingsModal';
import { AuthModal } from './AuthModal';
import { ChatInterface } from './ChatInterface';
import { MoodDrawer } from './MoodDrawer';

interface MoodOption {
  key: JannyMood;
  icon: React.FC<{ className?: string }>;
  color: string;
  badgeColor: string;
  getLabel: (t: UIStrings) => string;
  getShortLabel: (t: UIStrings) => string;
}

const MOODS: MoodOption[] = [
  { 
    key: 'romantic', 
    icon: Heart, 
    color: 'text-rose-400', 
    badgeColor: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
    getLabel: (t) => t.moodRomantic,
    getShortLabel: (t) => t.moodRomanticShort,
  },
  { 
    key: 'caring', 
    icon: HeartHandshake, 
    color: 'text-teal-400', 
    badgeColor: 'bg-teal-500/20 border-teal-500/40 text-teal-300',
    getLabel: (t) => t.moodCaring,
    getShortLabel: (t) => t.moodCaringShort,
  },
  { 
    key: 'happy', 
    icon: Smile, 
    color: 'text-amber-400', 
    badgeColor: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    getLabel: (t) => t.moodHappy,
    getShortLabel: (t) => t.moodHappyShort,
  },
  { 
    key: 'shy', 
    icon: Sparkles, 
    color: 'text-pink-400', 
    badgeColor: 'bg-pink-500/20 border-pink-500/40 text-pink-300',
    getLabel: (t) => t.moodShy,
    getShortLabel: (t) => t.moodShyShort,
  },
  { 
    key: 'jealous', 
    icon: Eye, 
    color: 'text-purple-400', 
    badgeColor: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
    getLabel: (t) => t.moodJealous,
    getShortLabel: (t) => t.moodJealousShort,
  },
  { 
    key: 'playful', 
    icon: Flame, 
    color: 'text-fuchsia-400', 
    badgeColor: 'bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-300',
    getLabel: (t) => t.moodPlayful,
    getShortLabel: (t) => t.moodPlayfulShort,
  },
  { 
    key: 'crying', 
    icon: HeartCrack, 
    color: 'text-blue-400', 
    badgeColor: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
    getLabel: (t) => t.moodCrying,
    getShortLabel: (t) => t.moodCryingShort,
  },
  { 
    key: 'angry', 
    icon: FlameKindling, 
    color: 'text-red-400', 
    badgeColor: 'bg-red-500/20 border-red-500/40 text-red-300',
    getLabel: (t) => t.moodAngry,
    getShortLabel: (t) => t.moodAngryShort,
  },
];

const JannyInterface: React.FC = () => {
  const { user, phoneUser, openAuthModal } = useAuth();

  // Mode: "chat" (default) or "voice"
  const [appMode, setAppMode] = useState<"chat" | "voice">("chat");

  const [state, setState] = useState<"disconnected" | "connecting" | "connected" | "listening" | "speaking">("disconnected");
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(85);
  const [mood, setMood] = useState<JannyMood>("romantic");
  const [partnerGender, setPartnerGender] = useState<PartnerGender>(() => {
    return (MemoryStore.getProfile().partnerGender as PartnerGender) || "female";
  });
  const [partnerVoice, setPartnerVoice] = useState<PartnerVoice>(() => {
    const p = MemoryStore.getProfile();
    return (p.partnerVoice as PartnerVoice) || (p.partnerGender === "male" ? "Puck" : "Aoede");
  });
  const [language, setLanguage] = useState<PartnerLanguage>(() => {
    return (MemoryStore.getProfile().preferredLanguage as PartnerLanguage) || "english";
  });
  const [moodFeedback, setMoodFeedback] = useState<string | null>(null);

  // Dynamic Translations (English-first)
  const t = getUIStrings("english");

  // Modal & Drawer states
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCompanionModalOpen, setIsCompanionModalOpen] = useState(false);
  const [isMemoryDrawerOpen, setIsMemoryDrawerOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [isTranscriptDrawerOpen, setIsTranscriptDrawerOpen] = useState(false);
  const [isMoodDrawerOpen, setIsMoodDrawerOpen] = useState(false);

  // Persistent Memory State
  const [memories, setMemories] = useState<MemoryItem[]>(() => MemoryStore.getMemories());
  const [profile, setProfile] = useState<UserProfile>(() => MemoryStore.getProfile());

  const liveSessionRef = useRef<LiveSession | null>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const feedbackTimeoutRef = useRef<any>(null);

  // First time on load: prompt login if unauthenticated, otherwise show companion & voice selection
  useEffect(() => {
    const hasVisited = sessionStorage.getItem('janny_session_visited_v4');
    if (!hasVisited) {
      sessionStorage.setItem('janny_session_visited_v4', 'true');
      if (!user && !phoneUser) {
        openAuthModal();
      } else {
        setIsCompanionModalOpen(true);
      }
    }
  }, []);

  // Auto sync with Firestore whenever authenticated user changes
  useEffect(() => {
    if (user) {
      MemoryStore.syncWithFirestore(user.uid).then(({ memories: m, profile: p }) => {
        setMemories(m);
        setProfile(p);
        if (p.partnerGender) {
          setPartnerGender(p.partnerGender);
        }
        if (p.partnerVoice) {
          setPartnerVoice(p.partnerVoice);
        }
        if (p.preferredLanguage) {
          setLanguage(p.preferredLanguage);
        }
        if (p.mood) {
          setMood(p.mood);
        }
      });
    } else {
      setMemories(MemoryStore.getMemories());
      setProfile(MemoryStore.getProfile());
    }
  }, [user, phoneUser]);

  const refreshMemoriesFromStore = () => {
    setMemories(MemoryStore.getMemories());
    setProfile(MemoryStore.getProfile());
  };

  const handleUpdateSettings = (newSettings: {
    partnerGender?: PartnerGender;
    partnerVoice?: PartnerVoice;
    language?: PartnerLanguage;
    nickname?: string;
  }) => {
    let nextGender = partnerGender;
    let nextVoice = partnerVoice;
    let nextLang = language;

    if (newSettings.partnerGender) {
      nextGender = newSettings.partnerGender;
      setPartnerGender(nextGender);
    }
    if (newSettings.partnerVoice) {
      nextVoice = newSettings.partnerVoice;
      setPartnerVoice(nextVoice);
    }
    if (newSettings.language) {
      nextLang = newSettings.language;
      setLanguage(nextLang);
    }
    if (newSettings.nickname) {
      setProfile(prev => ({ ...prev, nickname: newSettings.nickname }));
    }

    MemoryStore.updateProfile({
      partnerGender: nextGender,
      partnerVoice: nextVoice,
      preferredLanguage: nextLang,
      nickname: newSettings.nickname || profile.nickname,
    });

    const partnerLabel = nextGender === "male" ? "Jay" : "Janny";
    showToast(`✨ Settings updated: ${partnerLabel} (${nextVoice})`);

    if (state !== "disconnected") {
      toggleConnection(nextGender, mood, nextLang, nextVoice);
    }
  };

  const handleCompanionAndVoiceSelect = (
    gender: PartnerGender,
    voice: PartnerVoice,
    newLang: PartnerLanguage
  ) => {
    setPartnerGender(gender);
    setPartnerVoice(voice);
    setLanguage(newLang);
    MemoryStore.updateProfile({
      partnerGender: gender,
      partnerVoice: voice,
      preferredLanguage: newLang,
    });

    const voiceInfo = SUPPORTED_VOICES.find(v => v.id === voice);
    const partnerName = gender === "male" ? "Jay" : "Janny";
    showToast(`✨ ${partnerName} (${voiceInfo?.name || voice}) setup complete!`);

    if (state !== "disconnected") {
      toggleConnection(gender, mood, newLang, voice);
    }
  };

  const handleLanguageChange = (newLanguage: PartnerLanguage) => {
    setLanguage(newLanguage);
    MemoryStore.updateProfile({ preferredLanguage: newLanguage });
    liveSessionRef.current?.setLanguage(newLanguage);

    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === newLanguage);
    showToast(`🌐 Language: ${langInfo?.name || newLanguage}`);

    if (state !== "disconnected") {
      liveSessionRef.current?.setLanguage(newLanguage);
    }
  };

  const handleMoodChange = (newMood: JannyMood) => {
    setMood(newMood);
    MemoryStore.updateProfile({ mood: newMood });
    liveSessionRef.current?.setMood(newMood);

    const targetMoodOption = MOODS.find(m => m.key === newMood);
    const label = targetMoodOption ? targetMoodOption.getLabel(t) : newMood;
    showToast(`✨ Mood: ${label}`);
  };

  const showToast = (message: string, duration = 3000) => {
    setMoodFeedback(message);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setMoodFeedback(null);
    }, duration);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    audioStreamerRef.current?.setVolume(newVolume / 100);
  };

  const toggleConnection = async (
    targetGender = partnerGender, 
    targetMood = mood,
    targetLanguage = language,
    targetVoice = partnerVoice
  ) => {
    if (state === "disconnected") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        alert("Gemini API Key is missing. Please configure it in your Settings panel.");
        return;
      }

      audioStreamerRef.current = new AudioStreamer((base64Data) => {
        if (liveSessionRef.current) {
          liveSessionRef.current.sendAudio(base64Data);
        }
      });
      audioStreamerRef.current.setVolume(volume / 100);
      audioStreamerRef.current.setMuted(isMuted);

      audioStreamerRef.current.onPlaybackStateChange = (isPlaying) => {
        if (liveSessionRef.current) {
          if (isPlaying) {
            liveSessionRef.current.notifyPlaybackStarted();
          } else {
            liveSessionRef.current.notifyPlaybackEnded();
          }
        }
      };

      liveSessionRef.current = new LiveSession(
        apiKey,
        {
          onAudioOutput: (base64Data) => {
            audioStreamerRef.current?.addPlaybackData(base64Data);
          },
          onInterrupted: () => {
            audioStreamerRef.current?.stopPlayback();
          },
          onStateChange: (newState) => {
            setState(newState);
          },
          onTranscription: (text, isUser) => {
            const speaker = isUser ? 'You' : (targetGender === 'male' ? 'Jay' : 'Janny');
            CaptionsStore.addTurn(isUser ? 'user' : 'partner', text, speaker);
          },
          onMemorySaved: (newMemory) => {
            refreshMemoriesFromStore();
            showToast(`✨ Saved: "${newMemory.detail}"`, 4000);
          },
          onProfileUpdated: (updatedProfile) => {
            setProfile(updatedProfile);
            refreshMemoriesFromStore();
          },
        },
        targetMood,
        targetGender,
        targetLanguage,
        targetVoice
      );

      try {
        await liveSessionRef.current.connect(targetMood, targetGender, targetLanguage, targetVoice);
        await audioStreamerRef.current.start();
      } catch (error) {
        console.error("Failed to start session:", error);
        setState("disconnected");
      }
    } else {
      liveSessionRef.current?.disconnect();
      audioStreamerRef.current?.stop();
      setState("disconnected");
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioStreamerRef.current?.setMuted(nextMuted);
  };

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      liveSessionRef.current?.disconnect();
      audioStreamerRef.current?.stop();
    };
  }, []);

  const activeMoodInfo = MOODS.find(m => m.key === mood) || MOODS[0];
  const activeLanguageInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  const partnerName = partnerGender === "male" ? "Jay" : "Janny";

  return (
    <div id="janny-main-app" className="relative w-full h-screen bg-[#070408] text-white flex flex-col overflow-hidden font-sans select-none">
      {/* Dynamic Toast Message */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none min-h-[36px] flex items-center justify-center px-4">
        <AnimatePresence>
          {moodFeedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="bg-black/90 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-full text-xs text-rose-200 shadow-2xl flex items-center gap-2 max-w-md text-center pointer-events-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-spin" />
              <span className="truncate">{moodFeedback}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MODE 1: TEXT CHAT MODE */}
      {appMode === "chat" && (
        <div className="w-full h-full flex flex-col">
          <ChatInterface
            partnerGender={partnerGender}
            partnerVoice={partnerVoice}
            mood={mood}
            profile={profile}
            onSwitchToVoiceMode={() => {
              setAppMode("voice");
              if (state === "disconnected") {
                toggleConnection();
              }
            }}
            onOpenMoodDrawer={() => setIsMoodDrawerOpen(true)}
            onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
            showToast={showToast}
          />
        </div>
      )}

      {/* MODE 2: VOICE CALL MODE (3D Voice Orb / Sphere only active and rendered here) */}
      {appMode === "voice" && (
        <div id="voice-call-mode-view" className="relative w-full h-full flex flex-col items-center justify-between overflow-hidden">
          {/* 3D Voice Orb Canvas Container - Strictly visible ONLY in Voice Mode */}
          <div className="absolute inset-0 z-0">
            <JannyAvatar state={state} isMuted={isMuted} mood={mood} gender={partnerGender} />
            {/* Soft Vignette & Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#070408]/95 pointer-events-none" />
          </div>

          {/* Top Header Bar for Voice Mode */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-20 w-full max-w-4xl px-3 sm:px-6 pt-3 sm:pt-5 flex items-center justify-between gap-2"
          >
            {/* Left: Switch back to Text Chat button */}
            <div className="flex items-center gap-2">
              <button
                id="voice-switch-back-to-chat-btn"
                onClick={() => setAppMode("chat")}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-white/15 border border-white/20 text-zinc-200 text-xs font-semibold shadow-lg backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Return to Text Chat"
              >
                <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
                <span>Text Chat</span>
              </button>

              <button 
                id="header-companion-pill-btn"
                onClick={() => setIsSettingsModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 border cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg backdrop-blur-xl ${
                  partnerGender === "male" ? "border-sky-500/40 text-sky-200" : "border-rose-500/40 text-rose-200"
                }`}
                title="Change Companion & Voice"
              >
                <span className="text-sm">{partnerGender === "male" ? "👨‍🦱" : "👩‍🦰"}</span>
                <span className="font-bold text-xs uppercase">{partnerName}</span>
                <span className="text-[10px] opacity-75 hidden sm:inline font-mono">({partnerVoice})</span>
              </button>
            </div>

            {/* Right: Subtitles Toggle + Settings */}
            <div className="flex items-center gap-2">
              <button
                id="janny-open-transcript-btn"
                onClick={() => setIsTranscriptDrawerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-white/10 border border-white/15 text-rose-200 text-xs font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
                title="Live Subtitles & Multi-language Side Translation"
              >
                <Captions className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Subtitles</span>
              </button>

              <button
                id="open-settings-modal-btn"
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-rose-500/20 to-pink-500/20 hover:from-rose-500/30 hover:to-pink-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
                title="Settings"
              >
                <Settings className="w-3.5 h-3.5 text-rose-400" />
                <span>Settings</span>
              </button>
            </div>
          </motion.div>

          {/* Center Info: Companion Name & Live Call State */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 pt-1 text-center flex flex-col items-center gap-1"
          >
            <div className="flex items-center gap-2">
              <MessageCircleHeart className={`w-5 h-5 ${partnerGender === "male" ? "text-blue-400" : "text-rose-400"} animate-pulse`} />
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-[0.25em] ${partnerGender === "male" ? "text-blue-100/90" : "text-rose-100/90"} uppercase`}>
                {partnerName}
              </h1>
            </div>

            {/* Live Call Status Badge */}
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${
                state === "speaking" 
                  ? "bg-emerald-400 animate-ping" 
                  : state === "listening" 
                    ? (partnerGender === "male" ? "bg-blue-500" : "bg-rose-500") + " animate-pulse" 
                    : state === "connected" 
                      ? "bg-emerald-400" 
                      : state === "connecting" 
                        ? "bg-amber-400 animate-pulse" 
                        : "bg-zinc-600"
              }`} />
              <span className="text-[11px] uppercase tracking-widest text-zinc-300 font-medium">
                {state === "disconnected" && "Offline • Tap Power to Connect"}
                {state === "connecting" && `Connecting to ${partnerName}...`}
                {state === "connected" && `Connected (${activeLanguageInfo.name})`}
                {state === "listening" && "Listening to you..."}
                {state === "speaking" && `${partnerName} is speaking`}
              </span>
            </div>

            {/* Active Emotion Pill (Opens Mood Drawer) */}
            <div className="flex items-center gap-2 mt-1">
              <button
                id="voice-mood-drawer-btn"
                onClick={() => setIsMoodDrawerOpen(true)}
                className={`px-3.5 py-1 rounded-full border text-[11px] font-medium tracking-wide flex items-center gap-1.5 backdrop-blur-md hover:scale-105 transition-all cursor-pointer ${activeMoodInfo.badgeColor}`}
                title="Click to change emotion"
              >
                <activeMoodInfo.icon className="w-3.5 h-3.5" />
                <span>Emotion: {activeMoodInfo.getLabel(t)}</span>
                <span className="text-[10px] opacity-75">▼</span>
              </button>
            </div>
          </motion.div>

          {/* Center Action: Big Voice Mic / Power Button */}
          <div className="relative z-10 flex items-center justify-center w-full my-auto">
            <AnimatePresence mode="wait">
              {state === "disconnected" ? (
                <motion.div
                  key="power-container"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.15, opacity: 0 }}
                  className="flex flex-col items-center gap-4"
                >
                  <motion.button
                    id="janny-start-call-btn"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => toggleConnection()}
                    className={`group relative w-32 h-32 rounded-full bg-zinc-900/60 border ${partnerGender === "male" ? "border-blue-500/30 hover:border-blue-400" : "border-rose-500/30 hover:border-rose-400"} flex items-center justify-center backdrop-blur-2xl shadow-2xl transition-all cursor-pointer`}
                  >
                    <div className={`absolute inset-0 rounded-full ${partnerGender === "male" ? "bg-blue-500/15 group-hover:bg-blue-500/30" : "bg-rose-500/15 group-hover:bg-rose-500/30"} blur-2xl transition-colors`} />
                    <Power className={`w-12 h-12 ${partnerGender === "male" ? "text-blue-400 group-hover:text-blue-300" : "text-rose-400 group-hover:text-rose-300"} transition-transform group-hover:scale-110`} />
                  </motion.button>
                  <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold text-center">
                    Start Voice Call with {partnerName}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="mic-container"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  className="relative flex flex-col items-center gap-3"
                >
                  {/* Outer Pulsing Glow */}
                  <motion.div
                    animate={{ 
                      scale: state === "speaking" ? [1, 1.45, 1] : state === "listening" ? [1, 1.25, 1] : 1,
                      opacity: state === "speaking" ? [0.25, 0.55, 0.25] : state === "listening" ? [0.15, 0.35, 0.15] : 0.1
                    }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className={`absolute w-52 h-52 rounded-full ${partnerGender === "male" ? "bg-blue-500" : "bg-rose-500"} blur-3xl pointer-events-none`}
                  />
                  
                  <motion.button
                    id="janny-mic-toggle-btn"
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={toggleMute}
                    className={`relative w-28 h-28 rounded-full flex items-center justify-center backdrop-blur-2xl border-2 transition-all duration-300 shadow-2xl cursor-pointer ${
                      isMuted 
                        ? "bg-zinc-900/90 border-red-500/60 text-red-500" 
                        : state === "speaking" 
                          ? (partnerGender === "male" ? "bg-blue-600/30 border-blue-400 text-blue-300 shadow-[0_0_40px_rgba(59,130,246,0.4)]" : "bg-rose-600/30 border-rose-400 text-rose-300 shadow-[0_0_40px_rgba(244,63,94,0.4)]") 
                          : "bg-white/10 border-white/30 text-white hover:bg-white/15"
                    }`}
                    title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                  >
                    {isMuted ? (
                      <MicOff className="w-10 h-10" />
                    ) : (
                      <Mic className={`w-10 h-10 ${state === "listening" ? "animate-pulse " + (partnerGender === "male" ? "text-blue-400" : "text-rose-400") : ""}`} />
                    )}
                    
                    {/* Visualizer Pulse Rings on Speaking */}
                    {state === "speaking" && (
                      <motion.div
                        animate={{ scale: [1, 1.55], opacity: [0.6, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className={`absolute inset-0 rounded-full border-2 ${partnerGender === "male" ? "border-blue-400" : "border-rose-400"}`}
                      />
                    )}
                  </motion.button>
                  
                  <span className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">
                    {isMuted ? "Microphone Muted" : "Tap to Mute Mic"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Floating Subtitle Overlay */}
          <LiveCaptionsOverlay
            onOpenDrawer={() => setIsTranscriptDrawerOpen(true)}
            partnerGender={partnerGender}
            isCallActive={state !== 'disconnected'}
          />

          {/* Bottom Controls: Volume & Call End Control Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-lg px-3 sm:px-6 pb-6 flex flex-col gap-3"
          >
            {/* Quick Mood Selector Bar */}
            <div id="janny-mood-selector" className="bg-white/5 backdrop-blur-2xl p-2.5 sm:p-3 rounded-2xl border border-white/10 flex flex-col gap-2 shadow-2xl">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-rose-400" />
                  Emotional Tone
                </span>
                <button
                  onClick={() => setIsMoodDrawerOpen(true)}
                  className="text-[10px] text-rose-300 hover:text-rose-200 font-medium flex items-center gap-1 hover:underline"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>All Moods</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {MOODS.slice(0, 4).map((m) => {
                  const Icon = m.icon;
                  const isActive = mood === m.key;
                  return (
                    <button
                      key={m.key}
                      id={`mood-btn-${m.key}`}
                      onClick={() => handleMoodChange(m.key)}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 border cursor-pointer ${
                        isActive 
                          ? `${m.badgeColor} shadow-lg scale-102 ring-1 ring-white/30` 
                          : 'bg-white/5 border-transparent text-zinc-400 hover:bg-white/10 hover:text-white'
                      }`}
                      title={m.getLabel(t)}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${isActive ? m.color : 'text-zinc-400'}`} />
                      <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap truncate max-w-full">
                        {m.getShortLabel(t)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Volume & End Call Bar */}
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-2xl p-2.5 sm:p-3 rounded-2xl border border-white/10 shadow-lg">
              <button 
                onClick={() => handleVolumeChange(volume === 0 ? 80 : 0)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-zinc-300 hover:text-white"
                title={volume === 0 ? "Unmute Sound" : "Mute Sound"}
              >
                {volume === 0 ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-rose-400" />}
              </button>
              
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={volume} 
                onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                title={`Volume: ${volume}%`}
              />

              <span className="text-[11px] text-zinc-400 w-7 text-right font-mono">
                {volume}%
              </span>

              {/* End Call Button */}
              {state !== "disconnected" && (
                <button 
                  id="janny-end-call-btn"
                  onClick={() => toggleConnection()}
                  className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 py-1.5 px-3 rounded-xl border border-rose-500/40 text-rose-400 hover:text-rose-300 transition-all ml-1 shadow-sm cursor-pointer"
                  title="End Call"
                >
                  <PowerOff className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wider font-bold">End</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Mood & Emotion Drawer */}
      <MoodDrawer
        isOpen={isMoodDrawerOpen}
        onClose={() => setIsMoodDrawerOpen(false)}
        currentMood={mood}
        onSelectMood={handleMoodChange}
        partnerGender={partnerGender}
      />

      {/* Master Settings Modal (ChatGPT & Gemini Style) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        partnerGender={partnerGender}
        partnerVoice={partnerVoice}
        language={language}
        mood={mood}
        onUpdateSettings={handleUpdateSettings}
        onOpenMemoryDrawer={() => setIsMemoryDrawerOpen(true)}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        onOpenTranscriptDrawer={() => setIsTranscriptDrawerOpen(true)}
        memoriesCount={memories.length}
      />

      {/* Long-Term Memory Drawer */}
      <JannyMemoryDrawer
        isOpen={isMemoryDrawerOpen}
        onClose={() => setIsMemoryDrawerOpen(false)}
        memories={memories}
        profile={profile}
        onMemoriesUpdated={refreshMemoriesFromStore}
        language={language}
      />

      {/* Language Modal */}
      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        selectedLanguage={language}
        onSelectLanguage={handleLanguageChange}
        partnerGender={partnerGender}
      />

      {/* Android Install Modal */}
      <AndroidInstallModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
        language={language}
      />

      {/* Companion & 4-Voice Selector Modal */}
      <CompanionSelectorModal
        isOpen={isCompanionModalOpen}
        onClose={() => setIsCompanionModalOpen(false)}
        currentGender={partnerGender}
        currentVoice={partnerVoice}
        currentLanguage={language}
        onSelect={handleCompanionAndVoiceSelect}
      />

      {/* Cloud Authentication Modal */}
      <AuthModal
        onLoginSuccess={() => {
          setIsCompanionModalOpen(true);
        }}
      />

      {/* Live Side Transcript & Subtitle Translation Drawer */}
      <LiveTranscriptDrawer
        isOpen={isTranscriptDrawerOpen}
        onClose={() => setIsTranscriptDrawerOpen(false)}
        partnerGender={partnerGender}
        partnerLanguage={language}
      />
    </div>
  );
};

export default JannyInterface;
