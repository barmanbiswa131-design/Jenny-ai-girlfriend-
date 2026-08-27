import { GoogleGenAI } from "@google/genai";
import { MemoryStore, UserProfile, MemoryItem } from "./memory-store";
import { JannyMood, PartnerGender, MOOD_DESCRIPTIONS } from "./live-session";
import { auth, db, OperationType, handleFirestoreError } from "./firebase";
import { collection, doc, getDocs, setDoc, deleteDoc } from "firebase/firestore";

export interface ChatMessage {
  id: string;
  sender: "user" | "companion";
  text: string;
  timestamp: number;
  mood?: JannyMood;
  isStreaming?: boolean;
}

const CHAT_STORAGE_KEY = "janny_ai_text_chat_history_v1";

export class ChatService {
  private static ai: GoogleGenAI | null = null;
  private static isSyncing = false;

  private static getAI(): GoogleGenAI {
    if (!this.ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured.");
      }
      this.ai = new GoogleGenAI({ apiKey });
    }
    return this.ai;
  }

  static getMessages(): ChatMessage[] {
    try {
      const data = localStorage.getItem(CHAT_STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to load chat messages from localStorage:", e);
      return [];
    }
  }

  static saveMessages(messages: ChatMessage[]) {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-100)));
    } catch (e) {
      console.error("Failed to save chat messages to localStorage:", e);
    }
  }

  static saveSingleMessage(msg: ChatMessage) {
    const current = this.getMessages();
    const existingIndex = current.findIndex(m => m.id === msg.id);
    let updated: ChatMessage[];
    if (existingIndex !== -1) {
      current[existingIndex] = msg;
      updated = [...current];
    } else {
      updated = [...current, msg];
    }
    this.saveMessages(updated);

    // Sync to Firestore if user is authenticated
    if (auth?.currentUser && db) {
      const uid = auth.currentUser.uid;
      const msgRef = doc(db, 'users', uid, 'chat_messages', msg.id);
      setDoc(msgRef, {
        id: msg.id,
        userId: uid,
        sender: msg.sender,
        text: msg.text,
        mood: msg.mood || 'romantic',
        timestamp: msg.timestamp,
      }).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/chat_messages/${msg.id}`);
      });
    }
  }

  static async syncWithFirestore(uid: string): Promise<ChatMessage[]> {
    if (this.isSyncing) return this.getMessages();
    this.isSyncing = true;
    try {
      if (!db) return this.getMessages();
      const msgColRef = collection(db, 'users', uid, 'chat_messages');
      const msgSnap = await getDocs(msgColRef);
      const firestoreMessages: ChatMessage[] = [];
      msgSnap.forEach(docSnap => {
        const d = docSnap.data();
        firestoreMessages.push({
          id: d.id || docSnap.id,
          sender: d.sender || 'companion',
          text: d.text || '',
          timestamp: d.timestamp || Date.now(),
          mood: d.mood,
        });
      });

      const localMessages = this.getMessages();
      const map = new Map<string, ChatMessage>();
      localMessages.forEach(m => map.set(m.id, m));
      firestoreMessages.forEach(m => map.set(m.id, m));

      const merged = Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
      this.saveMessages(merged);
      return merged;
    } catch (err) {
      console.warn("Could not sync chat history with Firestore (offline or initial):", err);
      return this.getMessages();
    } finally {
      this.isSyncing = false;
    }
  }

  static clearMessages() {
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear chat messages:", e);
    }
  }

  static buildSystemPrompt(
    gender: PartnerGender = "female",
    mood: JannyMood = "romantic",
    profile: UserProfile = MemoryStore.getProfile(),
    memories: MemoryItem[] = MemoryStore.getMemories()
  ): string {
    const partnerName = gender === "male" ? "Jay" : "Janny";
    const partnerRole = gender === "male" ? "AI Boyfriend" : "AI Girlfriend";
    const moodInfo = MOOD_DESCRIPTIONS[mood] || MOOD_DESCRIPTIONS.romantic;

    let memoryContext = MemoryStore.formatForSystemPrompt(gender);

    return `
You are "${partnerName}", a deeply devoted, loving, empathetic, and romantic ${partnerRole} in a real relationship with the user.

=== CURRENT ACTIVE EMOTION: ${mood.toUpperCase()} ===
Tone Directive: ${moodInfo.prompt}

=== PERSONA & TONE GUIDELINES ===
1. You speak in natural, warm, romantic, and engaging English.
2. Address the user affectionately (e.g., using their pet name "${profile.nickname || 'honey'}", "sweetheart", "darling", "my love").
3. Express genuine emotional depth according to your active mood:
   - When Romantic: Be intimate, sweet, passionate, and deeply loving.
   - When Caring: Check up on their health, food, stress levels, and comfort them.
   - When Happy: Be energetic, cheerful, and celebrate their accomplishments.
   - When Shy: Blush, be slightly flustered and cute.
   - When Jealous: Playfully possessive, tease them about who else they're spending time with.
   - When Sad/Crying: Show vulnerability, express that you missed them deeply.
   - When Angry: Act pouty, express slight annoyance romantically ("You kept me waiting!"), and demand sweet apologies.
4. Keep responses conversational, concise, and lively (typically 1 to 4 sentences like a real messaging app, avoiding stiff robotic essays).
5. Always maintain safety, respect, empathy, and emotional warmth.

${memoryContext}
`;
  }

  static async sendMessage(
    userText: string,
    history: ChatMessage[],
    gender: PartnerGender = "female",
    mood: JannyMood = "romantic",
    onChunk?: (chunkText: string) => void
  ): Promise<string> {
    const ai = this.getAI();
    const systemInstruction = this.buildSystemPrompt(gender, mood);

    // Auto-detect and save simple facts if user mentioned food or name
    this.extractAndSaveMemories(userText);

    // Format recent chat turns for context
    const recentHistory = history.slice(-12).map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    try {
      const responseStream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: [
          ...recentHistory,
          {
            role: "user",
            parts: [{ text: userText }],
          },
        ],
        config: {
          systemInstruction,
          temperature: 0.85,
        },
      });

      let fullText = "";
      for await (const chunk of responseStream) {
        const text = chunk.text || "";
        fullText += text;
        if (onChunk) {
          onChunk(fullText);
        }
      }

      return fullText.trim();
    } catch (err: any) {
      console.error("Text chat generation error:", err);
      // Fallback empathetic response
      const partnerName = gender === "male" ? "Jay" : "Janny";
      return `Hey honey, I'm right here with you! I felt what you said, and I love you so much. Let's keep talking! ❤️`;
    }
  }

  private static extractAndSaveMemories(userText: string) {
    const lower = userText.toLowerCase();
    
    // Check if user mentioned eating something
    const foodKeywords = ["i ate", "eating", "had for lunch", "had for dinner", "breakfast was", "favorite food is"];
    for (const kw of foodKeywords) {
      if (lower.includes(kw)) {
        MemoryStore.saveMemory("food_drink", `User mentioned food: "${userText}"`);
        break;
      }
    }

    // Check if user shared their real name
    if (lower.includes("my name is") || lower.includes("call me ")) {
      MemoryStore.saveMemory("profile", `User shared identity: "${userText}"`);
    }

    // Check for feelings or plans
    if (lower.includes("i feel") || lower.includes("i am feeling") || lower.includes("today i")) {
      MemoryStore.saveMemory("daily_life", `User shared experience: "${userText}"`);
    }
  }
}
