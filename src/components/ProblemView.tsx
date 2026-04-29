import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { INITIAL_PROBLEMS } from "../constants";
import { Problem, ExecutionResult, Hint, CodeReview, CodeVersion } from "../types";
import CodeEditor from "./CodeEditor";
import HintPanel from "./HintPanel";
import ExecutionResults from "./ExecutionResults";
import CodeReviewPanel from "./CodeReviewPanel";
import { generateHint, reviewCode, explainHintConcept, generateFullSolution } from "../services/gemini";
import { saveProgress } from "../services/db";
import { useAuth } from "./AuthProvider";
import { analyzeBehavior, generateDetailedFeedback } from "../services/gemini";
import { Play, Send, ChevronLeft, Info, BookOpen, ShieldCheck, Bug, Lightbulb, UserCheck, Timer, History, ShieldAlert, Cpu, Brain, Activity, Layers, Terminal, ChevronRight, HelpCircle, Users, Github } from "lucide-react";
import { cn } from "../lib/utils";
import CircularProgress from "./ui/CircularProgress";
import { collection, addDoc, query, where, getDocs, limit, doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { Submission } from "../types";

import DebuggerPanel from "./DebuggerPanel";

import CodeSnippet from "./CodeSnippet";

import MarkdownRenderer from "./MarkdownRenderer";
import { collabService } from "../services/collabService";
import CollaborationRoom from "./CollaborationRoom";
import { useRef } from "react";

export default function ProblemView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoadingProblem, setIsLoadingProblem] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const fetchProblem = async () => {
      setIsLoadingProblem(true);
      try {
        const docRef = doc(db, "problems", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProblem({ id: docSnap.id, ...docSnap.data() } as Problem);
        } else {
          // Fallback to INITIAL_PROBLEMS
          const localProblem = INITIAL_PROBLEMS.find(p => p.id === id);
          if (localProblem) setProblem(localProblem);
        }
      } catch (error: any) {
        console.error("Failed to fetch problem", error);
        // Special handling for Firestore connectivity issues
        if (error.message?.includes("unavailable") || error.message?.includes("Could not reach Cloud Firestore")) {
          setSubmissionFeedback({
            message: "Unable to connect to the database. Please check your internet connection or try again later.",
            type: "error"
          });
        }
        const localProblem = INITIAL_PROBLEMS.find(p => p.id === id);
        if (localProblem) setProblem(localProblem);
      } finally {
        setIsLoadingProblem(false);
      }
    };

    fetchProblem();
  }, [id]);

  const [language, setLanguage] = useState(profile?.preferredLanguage || "python");
  const [currentCodes, setCurrentCodes] = useState<Record<string, string>>({});

  // Collaboration states
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const isRemoteUpdate = useRef(false);
  const [showCollabPanel, setShowCollabPanel] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stuck detection states
  const [lastCodeChangeAt, setLastCodeChangeAt] = useState<number>(Date.now());
  const [lastError, setLastError] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [lastStuckHintAt, setLastStuckHintAt] = useState<number>(0);

  useEffect(() => {
    if (activeSessionId && user) {
      collabService.connect();
      collabService.joinSession(activeSessionId, user.uid, user.displayName || user.email || "Anonymous");

      collabService.onSessionState((data) => {
        isRemoteUpdate.current = true;
        if (Object.keys(data.code).length > 0) {
          setCurrentCodes(data.code);
        }
        if (data.language) setLanguage(data.language);
        setConnectedUsers(data.users);
        setTimeout(() => isRemoteUpdate.current = false, 100);
      });

      collabService.onCodeSync((data) => {
        isRemoteUpdate.current = true;
        setCurrentCodes(prev => ({ ...prev, ...data.code }));
        if (data.language) setLanguage(data.language);
        setTimeout(() => isRemoteUpdate.current = false, 100);
      });

      collabService.onUserJoined((data) => {
        setConnectedUsers(prev => Array.from(new Set([...prev, data.userId])));
      });

      collabService.onUserLeft((userId) => {
        setConnectedUsers(prev => prev.filter(id => id !== userId));
      });

      collabService.onUserTyping((data) => {
        if (data.userId !== user.uid) {
          setTypingUser(data.username);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2000);
        }
      });

      return () => {
        collabService.disconnect();
      };
    }
  }, [activeSessionId, user]);

  useEffect(() => {
    if (activeSessionId && !isRemoteUpdate.current) {
      if (user) collabService.sendTyping(user.uid, user.displayName || user.email || "Anonymous");
      const timeout = setTimeout(() => {
        collabService.sendCodeUpdate(currentCodes, language);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentCodes, language, activeSessionId, user]);

  const codes = currentCodes[language] || "";
  
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [hints, setHints] = useState<Hint[]>([]);
  const [review, setReview] = useState<CodeReview | null>(null);
  const [debugSteps, setDebugSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [isExplanationLoading, setIsExplanationLoading] = useState<number | null>(null);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [isDebugLoading, setIsDebugLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "output" | "review" | "debug" | "solutions" | "aisolution">("description");
  const [peerSolutions, setPeerSolutions] = useState<Submission[]>([]);
  
  // Authenticity states
  const [hintsTakenCount, setHintsTakenCount] = useState<number>(0);
  const [solutionViewed, setSolutionViewed] = useState<boolean>(false);
  const [startTime] = useState<number>(Date.now());
  const [fullSolution, setFullSolution] = useState<string>("");
  const [isSolutionLoading, setIsSolutionLoading] = useState(false);
  const [showSolutionConfirm, setShowSolutionConfirm] = useState(false);
  const [showInterviewConfirm, setShowInterviewConfirm] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  
  // Real-time scores for feedback
  const [liveDependencyScore, setLiveDependencyScore] = useState(0);
  const [liveThinkingScore, setLiveThinkingScore] = useState(100);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<CodeVersion | null>(null);

  // New behavioral analysis states
  const [interviewMode, setInterviewMode] = useState<boolean>(false);
  const [copyPasteCount, setCopyPasteCount] = useState<number>(0);
  const [timeBeforeFirstHintMs, setTimeBeforeFirstHintMs] = useState<number | null>(null);
  const [versionHistory, setVersionHistory] = useState<CodeVersion[]>([]);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // GitHub branch states
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [showBranchModal, setShowBranchModal] = useState(false);

  useEffect(() => {
    if (profile?.github) {
       const fetchBranches = async () => {
         try {
           const res = await fetch(`/api/github/branches?userId=${user?.uid}`);
           const data = await res.json();
           if (Array.isArray(data)) setBranches(data);
         } catch (e) {
           console.error("Failed to fetch branches", e);
         }
       };
       fetchBranches();
    }
  }, [profile, user]);

  const handleCreateBranch = async () => {
    if (!newBranchName || !user) return;
    setIsCreatingBranch(true);
    try {
      const res = await fetch("/api/github/branches/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          branchName: newBranchName,
          fromBranch: selectedBranch
        })
      });
      if (res.ok) {
        setBranches(prev => [...prev, { name: newBranchName }]);
        setSelectedBranch(newBranchName);
        setShowBranchModal(false);
        setNewBranchName("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingBranch(false);
    }
  };

  const getInitialHintLevel = () => {
    if (!profile) return 1;
    switch(profile.hintLevel) {
      case "light": return 1;
      case "medium": return 2;
      case "deep": return 3;
      default: return 1;
    }
  };
  
  const [hintLevel, setHintLevel] = useState<number>(1);

  const handleGetHint = async (isStuck: boolean = false) => {
    if (!problem || interviewMode) return;
    if (isStuck) setLastStuckHintAt(Date.now());
    
    if (timeBeforeFirstHintMs === null) {
      setTimeBeforeFirstHintMs(Date.now() - startTime);
    }

    setIsHintLoading(true);
    try {
      const currentLastError = results.find((r) => !r.passed)?.actualOutput;
      const effectiveLevel = isStuck ? 1 : hintLevel;
      const hint = await generateHint(
        problem, 
        codes, 
        language, 
        currentLastError, 
        effectiveLevel, 
        isStuck
      );

      setHints((prev) => [...prev, { ...hint, level: effectiveLevel }]);
      setHintsTakenCount(prev => prev + 1);
      
      // Track AI interaction in history
      setVersionHistory(prev => [...prev, {
        code: codes,
        timestamp: new Date().toISOString(),
        trigger: "ai_hint"
      }]);

      if (!isStuck) {
        setHintLevel(prev => Math.min(prev + 1, 4)); // Level 4 means all 3 are unlocked
      }
    } catch (error: any) {
      console.error("Failed to get hint", error);
      if (error.message?.includes("RESOURCE_EXHAUSTED") || error.status === 429) {
        setHints(prev => [...prev, {
          content: "System is under heavy load or quota reached. Please wait a moment before requesting another hint.",
          type: "beginner"
        }]);
      } else {
        setHints(prev => [...prev, {
          content: "Apologies, the mental link is a bit weak. Please try again in secondary mode.",
          type: "beginner"
        }]);
      }
    } finally {
      setIsHintLoading(false);
    }
  };

  // Inactivity detection
  useEffect(() => {
    const interval = setInterval(() => {
      // Don't trigger if already busy or if hints were recently given or interview mode
      if (isHintLoading || isExecuting || isSubmitting || interviewMode) return;
      if (Date.now() - lastStuckHintAt < 120000) return; // Wait at least 2 mins between stuck hints
      
      const inactiveMinutes = (Date.now() - lastCodeChangeAt) / (1000 * 60);
      if (inactiveMinutes >= 5) {
        handleGetHint(true);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [lastCodeChangeAt, isHintLoading, isExecuting, isSubmitting, lastStuckHintAt, problem, codes, language, results, hintLevel, interviewMode]);

  const handleCodeChange = (newCode: string) => {
    const now = Date.now();
    const prevCode = currentCodes[language] || "";
    if (newCode === prevCode) return;

    setLastCodeChangeAt(now);
    
    // Simple copy-paste detection
    if (newCode.length - prevCode.length > 50) {
      setCopyPasteCount(prev => prev + 1);
    }

    // Dynamic Live Scoring (Simple heuristic)
    const depScore = Math.min(100, (hintsTakenCount * 20) + (solutionViewed ? 80 : 0));
    const thinkingScore = Math.max(0, 100 - (depScore * 0.8) - (copyPasteCount * 10));
    setLiveDependencyScore(depScore);
    setLiveThinkingScore(thinkingScore);

    // Version history tracking
    const lastVersion = versionHistory[versionHistory.length - 1];
    const timeSinceLastVersion = lastVersion ? now - new Date(lastVersion.timestamp).getTime() : Infinity;
    const timeSinceLastEdit = now - lastCodeChangeAt;

    let shouldSave = false;
    let trigger: CodeVersion["trigger"] = "autosave";

    if (timeSinceLastEdit > 300000) { // 5 mins inactivity gap
      shouldSave = true;
      trigger = "session_start";
    } else if (timeSinceLastVersion > 60000) { // Regular autosave 60s
      shouldSave = true;
      trigger = "autosave";
    }

    if (shouldSave) {
      setVersionHistory(prev => [...prev, {
        code: newCode,
        timestamp: new Date().toISOString(),
        trigger
      }]);
    }

    setCurrentCodes(prev => ({ ...prev, [language]: newCode }));
  };

  const handleRestoreVersion = (version: CodeVersion) => {
    setCurrentCodes(prev => ({ ...prev, [language]: version.code }));
    setVersionHistory(prev => [...prev, {
      code: version.code,
      timestamp: new Date().toISOString(),
      trigger: "restore"
    }]);
    setPreviewVersion(null);
  };

  // Interview timer logic
  useEffect(() => {
    if (interviewMode && timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(timer);
    } else if (interviewMode && timeRemaining === 0) {
      handleSubmit();
    }
  }, [interviewMode, timeRemaining]);

  useEffect(() => {
    if (problem && activeTab === "solutions") {
      const q = query(
        collection(db, "submissions"), 
        where("problemId", "==", problem.id), 
        where("status", "==", "accepted"),
        limit(10)
      );
      getDocs(q).then(snap => {
        setPeerSolutions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Submission)));
      });
    }
  }, [activeTab, problem]);

  const handleDebug = async () => {
    if (!problem) return;
    setIsDebugLoading(true);
    setActiveTab("debug");
    try {
      const response = await fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codes, language, input: problem?.testCases[0]?.input || "" }),
      });
      const data = await response.json();
      setDebugSteps(data.steps || []);
      setCurrentStepIndex(0);
    } catch (error) {
      console.error("Debug failed", error);
    } finally {
      setIsDebugLoading(false);
    }
  };

  if (isLoadingProblem) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold mb-2">Problem Not Found</h2>
        <button onClick={() => navigate("/")} className="text-[#4F46E5] font-semibold">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const visibleLanguages = problem.languages;

  const handleRun = async () => {
    if (!problem) return;
    setIsExecuting(true);
    setActiveTab("output");
    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codes,
          language,
          testCases: problem.testCases,
        }),
      });
      const data = await response.json();
      setResults(data.results);
      
      // Error tracking for auto-hints
      const firstFailed = data.results.find((r: any) => !r.passed);
      if (firstFailed) {
        const errorMsg = firstFailed.actualOutput;
        if (errorMsg === lastError) {
          const newCount = errorCount + 1;
          setErrorCount(newCount);
          if (newCount >= 3 && Date.now() - lastStuckHintAt >= 120000) {
            handleGetHint(true);
            setErrorCount(0); // Reset after triggering
          }
        } else {
          setLastError(errorMsg);
          setErrorCount(1);
        }
      } else {
        setLastError(null);
        setErrorCount(0);
      }
    } catch (error) {
      console.error("Execution failed", error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmit = async () => {
    if (!problem) return;
    setIsSubmitting(true);
    setActiveTab("output");
    try {
      const timeSpentMs = Date.now() - startTime;
      const formatTime = (ms: number) => {
        const mins = Math.floor(ms / 60000);
        return `${mins} mins`;
      };

      // Perform AI Behavioral Analysis
      const behaviorAnalysis = await analyzeBehavior(
        problem,
        versionHistory,
        hintsTakenCount,
        timeSpentMs
      );

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codes,
          language,
          problemId: problem.id,
          userId: user?.uid,
          problemTitle: problem.title,
          aiUsage: behaviorAnalysis.dependencyScore,
          timeSpent: formatTime(timeSpentMs),
          interviewMode,
          branch: selectedBranch
        }),
      });
      const data = await response.json();
      setResults(data.results);
      const allPassed = data.allPassed;
      
      if (user) {
        const detailedFeedback = await generateDetailedFeedback(
          problem,
          codes,
          language
        );
        
        // Save to progress
        await saveProgress(user.uid, problem.id, allPassed, {
          hintsTaken: hintsTakenCount,
          solutionViewed,
          timeSpentMs,
          category: problem.category,
          language: language,
          timeBeforeFirstHintMs: timeBeforeFirstHintMs || 0,
          codeEdits: versionHistory.length
        });
        
        // Calculate authenticity for the submission record
        let authenticity: "manual" | "partial_ai" | "full_ai" = "manual";
        if (solutionViewed) authenticity = "full_ai";
        else if (hintsTakenCount > 0) authenticity = "partial_ai";

        // Save to submissions collection
        await addDoc(collection(db, "submissions"), {
          userId: user.uid,
          problemId: problem.id,
          language,
          code: codes,
          status: allPassed ? "accepted" : "wrong_answer",
          timestamp: new Date().toISOString(),
          runtime: 0,
          authenticity,
          hintsTaken: hintsTakenCount,
          solutionViewed,
          timeSpentMs,
          attemptsCount: (profile?.attempts[problem.id] || 0) + 1,
          // New Behavioral Fields
          copyPasteCount,
          timeBeforeFirstHintMs,
          versionHistory,
          interviewMode,
          aiDependencyScore: behaviorAnalysis.dependencyScore,
          originalThinkingScore: behaviorAnalysis.originalThinkingScore,
          feedback: {
            strengths: detailedFeedback.strengths,
            improvements: detailedFeedback.improvements,
            plagiarismProbability: behaviorAnalysis.plagiarismProbability
          }
        });
      }

      if (allPassed) {
        setSubmissionFeedback({ 
          message: "Congratulations! You solved the problem and passed all test cases (including hidden ones).", 
          type: 'success' 
        });
      } else {
        setSubmissionFeedback({ 
          message: "Some test cases failed. Check the output and try again.", 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error("Submission failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestSolution = async () => {
    if (!problem || solutionViewed) return;
    setIsSolutionLoading(true);
    setSolutionViewed(true);
    setActiveTab("aisolution");
    setShowSolutionConfirm(false);
    try {
      const solution = await generateFullSolution(problem, language);
      setFullSolution(solution);
    } catch (error) {
      console.error("Failed to get solution", error);
    } finally {
      setIsSolutionLoading(false);
    }
  };
  const handleToggleInterviewMode = () => {
    if (!interviewMode) {
      setShowInterviewConfirm(true);
    } else {
      setInterviewMode(false);
      setTimeLimit(null);
      setTimeRemaining(null);
    }
  };

  const confirmInterviewMode = () => {
    setInterviewMode(true);
    setTimeLimit(1800);
    setTimeRemaining(1800);
    setHints([]); // Clear any previous hints
    setHintsTakenCount(0);
    setSolutionViewed(false);
    setShowInterviewConfirm(false);
    if (activeTab === "aisolution" || activeTab === "review" || activeTab === "debug") {
      setActiveTab("description");
    }
  };

  const handleExplainHint = async (index: number) => {
    if (!problem || interviewMode) return;
    try {
      const explanation = await explainHintConcept(hints[index], problem, language);
      const newHints = [...hints];
      newHints[index] = { ...newHints[index], explanation };
      setHints(newHints);
    } catch (error) {
      console.error("Failed to get explanation", error);
    } finally {
      setIsExplanationLoading(null);
    }
  };

  const handleRequestReview = async () => {
    if (interviewMode) return;
    setIsReviewLoading(true);
    setActiveTab("review");
    try {
      const feedback = await reviewCode(problem, codes, language);
      setReview(feedback);
    } catch (error) {
      console.error("Failed to get review", error);
    } finally {
      setIsReviewLoading(false);
    }
  };

  return (
    <div className={`h-[calc(100vh-12rem)] flex flex-col gap-6 transition-colors duration-500 ${interviewMode ? 'dark:bg-[#1a1010]/20' : ''}`}>
      {/* Code Preview Modal */}
      {previewVersion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#0F172A] rounded-[2.5rem] border border-[#E5E7EB] dark:border-[#334155] w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden shadow-primary/20">
            <div className="p-8 border-b border-[#E5E7EB] dark:border-[#334155] flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <History size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Version_Snapshot</h3>
                  <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">
                    Stored {new Date(previewVersion.timestamp).toLocaleString()} • Triggered by {previewVersion.trigger}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewVersion(null)}
                className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-8 bg-[#020617] font-mono text-sm custom-scrollbar relative">
               <div className="absolute top-4 left-4 flex gap-1.5 pointer-events-none opacity-50">
                 <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                 <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                 <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
               </div>
               <pre className="text-slate-400 pt-8 leading-relaxed">
                 {previewVersion.code}
               </pre>
            </div>

            <div className="p-8 border-t border-[#E5E7EB] dark:border-[#334155] flex justify-end gap-4 bg-slate-50 dark:bg-slate-900/50">
               <button 
                 onClick={() => setPreviewVersion(null)}
                 className="px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
               >
                 Dismiss
               </button>
               <button 
                 onClick={() => handleRestoreVersion(previewVersion)}
                 className="px-10 py-3 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary-hover transition-all glow-primary"
               >
                 Revert to This Version
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Behavior Tracking Header */}
      <div className="flex items-center gap-6 px-6 py-3 bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] rounded-3xl shadow-sm transition-all overflow-x-auto no-scrollbar">
        {interviewMode && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl mr-4 shrink-0 animate-pulse">
            <ShieldAlert size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">GitHub sync disabled during interview for fair evaluation</span>
          </div>
        )}
        {typingUser && (
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-xl mr-4 shrink-0 animate-in fade-in slide-in-from-left duration-300">
            <div className="flex gap-0.5">
              <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{typingUser} is coding...</span>
          </div>
        )}
        <div className="flex items-center gap-6 border-r border-[#E5E7EB] dark:border-[#334155] pr-6">
          <CircularProgress percentage={liveDependencyScore} size={48} strokeWidth={4} color="#EF4444" label="AI Dep" />
          <CircularProgress percentage={liveThinkingScore} size={48} strokeWidth={4} color="#10B981" label="Thinking" />
        </div>
        
        <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <History size={14} className="text-primary" />
              <span>Edits</span>
            </div>
            <span className="text-lg font-black text-slate-800 dark:text-slate-200">{versionHistory.length}</span>
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Lightbulb size={14} className="text-yellow-400" />
              <span>Hints</span>
            </div>
            <span className="text-lg font-black text-slate-800 dark:text-slate-200">{hintsTakenCount}</span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Timer size={14} className="text-blue-400" />
              <span>Time Taken</span>
            </div>
            <span className="text-lg font-black text-slate-800 dark:text-slate-200">
              {Math.floor((Date.now() - startTime) / 60000)}m {Math.floor(((Date.now() - startTime) % 60000) / 1000)}s
            </span>
          </div>
        </div>

        {interviewMode && timeRemaining !== null && (
          <div className="flex items-center gap-3 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 animate-pulse ml-4">
            <Timer size={16} />
            <span className="font-black text-sm">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-4">
          {!interviewMode && profile?.github && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-200 dark:border-slate-700">
                <Github size={12} className="text-gray-500" />
                <select 
                  value={selectedBranch}
                  onChange={(e) => {
                    if (e.target.value === "NEW_BRANCH") {
                      setShowBranchModal(true);
                    } else {
                      setSelectedBranch(e.target.value);
                    }
                  }}
                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 cursor-pointer p-0"
                >
                  {branches.map(b => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                  <option value="NEW_BRANCH">+ New Branch</option>
                </select>
              </div>
            </div>
          )}
          <button 
            onClick={() => setIsTimelineOpen(!isTimelineOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all text-xs font-bold"
          >
            <Layers size={14} />
            Timeline
          </button>
          
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter border",
            interviewMode ? "bg-red-500 text-white border-red-600" : "bg-green-500/10 text-green-500 border-green-500/20"
          )}>
            {interviewMode ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
            {interviewMode ? "PROCTORING ACTIVE" : "LEARNING MODE"}
          </div>
        </div>
      </div>

      {/* Interview Mode Confirmation Overlay */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-[#E5E7EB] dark:border-[#334155] p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-6 mx-auto text-indigo-600 dark:text-indigo-400">
              <Github size={32} />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Create New Branch</h3>
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] text-center mb-6">
              Create a new branch in your "codementorai-solutions" repository to sync this solution.
            </p>
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF] mb-2 block">Branch Name</label>
                <input 
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value.replace(/\s+/g, '-'))}
                  placeholder="e.g. topic-binary-search"
                  className="w-full bg-[#F3F4F6] dark:bg-[#0F172A] border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF] mb-2 block">Base Branch</label>
                <select 
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full bg-[#F3F4F6] dark:bg-[#0F172A] border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all font-bold"
                >
                  {branches.map(b => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowBranchModal(false)}
                className="px-6 py-3 rounded-xl font-bold border border-gray-200 dark:border-[#334155] hover:bg-gray-50 dark:hover:bg-[#334155] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBranch}
                disabled={isCreatingBranch || !newBranchName}
                className="px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-50"
              >
                {isCreatingBranch ? "Creating..." : "Create Branch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interview Mode Confirmation Overlay */}
      {showInterviewConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-[#E5E7EB] dark:border-[#334155] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 mx-auto text-red-600 dark:text-red-400">
              <UserCheck size={32} />
            </div>
            <h3 className="text-xl font-bold text-center mb-4">Start Interview Mode?</h3>
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3 text-sm text-[#6B7280] dark:text-[#94A3B8]">
                <div className="mt-1 p-1 bg-red-500 rounded-full" />
                <p>All AI assistance (Hints, Review, Debug) will be disabled.</p>
              </div>
              <div className="flex items-start gap-3 text-sm text-[#6B7280] dark:text-[#94A3B8]">
                <div className="mt-1 p-1 bg-red-500 rounded-full" />
                <p>A 30-minute timer will start immediately.</p>
              </div>
              <div className="flex items-start gap-3 text-sm text-[#6B7280] dark:text-[#94A3B8]">
                <div className="mt-1 p-1 bg-red-500 rounded-full" />
                <p>The code will be automatically submitted when time expires.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowInterviewConfirm(false)}
                className="px-6 py-3 rounded-xl font-bold border border-gray-200 dark:border-[#334155] hover:bg-gray-50 dark:hover:bg-[#334155] transition-all"
              >
                Go Back
              </button>
              <button
                onClick={confirmInterviewMode}
                className="px-6 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-100 dark:shadow-none transition-all"
              >
                Let's Begin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-white dark:hover:bg-[#334155] rounded-xl border border-transparent hover:border-[#E5E7EB] dark:hover:border-[#334155] transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold">{problem.title}</h2>
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <span className="font-medium px-2 py-0.5 bg-gray-100 rounded">{problem.difficulty}</span>
              <span>•</span>
              <span>{problem.category}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all dark:text-white"
          >
            {visibleLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCollabPanel(!showCollabPanel)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all border",
              activeSessionId 
                ? "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100" 
                : "bg-white dark:bg-[#1E293B] border-[#E5E7EB] dark:border-[#334155] hover:bg-[#F9FAFB] dark:hover:bg-[#334155] dark:text-white"
            )}
          >
            <Users size={18} className={activeSessionId ? "text-indigo-500" : "text-[#4F46E5]"} />
            {activeSessionId ? "Session: " + activeSessionId : "Collaborate"}
          </button>
          <button
            onClick={handleToggleInterviewMode}
            title="Toggle proctored mode to simulate a real coding interview"
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all border",
              interviewMode 
                ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" 
                : "bg-white dark:bg-[#1E293B] border-[#E5E7EB] dark:border-[#334155] hover:bg-[#F9FAFB] dark:hover:bg-[#334155] dark:text-white"
            )}
          >
            <UserCheck size={18} className={interviewMode ? "text-red-500" : "text-[#4F46E5]"} />
            {interviewMode ? "End Interview" : "Interview Mode"}
          </button>
          <button
            onClick={handleDebug}
            disabled={isDebugLoading || interviewMode}
            title="Locate logic errors by stepping through code execution"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-30 dark:text-white"
          >
            <Bug size={14} className="text-[#F59E0B]" />
            Debug
          </button>
          <button
            onClick={handleRequestReview}
            disabled={isReviewLoading || interviewMode}
            title="Receive AI-powered feedback on performance and architecture"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-30 dark:text-white"
          >
            <ShieldCheck size={14} className="text-[#10B981]" />
            Review
          </button>
          <button
            onClick={() => handleGetHint(false)}
            disabled={isHintLoading || interviewMode}
            title="Stuck? Request a subtle nudget toward the solution"
            className="flex items-center gap-2 px-3 py-2 text-slate-400 dark:text-slate-500 hover:text-primary transition-all disabled:opacity-30 text-[10px] font-black uppercase tracking-widest"
          >
            <HelpCircle size={14} />
            Hint
          </button>
          <button
            onClick={handleRun}
            disabled={isExecuting || isSubmitting}
            title="Execute script to verify logic (Ctrl + Enter)"
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <Play size={14} className="text-slate-400 group-hover:text-green-600 transition-colors" />
            {isExecuting ? "Running..." : "Run_Code"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isExecuting || isSubmitting}
            title="Initiate final submission and behavioral analysis"
            className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.05] active:scale-95 transition-all shadow-[0_0_30px_rgba(79,70,229,0.5)] glow-primary disabled:opacity-50"
          >
            <Send size={16} />
            {isSubmitting ? "PROCESSING..." : "SUBMIT_TASK"}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 relative">
        {showCollabPanel && (
          <div className="absolute top-0 left-0 right-0 z-[60] p-6 animate-in slide-in-from-top duration-300">
            <div className="max-w-md mx-auto relative">
              <button 
                onClick={() => setShowCollabPanel(false)}
                className="absolute -top-3 -right-3 w-8 h-8 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 shadow-lg z-10"
              >
                ✕
              </button>
              <CollaborationRoom 
                activeSessionId={activeSessionId}
                connectedUsers={connectedUsers}
                onJoin={(id) => {
                  setActiveSessionId(id);
                  setShowCollabPanel(false);
                }}
                onLeave={() => {
                  setActiveSessionId(null);
                  setConnectedUsers([]);
                }}
              />
            </div>
          </div>
        )}
        {/* Timeline Drawer */}
        {isTimelineOpen && (
          <div className="absolute top-0 right-0 bottom-0 w-80 bg-white dark:bg-[#0F172A] border-l border-[#E5E7EB] dark:border-[#334155] z-40 transform transition-transform animate-in slide-in-from-right duration-300 shadow-2xl overflow-hidden flex flex-col rounded-l-3xl">
            <div className="p-6 border-b border-[#E5E7EB] dark:border-[#334155] flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <h4 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                <History size={16} className="text-primary" />
                Version Timeline
              </h4>
              <button 
                onClick={() => setIsTimelineOpen(false)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {versionHistory.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Activity size={32} className="mx-auto mb-4 opacity-20" />
                  <p className="text-xs">No snapshots yet. Start coding to track your evolution.</p>
                </div>
              )}
              {versionHistory.map((version, i) => (
                <div key={i} className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 pb-2">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white dark:bg-[#0F172A] border-2 border-primary" />
                  <div className="text-[10px] font-black uppercase text-primary mb-1 tracking-tighter">
                    {version.trigger.replace('_', ' ')}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all cursor-pointer group"
                       onClick={() => setPreviewVersion(version)}>
                    <div className="text-[10px] text-slate-500 mb-2 font-mono">
                      {new Date(version.timestamp).toLocaleTimeString()}
                    </div>
                    <code className="text-[10px] font-mono text-slate-600 dark:text-slate-400 line-clamp-2 block">
                      {version.code.substring(0, 100)}...
                    </code>
                    <div className="mt-2 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                      Preview <ChevronRight size={10} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Left: Problem & Hints */}
        <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">
          {/* Tabs for Problem Info */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E5E7EB] dark:border-[#334155] flex flex-col min-h-0 flex-1 transition-colors">
            <div className="flex border-b border-[#E5E7EB] dark:border-[#334155]">
              <button
                onClick={() => setActiveTab("description")}
                className={cn(
                  "flex-1 py-3 text-sm font-semibold transition-all border-b-2",
                  activeTab === "description" ? "border-[#4F46E5] text-[#4F46E5] dark:text-[#818CF8] dark:border-[#818CF8]" : "border-transparent text-[#6B7280] dark:text-[#94A3B8]"
                )}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab("output")}
                className={cn(
                  "flex-1 py-3 text-sm font-semibold transition-all border-b-2",
                  activeTab === "output" ? "border-[#4F46E5] text-[#4F46E5] dark:text-[#818CF8] dark:border-[#818CF8]" : "border-transparent text-[#6B7280] dark:text-[#94A3B8]"
                )}
              >
                Output
              </button>
              {!interviewMode && (
                <>
                  <button
                    onClick={() => setActiveTab("review")}
                    className={cn(
                      "flex-1 py-3 text-sm font-semibold transition-all border-b-2",
                      activeTab === "review" ? "border-[#4F46E5] text-[#4F46E5] dark:text-[#818CF8] dark:border-[#818CF8]" : "border-transparent text-[#6B7280] dark:text-[#94A3B8]"
                    )}
                  >
                    Review
                  </button>
                  <button
                    onClick={() => setActiveTab("debug")}
                    className={cn(
                      "flex-1 py-3 text-sm font-semibold transition-all border-b-2",
                      activeTab === "debug" ? "border-[#4F46E5] text-[#4F46E5] dark:text-[#818CF8] dark:border-[#818CF8]" : "border-transparent text-[#6B7280] dark:text-[#94A3B8]"
                    )}
                  >
                    Debug
                  </button>
                  <button
                    onClick={() => setActiveTab("aisolution")}
                    className={cn(
                      "flex-1 py-3 text-sm font-semibold transition-all border-b-2",
                      activeTab === "aisolution" ? "border-[#4F46E5] text-[#4F46E5] dark:text-[#818CF8] dark:border-[#818CF8]" : "border-transparent text-[#6B7280] dark:text-[#94A3B8]"
                    )}
                  >
                    {solutionViewed ? "AI Solution" : "Get Solution"}
                  </button>
                </>
              )}
              {profile?.solvedProblems.includes(problem.id) && (
                <button
                  onClick={() => setActiveTab("solutions")}
                  className={cn(
                    "flex-1 py-3 text-sm font-semibold transition-all border-b-2",
                    activeTab === "solutions" ? "border-[#4F46E5] text-[#4F46E5]" : "border-transparent text-[#6B7280]"
                  )}
                >
                  Solutions
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {activeTab === "description" && (
                <div className="space-y-8">
                  {/* Feedback Message */}
                  {submissionFeedback && (
                    <div className={cn(
                      "p-5 rounded-2xl border mb-6 flex items-center justify-between animate-in slide-in-from-top duration-500",
                      submissionFeedback.type === 'success' ? "bg-green-500/10 text-green-500 border-green-500/20 glow-success" : "bg-red-500/10 text-red-500 border-red-500/20 glow-error"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", submissionFeedback.type === 'success' ? "bg-green-500/20" : "bg-red-500/20")}>
                          {submissionFeedback.type === 'success' ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                        </div>
                        <p className="text-sm font-bold tracking-tight">{submissionFeedback.message}</p>
                      </div>
                      <button onClick={() => setSubmissionFeedback(null)} className="p-1 hover:bg-black/5 rounded-full transition-all">✕</button>
                    </div>
                  )}

                  <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-all transform rotate-12">
                      <Terminal size={120} />
                    </div>
                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                      <BookOpen size={14} className="text-primary" />
                      Platform Specification
                    </h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      <MarkdownRenderer content={problem.description} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoBox title="Input Interface" content={problem.inputFormat} icon={Cpu} />
                    <InfoBox title="Output Interface" content={problem.outputFormat} icon={Brain} />
                  </div>

                  <div className="bg-[#0F172A] p-6 rounded-3xl border border-[#334155] shadow-inner font-mono relative">
                    <div className="absolute top-3 right-4 flex gap-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                       <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30" />
                       <div className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#475569] mb-4">Constraints_Log</h4>
                    <pre className="text-blue-400 text-xs overflow-x-auto custom-scrollbar">
                      {problem.constraints}
                    </pre>
                  </div>

                  {problem.snippets && problem.snippets.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[#9CA3AF] mb-4">Helpful Snippets</h4>
                      {problem.snippets.map((snippet, i) => (
                        <CodeSnippet key={i} title={snippet.title} code={snippet.code} />
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === "output" && (
                <ExecutionResults results={results} isLoading={isExecuting} language={language} />
              )}
              {activeTab === "review" && (
                <CodeReviewPanel review={review} isLoading={isReviewLoading} onReview={handleRequestReview} />
              )}
              {activeTab === "debug" && (
                <DebuggerPanel 
                  steps={debugSteps} 
                  currentStepIndex={currentStepIndex} 
                  onStepChange={setCurrentStepIndex}
                  onReset={() => setCurrentStepIndex(0)}
                  isLoading={isDebugLoading}
                />
              )}
              {activeTab === "aisolution" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-[#9CA3AF]">AI-Generated Solution</h4>
                    {!solutionViewed && (
                      <button 
                        onClick={handleRequestSolution}
                        className="text-xs bg-[#4F46E5] text-white px-3 py-1.5 rounded-lg hover:bg-[#4338CA] transition-all"
                      >
                        Unlock Solution
                      </button>
                    )}
                  </div>
                  {isSolutionLoading ? (
                    <div className="flex items-center justify-center p-12">
                      <div className="w-6 h-6 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : fullSolution ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <MarkdownRenderer content={fullSolution} />
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl text-[10px] text-red-600 dark:text-red-400">
                        ⚠️ This problem is now marked as "Fully AI Assisted".
                      </div>
                    </div>
                  ) : showSolutionConfirm ? (
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-8 rounded-2xl border border-amber-200 dark:border-amber-900/50 text-center">
                      <ShieldCheck className="mx-auto mb-3 text-amber-500" size={32} />
                      <p className="text-sm text-amber-800 dark:text-amber-200 mb-4 font-medium">
                        Requesting a full solution will mark your submission as "AI Assisted" and heavily reduce your score. Are you sure?
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        <button 
                          onClick={() => setShowSolutionConfirm(false)}
                          className="px-6 py-2 bg-white dark:bg-[#1E293B] text-gray-700 dark:text-gray-300 rounded-xl font-semibold border border-gray-200 dark:border-[#334155] hover:bg-gray-50 transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleRequestSolution}
                          className="px-6 py-2 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#F9FAFB] dark:bg-[#0F172A] p-8 rounded-2xl border border-dashed border-[#E5E7EB] dark:border-[#334155] text-center">
                      <Lightbulb className="mx-auto mb-3 text-yellow-400" size={32} />
                      <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mb-4">
                        Stuck? You can view the full AI solution, but it will affect your authenticity score.
                      </p>
                      <button 
                        onClick={() => setShowSolutionConfirm(true)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#4F46E5] text-white rounded-xl font-semibold hover:bg-[#4338CA] transition-all"
                      >
                        Reveal Solution
                      </button>
                    </div>
                  )}
                </div>
              )}
              {activeTab === "solutions" && (
                <div className="space-y-6">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-[#9CA3AF]">Peer Solutions</h4>
                  {peerSolutions.length > 0 ? (
                    <div className="space-y-4">
                      {peerSolutions.map((sol) => (
                        <div key={sol.id} className="bg-[#F9FAFB] dark:bg-[#0F172A] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#334155]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-[#4F46E5] dark:text-[#818CF8] uppercase">{sol.language}</span>
                            <span className="text-[10px] text-[#6B7280] dark:text-[#94A3B8]">{new Date(sol.timestamp).toLocaleDateString()}</span>
                          </div>
                          <pre className="text-xs font-mono bg-white dark:bg-[#1E293B] p-3 rounded-lg border border-[#E5E7EB] dark:border-[#334155] overflow-x-auto dark:text-gray-300">
                            {sol.code}
                          </pre>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6B7280]">No other solutions found yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="h-1/3 min-h-[200px]">
            <HintPanel 
              hints={hints} 
              isLoading={isHintLoading} 
              onGetHint={() => handleGetHint(false)} 
              onExplainHint={handleExplainHint}
              isExplanationLoading={isExplanationLoading}
              hintLevel={hintLevel}
            />
          </div>
        </div>

        {/* Right: Editor */}
        <div className="lg:col-span-8 min-h-0">
          <CodeEditor 
            code={codes} 
            onChange={handleCodeChange} 
            language={language}
            highlightedLine={activeTab === "debug" ? debugSteps[currentStepIndex]?.line : undefined}
          />
        </div>
      </div>
    </div>
  );
}

function InfoBox({ title, content, icon: Icon }: any) {
  return (
    <div className="bg-[#F9FAFB] dark:bg-[#0F172A] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#334155]">
      <div className="flex items-center gap-2 mb-1 text-[#4F46E5] dark:text-[#818CF8]">
        <Icon size={14} />
        <span className="text-[10px] font-bold uppercase tracking-wider">{title}</span>
      </div>
      <div className="text-xs text-[#1A1A1A] dark:text-gray-300 leading-relaxed prose prose-xs dark:prose-invert max-w-none">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
}
