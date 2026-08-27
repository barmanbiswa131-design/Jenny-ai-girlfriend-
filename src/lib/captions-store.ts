import { SubtitleLanguage, translateSubtitle, romanizeText } from './translation-engine';

export interface CaptionTurn {
  id: string;
  sender: 'partner' | 'user';
  speakerName: string;
  originalText: string;
  romanizedText: string;
  translations: Partial<Record<SubtitleLanguage, string>>;
  timestamp: number;
}

export interface CaptionsSettings {
  enabled: boolean;
  targetLanguage: SubtitleLanguage;
  showSideDrawer: boolean;
  fontSize: 'sm' | 'md' | 'lg';
}

type Listener = () => void;

class CaptionsStoreClass {
  private history: CaptionTurn[] = [];
  private currentLiveTurn: CaptionTurn | null = null;
  private listeners: Set<Listener> = new Set();
  
  private settings: CaptionsSettings = {
    enabled: true,
    targetLanguage: 'romanized',
    showSideDrawer: false,
    fontSize: 'md',
  };

  constructor() {
    // Load persisted settings
    try {
      const saved = localStorage.getItem('janny_captions_settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not load captions settings:', e);
    }
  }

  public getSettings(): CaptionsSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<CaptionsSettings>) {
    this.settings = { ...this.settings, ...partial };
    try {
      localStorage.setItem('janny_captions_settings', JSON.stringify(this.settings));
    } catch (e) {}
    this.notify();
  }

  public getHistory(): CaptionTurn[] {
    return [...this.history];
  }

  public getCurrentLiveTurn(): CaptionTurn | null {
    return this.currentLiveTurn;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Caption listener error:', e);
      }
    });
  }

  public async addTurn(sender: 'partner' | 'user', text: string, speakerName: string) {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();

    const romanized = romanizeText(cleanText);
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newTurn: CaptionTurn = {
      id,
      sender,
      speakerName,
      originalText: cleanText,
      romanizedText: romanized,
      translations: {
        original: cleanText,
        romanized: romanized,
      },
      timestamp: Date.now(),
    };

    // Set as active floating subtitle
    this.currentLiveTurn = newTurn;
    this.history.push(newTurn);
    if (this.history.length > 100) {
      this.history.shift();
    }
    this.notify();

    // Asynchronously translate to current target language if needed
    const target = this.settings.targetLanguage;
    if (target !== 'original' && target !== 'romanized') {
      try {
        const { text: translated } = await translateSubtitle(cleanText, target);
        newTurn.translations[target] = translated;
        this.notify();
      } catch (err) {
        console.warn('Error fetching translation for caption:', err);
      }
    }
  }

  public clearLiveSubtitle() {
    this.currentLiveTurn = null;
    this.notify();
  }

  public clearHistory() {
    this.history = [];
    this.currentLiveTurn = null;
    this.notify();
  }
}

export const CaptionsStore = new CaptionsStoreClass();
