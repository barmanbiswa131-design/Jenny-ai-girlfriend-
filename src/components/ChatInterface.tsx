import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Sparkles,
  Phone,
  Settings,
  Copy,
  Check,
  Trash2,
  Heart,
  Smile,
  Flame,
  FlameKindling,
  HeartCrack,
  Eye,
  HeartHandshake,
  Bot,
  User as UserIcon,
  RefreshCw
} from 'lucide-react';
import { ChatService, ChatMessage } from '../lib/chat-service';
import { JannyMood, PartnerGender, PartnerVoice } from '../lib/live-session';
import { UserProfile } from '../lib/memory-store';
import { useAuth } from '../context/AuthContext';

interface ChatInterfaceProps {
  partnerGender: PartnerGender;
  partnerVoice: PartnerVoice;
  mood: JannyMood;
  profile: UserProfile;
  onSwitchToVoiceMode: () => void;
  onOpenMoodDrawer: () => void;
  onOpenSettingsModal: () => void;
  showToast: (msg: string) => void;
}

const STARTER_PROMPTS = [
  "Hey sweetie, how was your day today? ❤️",
  "Tell me a sweet romantic memory we share ✨",
  "I missed you so much! What are you doing right now?",
  "Can you give me some caring advice? I had a long day.",
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  partnerGender,
  partnerVoice,
  mood,
  profile,
  onSwitchToVoiceMode,
  onOpenMoodDrawer,
  onOpenSettingsModal,
  showToast,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => ChatService.getMessages());
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const partnerName = partnerGender === 'male' ? 'Jay' : 'Janny';
  const partnerRole = partnerGender === 'male' ? 'AI Boyfriend' : 'AI Girlfriend';

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isLoading]);

  // Sync messages from Firestore when user logs in
  useEffect(() => {
    if (user) {
      ChatService.syncWithFirestore(user.uid).then((synced) => {
        if (synced && synced.length > 0) {
          setMessages(synced);
        }
      });
    }
  }, [user]);

  // Initial welcome message if no history
  useEffect(() => {
    if (messages.length === 0) {
      const initialGreeting: ChatMessage = {
        id: 'msg_welcome_' + Date.now(),
        sender: 'companion',
        text: `Hey there ${profile.nickname || 'my love'}! I'm ${partnerName}, your ${partnerRole}. I'm so happy to chat with you right now. How are you feeling today? ❤️`,
        timestamp: Date.now(),
        mood,
      };
      setMessages([initialGreeting]);
      ChatService.saveSingleMessage(initialGreeting);
    }
  }, []);

  const handleCopyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast('Copied to clipboard');
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'msg_user_' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    ChatService.saveSingleMessage(userMessage);
    setInputText('');
    setIsLoading(true);

    // AI placeholder for streaming/response
    const aiMessageId = 'msg_ai_' + (Date.now() + 1);
    const aiPlaceholder: ChatMessage = {
      id: aiMessageId,
      sender: 'companion',
      text: '',
      timestamp: Date.now() + 1,
      mood,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, aiPlaceholder]);

    try {
      const aiResponse = await ChatService.sendMessage(
        textToSend,
        newHistory,
        partnerGender,
        mood,
        (streamedChunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId ? { ...msg, text: streamedChunk } : msg
            )
          );
        }
      );

      const aiFinalMessage: ChatMessage = {
        id: aiMessageId,
        sender: 'companion' as const,
        text: aiResponse,
        timestamp: Date.now(),
        mood,
        isStreaming: false,
      };

      const finalHistory = [
        ...newHistory,
        aiFinalMessage,
      ];

      setMessages(finalHistory);
      ChatService.saveSingleMessage(aiFinalMessage);
    } catch (err) {
      console.error('Failed to get companion reply:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (confirm(`Are you sure you want to clear your chat history with ${partnerName}?`)) {
      ChatService.clearMessages();
      const freshGreeting: ChatMessage = {
        id: 'msg_fresh_' + Date.now(),
        sender: 'companion',
        text: `Chat cleared! I'm right here with you, ${profile.nickname || 'honey'}. What would you like to talk about? ❤️`,
        timestamp: Date.now(),
        mood,
      };
      setMessages([freshGreeting]);
      ChatService.saveMessages([freshGreeting]);
      showToast('Chat history cleared');
    }
  };

  const getMoodIcon = (m: JannyMood) => {
    switch (m) {
      case 'caring':
        return <HeartHandshake className="w-3.5 h-3.5 text-teal-400" />;
      case 'happy':
        return <Smile className="w-3.5 h-3.5 text-amber-400" />;
      case 'shy':
        return <Sparkles className="w-3.5 h-3.5 text-pink-400" />;
      case 'jealous':
        return <Eye className="w-3.5 h-3.5 text-purple-400" />;
      case 'playful':
        return <Flame className="w-3.5 h-3.5 text-fuchsia-400" />;
      case 'crying':
        return <HeartCrack className="w-3.5 h-3.5 text-blue-400" />;
      case 'angry':
        return <FlameKindling className="w-3.5 h-3.5 text-red-400" />;
      case 'romantic':
      default:
        return <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/30" />;
    }
  };

  return (
    <div id="chat-interface-container" className="relative w-full h-full flex flex-col bg-[#09080c] text-white">
      {/* Top Header Bar */}
      <div className="relative z-20 w-full px-4 sm:px-6 py-3.5 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0">
        {/* Left: Companion Profile & Mood Indicator */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg border ${
                partnerGender === 'male'
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-200'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
              }`}
            >
              {partnerGender === 'male' ? '👨‍🦱' : '👩‍🦰'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-white tracking-wide">{partnerName}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 font-medium">
                {partnerRole}
              </span>
            </div>

            {/* Quick Mood Drawer Pill Button */}
            <button
              id="chat-mood-trigger-btn"
              onClick={onOpenMoodDrawer}
              className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-300 hover:text-white transition-colors group cursor-pointer"
              title="Click to change companion mood"
            >
              <span className="flex items-center gap-1">
                {getMoodIcon(mood)}
                <span className="capitalize font-semibold text-rose-300 group-hover:underline">
                  {mood} Mood
                </span>
              </span>
              <span className="text-[10px] text-zinc-500">▼</span>
            </button>
          </div>
        </div>

        {/* Right Actions: Switch to Voice Call, Settings, Clear */}
        <div className="flex items-center gap-2">
          {/* Switch to Voice Call Button (Hero CTA) */}
          <button
            id="chat-switch-to-voice-btn"
            onClick={onSwitchToVoiceMode}
            className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Switch to Live Voice Call Mode"
          >
            <Phone className="w-4 h-4 fill-white" />
            <span>Voice Call</span>
          </button>

          {/* Clear Chat Button */}
          <button
            id="clear-chat-history-btn"
            onClick={handleClearChat}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Master Settings Button */}
          <button
            id="chat-open-settings-btn"
            onClick={onOpenSettingsModal}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Stream Container */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-6 space-y-4 max-w-4xl w-full mx-auto">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isCopied = copiedId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group/msg transition-all`}
            >
              {/* Sender Name & Role Label */}
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-zinc-400">
                {!isUser && (
                  <span className="font-semibold text-rose-300 flex items-center gap-1">
                    {partnerGender === 'male' ? 'Jay' : 'Janny'}
                  </span>
                )}
                {isUser && <span className="font-semibold text-sky-300">You</span>}
                <span className="text-[10px] text-zinc-600">•</span>
                <span className="text-[10px] text-zinc-500">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Message Bubble + Actions Row */}
              <div
                className={`relative flex items-start gap-2 max-w-[88%] sm:max-w-[78%] ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Bubble Container */}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm sm:text-base leading-relaxed break-words shadow-md transition-all ${
                    isUser
                      ? 'bg-gradient-to-r from-sky-600/90 to-blue-600/90 text-white rounded-tr-none border border-sky-400/30'
                      : 'bg-zinc-900/90 border border-white/10 text-zinc-100 rounded-tl-none shadow-black/40'
                  }`}
                >
                  {msg.text ? (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    <div className="flex items-center gap-1.5 py-1 text-zinc-400">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse delay-100" />
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse delay-200" />
                    </div>
                  )}
                </div>

                {/* Clean Copy Button for Every Message */}
                <button
                  id={`copy-msg-btn-${msg.id}`}
                  onClick={() => handleCopyText(msg.id, msg.text)}
                  className={`shrink-0 p-1.5 rounded-lg border text-xs transition-all duration-200 opacity-60 group-hover/msg:opacity-100 hover:scale-110 cursor-pointer ${
                    isCopied
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={isCopied ? 'Copied!' : 'Copy message text'}
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isLoading && messages[messages.length - 1]?.sender === 'user' && (
          <div className="flex flex-col items-start gap-1">
            <span className="text-[11px] text-rose-300 font-semibold px-1">
              {partnerName} is thinking...
            </span>
            <div className="rounded-2xl rounded-tl-none px-4 py-3 bg-zinc-900/90 border border-white/10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce delay-150" />
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce delay-300" />
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Chips (if few messages) */}
      {messages.length <= 2 && (
        <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 pb-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
            {STARTER_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition-all shrink-0 cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Text Input Bar (ChatGPT & Gemini Style) */}
      <div className="relative z-20 w-full max-w-4xl mx-auto px-3 sm:px-6 pb-4 sm:pb-6 pt-2 shrink-0">
        <div className="relative flex items-end gap-2 bg-zinc-900/90 border border-white/15 rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 shadow-2xl backdrop-blur-xl focus-within:border-rose-400/60 transition-colors">
          {/* Quick Mood Drawer Opener Icon */}
          <button
            id="chat-input-mood-drawer-btn"
            onClick={onOpenMoodDrawer}
            className="p-2 rounded-xl text-zinc-400 hover:text-rose-300 hover:bg-white/5 transition-colors shrink-0"
            title="Change companion emotion"
          >
            {getMoodIcon(mood)}
          </button>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            id="chat-text-input-field"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${partnerName}... (Press Enter to send)`}
            rows={1}
            disabled={isLoading}
            className="flex-1 max-h-36 min-h-[38px] bg-transparent text-white text-sm sm:text-base placeholder:text-zinc-500 focus:outline-none resize-none py-1 px-1"
          />

          {/* Quick Voice Call switch icon inside input */}
          <button
            id="chat-input-voice-call-btn"
            onClick={onSwitchToVoiceMode}
            className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-white/5 transition-colors shrink-0"
            title="Switch to Voice Call"
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* Send Button */}
          <button
            id="chat-send-message-btn"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className={`p-2.5 rounded-xl sm:rounded-2xl transition-all shrink-0 cursor-pointer ${
              inputText.trim() && !isLoading
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95'
                : 'bg-white/5 text-zinc-600 cursor-not-allowed'
            }`}
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Small Footer Notice */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500 px-3 pt-1.5">
          <span>{partnerName} remembers your shared memories & preferences across calls.</span>
          <span className="hidden sm:inline">Shift + Enter for new line</span>
        </div>
      </div>
    </div>
  );
};
