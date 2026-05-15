export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  testCases: TestCase[];
  hiddenTestCases?: TestCase[];
  starterCode: Record<string, string>; // language -> code
  snippets?: { title: string; code: string }[];
  languages: string[];
  tags: string[];
  companyTags?: string[];
  unlockedBy?: string; // id of previous problem
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  hidden?: boolean;
}

export type AuthenticityCategory = "manual" | "partial_ai" | "full_ai";

export interface UserProgress {
  userId: string;
  displayName: string;
  photoURL: string;
  role: "user" | "interviewer" | "admin";
  solvedProblems: string[]; // IDs
  attempts: Record<string, number>; // problemId -> count
  accuracy: number;
  lastAttemptAt: string;
  xp: number;
  level: number;
  badges: Badge[];
  rank?: number;
  contestHistory?: any[];
  joinDate: string;
  streak: number;
  preferredLanguage: string;
  hintLevel: "light" | "medium" | "deep";
  topicStats: Record<string, number>; // category -> count
  languageStats: Record<string, number>; // language -> count
  // AI Authenticity Stats
  aiUsageStats: {
    totalHintsTaken: number;
    totalSolutionsViewed: number;
    manualSolutions: number;
    partialAISolutions: number;
    fullAISolutions: number;
  };
  authenticityScore: number; // 0-100 scale
  // Behavioral Trends
  aiUsageTrends: {
    date: string;
    hints: number;
    dependencyScore: number;
  }[];
  globalTimeSpentMs: number;
  totalAttempts: number;
  totalTimeBeforeFirstHintMs: number;
  totalCodeEdits: number;
  github?: {
    username: string;
    avatarUrl: string;
    profileUrl: string;
    repoName: string;
    connectedAt: string;
    totalCommits: number;
    lastCommitAt?: string;
  };
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  problems: string[]; // IDs
  participants: string[]; // UIDs
  status: "upcoming" | "active" | "ended";
}

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  contestId?: string;
  language: string;
  code: string;
  status: "pending" | "accepted" | "wrong_answer" | "error";
  runtime: number;
  timestamp: string;
  // Authenticity Tracking
  authenticity: AuthenticityCategory;
  hintsTaken: number;
  solutionViewed: boolean;
  timeSpentMs: number;
  attemptsCount: number;
  // Behavioral Analysis
  copyPasteCount: number;
  timeBeforeFirstHintMs: number;
  versionHistory: CodeVersion[];
  interviewMode: boolean;
  aiDependencyScore: number; // 0-100
  originalThinkingScore: number; // 0-100
  feedback?: {
    strengths: string;
    improvements: string;
    plagiarismProbability: number;
  };
}

export interface CodeVersion {
  code: string;
  timestamp: string;
  trigger: "manual" | "ai_hint" | "autosave" | "session_start" | "restore";
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export interface ForumPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  title: string;
  content: string;
  category: "General" | "Problems" | "Career" | "Showcase" | "Off-topic";
  tags: string[];
  createdAt: string;
  likes: string[]; // user IDs
  replies: ForumReply[];
}

export interface ForumReply {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface CodeReview {
  style: string;
  optimizations: string;
  bestPractices: string;
  edgeCases: string;
  potentialBugs: string;
  overallFeedback: string;
}

export interface Hint {
  type: "beginner" | "logical" | "debugging";
  content: string;
  explanation?: string;
  isStuckTrigger?: boolean;
  level?: number;
}

export interface ExecutionResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error?: boolean;
  // Populated when the runtime produced stderr or when compilation/runtime fails.
  errorLogs?: string;
  // True when the server couldn't find required runtime/compilers (e.g. Python, gcc, javac).
  environmentError?: boolean;
  timedOut?: boolean;
  // Total time for this test case execution.
  durationMs?: number;
}

export interface BattleMatch {
  id: string;
  problemId: string;
  creatorId: string;
  creatorName: string;
  creatorPhoto: string;
  opponentId?: string;
  opponentName?: string;
  opponentPhoto?: string;
  status: "waiting" | "active" | "completed";
  creatorProgress: number; // 0-100
  opponentProgress: number; // 0-100
  winnerId?: string;
  startTime?: string;
  durationMs: number;
  isPrivate: boolean;
  matchCode?: string;
  createdAt: string;
}
