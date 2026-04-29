import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../services/firebase";
import { Contest } from "../types";
import { Trophy, Calendar, Clock, ChevronRight, Users, Zap, Shield, Target, Award, Activity, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

import { seedInitialContests } from "../services/db";
import { useAuth } from "./AuthProvider";

export default function ContestList() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === "jagirdarrumana22@gmail.com";

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const snap = await getDocs(query(collection(db, "contests"), orderBy("startTime", "desc"), limit(20)));
        const fetchedContests = snap.docs.map(d => ({ id: d.id, ...d.data() } as Contest));
        
        if (fetchedContests.length === 0 && isAdmin) {
          await seedInitialContests();
          const retrySnap = await getDocs(query(collection(db, "contests"), orderBy("startTime", "desc"), limit(20)));
          setContests(retrySnap.docs.map(d => ({ id: d.id, ...d.data() } as Contest)));
        } else {
          setContests(fetchedContests);
        }
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
    <div className="space-y-12 pb-20">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Active Nodes", val: activeContests.length, icon: Activity, color: "text-emerald-500" },
          { label: "Total Synced", val: contests.length, icon: Users, color: "text-blue-500" },
          { label: "Global Ranking", val: "#241", icon: Trophy, color: "text-amber-500" },
          { label: "System Uptime", val: "99.9%", icon: Zap, color: "text-purple-500" },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
               <stat.icon size={80} />
            </div>
            <div className="relative z-10 flex flex-col gap-2">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</span>
               <div className="flex items-end gap-2">
                 <span className={cn("text-3xl font-black tracking-tight", stat.color)}>{stat.val}</span>
                 <div className="mb-1 w-1.5 h-1.5 rounded-full bg-slate-200 animate-pulse" />
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Feed */}
        <div className="lg:col-span-8 space-y-12">
          {/* Active Now */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200">
                  <Activity size={24} className="animate-pulse" />
               </div>
               <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-white leading-none">Live_Operations</h3>
                  <p className="text-xs font-bold text-red-500 uppercase tracking-widest mt-1">Real-time engagement synchronized</p>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
               <AnimatePresence>
                 {activeContests.map(c => <ContestCard key={c.id} contest={c} isLive />)}
               </AnimatePresence>
               {activeContests.length === 0 && (
                 <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-sm italic font-serif text-slate-400">No active synchronization waves detected.</p>
                 </div>
               )}
            </div>
          </section>

          {/* Upcoming */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <Calendar size={24} />
               </div>
               <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-white leading-none">Upcoming_Cycles</h3>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">Scheduled database expansions</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {upcomingContests.map(c => <ContestCard key={c.id} contest={c} />)}
            </div>
          </section>

          {/* History */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-slate-700 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Clock size={24} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-white">Archive_Logs</h3>
              </div>
              <button className="text-[10px] font-black uppercase tracking-widest text-[#4F46E5] hover:tracking-[0.2em] transition-all">View Full Ledger</button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                     <tr>
                        <th className="px-8 py-5">Node_Ident</th>
                        <th className="px-8 py-5">Engagement</th>
                        <th className="px-8 py-5">Winner_Auth</th>
                        <th className="px-8 py-5 text-right">Ledger</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                     {pastContests.slice(0, 5).map(c => (
                       <tr key={c.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all font-bold text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                          <td className="px-8 py-5 group-hover:text-primary transition-colors">{c.title}</td>
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-1.5 text-xs">
                                <Users size={14} className="text-slate-400" /> {c.participants.length}
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-2">
                                <Award size={14} className="text-amber-500" />
                                <span className="font-mono text-[10px]">AUTH_0x23F</span>
                             </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <ChevronRight size={14} className="inline opacity-0 group-hover:opacity-100 transition-all" />
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-12">
           {/* Top Performers */}
           <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
              <div className="absolute bottom-0 right-0 p-8 opacity-10">
                 <Shield size={120} />
              </div>
              <div className="relative z-10 space-y-8">
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Live Ranking</p>
                    <h4 className="text-3xl font-black uppercase tracking-tighter">Hall_of_Nexus</h4>
                 </div>

                 <div className="space-y-4">
                    {[
                      { user: "BinaryOracle", rank: 1, xp: 24502 },
                      { user: "SynthWiz", rank: 2, xp: 21200 },
                      { user: "NeuralNomad", rank: 3, xp: 19800 },
                      { user: "LogicGhost", rank: 4, xp: 18450 },
                    ].map((player, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-4">
                           <span className={cn("text-xs font-black w-6 h-6 flex items-center justify-center rounded-lg pr-px", 
                             player.rank === 1 ? "bg-amber-500 text-slate-900" : "bg-white/10"
                           )}>{player.rank}</span>
                           <span className="text-sm font-bold tracking-tight">{player.user}</span>
                        </div>
                        <span className="font-mono text-[10px] text-primary">{player.xp} XP</span>
                      </div>
                    ))}
                 </div>

                 <button className="w-full py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-900 group">
                    <span className="group-hover:tracking-[0.2em] transition-all flex items-center justify-center gap-2">View Full Leaderboard <ArrowRight size={14} /></span>
                 </button>
              </div>
           </div>

           {/* Next Event */}
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                 <Target className="text-slate-400" size={20} />
                 <div className="flex gap-1">
                    {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-slate-200 rounded-full" />)}
                 </div>
              </div>
              <div className="space-y-4">
                 <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Target_Sync_Window</h4>
                 <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "D", val: 0 },
                      { label: "H", val: 14 },
                      { label: "M", val: 32 },
                      { label: "S", val: 55 },
                    ].map((unit, i) => (
                      <div key={i} className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                         <span className="text-xl font-black text-slate-800 dark:text-white">{unit.val}</span>
                         <span className="text-[10px] font-bold text-slate-400">{unit.label}</span>
                      </div>
                    ))}
                 </div>
                 <p className="text-xs font-serif italic text-slate-400 pt-2 text-center border-t border-slate-50 dark:border-slate-800">Recursive Algorithms Global Hackathon</p>
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
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => navigate(`/contests/${contest.id}`)}
      className={cn(
        "relative rounded-[2.5rem] border-2 p-8 cursor-pointer transition-all duration-500 overflow-hidden group",
        isLive 
          ? "bg-white dark:bg-slate-900 border-red-500 shadow-2xl shadow-red-100" 
          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary shadow-sm hover:shadow-xl hover:-translate-y-1"
      )}
    >
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
         <Zap size={150} />
      </div>

      <div className="flex flex-col h-full space-y-6 relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <h4 className={cn("text-xl font-black tracking-tighter uppercase", isLive ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-white")}>
              {contest.title}
            </h4>
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                 <Users size={12} /> {contest.participants.length} Synced_Nodes
               </span>
               <div className="w-1 h-1 bg-slate-300 rounded-full" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                 <Clock size={12} /> {contest.startTime.split('T')[0]}
               </span>
            </div>
          </div>
          {isLive && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest animate-pulse shadow-lg shadow-red-200">
               Live
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 font-serif italic line-clamp-2 leading-relaxed">
          {contest.description}
        </p>

        <div className="flex items-center justify-between pt-4">
           <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <img key={i} src={`https://picsum.photos/seed/${contest.id}${i}/40/40`} className="w-8 h-8 rounded-xl border-2 border-white dark:border-slate-900 object-cover" />
              ))}
              <div className="w-8 h-8 rounded-xl border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">+12</div>
           </div>
           
           <button className={cn(
             "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2",
             isLive ? "bg-red-500 text-white shadow-lg" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-primary group-hover:text-white shadow-inner"
           )}>
             {isLive ? "Interface Now" : "Pre-Register"} <ArrowRight size={14} />
           </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-100 dark:bg-slate-800">
         <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: "100%" }}
            className={cn("h-full", isLive ? "bg-red-500" : "bg-primary")} 
         />
      </div>
    </motion.div>
  );
}
