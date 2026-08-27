import { CaptionsStore } from './captions-store';
import { PartnerLanguage } from './live-session';

const LANG_BCP47: Record<PartnerLanguage, string> = {
  nepali: 'ne-NP',
  bengali: 'bn-BD',
  banglish: 'bn-IN',
  hindi: 'hi-IN',
  hinglish: 'hi-IN',
  english: 'en-US',
  spanish: 'es-ES',
  french: 'fr-FR',
  japanese: 'ja-JP',
  korean: 'ko-KR',
  arabic: 'ar-SA',
};

export class UserSpeechRecognizer {
  private recognition: any = null;
  private isListening = false;
  private currentLanguage: PartnerLanguage = 'banglish';

  constructor(language: PartnerLanguage = 'banglish') {
    this.currentLanguage = language;
    this.initRecognition();
  }

  private initRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API is not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = LANG_BCP47[this.currentLanguage] || 'en-US';

      this.recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.trim();
          if (transcript) {
            CaptionsStore.addTurn('user', transcript, 'You');
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }
        console.warn('Speech recognition warning:', event.error);
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {}
        }
      };
    } catch (err) {
      console.warn('Could not initialize SpeechRecognition:', err);
    }
  }

  public setLanguage(language: PartnerLanguage) {
    this.currentLanguage = language;
    if (this.recognition) {
      this.recognition.lang = LANG_BCP47[language] || 'en-US';
    }
  }

  public start() {
    if (!this.recognition || this.isListening) return;
    this.isListening = true;
    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Failed to start SpeechRecognition:', e);
    }
  }

  public stop() {
    this.isListening = false;
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch (e) {}
  }
}
