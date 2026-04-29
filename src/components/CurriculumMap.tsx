import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronRight, 
  Map as MapIcon, 
  Lock, 
  CheckCircle2, 
  Star, 
  Terminal,
  Brain,
  Zap,
  Target,
  Trophy,
  Activity,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { INITIAL_PROBLEMS } from "../constants";
import { useAuth } from "./AuthProvider";
import { UserProgress, Problem } from "../types";
import { cn } from "../lib/utils";
import { db } from "../services/firebase";
import { getUserProgress } from "../services/db";

const CATEGORIES = [
  { 
    id: "basics", 
    name: "Foundation & Syntax", 
    desc: "Master the building blocks of coding.", 
    icon: Terminal,
    color: "bg-blue-500",
    problems: INITIAL_PROBLEMS.filter(p => p.category === "Basics")
  },
  { 
    id: "arithmetic", 
    name: "Mathematical Logic", 
    desc: "Numerical operations and basic math.", 
    icon: Zap,
    color: "bg-amber-500",
    problems: INITIAL_PROBLEMS.filter(p => p.category === "Arithmetic")
  },
  { 
    id: "strings", 
    name: "String Manipulation", 
    desc: "Handling text and pattern matching.", 
    icon: Target,
    color: "bg-green-500",
    problems: INITIAL_PROBLEMS.filter(p => p.category === "Strings")
  },
  { 
    id: "stacks", 
    name: "Data Structures", 
    desc: "Stacks, Queues, and more.", 
    icon: Activity,
    color: "bg-purple-500",
    problems: INITIAL_PROBLEMS.filter(p => p.category === "Stacks")
  },
  { 
    id: "dp", 
    name: "Advanced Thinking", 
    desc: "Dynamic Programming and Optimization.", 
    icon: Brain,
    color: "bg-red-500",
    problems: INITIAL_PROBLEMS.filter(p => p.category === "Dynamic Programming")
  }
];

