import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, User, RefreshCw } from "lucide-react";
import { ChatMessage } from "../types";

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "ai",
      text: "Gracious greetings, darling! I am your LuxeBeauty Concierge. How may I elevate your style journey or guide your salon booking experience today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "user",
      text: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      const data = await resp.json();

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_ai_${Date.now()}`,
          sender: "ai",
          text: data.text || "I am currently polishing my lipsticks. How else can I assist you with standard booking procedures?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_ai_err_${Date.now()}`,
          sender: "ai",
          text: "Forgive me, my connection is slightly faint. To book immediately write to support or book straight away via the Booking page!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const presetQueries = [
    "What offers are running?",
    "Book an appointment",
    "Where is the salon?",
    "Bridal packages",
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button */}
      {!isOpen && (
        <button
          id="chat-toggle-btn"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white rounded-full p-4 shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 group cursor-pointer"
        >
          <MessageCircle className="w-6 h-6 animate-pulse" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out whitespace-nowrap text-sm font-semibold tracking-wide">
            Luxe Assistant
          </span>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          id="chat-container-window"
          className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl border border-pink-100 dark:border-zinc-800 flex flex-col overflow-hidden transition-all duration-300 transform scale-100"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 p-4 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full">
                <Sparkles className="w-5 h-5 text-amber-100" />
              </div>
              <div>
                <h4 className="font-semibold text-sm tracking-widest uppercase">Luxe Concierge</h4>
                <p className="text-xs text-pink-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-ping"></span>
                  Active Beauty Assistant
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                    m.sender === "user"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-pink-100 text-pink-800"
                  }`}
                >
                  {m.sender === "user" ? <User className="w-3.5 h-3.5" /> : "LB"}
                </div>
                <div className="flex flex-col max-w-[80%]">
                  <div
                    className={`p-3 rounded-2xl text-xs md:text-sm shadow-sm leading-relaxed ${
                      m.sender === "user"
                        ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-tr-none"
                        : "bg-pink-50/75 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-250 border border-pink-100/30 rounded-tl-none font-sans"
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-1 self-end">{m.timestamp}</span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 items-center text-pink-500 text-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Luxe Concierge is typing elegant reply...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preset Buttons */}
          <div className="p-2 border-t border-pink-50 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900 flex flex-wrap gap-1">
            {presetQueries.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setInputValue(q);
                }}
                className="text-[10px] bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:border-pink-300 hover:text-pink-600 rounded-full px-2.5 py-1 text-gray-600 dark:text-gray-300 transition-all cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Form Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-pink-50 dark:border-zinc-850 flex gap-2 items-center bg-white dark:bg-zinc-900"
          >
            <input
              type="text"
              placeholder="Ask for bridal glow, locations, or discounts..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-pink-50/50 dark:bg-zinc-800/80 outline-none rounded-full px-4 py-2 text-xs md:text-sm text-zinc-800 dark:text-zinc-100 border border-pink-100/40 focus:border-pink-300 focus:bg-white dark:focus:bg-zinc-850 transition-all"
            />
            <button
              type="submit"
              className="bg-pink-500 hover:bg-pink-600 active:scale-95 text-white p-2.5 rounded-full transition-all shadow cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
