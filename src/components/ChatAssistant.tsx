import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, User, Minimize2 } from "lucide-react";
import { chatWithMentor } from "../services/gemini";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

import { useParams, useLocation } from "react-router-dom";
import { INITIAL_PROBLEMS } from "../constants";

export default function ChatAssistant() {
  const { id } = useParams();
  const location = useLocation();
  const problem = INITIAL_PROBLEMS.find((p) => p.id === id);
  const isProblemPage = location.pathname.startsWith("/problem/");

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hi! I'm CodeMentor. How can I help you with your coding journey today?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const language = isProblemPage && problem ? problem.languages[0] : "python";
      const context = isProblemPage && problem 
        ? `User is working on problem: "${problem.title}". Description: ${problem.description}. Primary language: ${language}.`
        : "General coding doubt";
      
      // Convert messages to Gemini history format
      const history = messages.slice(1).map(msg => ({
        role: msg.role === "user" ? "user" as const : "model" as const,
        parts: [{ text: msg.content }]
      }));

      const response = await chatWithMentor(userMsg, history, language, context);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl w-[400px] h-[600px] rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-white/5 flex flex-col mb-6 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-[#4F46E5] text-white flex items-center justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                <Bot size={120} />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest">Mentor_AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest leading-none">Status: Nominal</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="hover:bg-white/10 p-2 rounded-xl transition-all relative z-10"
              >
                <Minimize2 size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef} 
              className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-transparent"
            >
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-4 group", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                  <div
                    className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110",
                      msg.role === "assistant" 
                        ? "bg-white dark:bg-slate-800 text-[#4F46E5] border border-slate-100 dark:border-slate-700" 
                        : "bg-[#4F46E5] text-white"
                    )}
                  >
                    {msg.role === "assistant" ? <Bot size={20} /> : <User size={20} />}
                  </div>
                  <div
                    className={cn(
                      "max-w-[75%] p-4 rounded-[1.5rem] text-sm shadow-sm leading-relaxed",
                      msg.role === "assistant" 
                        ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700 font-serif italic" 
                        : "bg-[#4F46E5] text-white rounded-tr-none font-bold"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 text-[#4F46E5] flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm">
                    <Bot size={20} />
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-[1.5rem] rounded-tl-none shadow-sm flex gap-1.5 border border-slate-100 dark:border-slate-700">
                    <div className="w-2 h-2 bg-[#4F46E5] rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-[#4F46E5] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-[#4F46E5] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-lg border-t border-white/20 dark:border-white/5">
              <div className="flex gap-3 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Input query to Mentor_AI..."
                  className="flex-1 bg-white dark:bg-slate-800 border-none rounded-[1.25rem] px-6 py-4 text-sm focus:ring-4 focus:ring-[#4F46E5]/10 transition-all outline-none shadow-inner font-bold placeholder:text-slate-400 placeholder:italic placeholder:font-normal"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-[#4F46E5] text-white p-4 rounded-[1.25rem] hover:bg-[#4338CA] disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 active:scale-90 flex items-center justify-center shrink-0 border border-white/10"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95",
          isOpen ? "bg-white text-[#4F46E5] rotate-90" : "bg-[#4F46E5] text-white"
        )}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>
    </div>
  );
}
