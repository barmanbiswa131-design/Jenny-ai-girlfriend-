import { GoogleGenAI } from '@google/genai';
import { PartnerLanguage } from './live-session';

export type SubtitleLanguage = 
  | 'original'
  | 'romanized'
  | 'english'
  | 'bengali'
  | 'banglish'
  | 'nepali'
  | 'nepglish'
  | 'hindi'
  | 'hinglish'
  | 'spanish'
  | 'french';

export interface SubtitleLangInfo {
  code: SubtitleLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUBTITLE_LANGUAGES: SubtitleLangInfo[] = [
  { code: 'romanized', name: 'Romanized (Phonetic)', nativeName: 'Roman / Ma timi lai maya...', flag: '🔤' },
  { code: 'english', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'bengali', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'banglish', name: 'Banglish', nativeName: 'Banglish', flag: '🇧🇩' },
  { code: 'nepali', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵' },
  { code: 'nepglish', name: 'Nepglish', nativeName: 'Nepglish', flag: '🇳🇵' },
  { code: 'hindi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'hinglish', name: 'Hinglish', nativeName: 'Hinglish', flag: '🇮🇳' },
  { code: 'original', name: 'Original Spoken', nativeName: 'As Spoken', flag: '🎙️' },
  { code: 'spanish', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'french', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

// Devanagari to Roman transliteration table (Nepali / Hindi)
const DEVANAGARI_MAP: Record<string, string> = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri',
  'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'अं': 'an', 'अः': 'ah',
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'w', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
  'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ँ': 'n', '्': '',
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  '।': '.', '॥': '.'
};

// Bengali script to Roman transliteration table
const BENGALI_MAP: Record<string, string> = {
  'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'ee', 'উ': 'u', 'ঊ': 'oo', 'ঋ': 'ri',
  'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou', 'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n',
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'ny',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
  'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
  'য়': 'y', 'ড়': 'r', 'ঢ়': 'rh',
  'া': 'a', 'ি': 'i', 'ী': 'ee', 'ু': 'u', 'ূ': 'oo', 'ৃ': 'ri',
  'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou', '্': '',
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  '।': '.'
};

// Common conversational phrases fast lookup
const COMMON_PHRASES: Record<string, { romanized: string; en: string; bn: string; hi: string; ne: string }> = {
  'म तिमीलाई माया गर्छु': {
    romanized: 'Ma timi lai maya garchhu',
    en: 'I love you',
    bn: 'আমি তোমাকে ভালোবাসি',
    hi: 'मैं तुमसे प्यार करती हूँ',
    ne: 'म तिमीलाई माया गर्छु',
  },
  'म तिमीलाई धेरै माया गर्छु': {
    romanized: 'Ma timi lai dherai maya garchhu',
    en: 'I love you so much',
    bn: 'আমি তোমাকে অনেক ভালোবাসি',
    hi: 'मैं तुमसे बहुत प्यार करती हूँ',
    ne: 'म तिमीलाई धेरै माया गर्छु',
  },
  'कस्तो छ मेरो माया?': {
    romanized: 'Kasto chha mero maya?',
    en: 'How are you my love?',
    bn: 'কেমন আছো আমার ভালোবাসা?',
    hi: 'कैसी हो मेरी जान?',
    ne: 'कस्तो छ मेरो माया?',
  },
  'खाना खायौ?': {
    romanized: 'Khana khayau?',
    en: 'Did you eat food?',
    bn: 'ভাত খেয়েছো?',
    hi: 'खाना खाया तुमने?',
    ne: 'खाना खायौ?',
  },
  'मलाई तिम्रो धेरै याद आयो': {
    romanized: 'Malai timro dherai yaad aayo',
    en: 'I missed you so much',
    bn: 'আমার তোমার খুব মনে পড়ছিল',
    hi: 'मुझे तुम्हारी बहुत याद आई',
    ne: 'मलाई तिम्रो धेरै याद आयो',
  },
  'আমি তোমাকে খুব ভালোবাসি': {
    romanized: 'Ami tomake khub bhalobashi',
    en: 'I love you very much',
    bn: 'আমি তোমাকে খুব ভালোবাসি',
    hi: 'मैं तुमसे बहुत प्यार करती हूँ',
    ne: 'म तिमीलाई धेरै माया गर्छु',
  },
  'কেমন আছো সোনা?': {
    romanized: 'Kemon acho shona?',
    en: 'How are you sweetie?',
    bn: 'কেমন আছো সোনা?',
    hi: 'कैसी हो जानू?',
    ne: 'कस्तो छौ सानु?',
  },
  'ভাত খেয়েছো ঠিক সময়ে?': {
    romanized: 'Bhat kheyecho thik shomoye?',
    en: 'Did you eat on time?',
    bn: 'ভাত খেয়েছো ঠিক সময়ে?',
    hi: 'समय पर खाना खाया ना?',
    ne: 'समयमा खाना खायौ?',
  },
  'tum kitne cute ho': {
    romanized: 'Tum kitne cute ho',
    en: 'You are so cute',
    bn: 'তুমি কত কিউট',
    hi: 'तुम कितने प्यारे हो',
    ne: 'तिमी कति राम्रो छौ',
  },
  'kaise ho baby': {
    romanized: 'Kaise ho baby',
    en: 'How are you baby?',
    bn: 'কেমন আছো বেবি?',
    hi: 'कैसे हो बेबी?',
    ne: 'कस्तो छौ बेबी?',
  }
};

/**
 * Phonetically transliterates text written in Devanagari or Bengali script into readable Roman letters
 */
export function romanizeText(text: string): string {
  if (!text) return '';

  // Check fast phrase dictionary first
  const cleanKey = text.trim();
  if (COMMON_PHRASES[cleanKey]) {
    return COMMON_PHRASES[cleanKey].romanized;
  }

  let result = '';
  const isDevanagari = /[\u0900-\u097F]/.test(text);
  const isBengali = /[\u0980-\u09FF]/.test(text);

  if (isDevanagari) {
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const roman = DEVANAGARI_MAP[char];
      if (roman !== undefined) {
        result += roman;
      } else {
        result += char;
      }
    }
    // Clean up duplicate spaces or punctuation
    return result.replace(/\s+/g, ' ').trim();
  }

  if (isBengali) {
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const roman = BENGALI_MAP[char];
      if (roman !== undefined) {
        result += roman;
      } else {
        result += char;
      }
    }
    return result.replace(/\s+/g, ' ').trim();
  }

  // If already in Roman characters, return as is
  return text;
}

// In-memory translation cache to make UI instant
const translationCache = new Map<string, Record<string, string>>();

/**
 * Translates spoken text to the target subtitle language using Gemini API or instant dictionary
 */
export async function translateSubtitle(
  text: string,
  targetLang: SubtitleLanguage,
  sourceLangHint?: PartnerLanguage
): Promise<{ text: string; romanized: string }> {
  if (!text || !text.trim()) {
    return { text: '', romanized: '' };
  }

  const clean = text.trim();
  const romanized = romanizeText(clean);

  if (targetLang === 'original') {
    return { text: clean, romanized };
  }

  if (targetLang === 'romanized') {
    return { text: romanized, romanized };
  }

  // Check phrase dictionary
  if (COMMON_PHRASES[clean]) {
    const item = COMMON_PHRASES[clean];
    if (targetLang === 'english') return { text: item.en, romanized };
    if (targetLang === 'bengali') return { text: item.bn, romanized };
    if (targetLang === 'banglish') return { text: romanizeText(item.bn), romanized };
    if (targetLang === 'nepali') return { text: item.ne, romanized };
    if (targetLang === 'nepglish') return { text: romanizeText(item.ne), romanized };
    if (targetLang === 'hindi') return { text: item.hi, romanized };
    if (targetLang === 'hinglish') return { text: romanizeText(item.hi), romanized };
  }

  // Check cache
  const cachedForText = translationCache.get(clean);
  if (cachedForText && cachedForText[targetLang]) {
    return { text: cachedForText[targetLang], romanized };
  }

  // Try fast Gemini translation
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Translate the following dialogue from a voice conversation into ${targetLang} naturally and concisely.
If target is romanized/Banglish/Nepglish/Hinglish, write in English alphabet with colloquial phonetic flow (e.g. "Ma timi lai maya garxu", "Ami tomake bhalobashi").
Spoken input: "${clean}"
Output ONLY the direct translation text with no quotes, explanations, or metadata.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
      });

      const translated = response.text?.trim() || romanized;

      // Save to cache
      if (!translationCache.has(clean)) {
        translationCache.set(clean, {});
      }
      translationCache.get(clean)![targetLang] = translated;

      return { text: translated, romanized };
    }
  } catch (err) {
    console.warn('Live translation fallback error:', err);
  }

  // Fallback: return romanized version
  return { text: romanized, romanized };
}