export default function CurriculumMap() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      getUserProgress(user.uid).then(setProgress);
    }
  }, [user]);

  const solvedProblemIds = progress?.solvedProblems || [];

  const isCategoryUnlocked = (index: number) => {
    if (index === 0) return true;
    const prevCategory = CATEGORIES[index - 1];
    return prevCategory.problems.every(p => solvedProblemIds.includes(p.id));
  };

  const getCategoryProgress = (problems: Problem[]) => {
    const solved = problems.filter(p => solvedProblemIds.includes(p.id)).length;
    return (solved / problems.length) * 100;
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] py-12 px-6 lg:px-20 max-w-7xl mx-auto space-y-16">
      <header className="space-y-4 max-w-2xl">
        <div className="flex items-center gap-3 text-primary font-black uppercase tracking-[0.2em] text-xs">
          <MapIcon size={18} />
          Your Learning Odyssey
        </div>
        <h1 className="text-5xl font-black tracking-tight text-slate-800 dark:text-white leading-none">
          Curriculum <span className="text-primary italic">Map</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          Embark on a structured journey through computer science. Each node represents a domain of knowledge. Complete one to unlock the next.
        </p>
      </header>

      {/* Map Nodes */}
      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute top-0 bottom-0 left-[31px] md:left-1/2 w-1 bg-slate-100 dark:bg-slate-800 -translate-x-1/2 -z-10 rounded-full" />

        <div className="space-y-24 relative">
          {CATEGORIES.map((cat, idx) => {
            const unlocked = isCategoryUnlocked(idx);
            const isEven = idx % 2 === 0;
            const completion = getCategoryProgress(cat.problems);
            const isFullySolved = completion === 100;

            return (
              <motion.div 
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={cn(
                  "flex flex-col md:flex-row items-center gap-8 md:gap-20",
                  isEven ? "md:flex-row" : "md:flex-row-reverse"
                )}
              >
                {/* Node Label / Icon */}
                <div className="relative">
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className={cn(
                      "w-16 h-16 rounded-3xl flex items-center justify-center shadow-xl relative z-10 transition-all duration-500",
                      unlocked ? `${cat.color} text-white` : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                    )}
                  >
                    {isFullySolved ? <CheckCircle2 size={32} /> : (unlocked ? <cat.icon size={32} /> : <Lock size={28} />)}
                    
                    {/* Ring for Progress */}
                    {unlocked && (
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle
                                cx="32"
                                cy="32"
                                r="30"
                                stroke="white"
                                strokeWidth="2"
                                fill="transparent"
                                strokeDasharray={188.4}
                                strokeDashoffset={188.4 - (completion / 100) * 188.4}
                                className="opacity-40"
                            />
                        </svg>
                    )}
                  </motion.div>
                  
                  {/* Glowing Effect for unlocked nodes */}
                  {unlocked && !isFullySolved && (
                      <div className={cn("absolute inset-0 blur-xl opacity-30 animate-pulse", cat.color)} />
                  )}
                </div>

                {/* Content Card */}
                <motion.div 
                  whileHover={{ y: -5 }}
                  className={cn(
                    "flex-1 bg-white dark:bg-[#0F172A] p-8 rounded-[2.5rem] border border-[#E5E7EB] dark:border-[#334155] shadow-2xl shadow-indigo-500/5 group cursor-pointer transition-all w-full md:w-auto",
                    !unlocked && "opacity-50 grayscale"
                  )}
                  onClick={() => unlocked && setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Section {idx + 1}</span>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Star 
                                    key={i} 
                                    size={12} 
                                    className={cn(i < Math.ceil(completion / 33) ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-700")} 
                                />
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white group-hover:text-primary transition-colors flex items-center gap-2">
                            {cat.name}
                            {unlocked && <ChevronRight size={20} className={cn("transition-transform", selectedCategory === cat.id ? "rotate-90" : "")} />}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{cat.desc}</p>
                    </div>

                    {/* Progress Bar */}
                    {unlocked && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                                <span>Progress</span>
                                <span>{Math.round(completion)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${completion}%` }}
                                    className={cn("h-full", cat.color)} 
                                />
                            </div>
                        </div>
                    )}
                  </div>

                  {/* Problems Sub-menu */}
                  <AnimatePresence>
                    {selectedCategory === cat.id && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-8 space-y-4">
                                <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {cat.problems.map((prob) => {
                                        const isSolved = solvedProblemIds.includes(prob.id);
                                        return (
                                            <div 
                                                key={prob.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/problem/${prob.id}`);
                                                }}
                                                className={cn(
                                                    "p-4 rounded-2xl border transition-all flex items-center justify-between group/prob",
                                                    isSolved 
                                                        ? "bg-green-500/5 border-green-500/20 text-green-700 dark:text-green-400" 
                                                        : "bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-primary/30"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all",
                                                        isSolved ? "bg-green-500 text-white" : "bg-white dark:bg-slate-900 shadow-sm"
                                                    )}>
                                                        {isSolved ? <CheckCircle2 size={16} /> : <Terminal size={14} />}
                                                    </div>
                                                    <div className="text-xs font-bold tracking-tight">{prob.title}</div>
                                                </div>
                                                <ArrowRight size={14} className="opacity-0 group-hover/prob:opacity-100 translate-x-[-10px] group-hover/prob:translate-x-0 transition-all" />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <footer className="text-center pt-20">
        <div className="inline-flex flex-col items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800">
            <Trophy size={48} className="text-amber-400" />
            <h4 className="text-xl font-black text-slate-800 dark:text-white">Master the Path</h4>
            <p className="max-w-md text-sm text-slate-500 font-medium">
                Completing the entire curriculum will grant you the <span className="text-primary font-bold">"Zen Algorithmist"</span> title and unlock the advanced Interview Simulation chambers.
            </p>
        </div>
      </footer>
    </div>
  );
}
