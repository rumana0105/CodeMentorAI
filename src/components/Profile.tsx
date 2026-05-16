import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { 
  Trophy, 
  MapPin, 
  Calendar, 
  Target, 
  Zap, 
  Award, 
  Settings, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  PieChart as PieIcon,
  Brain,
  Code2,
  ChevronRight,
  Flame,
  Globe,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Github,
  ExternalLink,
  GitCommit,
  GitBranch,
  GitPullRequest,
  MessageSquare,
  Plus,
  Unlink,
  FileDown,
  Loader2
} from "lucide-react";
import { cn } from "../lib/utils";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { INITIAL_PROBLEMS } from "../constants";
import { doc, updateDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

export default function Profile() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "settings">("overview");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        window.location.reload();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleGitHubConnect = async () => {
    if (!profile) return;
    try {
      const res = await fetch(`/api/github/auth-url?userId=${profile.userId}`);
      const { url } = await res.json();
      if (url) {
        window.open(url, "github_auth", "width=600,height=700");
      }
    } catch (e) {
      console.error(e);
    }
  };

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
      setDownloadError(error instanceof Error ? error.message : "Failed to download");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!profile) return null;

  const solvedProblems = profile.solvedProblems || [];
  const attempts = profile.attempts || {};
  const badges = profile.badges || [];

  const solvedData = [
    { name: "Easy", value: solvedProblems.filter(id => INITIAL_PROBLEMS.find(p => p.id === id)?.difficulty === "Easy").length, color: "#10B981" },
    { name: "Medium", value: solvedProblems.filter(id => INITIAL_PROBLEMS.find(p => p.id === id)?.difficulty === "Medium").length, color: "#F59E0B" },
    { name: "Hard", value: solvedProblems.filter(id => INITIAL_PROBLEMS.find(p => p.id === id)?.difficulty === "Hard").length, color: "#EF4444" },
  ];

  const totalSolved = solvedProblems.length;
  const accuracy = profile.accuracy || 0;

  const topicCount = INITIAL_PROBLEMS.reduce((acc, p) => {
    if (solvedProblems.includes(p.id)) {
      acc[p.category] = (acc[p.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const strongestTopic = Object.entries(topicCount).sort((a,b) => b[1] - a[1])[0]?.[0] || "Basics";
  
  const failedIDs = Object.entries(attempts)
    .filter(([id]) => !solvedProblems.includes(id))
    .sort((a,b) => b[1] - a[1]);
    
  const weakTopic = failedIDs.length > 0 
    ? INITIAL_PROBLEMS.find(p => p.id === failedIDs[0][0])?.category || "Dynamic Programming"
    : "Dynamic Programming";

  const recommendations = INITIAL_PROBLEMS
    .filter(p => p.category === weakTopic && !solvedProblems.includes(p.id))
    .slice(0, 2);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Profile Section */}
      <div className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-[#E5E7EB] dark:border-[#334155] p-8 shadow-sm transition-colors overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#4F46E5] opacity-[0.03] rounded-full -mr-32 -mt-32" />
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          <div className="relative">
            <div className="w-32 h-32 rounded-[2.5rem] bg-[#F3F4F6] dark:bg-[#334155] border-4 border-white dark:border-[#1E293B] shadow-xl overflow-hidden group">
              <img
                src={profile.photoURL || "https://picsum.photos/seed/user/200/200"}
                alt="Avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Settings className="text-white" size={24} />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[#4F46E5] text-white p-2 rounded-xl shadow-lg border-2 border-white dark:border-[#1E293B]">
              <Trophy size={16} />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A] dark:text-white">
                {profile.displayName}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2 text-sm text-[#6B7280] dark:text-[#94A3B8]">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#4F46E5]" />
                  Joined {new Date(profile.joinDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe size={14} className="text-[#4F46E5]" />
                  Level {profile.level} Mentor
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              {badges.slice(0, 3).map((badge) => (
                <div key={badge.id} className="flex items-center gap-2 bg-[#EEF2FF] dark:bg-[#312E81] text-[#4F46E5] dark:text-[#818CF8] px-3 py-1.5 rounded-xl text-xs font-bold border border-[#C7D2FE] dark:border-[#4338CA]">
                  <span>{badge.icon}</span>
                  {badge.name}
                </div>
              ))}
              {badges.length > 3 && (
                <div className="text-xs font-bold text-[#6B7280] dark:text-[#94A3B8] ml-2">
                  +{badges.length - 3} more
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab("overview")}
              className={cn(
                "px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
                activeTab === "overview" ? "bg-[#4F46E5] text-white shadow-lg shadow-indigo-100 dark:shadow-none" : "hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-[#6B7280] dark:text-[#94A3B8]"
              )}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab("settings")}
              className={cn(
                "px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
                activeTab === "settings" ? "bg-[#4F46E5] text-white shadow-lg shadow-indigo-100 dark:shadow-none" : "hover:bg-[#F3F4F6] dark:hover:bg-[#334155] text-[#6B7280] dark:text-[#94A3B8]"
              )}
            >
              Settings
            </button>
            <button 
              onClick={handleDownloadReport}
              disabled={isDownloading}
              className="px-4 py-2.5 rounded-xl font-bold text-sm transition-all bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
              title="Download Performance Report"
            >
              {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
              <span className="hidden md:inline">Report</span>
            </button>
            {!profile.github && (
              <button 
                onClick={handleGitHubConnect}
                className="px-4 py-2.5 rounded-xl font-bold text-sm transition-all bg-gray-900 text-white hover:bg-black flex items-center gap-2 shadow-lg"
              >
                <Github size={16} />
                <span className="hidden md:inline">Connect GitHub</span>
              </button>
            )}
          </div>
          {downloadError && (
            <div className="mt-2 text-xs text-red-500 font-bold">
              {downloadError}
            </div>
          )}
        </div>
      </div>

      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Stats */}
          <div className="lg:col-span-8 space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Solved" value={totalSolved} icon={CheckCircle2} color="text-green-500" bg="bg-green-50 dark:bg-green-900/10" />
              <StatCard label="Accuracy" value={`${accuracy}%`} icon={Target} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-900/10" />
              <StatCard label="Avg AI Score" value={`${Math.round(profile.authenticityScore || 0)}/100`} icon={ShieldCheck} color="text-indigo-500" bg="bg-indigo-50 dark:bg-indigo-900/10" />
              <StatCard label="XP" value={profile.xp} icon={Zap} color="text-purple-500" bg="bg-purple-50 dark:bg-purple-900/10" />
            </div>

            {/* AI Dependency Trend */}
            <div className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-[#E5E7EB] dark:border-[#334155] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                    <Activity size={20} />
                  </div>
                  <h3 className="font-bold text-[#1A1A1A] dark:text-white">AI Dependency Trend</h3>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                  <LineChart data={profile.aiUsageTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="dependencyScore" 
                      stroke="#4F46E5" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#4F46E5' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-4 text-[10px] text-[#6B7280] dark:text-[#94A3B8] uppercase font-bold tracking-widest text-center">
                Score (0-100): Lower dependency reflects higher original thinking.
              </p>
            </div>

            {/* Difficulty Breakdown */}
            <div className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-[#E5E7EB] dark:border-[#334155] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F59E0B]/10 rounded-xl text-[#F59E0B]">
                    <BarChart3 size={20} />
                  </div>
                  <h3 className="font-bold text-[#1A1A1A] dark:text-white">Difficulty Distribution</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                    <PieChart>
                      <Pie
                        data={solvedData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {solvedData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-6">
                  {solvedData.map((item) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-[#6B7280] dark:text-[#94A3B8]">{item.name}</span>
                        <span className="font-bold text-[#1A1A1A] dark:text-white">{item.value}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-[#334155] rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-1000"
                          style={{ width: `${(item.value / (totalSolved || 1)) * 100}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Career Mentor Advice */}
            <div className="bg-[#4F46E5] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-100 dark:shadow-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.05] rounded-full -mr-20 -mt-20 shrink-0" />
              <div className="flex items-start gap-6 relative z-10">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm">
                  <Brain size={32} />
                </div>
                <div className="space-y-3">
                  <h4 className="text-xl font-black">AI Skill Analysis</h4>
                  <div className="text-indigo-100 leading-relaxed space-y-4">
                    <p className="text-sm font-medium">
                      Based on your recent activity, your strongest performance is in <span className="text-white font-bold underline decoration-white/30 underline-offset-4 decoration-2">{strongestTopic}</span>. However, you've hit some roadblocks with <span className="text-white font-bold underline decoration-white/30 underline-offset-4 decoration-2">{weakTopic}</span>.
                    </p>
                    {recommendations.length > 0 && (
                      <div className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-white mb-2">Recommended Next Steps:</p>
                        <ul className="text-xs space-y-2 opacity-90">
                          {recommendations.map(p => (
                            <li key={p.id} className="flex items-center gap-2">
                              <CheckCircle2 size={14} className="text-white" />
                              Try "{p.title}" to build {weakTopic} intuition
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Skills & Badges */}
          <div className="lg:col-span-4 space-y-8">
            {/* Language Skills */}
            <div className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-[#E5E7EB] dark:border-[#334155] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#4F46E5]/10 rounded-xl text-[#4F46E5]">
                  <Code2 size={20} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] dark:text-white">Language Skills</h3>
              </div>
              <div className="space-y-4">
                <LanguageItem label="Python" solved={15} color="bg-blue-400" />
                <LanguageItem label="Java" solved={8} color="bg-red-400" />
                <LanguageItem label="JavaScript" solved={5} color="bg-yellow-400" />
                <LanguageItem label="C++" solved={2} color="bg-indigo-400" />
              </div>
            </div>

            {/* AI Authenticity Metrics */}
            <div className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-[#E5E7EB] dark:border-[#334155] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] dark:text-white">Solution Authenticity</h3>
              </div>
              
              <div className="flex flex-col items-center text-center p-6 bg-gray-50 dark:bg-gray-900/40 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-800 mb-6">
                <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 mb-1">{Math.round(profile.authenticityScore || 0)}</div>
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-3">Authenticity Score</div>
                
                {/* Badge based on score */}
                <div className={cn(
                  "px-4 py-2 rounded-2xl text-xs font-black shadow-sm flex items-center gap-2",
                  (profile.authenticityScore || 0) >= 85 ? "bg-green-100 text-green-700 border border-green-200" :
                  (profile.authenticityScore || 0) >= 60 ? "bg-yellow-100 text-yellow-700 border border-yellow-200" :
                  "bg-red-100 text-red-700 border border-red-200"
                )}>
                  {(profile.authenticityScore || 0) >= 85 ? <Trophy size={14} /> : <AlertTriangle size={14} />}
                  {(profile.authenticityScore || 0) >= 85 ? "Genuine Solver" : (profile.authenticityScore || 0) >= 60 ? "AI Assisted Learner" : "AI Dependent"}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Hints Taken</span>
                  <span className="font-bold">{profile.aiUsageStats?.totalHintsTaken || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Solutions Unlocked</span>
                  <span className="font-bold">{profile.aiUsageStats?.totalSolutionsViewed || 0}</span>
                </div>
                
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Dependency History</p>
                  <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <div 
                      className="bg-green-500 transition-all duration-500"
                      style={{ width: `${(profile.aiUsageStats?.manualSolutions || 0) / (profile.solvedProblems.length || 1) * 100}%` }}
                      title="Manual"
                    />
                    <div 
                      className="bg-yellow-500 transition-all duration-500"
                      style={{ width: `${(profile.aiUsageStats?.partialAISolutions || 0) / (profile.solvedProblems.length || 1) * 100}%` }}
                      title="Partial AI"
                    />
                    <div 
                      className="bg-red-500 transition-all duration-500"
                      style={{ width: `${(profile.aiUsageStats?.fullAISolutions || 0) / (profile.solvedProblems.length || 1) * 100}%` }}
                      title="Full AI"
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[8px] font-bold text-green-600">MANUAL</span>
                    <span className="text-[8px] font-bold text-yellow-600">PARTIAL</span>
                    <span className="text-[8px] font-bold text-red-600">FULL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* GitHub Portfolio Integration */}
            {profile.github && (
               <div className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-[#E5E7EB] dark:border-[#334155] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-900 rounded-xl text-white">
                      <Github size={20} />
                    </div>
                    <h3 className="font-bold text-[#1A1A1A] dark:text-white">GitHub Portfolio</h3>
                  </div>
                  <a 
                    href={profile.github.profileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800 mb-6">
                  <img 
                    src={profile.github.avatarUrl} 
                    alt="GitHub" 
                    className="w-12 h-12 rounded-xl"
                  />
                  <div>
                    <p className="text-sm font-black text-[#1A1A1A] dark:text-white">@{profile.github.username}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">{profile.github.repoName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-white dark:bg-[#0F172A] rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                    <p className="text-lg font-black text-[#1A1A1A] dark:text-white">{profile.github.totalCommits}</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Total Syncs</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-[#0F172A] rounded-xl border border-gray-100 dark:border-gray-800 text-center text-xs">
                    <p className="font-black text-[#1A1A1A] dark:text-white">Active</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <GitHubCommits userId={profile.userId} />
                  
                  <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Recent Developer Activity</p>
                    <GitHubActivity userId={profile.userId} />
                  </div>
                </div>
              </div>
            )}

            {!profile.github && (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-8 -translate-y-8 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                    <Github size={24} />
                  </div>
                  <h3 className="text-xl font-black mb-2">Sync Your Journey</h3>
                  <p className="text-sm text-indigo-100 mb-6 leading-relaxed">
                    Connect your GitHub to automatically push your solutions, track commits, and showcase your developer portfolio.
                  </p>
                  <button 
                    onClick={handleGitHubConnect}
                    className="w-full bg-white text-indigo-600 font-bold py-3 px-6 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                  >
                    Connect Account
                    <ExternalLink size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Recent Badges */}
            <div className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-[#E5E7EB] dark:border-[#334155] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#FACC15]/10 rounded-xl text-[#FACC15]">
                  <Award size={20} />
                </div>
                <h3 className="font-bold text-[#1A1A1A] dark:text-white">Recent Achievements</h3>
              </div>
              <div className="space-y-4">
                {badges.slice(-4).reverse().map((badge) => (
                  <div key={badge.id} className="flex items-center gap-4 p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#334155] rounded-2xl transition-colors cursor-pointer group border border-transparent hover:border-[#E5E7EB] dark:hover:border-[#334155]">
                    <div className="w-12 h-12 bg-[#F3F4F6] dark:bg-[#1E293B] rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {badge.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1A1A1A] dark:text-white">{badge.name}</p>
                      <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">{new Date(badge.unlockedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {badges.length === 0 && (
                  <p className="text-center text-xs text-[#6B7280] py-4">Solve problems to earn badges!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ProfileSettings profile={profile} onConnect={handleGitHubConnect} />
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E5E7EB] dark:border-[#334155] p-5 shadow-sm transition-all hover:-translate-y-1">
      <div className={cn("inline-flex p-2 rounded-xl mb-3", bg, color)}>
        <Icon size={18} />
      </div>
      <p className="text-xl font-black text-[#1A1A1A] dark:text-white mb-0.5">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8]">{label}</p>
    </div>
  );
}

function LanguageItem({ label, solved, color }: any) {
  return (
    <div className="group cursor-default">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black text-[#1A1A1A] dark:text-white uppercase tracking-tight">{label}</span>
        <span className="text-xs font-bold text-[#6B7280] dark:text-[#94A3B8]">{solved} solved</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-[#334155] rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-1000", color)}
          style={{ width: `${Math.min((solved / 30) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

function ProfileSettings({ profile, onConnect }: { profile: any, onConnect: () => void }) {
  const [preferredLang, setPreferredLang] = useState(profile.preferredLanguage || "python");
  const [hintLevel, setHintLevel] = useState(profile.hintLevel || "medium");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, "users", profile.userId);
      await updateDoc(docRef, {
        preferredLanguage: preferredLang,
        hintLevel: hintLevel
      });
    } catch (error) {
      console.error("Failed to save settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGitHubDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect GitHub?")) return;
    try {
      await fetch("/api/github/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.userId })
      });
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

      useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        window.location.reload();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-[#E5E7EB] dark:border-[#334155] p-8 shadow-sm animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-[#4F46E5]/10 rounded-xl text-[#4F46E5]">
          <Settings size={20} />
        </div>
        <h3 className="font-bold text-xl text-[#1A1A1A] dark:text-white">Platform Settings</h3>
      </div>

      <div className="max-w-2xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-[#6B7280] dark:text-[#94A3B8] mb-2 block">
                Preferred Language
              </label>
              <select 
                value={preferredLang}
                onChange={(e) => setPreferredLang(e.target.value)}
                className="w-full bg-[#F3F4F6] dark:bg-[#0F172A] border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#4F46E5] transition-all font-bold"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="ruby">Ruby</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-[#6B7280] dark:text-[#94A3B8] mb-2 block">
              AI Mentor Hint Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["light", "medium", "deep"].map((level) => (
                <button
                  key={level}
                  onClick={() => setHintLevel(level as any)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-bold border transition-all capitalize",
                    hintLevel === level 
                      ? "bg-[#4F46E5] border-[#4F46E5] text-white shadow-md shadow-indigo-100 dark:shadow-none" 
                      : "bg-[#F3F4F6] dark:bg-[#0F172A] border-transparent text-[#6B7280] dark:text-[#94A3B8] hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
              Deep level provides more detailed algorithmic guidance. Light level only points to syntax.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-[#E5E7EB] dark:border-[#334155] flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#4F46E5] text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-[#4338CA] disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none"
          >
            {isSaving ? "Saving..." : "Save Preferences"}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="mt-12 pt-12 border-t border-[#E5E7EB] dark:border-[#334155]">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-gray-900 rounded-xl text-white">
            <Github size={20} />
          </div>
          <h3 className="font-bold text-xl text-[#1A1A1A] dark:text-white">Developer Integrations</h3>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/40 rounded-3xl p-8 border border-dashed border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm flex items-center justify-center">
              <Github size={32} className="text-gray-900 dark:text-white" />
            </div>
            <div>
              <h4 className="font-black text-lg text-[#1A1A1A] dark:text-white">GitHub Sync</h4>
              <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] max-w-sm">
                Automatically push your problem solutions to a dedicated "codementorai-solutions" repository.
              </p>
              {profile.github?.lastSyncStatus === 'failed' && (
                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl border border-red-100 dark:border-red-900/30">
                  <AlertTriangle size={14} />
                  <span>Last Sync Failed: {profile.github.lastError}</span>
                </div>
              )}
              {profile.github?.lastSyncStatus === 'success' && (
                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-xl border border-green-100 dark:border-green-900/30">
                  <CheckCircle2 size={14} />
                  <span>Repositories up to date and synced.</span>
                </div>
              )}
            </div>
          </div>

          {!profile.github ? (
            <button 
              onClick={onConnect}
              className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-black transition-all flex items-center gap-3 shadow-xl"
            >
              <Github size={20} />
              Connect GitHub
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">Connected as {profile.github.username}</span>
              </div>
              <button 
                onClick={handleGitHubDisconnect}
                className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"
                title="Disconnect GitHub"
              >
                <Unlink size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GitHubActivity({ userId }: { userId: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch(`/api/github/activity?userId=${userId}`);
        const data = await response.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [userId]);

  if (loading) return <div className="space-y-3">
    {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
  </div>;

  if (events.length === 0) return (
    <div className="p-8 text-center bg-gray-50 dark:bg-gray-900/20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
      <Activity size={24} className="mx-auto text-gray-300 mb-2" />
      <p className="text-xs text-gray-400 italic">No recent repository activity found.</p>
    </div>
  );

  const renderEventDetails = (event: any) => {
    const { type, payload } = event;
    const date = new Date(event.created_at).toLocaleDateString();
    const time = new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let icon = <Activity size={14} />;
    let color = "text-gray-500 bg-gray-50 dark:bg-gray-900/20";
    let title = "Unknown Event";
    let description = "";

    switch(type) {
      case 'PushEvent':
        icon = <GitCommit size={14} />;
        color = "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20";
        title = `Pushed ${payload.size} ${payload.size === 1 ? 'commit' : 'commits'}`;
        description = `to ${payload.ref.replace('refs/heads/', '')}`;
        break;
      case 'PullRequestEvent':
        icon = <GitPullRequest size={14} />;
        color = "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20";
        title = `${payload.action.charAt(0).toUpperCase() + payload.action.slice(1)} Pull Request`;
        description = `#${payload.number}: ${payload.pull_request.title}`;
        break;
      case 'IssuesEvent':
        icon = <MessageSquare size={14} />;
        color = "text-orange-500 bg-orange-50 dark:bg-orange-900/20";
        title = `${payload.action.charAt(0).toUpperCase() + payload.action.slice(1)} Issue`;
        description = `#${payload.issue.number}: ${payload.issue.title}`;
        break;
      case 'CreateEvent':
        icon = <Plus size={14} />;
        color = "text-blue-500 bg-blue-50 dark:bg-blue-900/20";
        title = `Created ${payload.ref_type}`;
        description = payload.ref || "New branch/tag";
        break;
      case 'DeleteEvent':
        icon = <Unlink size={14} />;
        color = "text-red-500 bg-red-50 dark:bg-red-900/20";
        title = `Deleted ${payload.ref_type}`;
        description = payload.ref;
        break;
      default:
        title = type.replace('Event', '');
        description = "Action performed in repository";
    }

    return (
      <div key={event.id} className="p-4 bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-100 dark:border-gray-800 flex gap-4 hover:shadow-sm transition-all group">
        <div className={`p-2.5 rounded-xl shrink-0 h-fit ${color}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">{title}</h4>
            <span className="text-[10px] text-gray-400 font-medium">{date}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
            {description}
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/20" />
            <span className="text-[10px] text-gray-400">
              Synced at {time}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {events.map(event => renderEventDetails(event))}
    </div>
  );
}

function GitHubCommits({ userId }: { userId: string }) {
  const [commits, setCommits] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [loading, setLoading] = useState(true);
  const [branchLoading, setBranchLoading] = useState(true);
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [baseBranch, setBaseBranch] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    if (selectedBranch && !baseBranch) {
      setBaseBranch(selectedBranch);
    }
  }, [selectedBranch]);

  const fetchBranches = async () => {
    try {
      const response = await fetch(`/api/github/branches?userId=${userId}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setBranches(data);
        if (!selectedBranch && data.length > 0) {
          const hasMain = data.find(b => b.name === "main");
          setSelectedBranch(hasMain ? "main" : data[0].name);
        }
      }
    } catch (e) {
      console.error("Error fetching branches:", e);
    } finally {
      setBranchLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [userId]);

  useEffect(() => {
    const fetchCommits = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/github/commits?userId=${userId}&branch=${selectedBranch}`);
        const data = await response.json();
        setCommits(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error fetching commits:", e);
      } finally {
        setLoading(false);
      }
    };
    if (selectedBranch) fetchCommits();
  }, [userId, selectedBranch]);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    setCreateLoading(true);
    try {
      const res = await fetch("/api/github/branches/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          branchName: newBranchName.trim(),
          fromBranch: baseBranch || selectedBranch
        })
      });
      if (res.ok) {
        await fetchBranches();
        setSelectedBranch(newBranchName.trim());
        setIsCreatingBranch(false);
        setNewBranchName("");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create branch");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred");
    } finally {
      setCreateLoading(false);
    }
  };

  if (branchLoading) return <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse mb-4" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Repository Syncs</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/40 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-800">
            <GitBranch size={12} className="text-gray-400" />
            <select 
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent border-none text-[10px] font-bold text-gray-600 dark:text-gray-400 focus:ring-0 cursor-pointer outline-none"
            >
              {branches.map(branch => (
                <option key={branch.name} value={branch.name}>{branch.name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => setIsCreatingBranch(!isCreatingBranch)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 transition-colors"
            title="Create New Branch"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {isCreatingBranch && (
        <form onSubmit={handleCreateBranch} className="bg-gray-50 dark:bg-gray-900/40 p-5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 animate-in slide-in-from-top-2 duration-300 space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">New Branch Name</label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="feature/new-implementation"
                className="flex-1 bg-white dark:bg-[#0F172A] border-gray-100 dark:border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Base Branch</label>
            <select 
              value={baseBranch}
              onChange={(e) => setBaseBranch(e.target.value)}
              className="w-full bg-white dark:bg-[#0F172A] border-gray-100 dark:border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              {branches.map(branch => (
                <option key={branch.name} value={branch.name}>{branch.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[10px] text-gray-400 italic">Creating a link to the past...</p>
            <button 
              type="submit"
              disabled={createLoading || !newBranchName.trim()}
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/20"
            >
              {createLoading ? "Creating..." : "Create Branch"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : commits.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-4 text-center">No recent syncs found on this branch.</p>
      ) : (
        <div className="space-y-3">
          {commits.map((commit: any) => (
            <div key={commit.sha} className="p-4 bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all group">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <img 
                    src={commit.author?.avatar_url || "https://github.com/identicons/default.png"} 
                    alt="Author" 
                    className="w-6 h-6 rounded-lg ring-2 ring-white dark:ring-gray-800"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-500 transition-colors">
                    {commit.commit.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-medium text-gray-400">
                      {commit.commit.author.name}
                    </span>
                    <span className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
                    <span className="text-[10px] text-gray-400">
                      {new Date(commit.commit.author.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionHistory({ userId }: { userId: string }) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, "submissions"),
          where("userId", "==", userId),
          orderBy("timestamp", "desc")
        );
        const snap = await getDocs(q);
        setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Failed to fetch history", e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [userId]);

  if (loading) return (
    <div className="flex justify-center p-12">
      <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
    </div>
  );

  if (submissions.length === 0) return (
    <div className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-[#E5E7EB] dark:border-[#334155] p-12 text-center text-slate-500">
      No submissions found. Start coding!
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-[#E5E7EB] dark:border-[#334155] p-8 shadow-sm">
      <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-800 dark:text-white">
        <Activity className="text-indigo-500" /> Granular Submission History
      </h3>
      <div className="space-y-4">
        {submissions.map(sub => (
          <div key={sub.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                  sub.status === "accepted" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                )}>
                  {sub.status === "accepted" ? "Accepted" : "Failed"}
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-white">
                  Problem {sub.problemId}
                </span>
              </div>
              <div className="text-xs text-slate-500 flex gap-4">
                <span>{new Date(sub.timestamp).toLocaleString()}</span>
                <span>• {sub.language}</span>
                {sub.timeSpentMs && <span>• {Math.round(sub.timeSpentMs / 60000)} mins</span>}
              </div>
            </div>
            
            <div className="flex gap-4 items-center">
              {sub.aiDependencyScore !== undefined && (
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AI Dependency</div>
                  <div className={cn("text-sm font-black", sub.aiDependencyScore < 30 ? "text-green-500" : sub.aiDependencyScore > 70 ? "text-red-500" : "text-yellow-500")}>
                    {Math.round(sub.aiDependencyScore)}%
                  </div>
                </div>
              )}
              {sub.hintsTaken !== undefined && (
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Hints</div>
                  <div className="text-sm font-black text-slate-700 dark:text-slate-300">{sub.hintsTaken}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
