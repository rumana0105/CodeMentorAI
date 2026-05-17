import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import { Contest, Problem, Submission } from "../types";
import { Trophy, Clock, ChevronLeft, BookOpen, Users, BarChart2, Zap, AlertCircle, Target, Activity, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { INITIAL_PROBLEMS } from "../constants";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "./AuthProvider";

export default function ContestView() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState<Contest | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number} | null>(null);
  const [activeTab, setActiveTab] = useState<"problems" | "leaderboard" | "analytics">("problems");
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchContest = async () => {
      const docRef = doc(db, "contests", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const contestData = { id: docSnap.id, ...docSnap.data() } as Contest;
        setContest(contestData);
        const contestProblems = INITIAL_PROBLEMS.filter(p => contestData.problems.includes(p.id));
        setProblems(contestProblems);
      }
    };
    fetchContest();

    const q = query(collection(db, "submissions"), where("contestId", "==", id), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Submission)));
    });

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!contest) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(contest.endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setIsEnded(true);
        setTimeLeft(null);
        clearInterval(timer);
      } else {
        setTimeLeft({
          h: Math.floor(diff / (1000 * 60 * 60)),
          m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [contest]);

  if (!contest) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Zap size={40} className="text-indigo-500 animate-pulse" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Initializing Contest Uplink...</p>
      </div>
    );
  }

  // Calculate dynamic leaderboard from submissions
  // User -> { score, penalty, problemsSolved }
  const leaderboardMap = new Map<string, { userId: string, score: number, penalty: number, solvedCount: number }>();
  
  submissions.forEach(sub => {
    if (!leaderboardMap.has(sub.userId)) {
      leaderboardMap.set(sub.userId, { userId: sub.userId, score: 0, penalty: 0, solvedCount: 0 });
    }
    const userStats = leaderboardMap.get(sub.userId)!;
    // Basic logic: if passed, add points based on difficulty, add penalty based on time
    if (sub.status === "accepted") {
      userStats.solvedCount += 1;
      userStats.score += 100; // Mock score per problem
    } else {
      userStats.penalty += 10; // 10 min penalty
    }
  });

  const sortedLeaderboard = Array.from(leaderboardMap.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.penalty - b.penalty;
  });

  // Dummy fallback if no submissions
  const displayLeaderboard = sortedLeaderboard.length > 0 ? sortedLeaderboard : [
    { userId: "user_alpha_1", score: 400, penalty: 20, solvedCount: 4 },
    { userId: "user_beta_2", score: 300, penalty: 10, solvedCount: 3 },
    { userId: "user_gamma_3", score: 300, penalty: 40, solvedCount: 3 },
    { userId: "user_delta_4", score: 200, penalty: 0, solvedCount: 2 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      {/* Contest Header - Cyberpunk style */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#020617] border border-[#1E293B] shadow-[0_0_80px_rgba(79,70,229,0.15)] p-10 group">
         <div className="absolute top-0 right-0 w-[600px] h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
         
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-start gap-6">
               <button 
                 onClick={() => navigate("/contests")}
                 className="mt-2 p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all shadow-inner text-white"
               >
                 <ChevronLeft size={20} />
               </button>
               <div>
                 <div className="flex items-center gap-3 mb-2">
                    {isEnded ? (
                      <span className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-700">Archived</span>
                    ) : (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-red-500/30 flex items-center gap-1">
                        <Activity size={10} className="animate-pulse" /> Live Event
                      </span>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">ID: {contest.id.substring(0,8)}</span>
                 </div>
                 <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{contest.title}</h1>
                 <p className="text-sm text-slate-400 font-medium mt-2 max-w-xl line-clamp-2">{contest.description}</p>
                 
                 <div className="flex items-center gap-6 mt-6">
                   <div className="flex items-center gap-2 text-slate-300">
                     <Users size={16} className="text-indigo-400" />
                     <span className="text-sm font-bold">{contest.participants?.length || 0} Registered</span>
                   </div>
                   <div className="flex items-center gap-2 text-slate-300">
                     <BookOpen size={16} className="text-fuchsia-400" />
                     <span className="text-sm font-bold">{problems.length} Challenges</span>
                   </div>
                 </div>
               </div>
            </div>

            {/* Neon Timer */}
            <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/10 p-6 rounded-3xl min-w-[280px] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 text-center">Remaining Uplink Time</p>
               
               {isEnded ? (
                 <div className="text-center py-2">
                   <span className="text-3xl font-black text-slate-500 uppercase tracking-widest">Ended</span>
                 </div>
               ) : timeLeft ? (
                 <div className="flex justify-center items-center gap-4">
                   {[
                     { label: "HRS", val: timeLeft.h.toString().padStart(2, '0') },
                     { label: "MIN", val: timeLeft.m.toString().padStart(2, '0') },
                     { label: "SEC", val: timeLeft.s.toString().padStart(2, '0') },
                   ].map((unit, i) => (
                     <div key={i} className="flex flex-col items-center">
                       <div className="bg-black/50 border border-white/5 rounded-xl w-14 h-16 flex items-center justify-center mb-2 shadow-inner">
                          <span className={cn(
                            "text-3xl font-black font-mono tracking-tighter",
                            timeLeft.h === 0 && timeLeft.m < 15 ? "text-red-500 animate-pulse" : "text-white"
                          )}>{unit.val}</span>
                       </div>
                       <span className="text-[9px] font-bold text-slate-500 tracking-widest">{unit.label}</span>
                     </div>
                   ))}
                 </div>
               ) : null}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12">
          {/* Main Navigation */}
          <div className="flex gap-2 p-1.5 bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#334155] w-max shadow-sm">
            {[
              { id: "problems", label: "Operations", icon: Target },
              { id: "leaderboard", label: "Live Rankings", icon: Trophy },
              { id: "analytics", label: "Telemetry", icon: BarChart2 }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                  activeTab === tab.id 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-12">
          <AnimatePresence mode="wait">
            {activeTab === "problems" && (
              <motion.div 
                key="problems"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {problems.map((problem, index) => {
                  const hasSolved = submissions.some(s => s.userId === user?.uid && s.problemId === problem.id && s.status === "accepted");
                  const hasFailed = submissions.some(s => s.userId === user?.uid && s.problemId === problem.id && s.status !== "accepted");
                  
                  return (
                    <div 
                      key={problem.id}
                      onClick={() => !isEnded && navigate(`/problem/${problem.id}?contest=${contest.id}`)}
                      className={cn(
                        "group relative bg-white dark:bg-[#1E293B] p-8 rounded-[2rem] border transition-all cursor-pointer overflow-hidden",
                        hasSolved ? "border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]" :
                        isEnded ? "border-slate-200 dark:border-slate-800 opacity-75 cursor-not-allowed" : "border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1"
                      )}
                    >
                      {/* Solved overlay gradient */}
                      {hasSolved && <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />}

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg",
                            hasSolved ? "bg-green-500 text-white shadow-lg shadow-green-500/30" : "bg-slate-100 dark:bg-slate-900 text-indigo-500 border border-slate-200 dark:border-slate-700"
                          )}>
                            {hasSolved ? <CheckCircle2 size={24} /> : String.fromCharCode(65 + index)}
                          </div>
                          
                          <div className="flex items-center gap-2">
                             {hasFailed && !hasSolved && (
                               <span title="Previous attempt failed"><AlertCircle size={16} className="text-red-500" /></span>
                             )}
                             <span className={cn(
                               "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                               problem.difficulty === "Easy" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                               problem.difficulty === "Medium" ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" :
                               "bg-red-500/10 text-red-600 border-red-500/20"
                             )}>
                               {problem.difficulty}
                             </span>
                          </div>
                        </div>
                        
                        <h3 className={cn("text-xl font-black mb-3 tracking-tight", hasSolved ? "text-green-600 dark:text-green-400" : "text-slate-800 dark:text-white group-hover:text-indigo-500 transition-colors")}>
                          {problem.title}
                        </h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 leading-relaxed">{problem.description}</p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                            <Target size={14} /> {problem.category}
                          </span>
                          <span className={cn(
                            "text-xs font-black uppercase tracking-widest",
                            hasSolved ? "text-green-500" : "text-indigo-500"
                          )}>
                            {hasSolved ? "Completed" : "100 Pts"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === "leaderboard" && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl"
              >
                <div className="p-6 bg-slate-50 dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                     <Activity size={16} className="text-indigo-500" /> Live Rankings
                   </h3>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Auto-sync Active</span>
                   </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <tr>
                        <th className="px-8 py-5">Rank</th>
                        <th className="px-8 py-5">Node_ID</th>
                        <th className="px-8 py-5 text-center">Cleared</th>
                        <th className="px-8 py-5 text-center">Penalty</th>
                        <th className="px-8 py-5 text-right text-indigo-500">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {displayLeaderboard.map((userStats, index) => {
                        const rank = index + 1;
                        return (
                          <tr key={userStats.userId} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-8 py-5">
                              <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs",
                                rank === 1 ? "bg-amber-400 text-amber-900 shadow-[0_0_15px_rgba(251,191,36,0.4)]" :
                                rank === 2 ? "bg-slate-300 text-slate-800" :
                                rank === 3 ? "bg-amber-700 text-white" :
                                "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              )}>
                                {rank}
                              </div>
                            </td>
                            <td className="px-8 py-5 font-bold text-slate-800 dark:text-white flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 p-0.5">
                                 <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${userStats.userId}`} className="w-full h-full rounded-md" />
                               </div>
                               {userStats.userId.length > 12 ? userStats.userId.substring(0,8) + "..." : userStats.userId}
                            </td>
                            <td className="px-8 py-5 text-center">
                               <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold font-mono">
                                  <CheckCircle2 size={12} /> {userStats.solvedCount} / {problems.length}
                               </span>
                            </td>
                            <td className="px-8 py-5 text-center">
                               <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-red-500">
                                  <Clock size={12} /> {userStats.penalty}m
                               </span>
                            </td>
                            <td className="px-8 py-5 text-right font-black text-lg text-indigo-600 dark:text-indigo-400 tracking-tighter">
                               {userStats.score}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="p-16 text-center bg-white dark:bg-[#1E293B] rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800"
              >
                <Activity size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-6 animate-pulse" />
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">Telemetry Processing</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Detailed contest analytics, submission heatmaps, and code complexity reports will be available after the contest concludes.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
