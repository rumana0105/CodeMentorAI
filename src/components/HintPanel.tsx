import React from "react";
import { Lightbulb, HelpCircle, AlertCircle, ChevronRight, Brain, Activity, Layers } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Hint } from "../types";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface HintPanelProps {
  hints: Hint[];
  isLoading: boolean;
  onGetHint: () => void;
  onExplainHint: (index: number) => void;
  isExplanationLoading: number | null;
  hintLevel: number;
}

export default function HintPanel({ 
  hints, 
  isLoading, 
  onGetHint, 
  onExplainHint, 
  isExplanationLoading,
  hintLevel
}: HintPanelProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const levelLabels = ["Conceptual", "Approach", "Pseudocode"];
  const levelIcons = [<Brain size={14} />, <Activity size={14} />, <Layers size={14} />];

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [hints, isLoading]);

  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-[#E5E7EB] dark:border-[#334155] shadow-xl flex flex-col h-full overflow-hidden transition-all">
      <div className="px-6 py-4 border-b border-[#E5E7EB] dark:border-[#334155] flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
          <Lightbulb size={16} className="text-yellow-400" />
          Recursive Mentor
        </div>
        <div className="flex items-center gap-3">
           <div className="flex gap-1">
              {[1, 2, 3].map(lvl => (
                <div 
                  key={lvl}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-500",
                    hintLevel > lvl ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
                  )}
                />
              ))}
           </div>
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Lvl {Math.min(hintLevel, 3)}/3
           </span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.03)_0%,transparent_50%)]"
      >
        {hints.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary rotate-12 group-hover:rotate-0 transition-transform shadow-inner">
              <HelpCircle size={40} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">System_Idle</p>
              <p className="text-[10px] font-medium text-slate-400 max-w-[220px] leading-relaxed italic font-serif">
                "The first step is always the hardest. I'm here to illuminate the path without walking it for you."
              </p>
            </div>
            <button
               onClick={onGetHint}
               className="bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-primary-hover shadow-xl shadow-indigo-100 dark:shadow-none flex items-center gap-2 transition-all active:scale-95"
            >
               Initiate Hint Sequence <ChevronRight size={14} />
            </button>
          </div>
        )}

        <AnimatePresence initial={false}>
          {hints.map((hint, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <div className="absolute -left-3 top-0 bottom-0 w-1 bg-slate-100 dark:bg-slate-800 rounded-full" />
              <div className={cn(
                "p-5 rounded-3xl border flex flex-col gap-4 shadow-sm",
                hint.type === "beginner" && "bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-800/30 text-green-800 dark:text-green-400",
                hint.type === "logical" && "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30 text-blue-800 dark:text-blue-400",
                hint.type === "debugging" && "bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800/30 text-orange-800 dark:text-orange-400"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white/50 dark:bg-black/20 flex items-center justify-center text-[10px] font-black">
                      {hint.level || index + 1}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                      {levelIcons[Math.min((hint.level || index + 1) - 1, 2)]}
                      Level: {levelLabels[Math.min((hint.level || index + 1) - 1, 2)]}
                    </span>
                  </div>
                  {!hint.explanation && (
                    <button
                      onClick={() => onExplainHint(index)}
                      disabled={isExplanationLoading === index}
                      className="text-[9px] font-black uppercase tracking-widest bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-xl hover:bg-white/80 dark:hover:bg-black/40 transition-all disabled:opacity-50"
                    >
                      {isExplanationLoading === index ? "Analyzing..." : "Deep_Dive"}
                    </button>
                  )}
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 text-xs leading-relaxed font-medium prose prose-xs max-w-none dark:prose-invert">
                    {hint.isStuckTrigger && (
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter mb-2 text-red-600 dark:text-red-400 animate-pulse">
                        <AlertCircle size={10} />
                        Automated Intervention
                      </div>
                    )}
                    <ReactMarkdown>{hint.content}</ReactMarkdown>
                  </div>
                </div>
                
                {hint.explanation && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2 p-4 bg-white/40 dark:bg-black/20 rounded-2xl border border-current/5 text-[11px] leading-relaxed"
                  >
                    <div className="flex items-center gap-2 font-black mb-2 uppercase tracking-widest text-[8px] opacity-60">
                      <Brain size={12} />
                      Contextual Logic
                    </div>
                    <ReactMarkdown>{hint.explanation}</ReactMarkdown>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {hints.length > 0 && hints.length < 3 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-5 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center gap-4 bg-slate-50/30 dark:bg-slate-900/10"
          >
             <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   {levelIcons[hints.length]} Next Step Available: {levelLabels[hints.length]}
                </p>
                <p className="text-[9px] text-slate-400 italic font-serif">Still facing interference? Reveal the next layer of complexity.</p>
             </div>
             <button
               onClick={onGetHint}
               className="bg-primary text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-primary-hover shadow-lg shadow-indigo-100 dark:shadow-none flex items-center gap-2 transition-all active:scale-95"
             >
                Unlock Next Hint <ChevronRight size={14} />
             </button>
          </motion.div>
        )}

        {isLoading && (
          <div className="flex flex-col gap-3 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl animate-pulse">
             <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-24" />
             </div>
             <div className="space-y-2">
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
