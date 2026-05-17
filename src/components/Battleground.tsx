import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "./AuthProvider";
import { BattleMatch } from "../types";
import { INITIAL_PROBLEMS } from "../constants";
import { Swords, Users, Plus, Zap, Trophy, Lock, Unlock, Timer, ChevronRight, Activity, Flame, Shield, Crosshair, Cpu } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

export default function Battleground() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<BattleMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState(INITIAL_PROBLEMS[0].id);
  const [isMatchPrivate, setIsMatchPrivate] = useState(false);
  const [matchDuration, setMatchDuration] = useState(15);
  const [activeTab, setActiveTab] = useState<"live" | "rankings">("live");

  useEffect(() => {
    const q = query(
      collection(db, "matches"), 
      where("isPrivate", "==", false),
      where("status", "in", ["waiting", "active"])
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const matchData = snap.docs.map(d => ({ id: d.id, ...d.data() } as BattleMatch));
      setMatches(matchData.sort((a, b) => {
        if (a.status === "waiting" && b.status !== "waiting") return -1;
        if (a.status !== "waiting" && b.status === "waiting") return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateMatch = async () => {
    if (!user) return;
    const problem = INITIAL_PROBLEMS.find(p => p.id === selectedProblemId);
    if (!problem) return;

    try {
      const matchCode = isMatchPrivate ? Math.random().toString(36).substring(2, 8).toUpperCase() : null;
      const newMatch: any = {
        problemId: problem.id,
        creatorId: user.uid,
        creatorName: user.displayName || "Anonymous",
        creatorPhoto: user.photoURL || "",
        status: "waiting",
        creatorProgress: 0,
        opponentProgress: 0,
        durationMs: matchDuration * 60 * 1000,
        isPrivate: isMatchPrivate,
        createdAt: new Date().toISOString()
      };
      if (matchCode) newMatch.matchCode = matchCode;

      const docRef = await addDoc(collection(db, "matches"), newMatch);
      setShowCreateModal(false);
      navigate(`/battle/${docRef.id}`);
    } catch (error) {
      console.error("Error creating match:", error);
    }
  };

  const handleJoinMatch = async (matchId: string) => {
    if (!user) return;
    try {
      const matchRef = doc(db, "matches", matchId);
      const matchSnap = await getDoc(matchRef);
      if (!matchSnap.exists()) return;
      const match = matchSnap.data() as BattleMatch;
      
      if (match.status !== "waiting") return;
      if (match.creatorId === user.uid) {
        navigate(`/battle/${matchId}`);
        return;
      }

      await updateDoc(matchRef, {
        opponentId: user.uid,
        opponentName: user.displayName || "Anonymous",
        opponentPhoto: user.photoURL || "",
        status: "active",
        startTime: new Date().toISOString()
      });
      navigate(`/battle/${matchId}`);
    } catch (error) {
      console.error("Error joining match:", error);
    }
  };

  const handleQuickMatch = async () => {
    if (!user) return;
    
    // Find the first available waiting public match
    const availableMatch = matches.find(m => m.status === "waiting" && !m.isPrivate && m.creatorId !== user.uid);
    
    if (availableMatch) {
      await handleJoinMatch(availableMatch.id);
    } else {
      // Create a random match if none available
      const randomProblem = INITIAL_PROBLEMS[Math.floor(Math.random() * INITIAL_PROBLEMS.length)];
      try {
        const newMatch: any = {
          problemId: randomProblem.id,
          creatorId: user.uid,
          creatorName: user.displayName || "Anonymous",
          creatorPhoto: user.photoURL || "",
          status: "waiting",
          creatorProgress: 0,
          opponentProgress: 0,
          durationMs: 15 * 60 * 1000,
          isPrivate: false,
          createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, "matches"), newMatch);
        navigate(`/battle/${docRef.id}`);
      } catch (error) {
        console.error("Error creating quick match:", error);
      }
    }
  };

  const waitingMatches = matches.filter(m => m.status === "waiting");
  const activeMatches = matches.filter(m => m.status === "active");

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      {/* Neo-Cyberpunk Hero Area */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#020617] p-12 text-white border border-[#1E293B] shadow-[0_0_100px_rgba(79,70,229,0.15)] flex flex-col lg:flex-row items-center justify-between gap-12 group">
        {/* Holographic background effects */}
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15)_0%,transparent_50%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-xs font-bold uppercase tracking-wider">
            <Flame size={14} className="animate-pulse" /> Global Multiplayer Arena
          </div>
          <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9]">
            Code<span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-indigo-500">_Battles_</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium max-w-lg leading-relaxed">
            Enter the proving grounds. Challenge developers worldwide in real-time logic duels. Climb the Elo ranks and solidify your legacy.
          </p>
          <div className="flex items-center gap-6 pt-4">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-[0_0_30px_rgba(168,85,247,0.4)] active:scale-95"
            >
              <Swords size={18} /> Host Match
            </button>
            <button 
              onClick={handleQuickMatch}
              className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
            >
              <Crosshair size={18} /> Quick Match
            </button>
          </div>
        </div>

        {/* Floating holographic stats card */}
        <div className="relative z-10 w-full lg:w-auto">
           <div className="bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/5" />
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                   <Trophy size={24} />
                </div>
                <div>
                   <p className="text-xs font-black uppercase tracking-widest text-slate-400">Your Elo Rating</p>
                   <p className="text-3xl font-black text-white">1,452</p>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Win Rate</p>
                   <p className="text-lg font-bold text-green-400">68.4%</p>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Matches</p>
                   <p className="text-lg font-bold text-white">42</p>
                </div>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Custom Tabs */}
          <div className="flex gap-2 p-1.5 bg-[#1E293B] rounded-2xl border border-[#334155] w-max">
            <button
              onClick={() => setActiveTab("live")}
              className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === "live" ? "bg-[#0F172A] text-white shadow-lg border border-white/5" : "text-slate-400 hover:text-white"
              )}
            >
              Ongoing Battles
            </button>
            <button
              onClick={() => setActiveTab("rankings")}
              className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === "rankings" ? "bg-[#0F172A] text-white shadow-lg border border-white/5" : "text-slate-400 hover:text-white"
              )}
            >
              Global Rankings
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "live" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Lobbies Waiting for Opponent */}
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Activity className="text-indigo-500" /> Awaiting Challengers ({waitingMatches.length})
                </h3>
                
                {isLoading ? (
                  <div className="grid gap-4">
                    {[1, 2].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
                  </div>
                ) : waitingMatches.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-[#1E293B] rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700">
                    <Shield size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-sm font-bold text-slate-500">No public lobbies open. Host a match to start fighting!</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {waitingMatches.map(match => (
                      <MatchCard key={match.id} match={match} onJoin={handleJoinMatch} />
                    ))}
                  </div>
                )}

                {/* Active Battles */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                    <Swords className="text-red-500" /> Live Duels ({activeMatches.length})
                  </h3>
                  <div className="grid gap-4">
                    {activeMatches.map(match => (
                      <MatchCard key={match.id} match={match} onJoin={handleJoinMatch} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "rankings" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden"
              >
                <table className="w-full text-left">
                   <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                         <th className="px-6 py-4">Rank</th>
                         <th className="px-6 py-4">Player</th>
                         <th className="px-6 py-4 text-center">Win Rate</th>
                         <th className="px-6 py-4 text-right">Elo Rating</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {[
                        { name: "CodeNinja99", rank: 1, winRate: "82%", elo: 2840 },
                        { name: "AlgorithmGod", rank: 2, winRate: "79%", elo: 2710 },
                        { name: "ByteBreaker", rank: 3, winRate: "75%", elo: 2650 },
                        { name: "SyntaxTerror", rank: 4, winRate: "71%", elo: 2480 },
                        { name: "UndefinedIsAFunction", rank: 5, winRate: "68%", elo: 2310 }
                      ].map((player) => (
                        <tr key={player.rank} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                           <td className="px-6 py-4">
                             <div className={cn(
                               "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs",
                               player.rank === 1 ? "bg-amber-400 text-amber-900 shadow-[0_0_15px_#fbbf24]" :
                               player.rank === 2 ? "bg-slate-300 text-slate-800" :
                               player.rank === 3 ? "bg-amber-700 text-white" :
                               "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                             )}>
                               {player.rank}
                             </div>
                           </td>
                           <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{player.name}</td>
                           <td className="px-6 py-4 text-center text-sm font-mono text-slate-600 dark:text-slate-400">{player.winRate}</td>
                           <td className="px-6 py-4 text-right font-black text-indigo-600 dark:text-indigo-400">{player.elo}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-b from-slate-900 to-[#0F172A] rounded-[2rem] p-8 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-10">
                <Cpu size={100} />
             </div>
             <div className="relative z-10">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
                  <Activity size={14} /> Season 4 Progress
                </h3>
                <div className="flex items-end justify-between mb-2">
                   <span className="text-2xl font-black">Diamond III</span>
                   <span className="text-sm font-bold text-slate-400">1452 / 1500 XP</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-6">
                   <div className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 w-[85%]" />
                </div>
                <div className="space-y-3">
                   <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 font-medium">Global Rank</span>
                      <span className="font-bold">#14,021</span>
                   </div>
                   <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 font-medium">Win Streak</span>
                      <span className="font-bold text-yellow-400 flex items-center gap-1"><Flame size={14} /> 4</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Create Match Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 p-8 text-white relative">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Initialize Arena</h2>
              <p className="text-white/80 text-sm font-medium">Configure match parameters</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Select Challenge</label>
                <select 
                  value={selectedProblemId}
                  onChange={(e) => setSelectedProblemId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                >
                  {INITIAL_PROBLEMS.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.difficulty})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Time Limit</label>
                  <input 
                    type="number" 
                    value={matchDuration}
                    onChange={(e) => setMatchDuration(parseInt(e.target.value))}
                    min={5} max={60}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Visibility</label>
                  <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <button 
                      onClick={() => setIsMatchPrivate(false)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all",
                        !isMatchPrivate ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      <Unlock size={14} /> Public
                    </button>
                    <button 
                      onClick={() => setIsMatchPrivate(true)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all",
                        isMatchPrivate ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      <Lock size={14} /> Private
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-4 text-slate-500 font-bold uppercase tracking-wider text-xs hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateMatch}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
                >
                  Deploy Match
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MatchCard({ match, onJoin }: { match: BattleMatch, onJoin: (id: string) => void }) {
  const problem = INITIAL_PROBLEMS.find(p => p.id === match.problemId);
  const isWaiting = match.status === "waiting";

  return (
    <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(79,70,229,0.1)] transition-all group relative overflow-hidden flex items-center justify-between gap-6">
       <div className="flex items-center gap-4 flex-1">
          <div className="relative">
             <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1">
                <img src={match.creatorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.creatorId}`} className="w-full h-full rounded-lg object-cover" />
             </div>
             <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-[#1E293B] rounded-full" />
          </div>
          <div>
             <div className="flex items-center gap-2">
                <h4 className="font-black text-slate-800 dark:text-white group-hover:text-indigo-500 transition-colors">{match.creatorName}</h4>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">Rank S</span>
             </div>
             <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                <span>{problem?.title || "Unknown Problem"}</span>
                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                <span className={cn(
                  "font-bold uppercase text-[10px] tracking-wider",
                  problem?.difficulty === "Easy" ? "text-green-500" : problem?.difficulty === "Medium" ? "text-blue-500" : "text-red-500"
                )}>
                  {problem?.difficulty}
                </span>
             </p>
          </div>
       </div>

       <div className="flex items-center gap-8">
          <div className="hidden sm:flex items-center gap-2 text-slate-500 dark:text-slate-400">
             <Timer size={16} />
             <span className="text-xs font-bold font-mono">{match.durationMs / 60000}m</span>
          </div>

          <button
            onClick={() => onJoin(match.id)}
            disabled={!isWaiting}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all",
              isWaiting
                ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 shadow-lg shadow-indigo-500/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
            )}
          >
            {isWaiting ? "Join Duel" : "Match Full"}
            {isWaiting && <ChevronRight size={14} />}
          </button>
       </div>
       
       {/* Background hover accent */}
       <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}
