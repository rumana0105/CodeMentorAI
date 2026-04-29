import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, setDoc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { Problem, UserProgress, Submission } from "../types";
import { Plus, Edit2, Trash2, Users, BookOpen, Activity, Search, Save, X, Brain, ShieldAlert, History, UserCheck, Timer } from "lucide-react";
import { cn } from "../lib/utils";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"users" | "problems" | "submissions">("problems");
  const [users, setUsers] = useState<UserProgress[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Problem>>({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "users") {
        const snap = await getDocs(collection(db, "users"));
        setUsers(snap.docs.map(d => ({ userId: d.id, ...d.data() } as UserProgress)));
      } else if (activeTab === "problems") {
        const snap = await getDocs(collection(db, "problems"));
        setProblems(snap.docs.map(d => ({ id: d.id, ...d.data() } as Problem)));
      } else if (activeTab === "submissions") {
        const q = query(collection(db, "submissions"), orderBy("timestamp", "desc"), limit(50));
        const snap = await getDocs(q);
        setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Submission)));
      }
    } catch (error) {
      console.error("Failed to fetch admin data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProblems = problems.filter(p => {
    const s = searchTerm.toLowerCase();
    return p.title.toLowerCase().includes(s) || 
           p.id.toLowerCase().includes(s) || 
           p.difficulty.toLowerCase().includes(s) || 
           p.category.toLowerCase().includes(s);
  });

  const handleSaveProblem = async () => {
    try {
      const { hiddenTestCases, ...publicData } = editForm;
      let problemId = isEditing;

      if (isEditing === "new") {
        const docRef = await addDoc(collection(db, "problems"), publicData);
        problemId = docRef.id;
      } else if (isEditing) {
        await updateDoc(doc(db, "problems", isEditing), publicData);
      }

      if (problemId) {
        // Save hidden test cases to a private subcollection
        await updateDoc(doc(db, "problems", problemId), {
          // We still need to clear it from the main doc if it was there before
          hiddenTestCases: [] 
        });
        
        // Use a dedicated doc for hidden cases
        const privateRef = doc(db, "problems", problemId, "private", "test_cases");
        await setDoc(privateRef, { cases: hiddenTestCases || [] });
      }

      setIsEditing(null);
      fetchData();
    } catch (error) {
      console.error("Failed to save problem", error);
    }
  };

  const handleDeleteProblem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this problem?")) return;
    try {
      await deleteDoc(doc(db, "problems", id));
      fetchData();
    } catch (error) {
      console.error("Failed to delete problem", error);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    let newRole: "user" | "interviewer" | "admin" = "user";
    if (currentRole === "user") newRole = "interviewer";
    else if (currentRole === "interviewer") newRole = "admin";
    else newRole = "user";
    
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      fetchData();
    } catch (error) {
      console.error("Failed to update user role", error);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Admin Control Center</h1>
          <p className="text-[#6B7280]">Manage the platform, users, and content.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-[#E5E7EB] shadow-sm">
          <TabButton 
            active={activeTab === "problems"} 
            onClick={() => setActiveTab("problems")} 
            icon={BookOpen} 
            label="Problems" 
          />
          <TabButton 
            active={activeTab === "users"} 
            onClick={() => setActiveTab("users")} 
            icon={Users} 
            label="Users" 
          />
          <TabButton 
            active={activeTab === "submissions"} 
            onClick={() => setActiveTab("submissions")} 
            icon={Activity} 
            label="Submissions" 
          />
        </div>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
        {activeTab === "problems" && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by title, ID, difficulty, or category..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all"
                />
              </div>
              <button 
                onClick={() => {
                  setIsEditing("new");
                  setEditForm({
                    title: "",
                    description: "",
                    difficulty: "Easy",
                    category: "Basics",
                    inputFormat: "",
                    outputFormat: "",
                    constraints: "",
                    languages: ["python", "javascript"],
                    starterCode: { python: "", javascript: "" },
                    testCases: [{ input: "", expectedOutput: "" }],
                    hiddenTestCases: []
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-xl font-semibold hover:bg-[#4338CA] transition-all"
              >
                <Plus size={18} />
                Add Problem
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {isEditing ? (
                <div className="max-w-4xl mx-auto space-y-6 bg-[#F9FAFB] p-8 rounded-3xl border border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">{isEditing === "new" ? "Create New Problem" : "Edit Problem"}</h3>
                    <button onClick={() => setIsEditing(null)} className="p-2 hover:bg-gray-200 rounded-full">
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#374151]">Title</label>
                      <input 
                        type="text" 
                        value={editForm.title} 
                        onChange={e => setEditForm({...editForm, title: e.target.value})}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#374151]">Difficulty</label>
                      <select 
                        value={editForm.difficulty} 
                        onChange={e => setEditForm({...editForm, difficulty: e.target.value as any})}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#374151]">Description</label>
                    <textarea 
                      rows={4}
                      value={editForm.description} 
                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                      className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#374151]">Input Format</label>
                      <textarea 
                        rows={2}
                        value={editForm.inputFormat} 
                        onChange={e => setEditForm({...editForm, inputFormat: e.target.value})}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#374151]">Output Format</label>
                      <textarea 
                        rows={2}
                        value={editForm.outputFormat} 
                        onChange={e => setEditForm({...editForm, outputFormat: e.target.value})}
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#374151]">Constraints</label>
                    <textarea 
                      rows={2}
                      value={editForm.constraints} 
                      onChange={e => setEditForm({...editForm, constraints: e.target.value})}
                      className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-[#374151]">Public Test Cases</label>
                      <button 
                        onClick={() => setEditForm({
                          ...editForm, 
                          testCases: [...(editForm.testCases || []), { input: "", expectedOutput: "" }]
                        })}
                        className="text-xs font-bold text-[#4F46E5] hover:underline"
                      >
                        + Add Case
                      </button>
                    </div>
                    {editForm.testCases?.map((tc, i) => (
                      <div key={i} className="grid grid-cols-2 gap-2 p-3 bg-white border border-[#E5E7EB] rounded-xl relative group">
                        <input 
                          placeholder="Input"
                          value={tc.input}
                          onChange={e => {
                            const newCases = [...(editForm.testCases || [])];
                            newCases[i].input = e.target.value;
                            setEditForm({...editForm, testCases: newCases});
                          }}
                          className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded-lg"
                        />
                        <input 
                          placeholder="Expected Output"
                          value={tc.expectedOutput}
                          onChange={e => {
                            const newCases = [...(editForm.testCases || [])];
                            newCases[i].expectedOutput = e.target.value;
                            setEditForm({...editForm, testCases: newCases});
                          }}
                          className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded-lg"
                        />
                        <button 
                          onClick={() => {
                            const newCases = editForm.testCases?.filter((_, idx) => idx !== i);
                            setEditForm({...editForm, testCases: newCases});
                          }}
                          className="absolute -right-2 -top-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-[#374151]">Hidden Test Cases</label>
                      <button 
                        onClick={() => setEditForm({
                          ...editForm, 
                          hiddenTestCases: [...(editForm.hiddenTestCases || []), { input: "", expectedOutput: "", hidden: true }]
                        })}
                        className="text-xs font-bold text-[#4F46E5] hover:underline"
                      >
                        + Add Hidden Case
                      </button>
                    </div>
                    {editForm.hiddenTestCases?.map((tc, i) => (
                      <div key={i} className="grid grid-cols-2 gap-2 p-3 bg-gray-50 border border-[#E5E7EB] rounded-xl relative group">
                        <input 
                          placeholder="Input"
                          value={tc.input}
                          onChange={e => {
                            const newCases = [...(editForm.hiddenTestCases || [])];
                            newCases[i].input = e.target.value;
                            setEditForm({...editForm, hiddenTestCases: newCases});
                          }}
                          className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded-lg"
                        />
                        <input 
                          placeholder="Expected Output"
                          value={tc.expectedOutput}
                          onChange={e => {
                            const newCases = [...(editForm.hiddenTestCases || [])];
                            newCases[i].expectedOutput = e.target.value;
                            setEditForm({...editForm, hiddenTestCases: newCases});
                          }}
                          className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded-lg"
                        />
                        <button 
                          onClick={() => {
                            const newCases = editForm.hiddenTestCases?.filter((_, idx) => idx !== i);
                            setEditForm({...editForm, hiddenTestCases: newCases});
                          }}
                          className="absolute -right-2 -top-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handleSaveProblem}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#4F46E5] text-white rounded-xl font-bold hover:bg-[#4338CA] transition-all"
                  >
                    <Save size={20} />
                    Save Problem
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProblems.map(p => (
                    <div key={p.id} className="p-5 bg-white border border-[#E5E7EB] rounded-2xl hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-[#1A1A1A]">{p.title}</h4>
                          <span className={cn(
                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                            p.difficulty === "Easy" ? "bg-green-100 text-green-700" :
                            p.difficulty === "Medium" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          )}>
                            {p.difficulty}
                          </span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={async () => { 
                              setIsEditing(p.id); 
                              // Fetch hidden test cases when editing
                              const privateSnap = await getDoc(doc(db, "problems", p.id, "private", "test_cases"));
                              const hiddenCases = privateSnap.exists() ? privateSnap.data().cases : [];
                              setEditForm({ ...p, hiddenTestCases: hiddenCases }); 
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProblem(p.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-[#6B7280] line-clamp-2">{p.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="flex-1 overflow-auto p-6">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[#9CA3AF] text-xs font-bold uppercase tracking-wider border-b border-[#E5E7EB]">
                  <th className="pb-4 pl-4">User</th>
                  <th className="pb-4">Role</th>
                  <th className="pb-4" title="Historical AI reliance vs. independent thinking">AI_Score Split</th>
                  <th className="pb-4" title="Total hints taken across all problems">Hints</th>
                  <th className="pb-4" title="Avg time before seeking first AI hint">Persistence</th>
                  <th className="pb-4" title="Number of code versions/edits saved">Versions</th>
                  <th className="pb-4">solved</th>
                  <th className="pb-4 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {users.map(u => (
                  <tr key={u.userId} className="hover:bg-[#F9FAFB] transition-all">
                    <td className="py-4 pl-4">
                      <div className="flex items-center gap-3">
                        <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.userId}`} className="w-10 h-10 rounded-full border border-[#E5E7EB]" />
                        <div>
                           <div className="font-bold text-[#1A1A1A]">{u.displayName}</div>
                           <div className="text-[10px] text-[#6B7280] font-mono tracking-tighter capitalize">{u.userId.slice(0, 12)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={cn(
                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                        u.role === "admin" ? "bg-purple-100 text-purple-700" : 
                        u.role === "interviewer" ? "bg-indigo-100 text-indigo-700" :
                        "bg-gray-100 text-gray-700"
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                             <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-red-400" style={{ width: `${100 - (u.authenticityScore || 100)}%` }} />
                             </div>
                             <span className="text-[10px] font-black text-red-500">{Math.round(100 - (u.authenticityScore || 100))}% Dep</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-400" style={{ width: `${u.authenticityScore || 0}%` }} />
                             </div>
                             <span className="text-[10px] font-black text-green-600">{Math.round(u.authenticityScore || 0)}% Think</span>
                          </div>
                       </div>
                    </td>
                    <td className="py-4 text-sm font-black text-slate-700">
                       {u.aiUsageStats?.totalHintsTaken || 0}
                    </td>
                    <td className="py-4">
                       <div className="flex items-center gap-2">
                          <Timer size={12} className="text-blue-400" />
                          <span className="text-xs font-bold text-slate-600">
                             {u.totalTimeBeforeFirstHintMs ? Math.round(u.totalTimeBeforeFirstHintMs / 60000) : 0}m
                          </span>
                       </div>
                       <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Total Idle</p>
                    </td>
                    <td className="py-4">
                       <div className="flex items-center gap-2">
                          <History size={12} className="text-indigo-400" />
                          <span className="text-xs font-bold text-slate-600">{u.totalCodeEdits || 0}</span>
                       </div>
                    </td>
                    <td className="py-4">
                      <div className="text-xs font-black text-slate-800 uppercase tracking-tighter">{u.solvedProblems.length} Challenge{u.solvedProblems.length !== 1 ? 's' : ''}</div>
                      <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Level {u.level}</div>
                    </td>
                    <td className="py-4 pr-4">
                      <button 
                        onClick={() => handleToggleRole(u.userId, u.role)}
                        className="text-[10px] font-black uppercase tracking-widest text-[#4F46E5] hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
                      >
                        Elevate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "submissions" && (
          <div className="flex-1 overflow-auto p-6">
             <table className="w-full text-left">
              <thead>
                <tr className="text-[#9CA3AF] text-xs font-bold uppercase tracking-wider border-b border-[#E5E7EB]">
                  <th className="pb-4 pl-4">Time</th>
                  <th className="pb-4">User</th>
                  <th className="pb-4">Problem</th>
                  <th className="pb-4">Language</th>
                  <th className="pb-4">AI Score</th>
                  <th className="pb-4 pr-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {submissions.map(s => (
                  <tr key={s.id} className="hover:bg-[#F9FAFB] transition-all">
                    <td className="py-4 pl-4 text-xs text-[#6B7280]">
                      {new Date(s.timestamp).toLocaleString()}
                      {s.interviewMode && (
                        <div className="flex items-center gap-1 text-red-500 font-bold mt-1">
                          <UserCheck size={10} />
                          <span>INTERVIEW</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 text-sm font-medium">{s.userId.slice(0, 8)}...</td>
                    <td className="py-4 text-sm font-medium">{s.problemId}</td>
                    <td className="py-4 text-xs font-mono uppercase">{s.language}</td>
                    <td className="py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <Brain size={12} className="text-indigo-500" />
                          <span className="text-xs font-bold">{s.originalThinkingScore ?? 100}%</span>
                        </div>
                        {s.aiDependencyScore > 40 && (
                          <div className="flex items-center gap-1.5">
                            <ShieldAlert size={12} className="text-red-400" />
                            <span className="text-[10px] text-red-500 font-bold">HIGH DEP.</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={cn(
                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                        s.status === "accepted" ? "bg-green-100 text-green-700" :
                        s.status === "wrong_answer" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      )}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
        active ? "bg-[#4F46E5] text-white shadow-lg shadow-indigo-100" : "text-[#6B7280] hover:bg-[#F9FAFB]"
      )}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}
