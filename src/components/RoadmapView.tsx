import React, { useState, useEffect } from "react";
import { generateRoadmap } from "../services/gemini";
import { saveRoadmap, loadRoadmap } from "../services/db";
import { Roadmap, RoadmapNode } from "../types";
import { useAuth } from "./AuthProvider";
import { Brain, Sparkles, CheckCircle2, Lock, ArrowRight, Loader2, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

export default function RoadmapView({ currentRoadmapId }: { currentRoadmapId?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Wizard state
  const [language, setLanguage] = useState("Python");
  const [domain, setDomain] = useState("Backend Development");
  const [level, setLevel] = useState("Beginner");
  const [goal, setGoal] = useState("Land a junior role");

  useEffect(() => {
    if (user && currentRoadmapId) {
      setIsLoading(true);
      loadRoadmap(user.uid, currentRoadmapId).then((r) => {
        setRoadmap(r);
        setIsLoading(false);
      });
    }
  }, [user, currentRoadmapId]);

  const handleGenerate = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      const generated = await generateRoadmap(language, domain, level, goal);
      const newRoadmap: Roadmap = {
        id: `rm_${Date.now()}`,
        userId: user.uid,
        language,
        domain,
        level,
        goal,
        phases: generated.phases.map((p: any, i: number) => ({
          id: `phase_${i}`,
          title: p.title,
          nodes: p.nodes.map((n: any, j: number) => ({
            id: `node_${i}_${j}`,
            title: n.title,
            description: n.description,
            type: n.type,
            status: i === 0 && j === 0 ? "unlocked" : "locked",
            dependencies: n.dependencies || []
          }))
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activeNodeId: "node_0_0"
      };
      await saveRoadmap(user.uid, newRoadmap);
      setRoadmap(newRoadmap);
    } catch (error) {
      console.error(error);
      alert("Failed to generate roadmap.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNodeClick = (node: RoadmapNode) => {
    if (node.status === "locked") return;
    // In a real app, this would dynamically generate a problem if it doesn't exist.
    // For now, redirect to a dynamic practice session or just a placeholder problem.
    // We'll pass the topic in query state to let ProblemView know to generate it.
    navigate(`/problem/dynamic?topic=${encodeURIComponent(node.title)}&difficulty=${level}&language=${language}&nodeId=${node.id}`);
  };

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-slate-800 rounded-3xl" />;
  }

  if (!roadmap) {
    return (
      <div className="bg-slate-900 rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.1)_0%,transparent_50%)]" />
        <div className="relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">Generate Your Path</h2>
            <p className="text-slate-400">Let the AI construct your personalized learning roadmap.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Language</label>
              <select className="w-full bg-slate-800 border-none rounded-2xl p-4 text-white font-bold" value={language} onChange={e => setLanguage(e.target.value)}>
                <option>Python</option>
                <option>JavaScript</option>
                <option>Java</option>
                <option>C++</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Domain</label>
              <select className="w-full bg-slate-800 border-none rounded-2xl p-4 text-white font-bold" value={domain} onChange={e => setDomain(e.target.value)}>
                <option>Backend Development</option>
                <option>Frontend Development</option>
                <option>Data Structures & Algorithms</option>
                <option>Machine Learning</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Level</label>
              <select className="w-full bg-slate-800 border-none rounded-2xl p-4 text-white font-bold" value={level} onChange={e => setLevel(e.target.value)}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Career Goal</label>
              <input 
                type="text" 
                className="w-full bg-slate-800 border-none rounded-2xl p-4 text-white font-bold" 
                value={goal} 
                onChange={e => setGoal(e.target.value)}
                placeholder="e.g. Pass FAANG interviews"
              />
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-primary text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/30 flex items-center gap-3 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {isGenerating ? "Synthesizing Matrix..." : "Generate Roadmap"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-[3rem] p-10 md:p-14 border border-slate-800 relative overflow-hidden text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(79,70,229,0.05)_0%,transparent_50%)]" />
      
      <div className="flex items-center justify-between mb-12 relative z-10">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-2">Your AI Roadmap</h2>
          <p className="text-slate-400 text-sm font-medium">{roadmap.domain} • {roadmap.language} • {roadmap.level}</p>
        </div>
        <div className="bg-primary/20 text-primary px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-primary/30">
          Active
        </div>
      </div>

      <div className="space-y-12 relative z-10">
        {roadmap.phases.map((phase, pIdx) => (
          <div key={phase.id} className="relative">
            {pIdx !== roadmap.phases.length - 1 && (
              <div className="absolute left-8 top-20 bottom-[-3rem] w-1 bg-slate-800" />
            )}
            
            <h3 className="text-xl font-black mb-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 shadow-inner z-10">
                P{pIdx + 1}
              </div>
              {phase.title}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-20">
              {phase.nodes.map(node => (
                <div 
                  key={node.id} 
                  onClick={() => handleNodeClick(node)}
                  className={cn(
                    "p-6 rounded-3xl border transition-all relative overflow-hidden group",
                    node.status === "locked" ? "bg-slate-800/50 border-slate-800 opacity-60 cursor-not-allowed" :
                    node.status === "completed" ? "bg-green-500/10 border-green-500/30 cursor-pointer" :
                    "bg-slate-800 border-indigo-500/50 hover:bg-slate-700 cursor-pointer hover:-translate-y-1 shadow-lg shadow-indigo-500/10"
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      {node.status === "locked" && <Lock size={16} className="text-slate-500" />}
                      {node.status === "completed" && <CheckCircle2 size={16} className="text-green-500" />}
                      {node.status === "unlocked" && <Play size={16} className="text-indigo-400 ml-1" fill="currentColor" />}
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{node.type}</span>
                    </div>
                  </div>
                  <h4 className={cn("text-lg font-black mb-2", node.status === "completed" ? "text-green-400" : "text-white")}>{node.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{node.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
