import { doc, setDoc, getDoc, updateDoc, arrayUnion, increment, addDoc, query, limit, getDocs, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";
import { UserProgress, Roadmap } from "../types";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.log("Current User UID:", auth.currentUser?.uid);
  
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  if (errInfo.error.toLowerCase().includes("permission") || errInfo.error.toLowerCase().includes("missing")) {
    console.error("Permission denied. Ensure your rules are deployed and you are logged in.");
    return;
  }
  
  console.error("Firestore operation failed:", errInfo.error);
}

export async function getUserProgress(userId: string): Promise<UserProgress | null> {
  const docRef = doc(db, "users", userId);
  try {
    const docSnap = await getDoc(docRef);
    let data: UserProgress | null = null;

    if (docSnap.exists()) {
      data = docSnap.data() as UserProgress;
    }
    
    // Initialize AI stats if missing
    if (data && !data.aiUsageStats) {
      data.aiUsageStats = {
        totalHintsTaken: 0,
        totalSolutionsViewed: 0,
        manualSolutions: 0,
        partialAISolutions: 0,
        fullAISolutions: 0
      };
      data.authenticityScore = 0;
    }

    // Force admin role for the master email
    if (auth.currentUser?.email === "jagirdarrumana22@gmail.com") {
      if (!data) {
        data = {
          userId,
          displayName: auth.currentUser.displayName || "Admin",
          photoURL: auth.currentUser.photoURL || "",
          role: "admin",
          solvedProblems: [],
          attempts: {},
          accuracy: 0,
          lastAttemptAt: new Date().toISOString(),
          xp: 0,
          level: 1,
          badges: [],
          joinDate: new Date().toISOString(),
          streak: 0,
          preferredLanguage: "python",
          hintLevel: "medium",
          topicStats: {},
          languageStats: {},
          aiUsageStats: {
            totalHintsTaken: 0,
            totalSolutionsViewed: 0,
            manualSolutions: 0,
            partialAISolutions: 0,
            fullAISolutions: 0
          },
          authenticityScore: 100,
          aiUsageTrends: [],
          globalTimeSpentMs: 0,
          totalAttempts: 0,
          totalTimeBeforeFirstHintMs: 0,
          totalCodeEdits: 0
        };
      } else if (data.role !== "admin") {
        data.role = "admin";
        // Update the DB to persist the admin role
        updateDoc(docRef, { role: "admin" }).catch(console.error);
      }
    }

    return data;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    return null;
  }
}

