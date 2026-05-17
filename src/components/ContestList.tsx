import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../services/firebase";
import { Contest } from "../types";
import { Trophy, Calendar, Clock, ChevronRight, Users, Zap, Shield, Target, Award, Activity, ArrowRight, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { seedInitialContests } from "../services/db";
import { useAuth } from "./AuthProvider";

export default function ContestList() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"live" | "upcoming" | "past">("live");
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === "jagirdarrumana22@gmail.com";

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const snap = await getDocs(query(collection(db, "contests"), orderBy("startTime", "desc"), limit(20)));
        let fetchedContests = snap.docs.map(d => ({ id: d.id, ...d.data() } as Contest));
        
        if (fetchedContests.length === 0 && isAdmin) {
          await seedInitialContests();
          const retrySnap = await getDocs(query(collection(db, "contests"), orderBy("startTime", "desc"), limit(20)));
          fetchedContests = retrySnap.docs.map(d => ({ id: d.id, ...d.data() } as Contest));
        }
        setContests(fetchedContests);
      } catch (error) {
        console.error("Failed to fetch contests", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContests();
  }, [isAdmin]);

  const activeContests = contests.filter(c => c.status === "active");
  const upcomingContests = contests.filter(c => c.status === "upcoming");
  const pastContests = contests.filter(c => c.status === "ended");

  return (
    <div className="space-y-8 pb-24 max-w-7xl mx-auto">
      {/* Cyberpunk Hero Stats */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#020617] border border-[#1E293B] shadow-[0_0_100px_rgba(239,68,68,0.1)] p-12 lg:p-16 text-white group">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
           <div className="space-y-6 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider">
                <Target size={14} className="animate-pulse" /> Official Tournaments
              </div>
              <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none italic">
                 Weekly <span className="text-red-500">Carnage</span>
              </h1>
              <p className="text-slate-400 text-lg font-medium leading-relaxed">
                 Engage in our high-stakes weekly coding tournaments. Solve algorithmic puzzles under extreme pressure to win exclusive badges and global recognition.
              </p>
           </div>
           
           {/* Next Contest Countdown */}
           <div className="bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden min-w-[320px]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Next Uplink Window</h3>
                 <Zap size={18} className="text-red-500" />
              </div>
              <div className="flex justify-between items-center mb-6">
                 {[
                   { label: "DAYS", val: "02" },
                   { label: "HRS", val: "14" },
                   { label: "MIN", val: "45" },
                   { label: "SEC", val: "12" },
                 ].map((unit, i) => (
                   <div key={i} className="flex flex-col items-center">
                     <div className="bg-black/50 border border-white/10 rounded-xl w-14 h-16 flex items-center justify-center mb-2 shadow-inner">
                        <span className="text-2xl font-black text-red-500 font-mono tracking-tighter">{unit.val}</span>
                     </div>
                     <span className="text-[9px] font-bold text-slate-500 tracking-widest">{unit.label}</span>
                   </div>
                 ))}
              </div>
              <button className="w-full py-4 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 rounded-xl text-white font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2">
                 Register Now <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex gap-2 p-1.5 bg-[#1E293B] rounded-2xl border border-[#334155] w-max">
            {["live", "upcoming", "past"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all uppercase tracking-wider",
                  activeTab === tab ? "bg-[#0F172A] text-white shadow-lg border border-white/5" : "text-slate-400 hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="space-y-6"
             >
               {activeTab === "live" && (
                 <div className="space-y-4">
                   {activeContests.map(c => <ContestCard key={c.id} contest={c} isLive />)}
                   {activeContests.length === 0 && (
                     <EmptyState message="No live tournaments at this moment." icon={Activity} />
                   )}
                 </div>
               )}
               {activeTab === "upcoming" && (
                 <div className="space-y-4">
                   {upcomingContests.map(c => <ContestCard key={c.id} contest={c} />)}
                   {upcomingContests.length === 0 && (
                     <EmptyState message="No upcoming tournaments scheduled." icon={Calendar} />
                   )}
                 </div>
               )}
               {activeTab === "past" && (
                 <div className="space-y-4">
                   {pastContests.map(c => <ContestCard key={c.id} contest={c} />)}
                   {pastContests.length === 0 && (
                     <EmptyState message="No past tournaments found in the archive." icon={Clock} />
                   )}
                 </div>
               )}
             </motion.div>
          </AnimatePresence>
        </div>

        {/* Global Leaderboard Sidebar */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10">
                 <Trophy size={120} />
              </div>
              <div className="relative z-10">
                 <h3 className="text-xs font-black uppercase tracking-widest text-red-500 mb-8 flex items-center gap-2">
                   <Flame size={16} /> Seasonal Champions
                 </h3>
                 <div className="space-y-4">
                    {[
                      { user: "BinaryOracle", points: 4250 },
                      { user: "NeuralNomad", points: 3820 },
                      { user: "SynthWiz", points: 3610 },
                      { user: "LogicGhost", points: 3400 },
                      { user: "ByteBreaker", points: 3150 },
                    ].map((player, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                         <div className="flex items-center gap-4">
                            <span className={cn(
                               "w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black",
                               i === 0 ? "bg-yellow-400 text-yellow-900 shadow-[0_0_15px_rgba(250,204,21,0.4)]" :
                               i === 1 ? "bg-slate-300 text-slate-800" :
                               i === 2 ? "bg-amber-700 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            )}>
                               {i + 1}
                            </span>
                            <span className="font-bold text-sm dark:text-white">{player.user}</span>
                         </div>
                         <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">{player.points} PT</span>
                      </div>
                    ))}
                 </div>
                 <button className="w-full mt-6 py-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    Full Leaderboard
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function ContestCard({ contest, isLive }: { contest: Contest, isLive?: boolean }) {
  const navigate = useNavigate();
  return (
    <div 
      onClick={() => navigate(`/contests/${contest.id}`)}
      className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 cursor-pointer hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative"
    >
       {/* Background accent */}
       <div className={cn(
         "absolute top-0 right-0 w-64 h-full bg-gradient-to-l opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
         isLive ? "from-red-500/10 to-transparent" : "from-indigo-500/5 to-transparent"
       )} />

       <div className="flex items-center gap-6 z-10">
          <div className={cn(
             "w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner",
             isLive ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-slate-100 dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800"
          )}>
             {isLive ? <Zap size={32} className="animate-pulse" /> : <Trophy size={32} />}
          </div>
          <div>
             <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-black uppercase tracking-tight dark:text-white group-hover:text-indigo-500 transition-colors">{contest.title}</h3>
                {isLive && <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">Live</span>}
             </div>
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-1">{contest.description}</p>
             <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Users size={12} /> {contest.participants.length}
                </span>
                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Clock size={12} /> {new Date(contest.startTime).toLocaleDateString()}
                </span>
             </div>
          </div>
       </div>

       <div className="z-10 w-full md:w-auto">
          <button className={cn(
            "w-full md:w-auto px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2",
            isLive 
              ? "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600" 
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white shadow-inner"
          )}>
            {isLive ? "Enter Arena" : "Details"} <ChevronRight size={16} />
          </button>
       </div>
    </div>
  );
}

function EmptyState({ message, icon: Icon }: { message: string, icon: any }) {
  return (
    <div className="p-16 text-center bg-white dark:bg-[#1E293B] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
       <Icon size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-6" />
       <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
