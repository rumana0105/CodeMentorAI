import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "./AuthProvider";
import { BattleMatch, Problem } from "../types";
import { INITIAL_PROBLEMS } from "../constants";
import { Swords, Users, Plus, Zap, Trophy, Lock, Unlock, Timer, ChevronRight, Monitor, Network, Activity, Cpu, TrendingUp } from "lucide-react";
import { cn } from "../lib/utils";

export default function Battleground() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<BattleMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState(INITIAL_PROBLEMS[0].id);
  const [isMatchPrivate, setIsMatchPrivate] = useState(false);
  const [matchDuration, setMatchDuration] = useState(15); // minutes

  useEffect(() => {
    // Show only public waiting or active matches
    const q = query(
      collection(db, "matches"), 
      where("isPrivate", "==", false),
      where("status", "in", ["waiting", "active"])
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const matchData = snap.docs.map(d => ({ id: d.id, ...d.data() } as BattleMatch));
      // Sort: waiting matches first, then by creation date
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
      
      const newMatch: Partial<BattleMatch> = {
        problemId: problem.id,
        creatorId: user.uid,
        creatorName: user.displayName || "Anonymous",
        creatorPhoto: user.photoURL || "",
        status: "waiting",
        creatorProgress: 0,
        opponentProgress: 0,
        durationMs: matchDuration * 60 * 1000,
        isPrivate: isMatchPrivate,
        matchCode: matchCode || undefined,
        createdAt: new Date().toISOString()
      };

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

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Tactical Hero Section */}
      <div className="relative overflow-hidden rounded-[3.5rem] bg-slate-900 p-16 text-white shadow-2xl border border-white/5">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
              <Zap size={16} className="text-yellow-400 animate-pulse" />
              Arena_Status: Global_Lobby_Live
            </div>
            <h1 className="text-6xl xl:text-8xl font-black leading-none tracking-tighter uppercase italic">
              Code<span className="text-primary not-italic">_Duels_</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-xl font-medium">
              Initialize real-time combat protocols. Secure your ranking in the global intelligence matrix. High-speed logic required for survival.
            </p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="group relative flex items-center gap-4 px-12 py-6 bg-primary text-white rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all shadow-[0_0_40px_rgba(79,70,229,0.4)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Plus size={24} className="relative z-10 group-hover:rotate-180 transition-transform duration-500" />
            <span className="relative z-10">Initialize_Match</span>
          </button>
        </div>

        {/* Tactical backgrounds */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32" />
        <Network size={600} className="absolute top-[-20%] right-[-10%] text-white/5 rotate-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
               <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                 <Monitor className="text-primary" size={16} />
                 Signal_Intercepts
               </h2>
               <p className="text-2xl font-black text-slate-900 tracking-tight">Active Transmissions</p>
            </div>
            <div className="text-[10px] font-black text-slate-400 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 uppercase tracking-widest">
              {matches.length} SECTORS_DETECTED
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-28 bg-slate-100 rounded-[2rem] animate-pulse border border-slate-200" />
              ))
            ) : matches.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] p-16 text-center group">
                <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl border border-slate-100 flex items-center justify-center mb-6 text-slate-300 group-hover:scale-110 transition-transform">
                  <Users size={40} />
                </div>
                <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase mb-2">No signals detected</h3>
                <p className="text-sm text-slate-500 max-w-sm mb-8 font-medium">Initialize a match sequence to attract potential challengers in the sector.</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="px-8 py-3 bg-white border-2 border-primary text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-lg"
                >
                  Force_Entrance
                </button>
              </div>
            ) : (
              matches.map(match => {
                const problem = INITIAL_PROBLEMS.find(p => p.id === match.problemId);
                return (
                  <div 
                    key={match.id}
                    className="bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:border-primary transition-all group relative overflow-hidden shadow-xl shadow-slate-200/50"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-[1.5rem] border-2 border-slate-50 p-1 shadow-inner bg-slate-50">
                             <img src={match.creatorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.creatorId}`} className="w-full h-full rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full shadow-lg" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                             <h4 className="font-black text-slate-900 group-hover:text-primary transition-colors uppercase tracking-tight text-lg">{match.creatorName}</h4>
                             <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-widest">RANK_S</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                             MISSION: <span className="text-slate-900">{problem?.title || "Unknown"}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-10">
                        <div className="text-center px-6 border-r border-slate-100">
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Duration</p>
                          <div className="flex items-center gap-2 text-slate-900">
                             <Timer size={14} className="text-blue-500" />
                             <span className="text-xs font-black font-mono">{match.durationMs / 60000}_MIN</span>
                          </div>
                        </div>

                        <div className="text-center px-6 border-r border-slate-100">
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Difficulty</p>
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                            problem?.difficulty === "Easy" ? "text-green-500 bg-green-50" :
                            problem?.difficulty === "Medium" ? "text-blue-500 bg-blue-50" :
                                                             "text-red-500 bg-red-50"
                          )}>
                            {problem?.difficulty || "Hard"}
                          </span>
                        </div>

                        <button
                          onClick={() => handleJoinMatch(match.id)}
                          className={cn(
                            "flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all",
                            match.status === "waiting"
                              ? "bg-primary text-white hover:scale-105 shadow-2xl shadow-indigo-500/30"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                          )}
                          disabled={match.status !== "waiting"}
                        >
                          {match.status === "waiting" ? (
                            <>
                              Initialize_Link
                              <ChevronRight size={16} />
                            </>
                          ) : "Link_Full"}
                        </button>
                      </div>
                    </div>
                    {/* Signal effect decors */}
                    <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Strategic Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-10 flex items-center gap-3">
              <Trophy className="text-yellow-400" />
              NEURAL_LEGENDS
            </h3>
            <div className="space-y-6 relative z-10">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black text-white/20 font-mono tracking-tighter">SEC_{i.toString().padStart(2, '0')}</span>
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                        <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=player${i}`} className="w-6 h-6 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-tight group-hover:text-primary transition-colors">User_Agent_0{i}</p>
                      <div className="flex items-center gap-2">
                         <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                         <p className="text-[8px] font-bold text-white/30 font-mono tracking-widest">{2400 - i * 85}_SIG_XP</p>
                      </div>
                    </div>
                  </div>
                  {i === 1 && <Zap size={14} className="text-yellow-400 shadow-[0_0_10px_#facc15]" />}
                </div>
              ))}
            </div>
            {/* Dark tactical decors */}
            <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-primary/10 rounded-full blur-[80px]" />
            <Cpu size={200} className="absolute bottom-[-10%] left-[-20%] text-white/[0.03] -rotate-12" />
          </section>

          <section className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-xl shadow-slate-200/40 relative overflow-hidden">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
              <Activity className="text-indigo-600" />
              Combat_Telemetry
            </h3>
            <div className="grid grid-cols-1 gap-6 relative z-10">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between group">
                <div>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Win_Probability</p>
                   <p className="text-3xl font-black text-slate-900 tracking-tighter">74.2%</p>
                </div>
                <TrendingUp size={24} className="text-green-500 group-hover:animate-bounce" />
              </div>
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between group">
                <div>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Kill_Streak</p>
                   <p className="text-3xl font-black text-slate-900 tracking-tighter">06</p>
                </div>
                <Zap size={24} className="text-yellow-500 fill-yellow-500" />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Create Match Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-8 text-white relative">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Forge a New Arena</h2>
              <p className="text-indigo-100 text-sm opacity-80 font-medium">Configure your duel parameters</p>
              <Swords className="absolute right-8 bottom-[-10px] w-24 h-24 text-white opacity-10" />
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Challenge</label>
                <select 
                  value={selectedProblemId}
                  onChange={(e) => setSelectedProblemId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all"
                >
                  {INITIAL_PROBLEMS.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.difficulty})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time Limit (Min)</label>
                  <input 
                    type="number" 
                    value={matchDuration}
                    onChange={(e) => setMatchDuration(parseInt(e.target.value))}
                    min={5}
                    max={60}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visibility</label>
                  <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                    <button 
                      onClick={() => setIsMatchPrivate(false)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                        !isMatchPrivate ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      <Unlock size={12} />
                      Public
                    </button>
                    <button 
                      onClick={() => setIsMatchPrivate(true)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                        isMatchPrivate ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      <Lock size={12} />
                      Private
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-800 transition-colors"
                >
                  Withdraw
                </button>
                <button 
                  onClick={handleCreateMatch}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
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
