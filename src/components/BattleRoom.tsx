import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc, getDoc, increment } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "./AuthProvider";
import { BattleMatch, Problem, ExecutionResult } from "../types";
import { INITIAL_PROBLEMS } from "../constants";
import CodeEditor from "./CodeEditor";
import ExecutionResults from "./ExecutionResults";
import { Swords, Trophy, Timer, ChevronLeft, Zap, Target, Users, AlertCircle, CheckCircle2, Play, Monitor, Network } from "lucide-react";
import { cn } from "../lib/utils";
import confetti from "canvas-confetti";

export default function BattleRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [match, setMatch] = useState<BattleMatch | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isMatchEnded, setIsMatchEnded] = useState(false);

  useEffect(() => {
    if (!id || !user) return;

    const unsubscribe = onSnapshot(doc(db, "matches", id), (snap) => {
      if (snap.exists()) {
        const matchData = { id: snap.id, ...snap.data() } as BattleMatch;
        setMatch(matchData);
        
        const prob = INITIAL_PROBLEMS.find(p => p.id === matchData.problemId);
        if (prob) {
          setProblem(prob);
          setCode(prob.starterCode[language] || "");
        }

        // Handle Winner
        if (matchData.status === "completed" && !isMatchEnded) {
          setIsMatchEnded(true);
          if (matchData.winnerId === user.uid) {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          }
        }
      } else {
        navigate("/battleground");
      }
    });

    return () => unsubscribe();
  }, [id, user]);

  useEffect(() => {
    if (!match || match.status !== "active" || isMatchEnded) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(match.startTime!).getTime();
      const end = start + match.durationMs;
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft(0);
        handleEndMatch(null); // Timeout
        clearInterval(timer);
      } else {
        setTimeLeft(Math.floor(diff / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [match, isMatchEnded]);

  const handleEndMatch = async (winnerId: string | null) => {
    if (!id || isMatchEnded) return;
    setIsMatchEnded(true);
    await updateDoc(doc(db, "matches", id), {
      status: "completed",
      winnerId: winnerId || undefined
    });
  };

  const handleRun = async () => {
    if (!problem || !match || isMatchEnded) return;
    setIsExecuting(true);
    
    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code,
          language,
          testCases: problem.testCases,
        }),
      });
      const data = await response.json();
      setResults(data.results);
      
      const passedCount = data.results.filter((r: any) => r.passed).length;
      const progress = Math.round((passedCount / problem.testCases.length) * 100);
      
      // Update progress in Firestore
      const updateData: any = {};
      if (match.creatorId === user?.uid) {
        updateData.creatorProgress = progress;
      } else {
        updateData.opponentProgress = progress;
      }

      // Check if won
      if (progress === 100 && !match.winnerId) {
        updateData.status = "completed";
        updateData.winnerId = user?.uid;
      }

      await updateDoc(doc(db, "matches", match.id), updateData);
    } catch (error) {
      console.error("Execution failed:", error);
    } finally {
      setIsExecuting(false);
    }
  };

  if (!match || !problem) return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Initializing Arena...</div>;

  const isCreator = match.creatorId === user?.uid;
  const userProgress = isCreator ? match.creatorProgress : match.opponentProgress;
  const opponentProgress = isCreator ? match.opponentProgress : match.creatorProgress;
  const opponentName = isCreator ? (match.opponentName || "Waiting for Challenger...") : match.creatorName;
  const opponentPhoto = isCreator ? match.opponentPhoto : match.creatorPhoto;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] -mt-8 -mx-8 bg-slate-950">
      {/* High-Intensity Battle Header */}
      <div className="bg-black/40 backdrop-blur-xl text-white p-6 border-b border-white/5 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => navigate("/battleground")}
              className="p-3 hover:bg-white/10 rounded-2xl transition-colors border border-white/5 shadow-inner"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                 <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500">LIVE_CIRCUIT_DUEL</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black tracking-tighter leading-none">{problem.title}</span>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
                   <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{problem.difficulty}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center bg-white/5 border border-white/10 rounded-[2rem] px-12 py-4 gap-16 relative overflow-hidden shadow-2xl">
             <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40 mb-2">TELEMETRY_CLOCK</span>
                <span className={cn(
                  "text-4xl font-black tabular-nums transition-all font-mono",
                  timeLeft < 60 ? "text-red-500 animate-pulse scale-110" : "text-white"
                )}>
                  {formatTime(timeLeft)}
                </span>
             </div>
             
             <div className="h-12 w-px bg-white/10" />

             <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                   <span className="text-sm font-black tracking-tight">{user?.displayName?.toUpperCase()}</span>
                   <span className="text-[9px] font-black text-indigo-400 tracking-widest">HOST_PROTOCOL</span>
                </div>
                <div className="relative group">
                   <div className="w-14 h-14 rounded-2xl border-2 border-indigo-500/50 p-1 group-hover:scale-105 transition-transform">
                      <img src={user?.photoURL || ""} className="w-full h-full object-cover rounded-xl grayscale hover:grayscale-0 transition-all" />
                   </div>
                   <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-black rounded-full" />
                </div>
                
                <div className="flex flex-col items-center gap-1 mx-4">
                   <Swords className="text-white/10" size={32} />
                   <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">vs</div>
                </div>

                <div className="relative group">
                   <div className="w-14 h-14 rounded-2xl border-2 border-red-500/50 p-1 bg-slate-900 group-hover:scale-105 transition-transform flex items-center justify-center">
                      {opponentPhoto ? <img src={opponentPhoto} className="w-full h-full object-cover rounded-xl" /> : <Users className="text-white/20" size={32} />}
                   </div>
                   <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 border-4 border-black rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                </div>
                <div className="flex flex-col items-start">
                   <span className="text-sm font-black tracking-tight truncate max-w-[120px]">{opponentName?.toUpperCase()}</span>
                   <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">INVADER_X</span>
                </div>
             </div>
          </div>

          <div className="w-64 flex flex-col items-end gap-2">
             <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                <Monitor size={14} className="text-blue-400" />
                <span className="text-[9px] font-mono text-slate-400">STREAMING_UPLINK_READY</span>
             </div>
             <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                <Network size={14} className="text-purple-400" />
                <span className="text-[9px] font-mono text-slate-400">LATENCY: 12ms</span>
             </div>
          </div>
        </div>
        
        {/* Hardware-spec grid background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #4F46E5 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      </div>

      {/* Duel Visualization Bar - High Tech */}
      <div className="flex h-4 bg-black relative">
         <div 
           className="h-full bg-gradient-to-l from-indigo-500 to-indigo-700 transition-all duration-1000 ease-out relative shadow-[0_0_20px_rgba(79,70,229,0.3)] shadow-inner"
           style={{ width: `${userProgress}%` }}
         >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] animate-shimmer" />
         </div>
         <div className="w-1 bg-white z-10 shadow-[0_0_10px_#fff]" />
         <div 
           className="h-full bg-gradient-to-r from-red-500 to-red-700 transition-all duration-1000 ease-out relative shadow-[0_0_20px_rgba(239,68,68,0.3)]"
           style={{ width: `${opponentProgress}%` }}
         >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] animate-shimmer" />
         </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Problem Description */}
        <div className="w-1/3 border-r border-slate-200 overflow-y-auto bg-slate-50 p-8 custom-scrollbar">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 uppercase tracking-widest text-[10px] font-black text-slate-400">
              Description
            </div>
            {isCreator ? (
               <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm border border-indigo-100 uppercase tracking-widest text-[10px] font-black">
                 Creator
               </div>
            ) : (
              <div className="p-2 bg-red-50 text-red-600 rounded-xl shadow-sm border border-red-100 uppercase tracking-widest text-[10px] font-black">
                 Challenger
               </div>
            )}
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4">{problem.title}</h3>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 font-medium leading-relaxed mb-6">{problem.description}</p>
            
            <div className="space-y-6">
              <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <Target size={14} className="text-indigo-400" />
                  Constraints
                </h4>
                <p className="text-sm font-mono text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">{problem.constraints}</p>
              </section>

              <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <Zap size={14} className="text-yellow-400" />
                  Input Format
                </h4>
                <p className="text-sm text-slate-700">{problem.inputFormat}</p>
              </section>

              <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                   <Target size={14} className="text-green-400" />
                  Output Format
                </h4>
                <p className="text-sm text-slate-700">{problem.outputFormat}</p>
              </section>
            </div>
          </div>
        </div>

        {/* Coding Area */}
        <div className="flex-1 flex flex-col bg-slate-50">
           <div className="flex-1 flex flex-col p-4 gap-4">
              <div className="flex-1 bg-[#1E293B] rounded-3xl overflow-hidden shadow-2xl relative">
                  <CodeEditor 
                    code={code}
                    language={language}
                    onChange={setCode}
                  />
                  <div className="absolute top-4 right-4 z-10">
                      <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-slate-900/50 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg focus:outline-none"
                      >
                        {problem.languages.map(lang => (
                          <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                        ))}
                      </select>
                  </div>
              </div>

              <div className="h-1/3 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                         <Play size={14} className="text-green-500" />
                         Results_Log
                      </h4>
                      <div className="flex items-center gap-4">
                         <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Passed: <span className="text-slate-900">{results.filter(r => r.passed).length} / {problem.testCases.length}</span>
                         </div>
                         <button 
                            onClick={handleRun}
                            disabled={isExecuting || isMatchEnded}
                            className={cn(
                              "flex items-center gap-2 px-10 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all",
                              isMatchEnded 
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95"
                            )}
                         >
                            {isExecuting ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                               <>
                                 <Zap size={14} className="text-yellow-400" />
                                 Execute_Test
                               </>
                            )}
                         </button>
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                     {results.length > 0 ? (
                        <ExecutionResults results={results} isLoading={isExecuting} language={language} />
                     ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                           <Zap size={40} className="opacity-20 translate-y-2 animate-bounce" />
                           <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Awaiting Script Execution...</p>
                        </div>
                     )}
                  </div>
              </div>
           </div>
        </div>
      </div>

      {/* Match Result Overlay */}
      {isMatchEnded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-500">
           <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 ring-8 ring-indigo-500/10">
              <div className={cn(
                "p-12 text-center relative",
                match.winnerId === user?.uid ? "bg-indigo-600 text-white" : "bg-red-50 text-red-900"
              )}>
                 {match.winnerId === user?.uid ? (
                    <>
                      <div className="absolute top-[-10%] left-[-10%] w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl animate-pulse" />
                      <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 drop-shadow-lg" />
                      <h2 className="text-5xl font-black uppercase tracking-tighter mb-2 italic">VICTORY</h2>
                      <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs opacity-70">You dominated the arena!</p>
                    </>
                 ) : (
                    <>
                      <AlertCircle className="w-24 h-24 text-red-400 mx-auto mb-6" />
                      <h2 className="text-5xl font-black uppercase tracking-tighter mb-2 italic text-red-600">DEFEAT</h2>
                      <p className="text-red-600/60 font-bold uppercase tracking-widest text-xs">Better luck next time, warrior.</p>
                    </>
                 )}
              </div>
              
              <div className="p-10 space-y-8">
                 <div className="grid grid-cols-2 gap-px bg-slate-100 rounded-3xl overflow-hidden border border-slate-100">
                    <div className="bg-white p-6 text-center">
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Final Progress</p>
                       <p className="text-3xl font-black text-slate-900">{userProgress}%</p>
                    </div>
                    <div className="bg-white p-6 text-center border-l border-slate-50">
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Opponent</p>
                       <p className="text-3xl font-black text-slate-900">{opponentProgress}%</p>
                    </div>
                 </div>

                 <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => navigate("/battleground")}
                      className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
                    >
                      Return to Lobby
                    </button>
                    <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">Post-match analytics updated</p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
