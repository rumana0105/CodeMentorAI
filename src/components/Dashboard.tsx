import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { INITIAL_PROBLEMS } from "../constants";
import ProblemCard from "./ProblemCard";
import RoadmapView from "./RoadmapView";
import { Trophy, Target, Zap, TrendingUp, Award, Brain, Activity, Layers, Search, Cpu, ArrowRight, Clock, BarChart3, AlertTriangle, Monitor, Code2, Terminal, Network, ShieldCheck, LayoutDashboard, Github, FileDown, Loader2, Flame } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from "recharts";
import { cn } from "../lib/utils";
import { getLeaderboard } from "../services/forum";
import { getRecommendedProblems } from "../services/gemini";
import { useAuth } from "./AuthProvider";
import { getUserProgress } from "../services/db";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { Problem, UserProgress } from "../types";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("All");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [recommendations, setRecommendations] = useState<{ problemId: string; reason: string; focusTopic: string; mastery: number }[]>([]);
  const [isRecLoading, setIsRecLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadReport = async () => {
    if (!user) return;
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/report/download?userId=${user.uid}`);
      if (!response.ok) throw new Error("Failed to download");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CodeMentorAI_Report_${user.displayName?.replace(/\s+/g, '_') || 'Profile'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setDownloadError(error instanceof Error ? error.message : "Failed to download report.");
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getLeaderboard().then(setLeaderboard);
      getUserProgress(user.uid).then(setProgress);
    }

    // Fetch problems from Firestore
    getDocs(collection(db, "problems"))
      .then(snap => {
        const dbProblems = snap.docs.map(d => ({ id: d.id, ...d.data() } as Problem));
        // Fallback to INITIAL_PROBLEMS if DB is empty
        const allProbs = dbProblems.length > 0 ? dbProblems : INITIAL_PROBLEMS;
        setProblems(allProbs);
      })
      .catch(error => {
        console.error("Failed to fetch problems from Firestore:", error);
        // Fallback to INITIAL_PROBLEMS on error
        setProblems(INITIAL_PROBLEMS);
      });
  }, [user]);

  useEffect(() => {
    if (progress && problems.length > 0 && recommendations.length === 0 && !isRecLoading) {
      setIsRecLoading(true);
      getRecommendedProblems(progress, problems)
        .then(setRecommendations)
        .finally(() => setIsRecLoading(false));
    }
  }, [progress, problems]);

  const filteredProblems = problems.filter(p =>
    difficultyFilter === "All" || p.difficulty === difficultyFilter
  );

  const solvedProblems = progress?.solvedProblems ?? [];

  const handleContinueLearning = () => {
    if (problems.length === 0) return;
    const nextProblem = problems.find(p => !solvedProblems.includes(p.id)) || problems[0];
    if (nextProblem) {
      navigate(`/problem/${nextProblem.id}`);
    }
  };

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const aiUsageData = [
    { name: 'Manual', value: progress?.aiUsageStats?.manualSolutions || 0 },
    { name: 'Partial AI', value: progress?.aiUsageStats?.partialAISolutions || 0 },
    { name: 'Full AI', value: progress?.aiUsageStats?.fullAISolutions || 0 },
  ];

  const topicData = Object.entries(progress?.topicStats || {}).map(([name, value]) => ({ name, value }));

  const avgTimePerProblem = progress?.globalTimeSpentMs && progress?.solvedProblems.length
    ? Math.round(progress.globalTimeSpentMs / progress.solvedProblems.length / 60000)
    : 0;

  return (
    <div className="space-y-16 pb-24">
      {/* SaaS Style Hero Section */}
      <section className="relative min-h-[500px] flex items-center rounded-[3rem] overflow-hidden bg-[#1f2833] border border-white/10 shadow-2xl shadow-[#bc13fe]/20 group transition-colors duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(188,19,254,0.08)_0%,transparent_50%)]" />
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
          <Network size={400} className="text-primary rotate-12" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 w-full relative z-10">
          <div className="p-12 lg:p-20 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                <ShieldCheck size={14} />
                Adaptive_Learning_Live
              </div>
              <h1 className="text-6xl xl:text-8xl font-black tracking-tighter leading-[0.85] text-slate-900 dark:text-white">
                CODE<span className="text-primary">MENTOR</span><br />
                <span className="text-slate-400 dark:text-slate-600">EVOLVED</span>
              </h1>
            </div>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed font-medium">
              Welcome back, <span className="text-slate-900 dark:text-white font-bold">{user?.displayName?.split(' ')[0]}</span>. Your cognitive efficiency is up <span className="text-green-500 font-bold">14.2%</span> this session.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={handleContinueLearning}
                className="bg-primary text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/40 hover:-translate-y-1 active:scale-95"
              >
                Continue Pathway
              </button>
              <button
                onClick={() => navigate('/battleground')}
                className="bg-[#0b0c10] text-[#45f3ff] border border-white/10 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#1f2833] transition-all flex items-center gap-3 shadow-[0_0_15px_rgba(69,243,255,0.2)]"
              >
                <Zap size={18} className="text-yellow-500" />
                Enter Battleground
              </button>
              <button
                onClick={handleDownloadReport}
                disabled={isDownloading}
                className="bg-[#0b0c10]/50 text-gray-400 border border-white/5 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:text-white hover:bg-[#1f2833] transition-all flex items-center gap-3 disabled:opacity-50"
              >
                {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
                Download Report
              </button>
            </div>
            {downloadError && (
              <div className="mt-3 text-xs text-red-500 font-bold">
                {downloadError}
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center justify-center p-20 relative">
            <div className="relative w-full max-w-md aspect-square bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-inner group-hover:rotate-1 transition-transform duration-700">
              <div className="absolute top-12 left-12 w-24 h-24 bg-primary/10 rounded-3xl blur-2xl animate-pulse" />
              <div className="absolute bottom-12 right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-700" />

              <div className="relative flex flex-col items-center">
                <div className="w-24 h-24 bg-[#0b0c10] rounded-3xl shadow-2xl border border-[#45f3ff]/30 flex items-center justify-center mb-6 transform -rotate-6 shadow-[0_0_20px_rgba(69,243,255,0.3)]">
                  <Code2 size={40} className="text-[#45f3ff]" />
                </div>
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-[#0b0c10] rounded-2xl shadow-xl border border-[#bc13fe]/30 flex items-center justify-center transform rotate-12 shadow-[0_0_15px_rgba(188,19,254,0.2)]">
                    <Terminal size={24} className="text-[#bc13fe]" />
                  </div>
                  <div className="w-16 h-16 bg-[#0b0c10] rounded-2xl shadow-xl border border-white/10 flex items-center justify-center transform -rotate-3 translate-y-4">
                    <Monitor size={24} className="text-gray-400" />
                  </div>
                </div>
                <div className="mt-12 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Core_Neural_Matrix</p>
                  <p className="text-xs font-mono text-slate-500 opacity-60">v4.2.0-STABLE_OAK</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid of Micro Stats */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <StatCard icon={Trophy} label="Mastered" value={progress?.solvedProblems.length.toString() || "0"} color="text-yellow-500" bg="bg-[#1f2833] border-white/10 shadow-sm" />
        <StatCard icon={Flame} label="Streak" value={`${progress?.streak || 0} Days`} color="text-[#ff007f]" bg="bg-[#1f2833] border-white/10 shadow-sm" />
        <StatCard icon={Target} label="Logic Accuracy" value={(progress?.accuracy || 0) + "%"} color="text-green-500" bg="bg-[#1f2833] border-white/10 shadow-sm" />
        <StatCard icon={Clock} label="Avg_Clock_Time" value={avgTimePerProblem + "m"} color="text-[#45f3ff]" bg="bg-[#1f2833] border-white/10 shadow-sm" />
        <StatCard
          icon={Github}
          label="Portfolio_Syncs"
          value={progress?.github?.totalCommits.toString() || "0"}
          color="text-white"
          bg="bg-[#1f2833] border-white/10 shadow-sm"
          onClick={() => navigate('/profile')}
        />
      </section>

      {/* AI Roadmap Integration */}
      <section className="pt-8">
        <RoadmapView currentRoadmapId={progress?.currentRoadmapId} />
      </section>

      {/* AI Recommendations HERO - Ultra Prominent */}
      {(recommendations.length > 0 || isRecLoading) && (
        <section className="bg-[#1f2833] rounded-[3.5rem] p-12 relative overflow-hidden shadow-[0_0_40px_rgba(188,19,254,0.15)] text-white border border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_0%,rgba(188,19,254,0.15)_0%,transparent_70%)]" />
          <div className="absolute bottom-0 right-0 p-20 opacity-[0.05] pointer-events-none">
            <Brain size={400} />
          </div>

          <div className="relative z-10 flex flex-col xl:flex-row gap-12">
            <div className="flex-1 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40">
                    <Brain size={24} />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Neural Recommendation Engine</h3>
                    <p className="text-3xl font-black tracking-tight leading-none">Diagnostic focus for <span className="text-primary">Mastery</span></p>
                  </div>
                </div>
                <p className="text-slate-400 max-w-lg text-sm leading-relaxed">
                  Our models have detected slight interference in specific logical sectors. Tackle these targets to bridge the knowledge gap.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {isRecLoading ? (
                  [1, 2, 3].map(i => <div key={i} className="h-44 bg-slate-800 rounded-3xl animate-pulse" />)
                ) : (
                  recommendations.map((rec) => {
                    const prob = problems.find(p => p.id === rec.problemId);
                    if (!prob) return null;
                    return (
                      <div
                        key={rec.problemId}
                        onClick={() => navigate(`/problem/${rec.problemId}`)}
                        className="bg-[#0b0c10]/50 backdrop-blur-md border border-white/5 p-6 rounded-[2.5rem] hover:bg-[#0b0c10] transition-all cursor-pointer group hover:-translate-y-2 border-b-4 border-b-transparent hover:border-b-primary shadow-lg"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
                            prob.difficulty === "Easy" ? "bg-green-500/10 text-green-400" :
                              prob.difficulty === "Medium" ? "bg-blue-500/10 text-blue-400" :
                                "bg-red-500/10 text-red-400"
                          )}>
                            {prob.difficulty}
                          </span>
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary transition-colors">
                            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                        <h4 className="text-base font-black mb-1 line-clamp-1">{prob.title}</h4>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Focus:</span>
                          <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">{rec.focusTopic}</span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] text-slate-400 leading-snug line-clamp-2 italic font-serif">"{rec.reason}"</p>
                          <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${rec.mastery}%` }} />
                          </div>
                          <div className="flex justify-between items-center text-[8px] font-black uppercase opacity-60">
                            <span>Mastery</span>
                            <span>{rec.mastery}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="xl:w-80 bg-white/5 rounded-[2.5rem] p-10 flex flex-col justify-between border border-white/5 relative group/card">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <LayoutDashboard size={100} />
              </div>
              <div className="space-y-8 relative z-10">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Proficiency</p>
                  <div className="flex items-end gap-2">
                    <span className="text-6xl font-black tracking-tighter leading-none">{progress?.accuracy || 0}%</span>
                    <TrendingUp className="text-green-500 mb-2 animate-bounce" size={24} />
                  </div>
                </div>
                <div className="h-px bg-white/10" />
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Neural Weakpoint</p>
                    <div className="inline-flex items-center gap-2 text-red-400 font-black uppercase tracking-widest text-xs bg-red-400/10 px-3 py-1.5 rounded-xl border border-red-400/20">
                      <AlertTriangle size={14} />
                      {recommendations[0]?.focusTopic || "N/A"}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Mental Authenticity</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${progress?.authenticityScore || 100}%` }} />
                      </div>
                      <span className="text-[10px] font-black">{progress?.authenticityScore || 100}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/curriculum')}
                className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-colors mt-12 shadow-xl"
              >
                Sync Road_Map
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Intelligence Trends & Problems */}
        <div className="lg:col-span-8 space-y-12">
          {/* Trends Dashboard */}
          <section className="bg-[#1f2833] rounded-[3rem] border border-white/10 p-8 lg:p-12 shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2">
                  <Activity size={16} className="text-primary" />
                  COG_METRIC_ANALYTICS_VIBRANCY
                </h3>
                <p className="text-2xl font-black tracking-tight text-white">Performance Entropy</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-black text-slate-400 uppercase">Mental_Load</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase">AI_Assistance</span>
                </div>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={progress?.aiUsageTrends || []}>
                  <defs>
                    <linearGradient id="colorHints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDependency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.05} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.15} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "bold", fill: "#64748b" }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ borderRadius: "24px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "#0b0c10", color: "#fff", fontSize: "10px", fontWeight: "bold", padding: "16px" }}
                    cursor={{ stroke: "#bc13fe", strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="hints" stroke="#bc13fe" strokeWidth={5} fillOpacity={1} fill="url(#colorHints)" name="Cognitive Load" />
                  <Area type="monotone" dataKey="dependencyScore" stroke="#ff007f" strokeWidth={2} strokeDasharray="8 8" fillOpacity={1} fill="url(#colorDependency)" name="AI Dependency" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Problem Feed */}
          <section className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Mission_Directive</h3>
                <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Active Neural Pathways</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-[1.25rem] border border-slate-200 dark:border-slate-800">
                {["All", "Easy", "Medium", "Hard"].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      difficultyFilter === diff
                        ? "bg-[#0b0c10] text-[#45f3ff] shadow-[0_0_10px_rgba(69,243,255,0.2)] border border-white/5"
                        : "text-gray-500 hover:text-white"
                    )}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredProblems.map((problem) => {
                const isLocked = problem.unlockedBy && !solvedProblems.includes(problem.unlockedBy);
                return <ProblemCard key={problem.id} problem={problem} isLocked={!!isLocked} />;
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Global Meta & Performance */}
        <div className="lg:col-span-4 space-y-12">
          {/* Categorical Radar */}
          <section className="bg-[#1f2833] rounded-[3rem] border border-white/10 p-10 shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-colors">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-10 flex items-center gap-2">
              <BarChart3 size={16} className="text-[#45f3ff]" />
              TOPIC_SATURATION
            </h3>
            {topicData.length > 0 ? (
              <div className="h-80 w-full -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9, fontWeight: "bold", fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "#0b0c10", color: "#fff", fontSize: "10px", padding: "12px" }}
                      cursor={{ fill: '#bc13fe', opacity: 0.1 }}
                    />
                    <Bar dataKey="value" fill="#bc13fe" radius={[0, 10, 10, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                <AlertTriangle size={32} className="text-slate-300" />
                <p className="text-[9px] font-black text-slate-400 leading-relaxed uppercase tracking-widest">No sector data available. Initiate problem sequences to bridge telemetry.</p>
              </div>
            )}
          </section>

          {/* Intelligence Split */}
          <section className="bg-[#1f2833] rounded-[3rem] border border-white/10 p-10 shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-colors">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-10 flex items-center gap-2">
              <Brain size={16} className="text-primary" />
              INTELLIGENCE_QUOTIENT_SPLIT
            </h3>
            <div className="h-56 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aiUsageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {aiUsageData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black">{Math.round((1 - (progress?.authenticityScore || 100) / 100) * 100)}%</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">AI Matrix</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6 mt-10">
              {aiUsageData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{entry.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Global Terminal Rankings */}
          <section className="bg-[#1f2833] rounded-[3rem] p-10 shadow-[0_0_40px_rgba(188,19,254,0.15)] text-white relative overflow-hidden border border-white/10">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Trophy size={120} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#45f3ff] mb-10 flex items-center gap-2 relative z-10">
              <Award size={18} />
              SYSTEM_LEADERBOARD_TERMINAL
            </h3>
            <div className="space-y-8 relative z-10">
              {leaderboard.slice(0, 5).map((user, i) => (
                <div key={user.userId} className="flex items-center justify-between group">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "text-[10px] font-black w-8 h-8 flex items-center justify-center rounded-xl",
                      i === 0 ? "bg-primary text-white shadow-lg shadow-indigo-500/40" : "bg-white/5 text-slate-500"
                    )}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-black text-sm text-white group-hover:text-primary transition-colors leading-none mb-1">{user.displayName || "Anonymous"}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">{user.xp} XP_DATA_PACKETS</p>
                    </div>
                  </div>
                  {i === 0 && <Zap size={14} className="text-yellow-400 animate-pulse" />}
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/forum')}
              className="w-full py-4 mt-12 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-slate-400 rounded-2xl border border-white/5 transition-colors"
            >
              Connect_Global_Relay
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-8 rounded-[2.5rem] border transition-all hover:-translate-y-1 group",
        bg,
        onClick ? "cursor-pointer hover:border-primary/30" : "cursor-default"
      )}
    >
      <div className="flex items-center justify-between mb-8">
        <div className={cn("p-3 rounded-2xl bg-[#0b0c10] shadow-sm border border-white/5", color)}>
          <Icon size={20} />
        </div>
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2 truncate">{label}</p>
        <p className="text-4xl font-black text-white leading-none tracking-tighter">{value}</p>
      </div>
    </div>
  );
}
