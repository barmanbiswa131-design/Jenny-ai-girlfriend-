/**
 * Persistent Long-Term Memory Store for Janny & Jay
 * Syncs with LocalStorage and Firestore database (when logged in).
 */
import { auth, db, OperationType, handleFirestoreError } from './firebase';
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { PartnerLanguage, PartnerVoice, JannyMood } from './live-session';

export type MemoryCategory = "profile" | "food_drink" | "daily_life" | "interests" | "events" | "special";

export interface MemoryItem {
  id: string;
  category: MemoryCategory;
  detail: string;
  timestamp: number;
  formattedDate: string;
}

export interface UserProfile {
  name?: string;
  nickname?: string;
  favoriteFood?: string;
  notes?: string;
  relationshipStatus?: string;
  lastMeal?: string;
  partnerGender?: "female" | "male";
  partnerVoice?: PartnerVoice;
  preferredLanguage?: PartnerLanguage;
  mood?: JannyMood;
}

const MEMORY_STORAGE_KEY = "janny_ai_long_term_memories_v1";
const PROFILE_STORAGE_KEY = "janny_ai_user_profile_v1";

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  nickname: "Jaan / Shona",
  favoriteFood: "",
  notes: "",
  relationshipStatus: "Dating",
  lastMeal: "",
  partnerGender: "female",
  partnerVoice: "Aoede",
  preferredLanguage: "english",
  mood: "romantic",
};

export class MemoryStore {
  private static isSyncing = false;

  static getMemories(): MemoryItem[] {
    try {
      const data = localStorage.getItem(MEMORY_STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to load memories from localStorage:", e);
      return [];
    }
  }

  static saveMemory(category: MemoryCategory, detail: string): MemoryItem {
    const memories = this.getMemories();
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const existingIndex = memories.findIndex(
      m => m.detail.toLowerCase().trim() === detail.toLowerCase().trim()
    );

    const newItem: MemoryItem = {
      id: "mem_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      category,
      detail: detail.trim(),
      timestamp: Date.now(),
      formattedDate,
    };

    let updated: MemoryItem[];
    if (existingIndex !== -1) {
      memories[existingIndex] = newItem;
      updated = [...memories];
    } else {
      updated = [newItem, ...memories];
    }

    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(updated.slice(0, 100)));
    } catch (e) {
      console.error("Failed to save memory to localStorage:", e);
    }