export async function createUserProfile(userId: string, displayName: string, photoURL: string = ""): Promise<UserProgress> {
  // 4. AUTH VALIDATION
  if (!auth.currentUser) {
    throw new Error("User not authenticated");
  }

  const docRef = doc(db, "users", userId);
  
  // 3. ADD SAFETY CHECK BEFORE CREATE
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProgress;
    }
  } catch (error) {
    console.error("Error checking existing profile:", error);
  }

  const user = auth.currentUser;
  console.log("User:", user);
  console.log("UID:", user?.uid);

  const initialProgress: any = {
    userId,
    displayName,
    name: user.displayName,
    email: user.email || "",
    createdAt: serverTimestamp(),
    photoURL,
    role: "user",
    solvedProblems: [],
    attempts: {},
    xp: 0,
    level: 1,
    lastAttemptAt: new Date().toISOString(),
    accuracy: 0,
    badges: [],
    joinDate: new Date().toISOString(),
    streak: 0,
    preferredLanguage: "python",
    hintLevel: "medium",
    topicStats: {},
    languageStats: {},
    aiUsageStats: {
      totalHintsTaken: 0,
      totalSolutionsViewed: 0,
      manualSolutions: 0,
      partialAISolutions: 0,
      fullAISolutions: 0
    },
    authenticityScore: 100,
    aiUsageTrends: [],
    globalTimeSpentMs: 0,
    totalAttempts: 0,
    totalTimeBeforeFirstHintMs: 0,
    totalCodeEdits: 0
  };

  try {
    console.log("UID:", auth.currentUser?.uid);
    console.log("Payload:", initialProgress);
    // Exact code requested by user:
    await setDoc(doc(db, "users", user.uid), {
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      createdAt: serverTimestamp()
    });
    // Setting the remaining initial progress fields separately to prevent app crashes
    await setDoc(docRef, initialProgress, { merge: true });
    
    // Create leaderboards entry
    try {
      await setDoc(doc(db, "leaderboards", user.uid), {
        userId: user.uid,
        displayName: displayName || user.displayName || "Anonymous",
        photoURL: photoURL || user.photoURL || "",
        xp: 0,
        level: 1,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (lbError) {
      console.error("Leaderboard creation failed:", lbError);
    }
    
    return initialProgress;
  } catch (error: any) {
    // 5. ERROR HANDLING IMPROVEMENT
    console.error(`User profile creation failed due to permission mismatch. UID: ${auth.currentUser.uid}, Path: users/${userId}`, error);
    throw new Error("User profile creation failed due to permission mismatch");
  }
}

export async function saveProgress(
  userId: string, 
  problemId: string, 
  passed: boolean, 
  metadata?: { 
    hintsTaken: number; 
    solutionViewed: boolean; 
    timeSpentMs: number;
    category?: string;
    language?: string;
    timeBeforeFirstHintMs?: number;
    codeEdits?: number;
    code?: string;
    aiReview?: any;
  }
) {
  const currentUser = auth.currentUser;
  console.log("User:", currentUser);
  console.log("UID:", currentUser?.uid);

  if (!currentUser) {
    throw new Error("User not authenticated");
  }

  const submissionData = {
    userId: currentUser.uid,
    problemId: problemId,
    code: metadata?.code || "",
    language: metadata?.language || "python",
    result: passed ? "passed" : "failed",
    runtime: 0,
    memory: 0,
    timestamp: new Date().toISOString()
  };

  console.log("UID:", auth.currentUser?.uid);
  console.log("Payload:", submissionData);

  try {
    await addDoc(collection(db, "submissions"), submissionData);
  } catch (error) {
    console.error("Failed to save submission in saveProgress:", error);
  }

  const docRef = doc(db, "users", userId);
  let docSnap;
  try {
    docSnap = await getDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    return;
  }

  const { 
    hintsTaken = 0, 
    solutionViewed = false, 
    timeSpentMs = 0, 
    category = "General", 
    language = "python",
    timeBeforeFirstHintMs = 0,
    codeEdits = 0
  } = metadata || {};
  
  // Calculate Authenticity
  let authenticity: "manual" | "partial_ai" | "full_ai" = "manual";
  let scoreImpact = 100;

  if (solutionViewed) {
    authenticity = "full_ai";
    scoreImpact = 10;
  } else if (hintsTaken > 0) {
    authenticity = "partial_ai";
    scoreImpact = Math.max(20, 100 - (hintsTaken * 15));
  }

  if (!docSnap.exists()) {
    const initialProgress: UserProgress = {
      userId,
      displayName: auth.currentUser?.displayName || "Anonymous",
      photoURL: auth.currentUser?.photoURL || "",
      role: "user",
      solvedProblems: passed ? [problemId] : [],
      attempts: { [problemId]: 1 },
      xp: passed ? (scoreImpact) : 0,
      level: 1,
      lastAttemptAt: new Date().toISOString(),
      accuracy: passed ? 100 : 0,
      badges: passed ? [{
        id: "first-problem",
        name: "First Problem",
        description: "Solved your very first coding challenge!",
        icon: "🚀",
        unlockedAt: new Date().toISOString()
      }] : [],
      joinDate: new Date().toISOString(),
      streak: 1,
      preferredLanguage: "python",
      hintLevel: "medium",
      topicStats: passed ? { [category]: 1 } : {},
      languageStats: passed ? { [language]: 1 } : {},
      aiUsageStats: {
        totalHintsTaken: hintsTaken,
        totalSolutionsViewed: solutionViewed ? 1 : 0,
        manualSolutions: (passed && authenticity === "manual") ? 1 : 0,
        partialAISolutions: (passed && authenticity === "partial_ai") ? 1 : 0,
        fullAISolutions: (passed && authenticity === "full_ai") ? 1 : 0
      },
      authenticityScore: passed ? scoreImpact : 100,
      aiUsageTrends: passed ? [{
        date: new Date().toISOString().split('T')[0],
        hints: hintsTaken,
        dependencyScore: 100 - scoreImpact
      }] : [],
      globalTimeSpentMs: timeSpentMs,
      totalAttempts: 1,
      totalTimeBeforeFirstHintMs: timeBeforeFirstHintMs,
      totalCodeEdits: codeEdits
    };
    try {
      await setDoc(docRef, initialProgress);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${userId}`);
    }
  } else {
    const data = docSnap.data() as UserProgress;
    const updates: any = {
      [`attempts.${problemId}`]: increment(1),
      lastAttemptAt: new Date().toISOString(),
      globalTimeSpentMs: increment(timeSpentMs),
      totalAttempts: increment(1),
      totalTimeBeforeFirstHintMs: increment(timeBeforeFirstHintMs),
      totalCodeEdits: increment(codeEdits)
    };
    
    let isFirstTime = false;
    if (passed) {
      isFirstTime = !data.solvedProblems.includes(problemId);
      if (isFirstTime) {
        updates.solvedProblems = arrayUnion(problemId);
        updates.xp = increment(scoreImpact);
        
        // Update Stats
        updates[`topicStats.${category}`] = increment(1);
        updates[`languageStats.${language}`] = increment(1);

        // Update AI stats
        updates["aiUsageStats.totalHintsTaken"] = increment(hintsTaken);
        updates["aiUsageStats.totalSolutionsViewed"] = increment(solutionViewed ? 1 : 0);
        
        if (authenticity === "manual") updates["aiUsageStats.manualSolutions"] = increment(1);
        else if (authenticity === "partial_ai") updates["aiUsageStats.partialAISolutions"] = increment(1);
        else if (authenticity === "full_ai") updates["aiUsageStats.fullAISolutions"] = increment(1);

        // Update overall authenticity score
        const totalSolved = data.solvedProblems.length + 1;
        const currentAvg = data.authenticityScore || 100;
        updates.authenticityScore = ((currentAvg * (totalSolved - 1)) + scoreImpact) / totalSolved;

        // Update Trends
        const today = new Date().toISOString().split('T')[0];
        const lastTrend = data.aiUsageTrends?.[data.aiUsageTrends.length - 1];
        if (lastTrend?.date === today) {
           const newTrends = [...(data.aiUsageTrends || [])];
           const last = newTrends[newTrends.length - 1];
           last.hints += hintsTaken;
           last.dependencyScore = (last.dependencyScore + (100 - scoreImpact)) / 2;
           updates.aiUsageTrends = newTrends;
        } else {
           updates.aiUsageTrends = arrayUnion({
             date: today,
             hints: hintsTaken,
             dependencyScore: 100 - scoreImpact
           });
        }

        // Milestones...
        if (totalSolved === 10) {
          updates.badges = arrayUnion({
            id: "decathlon",
            name: "Coding Decathlon",
            description: "Solved 10 problems!",
            icon: "🏆",
            unlockedAt: new Date().toISOString()
          });
        }
      }
    }

    // Update Overall Accuracy (Solved / Total Attempts)
    // Note: This is an approximation since we don't have total unique attempts across all problems easily without re-scanning
    // but we can use (solvedProblems.length / totalAttempts)
    const totalSolved = passed ? (data.solvedProblems.includes(problemId) ? data.solvedProblems.length : data.solvedProblems.length + 1) : data.solvedProblems.length;
    const totalTotalAttempts = (data.totalAttempts || 0) + 1;
    updates.accuracy = Math.round((totalSolved / totalTotalAttempts) * 100);

    try {
      await updateDoc(docRef, updates);
      
      // Update Leaderboard if XP changed
      if (passed && isFirstTime) {
        try {
          await setDoc(doc(db, "leaderboards", userId), {
            xp: increment(scoreImpact),
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (lbErr) {
          console.error("Leaderboard update failed", lbErr);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  }
}

export async function seedInitialContests() {
  const contestsCol = collection(db, "contests");
  const snap = await getDocs(query(contestsCol, limit(1)));
  if (!snap.empty) return; // Already seeded

  const contests = [
    {
      title: "Global Sync 2026: Phase Alpha",
      description: "The first major competitive cycle of 2026. Focus on Graph Theory and Dynamic Programming.",
      startTime: new Date(Date.now() - 3600000).toISOString(), // Started 1 hour ago
      endTime: new Date(Date.now() + 7200000).toISOString(),   // Ends in 2 hours
      problems: ["p1", "p2", "p3"],
      participants: ["user1", "user2"],
      status: "active"
    },
    {
      title: "CodeRush: Weekend Sprint",
      description: "Quick 2-hour sprint focusing on String Manipulation and Array logic.",
      startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      endTime: new Date(Date.now() + 93600000).toISOString(),
      problems: ["p4", "p5"],
      participants: [],
      status: "upcoming"
    },
    {
      title: "Neural Network Challenge",
      description: "Heuristic-based optimization problems and AI-assistant coordination tasks.",
      startTime: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      endTime: new Date(Date.now() - 165600000).toISOString(),
      problems: ["p6"],
      participants: ["user3", "user4", "user5"],
      status: "ended"
    }
  ];

  for (const c of contests) {
    try {
      await addDoc(contestsCol, c);
    } catch (error) {
      console.error("Failed to seed contest:", c.title, error);
    }
  }
}

export async function saveRoadmap(userId: string, roadmap: Roadmap) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("Cannot save roadmap: no authenticated user.");
    return;
  }
  try {
    const docRef = doc(db, "roadmaps", roadmap.id);
    await setDoc(docRef, {
      roadmapId: roadmap.id,
      userId: currentUser.uid,
      title: roadmap.title || "AI Learning Roadmap",
      language: roadmap.language || "general",
      level: roadmap.level || "beginner",
      generatedBy: "AI",
      phases: roadmap.phases || [],
      createdAt: new Date().toISOString()
    });
    
    // update user progress to track current roadmap
    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, { currentRoadmapId: roadmap.id });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `roadmaps/${roadmap.id}`);
  }
}

export async function loadRoadmap(userId: string, roadmapId: string): Promise<Roadmap | null> {
  try {
    const docRef = doc(db, "roadmaps", roadmapId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      // Security rule ensures only owner can read
      return docSnap.data() as Roadmap;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `roadmaps/${roadmapId}`);
    return null;
  }
}

