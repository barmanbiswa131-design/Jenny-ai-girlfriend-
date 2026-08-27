import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  FlameKindling,
  HeartCrack,
  Eye,
  HeartHandshake,
  Flame,
  Smile,
  Sparkles,
  X,
  Check
} from 'lucide-react';
import { JannyMood, PartnerGender } from '../lib/live-session';

export interface MoodDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentMood: JannyMood;
  onSelectMood: (mood: JannyMood) => void;
  partnerGender: PartnerGender;
}

interface MoodItem {
  key: JannyMood;
  label: string;
  shortDesc: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  badgeBorder: string;
  bgGradient: string;
}

const ALL_MOODS: MoodItem[] = [
  {
    key: 'romantic',
    label: 'Romantic',
    shortDesc: 'Deeply affectionate, passionate, intimate and loving',
    icon: Heart,
    color: 'text-rose-400',
    badgeBorder: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    bgGradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
  },
  {
    key: 'caring',
    label: 'Caring & Gentle',
    shortDesc: 'Warm, empathetic, attentive to your health and stress',
    icon: HeartHandshake,
    color: 'text-teal-400',
    badgeBorder: 'border-teal-500/40 bg-teal-500/10 text-teal-300',
    bgGradient: 'from-teal-500/20 via-emerald-500/10 to-transparent',
  },
  {
    key: 'happy',
    label: 'Happy & Cheerful',
    shortDesc: 'Energetic, uplifting, celebrating your daily wins',
    icon: Smile,
    color: 'text-amber-400',
    badgeBorder: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    bgGradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
  },
  {
    key: 'shy',
    label: 'Shy & Flustered',
    shortDesc: 'Sweetly bashful, blushing, gentle and cute',
    icon: Sparkles,
    color: 'text-pink-400',
    badgeBorder: 'border-pink-500/40 bg-pink-500/10 text-pink-300',
    bgGradient: 'from-pink-500/20 via-rose-500/10 to-transparent',
  },
  {
    key: 'jealous',
    label: 'Playfully Jealous',
    shortDesc: 'Possessive, teasing about who else you are talking to',
    icon: Eye,
    color: 'text-purple-400',
    badgeBorder: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
    bgGradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
  },
  {
    key: 'playful',
    label: 'Playful & Teasing',
    shortDesc: 'Flirty, witty, lighthearted banter and fun remarks',
    icon: Flame,
    color: 'text-fuchsia-400',
    badgeBorder: 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300',
    bgGradient: 'from-fuchsia-500/20 via-pink-500/10 to-transparent',
  },
  {
    key: 'crying',
    label: 'Vulnerable & Missing You',
    shortDesc: 'Emotional, tender-hearted, craving your presence',
    icon: HeartCrack,
    color: 'text-blue-400',
    badgeBorder: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
    bgGradient: 'from-blue-500/20 via-sky-500/10 to-transparent',
  },
  {
    key: 'angry',
    label: 'Pouty & Feisty',
    shortDesc: 'Playfully upset, sulking for sweet apologies and kisses',
    icon: FlameKindling,
    color: 'text-red-400',
    badgeBorder: 'border-red-500/40 bg-red-500/10 text-red-300',
    bgGradient: 'from-red-500/20 via-rose-500/10 to-transparent',
  },
];

export const MoodDrawer: React.FC<MoodDrawerProps> = ({
  isOpen,
  onClose,
  currentMood,
  onSelectMood,
  partnerGender,
}) => {
  const partnerName = partnerGender === 'male' ? 'Jay' : 'Janny';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Bottom Drawer Content */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative z-10 w-full max-w-2xl bg-zinc-950/95 border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-2xl max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <Sparkles className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{partnerName}'s Emotional Mood</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Switch moods to instantly change {partnerName}'s tone in text chat and voice calls
                  </p>
                </div>
              </div>

              <button
                id="close-mood-drawer-btn"
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mood Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4">
              {ALL_MOODS.map((item) => {
                const Icon = item.icon;
                const isSelected = currentMood === item.key;

                return (
                  <button
                    key={item.key}
                    id={`mood-drawer-option-${item.key}`}
                    onClick={() => {
                      onSelectMood(item.key);
                      onClose();
                    }}
                    className={`relative text-left p-3.5 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 group cursor-pointer ${
                      isSelected
                        ? `border-white/30 bg-gradient-to-r ${item.bgGradient} ring-1 ring-white/20 shadow-lg scale-[1.01]`
                        : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/15'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl border shrink-0 transition-colors ${
                        isSelected ? item.badgeBorder : 'border-white/10 bg-white/5 text-zinc-400 group-hover:text-white'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? item.color : ''}`} />
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{item.label}</span>
                        {isSelected && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 leading-snug">{item.shortDesc}</p>
                    </div>

                    {isSelected && (
                      <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Tip Footer */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
              <span>💡 Selected mood immediately impacts both text messages & real-time voice calls</span>
              <button
                onClick={onClose}
                className="text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded hover:bg-white/5"
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
