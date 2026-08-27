import { PartnerLanguage } from './live-session';

export interface UIStrings {
  // Header
  femalePartner: string;
  malePartner: string;
  femaleSubtitle: string;
  maleSubtitle: string;
  selectLanguage: string;
  androidAppBtn: string;
  androidAppShort: string;
  memoryBtn: string;
  loginSyncBtn: string;
  loginShort: string;
  logoutBtn: string;
  quickSpeak: string;
  moreLang: string;

  // Statuses
  offlineStatus: string;
  connectingStatus: string;
  connectedStatus: string;
  listeningStatus: string;
  speakingStatus: string;

  // Center Action
  startCallText: string;
  micMuted: string;
  tapToMute: string;
  tapToUnmute: string;
  unmuteMic: string;
  muteMic: string;

  // Bottom Controls
  changeMoodTitle: string;
  realtimeVoiceTone: string;
  volumeLabel: string;
  endCallBtn: string;
  emotionLabel: string;

  // Moods
  moodRomantic: string;
  moodRomanticShort: string;
  moodAngry: string;
  moodAngryShort: string;
  moodCrying: string;
  moodCryingShort: string;
  moodJealous: string;
  moodJealousShort: string;
  moodCaring: string;
  moodCaringShort: string;
  moodPlayful: string;
  moodPlayfulShort: string;
  moodHappy: string;
  moodHappyShort: string;
  moodShy: string;
  moodShyShort: string;

  // Memory Drawer
  memoryTitle: string;
  memorySubtitle: string;
  userProfileTab: string;
  memoryListTab: string;
  nameLabel: string;
  nicknameLabel: string;
  favFoodLabel: string;
  lastMealLabel: string;
  saveProfileBtn: string;
  addMemoryPlaceholder: string;
  addMemoryBtn: string;
  noMemoriesText: string;
  closeBtn: string;

  // Android Modal
  androidModalTitle: string;
  androidModalSubtitle: string;
  androidInstalledTitle: string;
  androidInstalledDesc: string;
  oneTapInstallBtn: string;
  androidGuideTitle: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
}

export const ENGLISH_UI_STRINGS: UIStrings = {
  femalePartner: "👩 Janny",
  malePartner: "👨 Jay",
  femaleSubtitle: "Female",
  maleSubtitle: "Male",
  selectLanguage: "Language",
  androidAppBtn: "📱 Android App",
  androidAppShort: "App",
  memoryBtn: "Memory Diary",
  loginSyncBtn: "Login & Cloud Sync",
  loginShort: "Login",
  logoutBtn: "Log out",
  quickSpeak: "Conversation Language:",
  moreLang: "+ More",

  offlineStatus: "Offline • Tap Power to Call",
  connectingStatus: "Connecting...",
  connectedStatus: "Connected • Say Hello!",
  listeningStatus: "Listening to you...",
  speakingStatus: "Speaking...",

  startCallText: "Start Voice Call",
  micMuted: "Microphone Muted",
  tapToMute: "Tap to Mute/Unmute",
  tapToUnmute: "Tap to Unmute",
  unmuteMic: "Unmute Microphone",
  muteMic: "Mute Microphone",

  changeMoodTitle: "Change Emotion & Mood (Romantic, Angry, Crying, Jealous, Caring)",
  realtimeVoiceTone: "Real-time voice tone",
  volumeLabel: "Volume",
  endCallBtn: "End Call",
  emotionLabel: "Emotion",

  moodRomantic: "Romantic & Loving",
  moodRomanticShort: "Romantic",
  moodAngry: "Angry & Sulking",
  moodAngryShort: "Angry",
  moodCrying: "Crying & Emotional",
  moodCryingShort: "Crying",
  moodJealous: "Jealous & Possessive",
  moodJealousShort: "Jealous",
  moodCaring: "Deeply Caring & Protective",
  moodCaringShort: "Caring",
  moodPlayful: "Playful & Mischievous",
  moodPlayfulShort: "Playful",
  moodHappy: "Happy & Cheerful",
  moodHappyShort: "Happy",
  moodShy: "Shy & Blushing",
  moodShyShort: "Shy",

  memoryTitle: "Memory Diary",
  memorySubtitle: "Long-term memories and facts remembered across sessions",
  userProfileTab: "Profile Facts",
  memoryListTab: "Stored Memories",
  nameLabel: "Your Real Name",
  nicknameLabel: "Pet Nickname (e.g. Honey, Sweetheart, Jaan)",
  favFoodLabel: "Favorite Food",
  lastMealLabel: "Last Meal Mentioned",
  saveProfileBtn: "Save Profile Facts",
  addMemoryPlaceholder: "Add a new memory detail...",
  addMemoryBtn: "Add Memory",
  noMemoriesText: "No memories stored yet. Talk during calls and they will be remembered automatically!",
  closeBtn: "Close",

  androidModalTitle: "Install Android App",
  androidModalSubtitle: "Install as a native Android fullscreen app",
  androidInstalledTitle: "App Installed on Android!",
  androidInstalledDesc: "Launch directly from your Android Home Screen anytime.",
  oneTapInstallBtn: "📱 1-Tap Install to Android Phone",
  androidGuideTitle: "How to install on Android phone:",
  step1Title: "Tap 3-dot menu in Chrome",
  step1Desc: "Tap the top right three dots (⋮) button.",
  step2Title: "Tap 'Install App' or 'Add to Home screen'",
  step2Desc: "Select Install App or Add to Home screen from the menu.",
  step3Title: "Fullscreen Native App",
  step3Desc: "Runs in fullscreen mode without any browser URL bar!",
};

export const TRANSLATIONS: Record<PartnerLanguage, UIStrings> = {
  banglish: ENGLISH_UI_STRINGS,
  hinglish: ENGLISH_UI_STRINGS,
  nepali: ENGLISH_UI_STRINGS,
  bengali: ENGLISH_UI_STRINGS,
  hindi: ENGLISH_UI_STRINGS,
  english: ENGLISH_UI_STRINGS,
  spanish: ENGLISH_UI_STRINGS,
  french: ENGLISH_UI_STRINGS,
  japanese: ENGLISH_UI_STRINGS,
  korean: ENGLISH_UI_STRINGS,
  arabic: ENGLISH_UI_STRINGS,
};

export function getUIStrings(_language?: PartnerLanguage): UIStrings {
  return ENGLISH_UI_STRINGS;
}
