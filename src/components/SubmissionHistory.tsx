import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "./AuthProvider";
import { Submission, Problem } from "../types";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, Clock, ChevronRight, ExternalLink, Brain, ShieldAlert, History, Github } from "lucide-react";
import { cn } from "../lib/utils";
import { INITIAL_PROBLEMS } from "../constants";

const getFileExtension = (lang: string) => {
  const map: Record<string, string> = {
    python: "py",
    javascript: "js",
    typescript: "ts",
    java: "java",
    c: "c",
    cpp: "cpp",
    ruby: "rb"
  };
  return map[lang] || "txt";
};

export default function SubmissionHistory() {
  const { user, profile } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [problems, setProblems] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const getGitHubLink = (sub: Submission) => {
    if (!profile?.github || sub.status !== "accepted") return null;
    const problemTitle = problems[sub.problemId];
    if (!problemTitle) return null;
    const filename = `${problemTitle.toLowerCase().replace(/\s+/g, '-')}.${getFileExtension(sub.language)}`;
    return `https://github.com/${profile.github.username}/${profile.github.repoName}/blob/main/${filename}`;
  };

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all problems to map IDs to titles
        const problemsSnap = await getDocs(collection(db, "problems"));
        const problemsMap: Record<string, string> = {};
        problemsSnap.docs.forEach(doc => {
          problemsMap[doc.id] = doc.data().title;
        });
        // Add initial problems to map as well
        INITIAL_PROBLEMS.forEach(p => {
          if (!problemsMap[p.id]) problemsMap[p.id] = p.title;
        });
        setProblems(problemsMap);

        // Fetch user submissions from API
        const res = await fetch(`/api/submissions/${user.uid}`);
        if (!res.ok) throw new Error("Failed to fetch submissions");
        const data = await res.json();
        const allSubs = data.submissions || [];
        
        // Calculate attempts per problem
        const problemAttempts: Record<string, number> = {};
        const enrichedSubs = [...allSubs].reverse().map(sub => {
          problemAttempts[sub.problemId] = (problemAttempts[sub.problemId] || 0) + 1;
          return { ...sub, problemAttemptNumber: problemAttempts[sub.problemId] };
        }).reverse();

        setSubmissions(enrichedSubs as any);
      } catch (error) {
        console.error("Error fetching submission history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Submission History</h2>
        <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">
          Total Submissions: {submissions.length}
        </p>
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-[#E5E7EB] dark:border-[#334155] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] dark:bg-[#0F172A] border-b border-[#E5E7EB] dark:border-[#334155]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">Problem</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">AI Score</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">Attempts</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">Language</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">Time Taken</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#9CA3AF] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#334155]">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-[#F9FAFB] dark:hover:bg-[#334155] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {sub.status === "accepted" ? (
                        <CheckCircle2 size={18} className="text-green-500" />
                      ) : (
                        <XCircle size={18} className="text-red-500" />
                      )}
                      <span className={cn(
                        "text-sm font-semibold capitalize",
                        sub.status === "accepted" ? "text-green-600" : "text-red-600"
                      )}>
                        {sub.status.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-[#1A1A1A] dark:text-white hover:text-[#4F46E5] dark:hover:text-[#818CF8] transition-colors">
                    <Link to={`/problem/${sub.problemId}`}>
                      {problems[sub.problemId] || "Unknown Problem"}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <Brain size={12} className="text-indigo-500" />
                        <span className="text-xs font-bold">{sub.originalThinkingScore ?? 100}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert size={12} className="text-red-400" />
                        <span className="text-[10px] text-gray-500">{sub.aiDependencyScore ?? 0}% Dep.</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-[#6B7280] dark:text-[#94A3B8]">
                    #{(sub as any).problemAttemptNumber || sub.attemptsCount || 1}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-[#6B7280] dark:text-[#94A3B8] capitalize">
                    {sub.language}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6B7280] dark:text-[#94A3B8]">
                    {sub.timeSpentMs ? `${Math.floor(sub.timeSpentMs / 60000)}m ${Math.floor((sub.timeSpentMs % 60000) / 1000)}s` : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6B7280] dark:text-[#94A3B8]">
                    {new Date(sub.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {getGitHubLink(sub) && (
                         <a 
                           href={getGitHubLink(sub)!}
                           target="_blank"
                           rel="noopener noreferrer"
                           title="View on GitHub"
                           className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#334155] rounded-lg transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white"
                         >
                           <Github size={16} />
                         </a>
                       )}
                       {sub.versionHistory && sub.versionHistory.length > 0 && (
                        <button 
                          title="View Evolution"
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#334155] rounded-lg transition-colors text-gray-400 hover:text-indigo-500"
                        >
                          <History size={16} />
                        </button>
                      )}
                      <Link
                        to={`/problem/${sub.problemId}`}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#334155] rounded-lg transition-colors text-gray-400 hover:text-indigo-500"
                      >
                        <ExternalLink size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#6B7280] dark:text-[#94A3B8]">
                    <p className="text-sm">No submissions yet. Start solving problems to see your history!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
