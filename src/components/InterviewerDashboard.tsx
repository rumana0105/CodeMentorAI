import React, { useState, useEffect } from "react";
import { collection, query, getDocs, orderBy, where } from "firebase/firestore";
import { db } from "../services/firebase";
import { Submission, UserProgress, AuthenticityCategory } from "../types";
import { Search, Filter, ShieldCheck, AlertTriangle, XCircle, User, Code, Clock } from "lucide-react";
import { cn } from "../lib/utils";
import MarkdownRenderer from "./MarkdownRenderer";

export default function InterviewerDashboard() {
  const [candidates, setCandidates] = useState<UserProgress[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AuthenticityCategory | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const subSnap = await getDocs(query(collection(db, "submissions"), orderBy("timestamp", "desc")));
        const userSnap = await getDocs(collection(db, "users"));
        
        setSubmissions(subSnap.docs.map(d => ({ ...d.data(), id: d.id } as unknown as Submission)));
        setCandidates(userSnap.docs.map(d => ({ ...d.data(), userId: d.id } as unknown as UserProgress)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSubmissions = submissions.filter(s => {
    const matchesFilter = filter === "all" || s.authenticity === filter;
    const user = candidates.find(c => c.userId === s.userId);
    const matchesSearch = user?.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.problemId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getAuthenticityBadge = (cat: AuthenticityCategory) => {
    switch (cat) {
      case "manual":
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">
          <ShieldCheck size={12} /> Genuine
        </span>;
      case "partial_ai":
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wider">
          <AlertTriangle size={12} /> AI Assisted
        </span>;
      case "full_ai":
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
          <XCircle size={12} /> Full AI
        </span>;
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading evaluation data...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interviewer Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Evaluate candidate solution authenticity and AI dependency.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search candidate or problem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          >
            <option value="all">All Authenticity</option>
            <option value="manual">Manual Only</option>
            <option value="partial_ai">AI Assisted</option>
            <option value="full_ai">Full AI</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submission List */}
        <div className="lg:col-span-2 space-y-4 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
          {filteredSubmissions.map((sub) => {
            const candidate = candidates.find(c => c.userId === sub.userId);
            return (
              <div 
                key={sub.id} 
                className={cn(
                  "p-5 bg-white border rounded-2xl transition-all cursor-pointer group hover:shadow-md",
                  selectedSubmission?.id === sub.id ? "border-indigo-500 ring-1 ring-indigo-500" : "border-gray-200"
                )}
                onClick={() => setSelectedSubmission(sub)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={candidate?.photoURL || `https://ui-avatars.com/api/?name=${candidate?.displayName}`} 
                      className="w-10 h-10 rounded-full border border-gray-100" 
                      alt="" 
                    />
                    <div>
                      <h4 className="font-bold text-gray-900">{candidate?.displayName}</h4>
                      <p className="text-xs text-gray-500">Problem: <span className="text-gray-700 font-medium">{sub.problemId}</span></p>
                    </div>
                  </div>
                  {getAuthenticityBadge(sub.authenticity)}
                </div>
                
                <div className="grid grid-cols-4 gap-4 py-3 border-y border-gray-50 mb-4">
                  <div className="text-center border-r border-gray-50">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Hints</p>
                    <p className="text-sm font-mono font-bold text-gray-700">{sub.hintsTaken || 0}</p>
                  </div>
                  <div className="text-center border-r border-gray-50">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Time</p>
                    <p className="text-sm font-mono font-bold text-gray-700">{Math.round((sub.timeSpentMs || 0) / 60000)}m</p>
                  </div>
                  <div className="text-center border-r border-gray-50">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Status</p>
                    <p className={cn("text-sm font-bold", sub.status === "accepted" ? "text-green-600" : "text-red-600")}>
                      {sub.status === "accepted" ? "PASS" : "FAIL"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Attempt</p>
                    <p className="text-sm font-mono font-bold text-gray-700">#{sub.attemptsCount || 1}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Code size={12} /> {sub.language}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {new Date(sub.timestamp).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Evaluation Detail Pane */}
        <div className="space-y-6">
          {selectedSubmission ? (
            <>
              <div className="bg-white p-6 border border-gray-200 rounded-3xl shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <ShieldCheck className="text-indigo-600" size={20} />
                  Submission Metadata
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600 font-medium tracking-tight">AI Hints Used</span>
                    <span className={cn("font-bold text-sm", (selectedSubmission.hintsTaken || 0) > 2 ? "text-orange-600" : "text-gray-900")}>
                      {selectedSubmission.hintsTaken || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600 font-medium tracking-tight">Solution Unlocked</span>
                    <span className={cn("font-bold text-sm", selectedSubmission.solutionViewed ? "text-red-600" : "text-green-600")}>
                      {selectedSubmission.solutionViewed ? "YES" : "NO"}
                    </span>
                  </div>
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Authenticity Verdict</p>
                    <p className="text-sm font-medium text-indigo-900 leading-relaxed">
                      {selectedSubmission.authenticity === "manual" 
                        ? "Candidate solved the problem independently with no AI guidance. Higher priority for interview."
                        : selectedSubmission.authenticity === "partial_ai"
                        ? "Candidate relied on conceptual hints to bridge knowledge gaps. Shows learning ability but partial dependency."
                        : "Candidate bypassed solving logic by requesting the full AI solution. Low evidence of problem-solving skills."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#1E293B] p-6 rounded-3xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Candidate Code</h3>
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 text-[10px] font-mono rounded capitalize">{selectedSubmission.language}</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  <pre className="text-xs font-mono text-gray-300 leading-relaxed">
                    {selectedSubmission.code}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-gray-50 border border-dashed border-gray-200 rounded-3xl">
              <User className="text-gray-300 mb-4" size={48} />
              <p className="text-sm text-gray-500 font-medium">Select a submission to view detailed evaluation metrics and code.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
