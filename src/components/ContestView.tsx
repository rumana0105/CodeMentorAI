import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import { Contest, Problem, Submission } from "../types";
import { Trophy, Clock, ChevronLeft, BookOpen, Users, BarChart2 } from "lucide-react";
import { cn } from "../lib/utils";
import { INITIAL_PROBLEMS } from "../constants";

export default function ContestView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState<Contest | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"problems" | "leaderboard">("problems");

  useEffect(() => {
    if (!id) return;

    const fetchContest = async () => {
      const docRef = doc(db, "contests", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const contestData = { id: docSnap.id, ...docSnap.data() } as Contest;
        setContest(contestData);
        
        // Fetch problems for this contest
        // In a real app, these would be in DB. For now, we use INITIAL_PROBLEMS
        const contestProblems = INITIAL_PROBLEMS.filter(p => contestData.problems.includes(p.id));
        setProblems(contestProblems);
      }
    };

    fetchContest();

    // Subscribe to submissions for real-time leaderboard
    const q = query(collection(db, "submissions"), where("contestId", "==", id), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Submission)));
    });

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!contest) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(contest.endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Ended");
        clearInterval(timer);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [contest]);

  if (!contest) return <div className="p-8">Loading contest...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/contests")}
            className="p-3 hover:bg-white rounded-2xl border border-transparent hover:border-[#E5E7EB] transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A]">{contest.title}</h1>
            <div className="flex items-center gap-3 text-sm text-[#6B7280]">
              <span className="flex items-center gap-1"><Users size={14} /> {contest.participants?.length || 0} Participants</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock size={14} /> Ends in {timeLeft}</span>
            </div>
          </div>
        </div>

        <div className="flex bg-white p-1 rounded-2xl border border-[#E5E7EB] shadow-sm">
          <button 
            onClick={() => setActiveTab("problems")}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === "problems" ? "bg-[#4F46E5] text-white shadow-lg shadow-indigo-100" : "text-[#6B7280] hover:bg-[#F9FAFB]"
            )}
          >
            <BookOpen size={18} />
            Problems
          </button>
          <button 
            onClick={() => setActiveTab("leaderboard")}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === "leaderboard" ? "bg-[#4F46E5] text-white shadow-lg shadow-indigo-100" : "text-[#6B7280] hover:bg-[#F9FAFB]"
            )}
          >
            <BarChart2 size={18} />
            Leaderboard
          </button>
        </div>
      </div>

      {activeTab === "problems" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {problems.map((problem, index) => (
            <div 
              key={problem.id}
              onClick={() => navigate(`/problem/${problem.id}?contest=${contest.id}`)}
              className="group bg-white p-6 rounded-3xl border border-[#E5E7EB] hover:border-[#4F46E5] hover:shadow-xl transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-[#F3F4F6] text-[#4F46E5] rounded-xl flex items-center justify-center font-bold">
                  {String.fromCharCode(65 + index)}
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                  problem.difficulty === "Easy" ? "bg-green-100 text-green-700" :
                  problem.difficulty === "Medium" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                )}>
                  {problem.difficulty}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2 group-hover:text-[#4F46E5] transition-colors">{problem.title}</h3>
              <p className="text-sm text-[#6B7280] line-clamp-2 mb-4">{problem.description}</p>
              <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                <span>{problem.category}</span>
                <span className="font-bold text-[#4F46E5]">100 Points</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#F9FAFB] text-[#6B7280] text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Solved</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Last Submission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {/* Mock Leaderboard Logic */}
              {[1, 2, 3, 4, 5].map(rank => (
                <tr key={rank} className="hover:bg-[#F9FAFB] transition-all">
                  <td className="px-6 py-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                      rank === 1 ? "bg-yellow-100 text-yellow-700" :
                      rank === 2 ? "bg-gray-100 text-gray-700" :
                      rank === 3 ? "bg-orange-100 text-orange-700" :
                      "text-[#6B7280]"
                    )}>
                      {rank}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#1A1A1A]">User_{rank}</td>
                  <td className="px-6 py-4 text-sm">{6 - rank} / {problems.length}</td>
                  <td className="px-6 py-4 font-bold text-[#4F46E5]">{(6 - rank) * 100}</td>
                  <td className="px-6 py-4 text-xs text-[#6B7280]">2m ago</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
