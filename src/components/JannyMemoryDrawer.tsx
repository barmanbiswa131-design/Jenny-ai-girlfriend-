import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookHeart, 
  X, 
  Trash2, 
  Plus, 
  Utensils, 
  User, 
  Sparkles, 
  Calendar, 
  Heart, 
  MessageSquare, 
  Search, 
  Check 
} from 'lucide-react';
import { MemoryStore, MemoryItem, MemoryCategory, UserProfile } from '../lib/memory-store';
import { PartnerLanguage } from '../lib/live-session';
import { getUIStrings } from '../lib/i18n';

interface JannyMemoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  profile: UserProfile;
  onMemoriesUpdated: () => void;
  language?: PartnerLanguage;
}

const CATEGORY_LABELS: Record<MemoryCategory, { label: string; icon: React.FC<{ className?: string }>; color: string }> = {
  food_drink: { label: 'Food & Meals', icon: Utensils, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  profile: { label: 'About You', icon: User, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  daily_life: { label: 'Daily Life', icon: MessageSquare, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  interests: { label: 'Interests', icon: Sparkles, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  events: { label: 'Moments & Plans', icon: Calendar, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  special: { label: 'Special', icon: Heart, color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' },
};

export const JannyMemoryDrawer: React.FC<JannyMemoryDrawerProps> = ({
  isOpen,
  onClose,
  memories,
  profile,
  onMemoriesUpdated,
  language = "banglish",
}) => {
  const [selectedTab, setSelectedTab] = useState<"all" | MemoryCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [newDetail, setNewDetail] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryCategory>("food_drink");

  const t = getUIStrings(language);

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState(profile.name || "");
  const [editedNickname, setEditedNickname] = useState(profile.nickname || "");
  const [editedLastMeal, setEditedLastMeal] = useState(profile.lastMeal || "");
  const [editedFavoriteFood, setEditedFavoriteFood] = useState(profile.favoriteFood || "");

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    MemoryStore.updateProfile({
      name: editedName.trim(),
      nickname: editedNickname.trim(),
      lastMeal: editedLastMeal.trim(),
      favoriteFood: editedFavoriteFood.trim(),
    });
    if (editedName.trim()) {
      MemoryStore.saveMemory("profile", `User's name is ${editedName.trim()}`);
    }
    if (editedLastMeal.trim()) {
      MemoryStore.saveMemory("food_drink", `User recently ate: ${editedLastMeal.trim()}`);
    }
    setIsEditingProfile(false);
    onMemoriesUpdated();
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDetail.trim()) return;
    MemoryStore.saveMemory(newCategory, newDetail.trim());
    if (newCategory === "food_drink") {
      MemoryStore.updateProfile({ lastMeal: newDetail.trim() });
    }
    setNewDetail("");
    setIsAddingMemory(false);
    onMemoriesUpdated();
  };

  const handleDeleteMemory = (id: string) => {
    MemoryStore.deleteMemory(id);
    onMemoriesUpdated();
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all stored memories?")) {
      MemoryStore.clearAllMemories();
      onMemoriesUpdated();
    }
  };

  const filteredMemories = memories.filter((m) => {
    const matchesTab = selectedTab === "all" || m.category === selectedTab;
    const matchesSearch = m.detail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="janny-memory-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl max-h-[90vh] bg-[#100912]/95 border border-rose-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <BookHeart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    {t.memoryTitle}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {memories.length}
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {t.memorySubtitle}
                  </p>
                </div>
              </div>

              <button
                id="janny-memory-close-btn"
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title={t.closeBtn}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Profile Card Summary */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-wider text-rose-300 font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {t.userProfileTab}
                  </span>
                  <button
                    onClick={() => {
                      setEditedName(profile.name || "");
                      setEditedNickname(profile.nickname || "");
                      setEditedLastMeal(profile.lastMeal || "");
                      setEditedFavoriteFood(profile.favoriteFood || "");
                      setIsEditingProfile(!isEditingProfile);
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium underline"
                  >
                    {isEditingProfile ? t.closeBtn : "Edit"}
                  </button>
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfile} className="space-y-3 mt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] text-zinc-400 font-medium block mb-1">{t.nameLabel}</label>
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          placeholder="e.g. Biswajit"
                          className="w-full text-xs bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-400 font-medium block mb-1">{t.nicknameLabel}</label>
                        <input
                          type="text"
                          value={editedNickname}
                          onChange={(e) => setEditedNickname(e.target.value)}
                          placeholder="e.g. Jaan / Shona / Maya"
                          className="w-full text-xs bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-400 font-medium block mb-1">{t.lastMealLabel}</label>
                        <input
                          type="text"
                          value={editedLastMeal}
                          onChange={(e) => setEditedLastMeal(e.target.value)}
                          placeholder="e.g. Biryani / Momo"
                          className="w-full text-xs bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-400 font-medium block mb-1">{t.favFoodLabel}</label>
                        <input
                          type="text"
                          value={editedFavoriteFood}
                          onChange={(e) => setEditedFavoriteFood(e.target.value)}
                          placeholder="e.g. Chicken Butter Masala"
                          className="w-full text-xs bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-md"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {t.saveProfileBtn}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-zinc-400 block mb-0.5">{t.nameLabel}</span>
                      <span className="font-semibold text-rose-200">
                        {profile.name || "—"}
                      </span>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-zinc-400 block mb-0.5">{t.nicknameLabel}</span>
                      <span className="font-semibold text-rose-200">
                        {profile.nickname || "Jaan"}
                      </span>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-zinc-400 block mb-0.5">{t.lastMealLabel}</span>
                      <span className="font-semibold text-amber-300 truncate block" title={profile.lastMeal}>
                        {profile.lastMeal || "—"}
                      </span>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-zinc-400 block mb-0.5">{t.favFoodLabel}</span>
                      <span className="font-semibold text-rose-200 truncate block">
                        {profile.favoriteFood || "—"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bar: Add Memory & Search */}
              <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search memories..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-rose-400/50"
                  />
                </div>

                {/* Add & Clear Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    id="add-memory-toggle-btn"
                    onClick={() => setIsAddingMemory(!isAddingMemory)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isAddingMemory ? t.closeBtn : t.addMemoryBtn}
                  </button>

                  {memories.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-transparent transition-colors"
                      title="Clear all memories"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Add Memory Form */}
              <AnimatePresence>
                {isAddingMemory && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddMemory}
                    className="bg-white/5 p-4 rounded-2xl border border-white/15 space-y-3 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-rose-300">
                        {t.addMemoryPlaceholder}
                      </span>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                        className="text-xs bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-rose-400"
                      >
                        <option value="food_drink">🍽️ Food & Meals</option>
                        <option value="profile">👤 Profile / Identity</option>
                        <option value="daily_life">💬 Daily Life</option>
                        <option value="interests">✨ Interests</option>
                        <option value="events">📅 Events</option>
                        <option value="special">❤️ Special</option>
                      </select>
                    </div>

                    <textarea
                      value={newDetail}
                      onChange={(e) => setNewDetail(e.target.value)}
                      placeholder={t.addMemoryPlaceholder}
                      rows={2}
                      className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-400 resize-none"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingMemory(false)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 text-zinc-400 text-xs hover:bg-white/10"
                      >
                        {t.closeBtn}
                      </button>
                      <button
                        type="submit"
                        disabled={!newDetail.trim()}
                        className="px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-semibold shadow-md"
                      >
                        {t.addMemoryBtn}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Category Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedTab("all")}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                    selectedTab === "all"
                      ? "bg-rose-500 border-rose-400 text-white shadow-md"
                      : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                  }`}
                >
                  All ({memories.length})
                </button>
                {(Object.keys(CATEGORY_LABELS) as MemoryCategory[]).map((cat) => {
                  const count = memories.filter((m) => m.category === cat).length;
                  const info = CATEGORY_LABELS[cat];
                  const Icon = info.icon;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedTab(cat)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                        selectedTab === cat
                          ? "bg-rose-500 border-rose-400 text-white shadow-md"
                          : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {info.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Memories List */}
              <div className="space-y-2.5">
                {filteredMemories.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
                    <Sparkles className="w-8 h-8 text-rose-500/40 animate-pulse" />
                    <p className="text-zinc-400 font-medium">{t.noMemoriesText}</p>
                  </div>
                ) : (
                  filteredMemories.map((item) => {
                    const catInfo = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.daily_life;
                    const Icon = catInfo.icon;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-start justify-between gap-3 shadow-sm"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-xl border mt-0.5 ${catInfo.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
                                {catInfo.label}
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                • {item.formattedDate}
                              </span>
                            </div>
                            <p className="text-xs text-rose-100 font-medium leading-relaxed break-words">
                              {item.detail}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteMemory(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Forget this memory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/10 bg-white/5 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Persistent long-term memory active in all calls
              </span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
              >
                {t.closeBtn}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