    // Sync to Firestore if user is authenticated
    if (auth?.currentUser && db) {
      const uid = auth.currentUser.uid;
      const memDocRef = doc(db, 'users', uid, 'memories', newItem.id);
      setDoc(memDocRef, {
        id: newItem.id,
        userId: uid,
        category: newItem.category,
        detail: newItem.detail,
        timestamp: newItem.timestamp,
        formattedDate: newItem.formattedDate,
      }).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/memories/${newItem.id}`);
      });
    }

    return newItem;
  }

  static deleteMemory(id: string): void {
    const memories = this.getMemories().filter(m => m.id !== id);
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories));
    } catch (e) {
      console.error("Failed to delete memory:", e);
    }

    if (auth?.currentUser && db) {
      const uid = auth.currentUser.uid;
      const memDocRef = doc(db, 'users', uid, 'memories', id);
      deleteDoc(memDocRef).catch(err => {
        handleFirestoreError(err, OperationType.DELETE, `users/${uid}/memories/${id}`);
      });
    }
  }

  static clearAllMemories(): void {
    try {
      localStorage.removeItem(MEMORY_STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear memories:", e);
    }
  }

  static getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!data) return DEFAULT_PROFILE;
      return { ...DEFAULT_PROFILE, ...JSON.parse(data) };
    } catch (e) {
      return DEFAULT_PROFILE;
    }
  }

  static updateProfile(patch: Partial<UserProfile>): UserProfile {
    const current = this.getProfile();
    const updated = { ...current, ...patch };
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to update profile:", e);
    }

    if (auth?.currentUser && db) {
      const uid = auth.currentUser.uid;
      const userDocRef = doc(db, 'users', uid);
      setDoc(userDocRef, {
        userId: uid,
        name: updated.name || '',
        nickname: updated.nickname || '',
        lastMeal: updated.lastMeal || '',
        favoriteFood: updated.favoriteFood || '',
        notes: updated.notes || '',
        partnerGender: updated.partnerGender || 'female',
        partnerVoice: updated.partnerVoice || (updated.partnerGender === 'male' ? 'Puck' : 'Aoede'),
        preferredLanguage: updated.preferredLanguage || 'english',
        mood: updated.mood || 'romantic',
        updatedAt: new Date().toISOString(),
      }, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      });
    }

    return updated;
  }

  /**
   * Sync all data from Firestore when user logs in
   */
  static async syncWithFirestore(uid: string): Promise<{ memories: MemoryItem[]; profile: UserProfile }> {
    if (this.isSyncing) return { memories: this.getMemories(), profile: this.getProfile() };
    this.isSyncing = true;

    try {
      if (!db) {
        return { memories: this.getMemories(), profile: this.getProfile() };
      }

      // 1. Fetch user profile
      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);
      let firestoreProfile: Partial<UserProfile> = {};
      if (userSnap.exists()) {
        const d = userSnap.data();
        firestoreProfile = {
          name: d.name || '',
          nickname: d.nickname || '',
          lastMeal: d.lastMeal || '',
          favoriteFood: d.favoriteFood || '',
          notes: d.notes || '',
          partnerGender: d.partnerGender || 'female',
          partnerVoice: d.partnerVoice || (d.partnerGender === 'male' ? 'Puck' : 'Aoede'),
          preferredLanguage: d.preferredLanguage || 'english',
          mood: d.mood || 'romantic',
        };
      }

      // Merge with local profile
      const mergedProfile = this.updateProfile(firestoreProfile);

      // 2. Fetch user memories
      const memColRef = collection(db, 'users', uid, 'memories');
      const memSnap = await getDocs(memColRef);
      const firestoreMemories: MemoryItem[] = [];
      memSnap.forEach(docSnap => {
        const d = docSnap.data();
        firestoreMemories.push({
          id: d.id || docSnap.id,
          category: d.category || 'daily_life',
          detail: d.detail || '',
          timestamp: d.timestamp || Date.now(),
          formattedDate: d.formattedDate || '',
        });
      });

      // Merge local with firestore
      const localMemories = this.getMemories();
      const map = new Map<string, MemoryItem>();
      localMemories.forEach(m => map.set(m.id, m));
      firestoreMemories.forEach(m => map.set(m.id, m));

      const mergedMemories = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(mergedMemories.slice(0, 100)));

      return { memories: mergedMemories, profile: mergedProfile };
    } catch (err) {
      console.warn("Could not sync with Firestore (offline or initial):", err);
      return { memories: this.getMemories(), profile: this.getProfile() };
    } finally {
      this.isSyncing = false;
    }
  }

  static formatForSystemPrompt(partnerGender: "female" | "male" = "female"): string {
    const profile = this.getProfile();
    const memories = this.getMemories();
    const partnerName = partnerGender === "male" ? "Jay" : "Janny";
    const partnerRole = partnerGender === "male" ? "AI Boyfriend" : "AI Girlfriend";

    let memoryText = `\n=== ${partnerName.toUpperCase()}'S PERSISTENT LONG-TERM MEMORY (CROSS-SESSION) ===\n`;
    memoryText += `You are ${partnerName}, the user's devoted and deeply emotional ${partnerRole}.\n`;
    memoryText += `You have PERFECT memory of everything the user has ever told you across past calls.\n\n`;

    memoryText += `USER PROFILE:\n`;
    if (profile.name) memoryText += `- User's Name: "${profile.name}"\n`;
    if (profile.nickname) memoryText += `- User's Nickname / Pet name: "${profile.nickname}"\n`;
    if (profile.favoriteFood) memoryText += `- Favorite Food: "${profile.favoriteFood}"\n`;
    if (profile.lastMeal) memoryText += `- Last Food / Meal mentioned: "${profile.lastMeal}"\n`;
    if (profile.preferredLanguage) memoryText += `- Preferred Spoken Language: "${profile.preferredLanguage}"\n`;
    if (profile.notes) memoryText += `- Special notes: "${profile.notes}"\n`;

    if (memories.length === 0) {
      memoryText += `\nSTORED MEMORIES: No previous memories recorded yet. Be sure to remember their name, what they ate, and what they do when they mention it!`;
    } else {
      memoryText += `\nSTORED MEMORIES (${memories.length} items - Most recent first):\n`;
      memories.slice(0, 30).forEach((m, idx) => {
        memoryText += `${idx + 1}. [${m.category.toUpperCase()}] (${m.formattedDate}): ${m.detail}\n`;
      });
    }

    memoryText += `\nCRITICAL MEMORY DIRECTIVES:
1. ALWAYS REMEMBER: If the user asks about anything they told you earlier, immediately check your STORED MEMORIES and answer accurately, warmly, passionately and naturally in their chosen language.
2. AUTOMATICALLY REMEMBER NEW FACTS: Whenever the user mentions their name, what food/drinks they ate, their family, their work, things they did today, or future plans, remember it so you will never forget it even after the session ends!`;

    return memoryText;
  }
}
