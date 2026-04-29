import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import admin from "firebase-admin";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import os from "os";
import axios from "axios";
import PDFDocument from "pdfkit";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
import fs_sync from 'fs';
const firebaseConfig = JSON.parse(fs_sync.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = admin.initializeApp({
  projectId: firebaseConfig.projectId,
});
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  // Real-time Collaboration Logic
  const sessions = new Map<string, { code: any, language: string, users: Set<string> }>();

  io.on("connection", (socket) => {
    socket.on("join-session", ({ sessionId, userId, username }) => {
      socket.join(sessionId);
      
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, { 
          code: {}, 
          language: "javascript", 
          users: new Set() 
        });
      }
      
      const session = sessions.get(sessionId)!;
      session.users.add(userId);
      (socket as any).userId = userId;
      (socket as any).sessionId = sessionId;
      (socket as any).username = username;

      // Sync current state to new user
      socket.emit("session-state", {
        code: session.code,
        language: session.language,
        users: Array.from(session.users)
      });

      // Notify others
      socket.to(sessionId).emit("user-joined", { userId, username });
    });

    socket.on("code-update", ({ sessionId, code, language }) => {
      if (sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        session.code = code;
        if (language) session.language = language;
        socket.to(sessionId).emit("code-sync", { code, language });
      }
    });

    socket.on("cursor-update", ({ sessionId, userId, position }) => {
      socket.to(sessionId).emit("cursor-sync", { userId, position });
    });

    socket.on("typing", ({ sessionId, userId, username }) => {
      socket.to(sessionId).emit("user-typing", { userId, username });
    });

    socket.on("disconnect", () => {
      const sessionId = (socket as any).sessionId;
      const userId = (socket as any).userId;
      
      if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        session.users.delete(userId);
        if (session.users.size === 0) {
          // Optional: Clean up empty sessions after some time
        }
        socket.to(sessionId).emit("user-left", userId);
      }
    });
  });

  app.use(express.json());

  // API Route for Code Execution (Public Test Cases)
  app.post("/api/execute", async (req, res) => {
    const { code, language, testCases } = req.body;
    const results = await runTestCases(code, language, testCases);
    res.json({ results });
  });

  // AI Endpoints
  app.post("/api/debug", async (req, res) => {
    try {
      const { code, language, input } = req.body;
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

      const prompt = `
        You are a code debugger. Provide a step-by-step execution trace for this ${language} code.
        Code:
        ${code}
        
        Input:
        ${input}
        
        For each step, provide:
        - line: current line number
        - locals: current value of all active variables (JSON-like)
        - output: any output produced up to this point
        
        Return ONLY a JSON object with a "steps" array. Max 20 steps.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt
      });
      const text = response.text || "";
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        res.json(JSON.parse(jsonMatch[0]));
      } else {
        throw new Error("Invalid AI response format");
      }
    } catch (err: any) {
      console.error("AI Debug Error:", err);
      res.status(500).json({ error: "Debug simulation failed", steps: [] });
    }
  });

  // API Route for Submission (Public + Hidden Test Cases)
  app.post("/api/submit", async (req, res) => {
    const { code, language, problemId } = req.body;
    
    try {
      const problemDoc = await db.collection("problems").doc(problemId).get();
      if (!problemDoc.exists) {
        return res.status(404).json({ error: "Problem not found" });
      }
      
      const problemData = problemDoc.data();
      const publicTestCases = problemData?.testCases || [];
      
      // Fetch hidden test cases from private subcollection
      const hiddenDoc = await db.collection("problems").doc(problemId).collection("private").doc("test_cases").get();
      const hiddenTestCases = hiddenDoc.exists ? (hiddenDoc.data()?.cases || []) : [];
      
      const allTestCases = [...publicTestCases, ...hiddenTestCases];
      const results = await runTestCases(code, language, allTestCases);
      
      const allPassed = results.every(r => r.passed);
      
      if (allPassed && req.body.userId && !req.body.interviewMode) {
        // Trigger GitHub Sync in background
        const problemTitle = problemData?.title || "Solution";
        pushToGitHub(req.body.userId, problemTitle, language, code, {
          aiUsage: req.body.aiUsage || 0,
          timeSpent: req.body.timeSpent || "N/A",
          branch: req.body.branch || "main"
        });
      }

      res.json({ 
        results: results.map(r => ({ ...r, expectedOutput: r.hidden ? "[Hidden]" : r.expectedOutput, actualOutput: r.hidden ? "[Hidden]" : r.actualOutput })),
        allPassed 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GitHub Auth Endpoints
  app.get("/api/github/auth-url", (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: "GitHub Client ID not configured" });
    }

    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    const redirectUri = `${process.env.APP_URL}/auth/github/callback`;
    const scope = "repo,user";
    const state = userId;

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
    res.json({ url: authUrl });
  });

  app.get("/auth/github/callback", async (req, res) => {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.send("Auth failed: Missing code or state");
    }

    try {
      const tokenResponse = await axios.post("https://github.com/login/oauth/access_token", {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.APP_URL}/auth/github/callback`,
      }, {
        headers: { Accept: "application/json" }
      });

      const accessToken = tokenResponse.data.access_token;
      if (!accessToken) {
        throw new Error("Failed to get access token");
      }

      const userResponse = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `token ${accessToken}` }
      });

      const githubUser = userResponse.data;

      await db.collection("github_tokens").doc(userId as string).set({
        accessToken,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await db.collection("users").doc(userId as string).update({
        github: {
          username: githubUser.login,
          avatarUrl: githubUser.avatar_url,
          profileUrl: githubUser.html_url,
          repoName: "codementorai-solutions",
          connectedAt: new Date().toISOString(),
          totalCommits: 0,
        }
      });

      res.send(`
        <html>
          <body style="background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/profile';
              }
            </script>
            <div style="text-align: center;">
              <h2>GitHub Connected!</h2>
              <p>You can close this window now.</p>
            </div>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("GitHub Auth Callback Error:", error);
      res.status(500).send("Auth failed: " + error.message);
    }
  });

  app.post("/api/github/disconnect", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    try {
      await db.collection("github_tokens").doc(userId).delete();
      await db.collection("users").doc(userId).update({
        github: admin.firestore.FieldValue.delete()
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/github/commits", async (req, res) => {
    const { userId, branch } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    try {
      const token = await getGitHubToken(userId as string);
      if (!token) return res.status(401).json({ error: "GitHub not connected" });

      const userDoc = await db.collection("users").doc(userId as string).get();
      const github = userDoc.data()?.github;
      if (!github) return res.status(404).json({ error: "GitHub info not found" });

      const repoName = github.repoName || "codementorai-solutions";
      const response = await axios.get(`https://api.github.com/repos/${github.username}/${repoName}/commits`, {
        headers: { Authorization: `token ${token}` },
        params: { per_page: 5, sha: branch || "main" }
      });

      res.json(response.data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/github/branches", async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    try {
      const token = await getGitHubToken(userId as string);
      if (!token) return res.status(401).json({ error: "GitHub not connected" });

      const userDoc = await db.collection("users").doc(userId as string).get();
      const github = userDoc.data()?.github;
      if (!github?.username) return res.status(404).json({ error: "GitHub info not found" });

      const repoName = github.repoName || "codementorai-solutions";
      const response = await axios.get(`https://api.github.com/repos/${github.username}/${repoName}/branches`, {
        headers: { Authorization: `token ${token}` }
      });

      res.json(response.data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/github/branches/create", async (req, res) => {
    const { userId, branchName, fromBranch } = req.body;
    if (!userId || !branchName) return res.status(400).json({ error: "User ID and Branch Name required" });

    try {
      const token = await getGitHubToken(userId);
      if (!token) return res.status(401).json({ error: "GitHub not connected" });

      const userDoc = await db.collection("users").doc(userId).get();
      const github = userDoc.data()?.github;
      if (!github?.username) return res.status(404).json({ error: "GitHub info not found" });

      const repoName = github.repoName || "codementorai-solutions";
      const owner = github.username;

      // Get SHA of fromBranch
      const refRes = await axios.get(`https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/${fromBranch || "main"}`, {
        headers: { Authorization: `token ${token}` }
      });
      const sha = refRes.data.object.sha;

      // Create new ref
      await axios.post(`https://api.github.com/repos/${owner}/${repoName}/git/refs`, {
        ref: `refs/heads/${branchName}`,
        sha
      }, {
        headers: { Authorization: `token ${token}` }
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/github/activity", async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    try {
      const token = await getGitHubToken(userId as string);
      if (!token) return res.status(401).json({ error: "GitHub not connected" });

      const userDoc = await db.collection("users").doc(userId as string).get();
      const github = userDoc.data()?.github;
      if (!github?.username) return res.status(404).json({ error: "GitHub info not found" });
      
      const repoName = github.repoName || "codementorai-solutions";
      const owner = github.username;

      const response = await axios.get(`https://api.github.com/repos/${owner}/${repoName}/events`, {
        headers: { Authorization: `token ${token}` },
        params: { per_page: 15 }
      });

      res.json(response.data);
    } catch (error: any) {
      console.error("Activity Fetch Error:", error.response?.data || error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/report/download", async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    try {
      const userDoc = await db.collection("users").doc(userId as string).get();
      if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

      const progressDoc = await db.collection("progress").doc(userId as string).get();
      const progress = progressDoc.exists ? progressDoc.data() : null;

      const submissionsSnap = await db.collection("submissions")
        .where("userId", "==", userId)
        .orderBy("timestamp", "desc")
        .limit(10)
        .get();
      
      const submissions = submissionsSnap.docs.map(doc => doc.data());
      const userData = userDoc.data();

      // Start PDF Generation
      const doc = new PDFDocument({ margin: 50 });
      const filename = `Report_${userId}_${Date.now()}.pdf`;

      const chunks: any[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const result = Buffer.concat(chunks);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", result.length);
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
        res.send(result);
      });

      // Header
      doc.fillColor("#4F46E5").fontSize(26).text("CodeMentorAI", { align: "left" });
      doc.fillColor("#6B7280").fontSize(10).text("Personal Performance Report", { align: "right" }).moveDown();
      doc.strokeColor("#E5E7EB").lineWidth(1).moveTo(50, 85).lineTo(550, 85).stroke();

      // User Details Section
      doc.moveDown(2);
      doc.fillColor("#111827").fontSize(16).text("User Profile", { underline: true });
      doc.moveDown(0.5);
      doc.fillColor("#374151").fontSize(12);
      doc.text(`Name: ${userData?.displayName || "N/A"}`);
      doc.text(`Email: ${userData?.email || "N/A"}`);
      if (userData?.github?.username) {
        doc.text(`GitHub: @${userData.github.username}`);
      }
      doc.text(`Join Date: ${new Date(progress?.joinDate || Date.now()).toLocaleDateString()}`);

      // Performance Summary
      doc.moveDown(2);
      doc.fillColor("#111827").fontSize(16).text("Performance Summary", { underline: true });
      doc.moveDown(0.5);
      
      const summaryData = [
        `Solved Problems: ${progress?.solvedProblems?.length || 0}`,
        `Accuracy: ${progress?.accuracy || 0}%`,
        `Total XP: ${progress?.xp || 0}`,
        `Current Level: ${progress?.level || 1}`,
        `Streak: ${progress?.streak || 0} days`
      ];
      summaryData.forEach(line => doc.fillColor("#374151").fontSize(12).text(`• ${line}`));

      // AI Usage Section
      doc.moveDown(2);
      doc.fillColor("#111827").fontSize(16).text("AI & Behavioral Analytics", { underline: true });
      doc.moveDown(1);

      const aiStats = progress?.aiUsageStats || {};
      const authScore = progress?.authenticityScore || 0;

      // Draw a simple bar for AI Dependency
      doc.fontSize(10).fillColor("#6B7280").text("AI Dependency Score:");
      doc.rect(50, doc.y + 5, 200, 15).fill("#F3F4F6");
      doc.rect(50, doc.y + 5, (200 * (100 - authScore)) / 100, 15).fill("#EF4444");
      doc.moveDown(2);

      doc.fontSize(12).fillColor("#374151");
      doc.text(`Original Thinking Score: ${authScore}%`);
      doc.text(`Total AI Hints Used: ${aiStats.totalHintsTaken || 0}`);
      doc.text(`Solutions Viewed: ${aiStats.totalSolutionsViewed || 0}`);

      // Topic-wise Performance
      doc.moveDown(2);
      doc.fillColor("#111827").fontSize(16).text("Topic-wise Mastery", { underline: true });
      doc.moveDown(0.5);

      const topics = progress?.topicStats || {};
      const sortedTopics = Object.entries(topics).sort((a, b) => (b[1] as number) - (a[1] as number));

      if (sortedTopics.length > 0) {
        sortedTopics.forEach(([topic, count]) => {
          doc.fontSize(11).fillColor("#374151").text(`${topic}: ${count} problems mastered`);
        });
      } else {
        doc.fontSize(11).fillColor("#9CA3AF").text("No topic data available yet.");
      }

      // Recent Activity Table
      doc.addPage();
      doc.fillColor("#111827").fontSize(16).text("Recent Submissions", { underline: true });
      doc.moveDown(1);

      if (submissions && submissions.length > 0) {
        const headers = ["Problem", "Status", "Language", "Time", "AI Score"];
        const xPos = [50, 150, 250, 350, 450];
        
        // Draw Headers
        const headerY = doc.y;
        doc.fontSize(10).font("Helvetica-Bold").fillColor("#111827");
        headers.forEach((h, i) => {
          doc.text(h, xPos[i], headerY, { width: 90 });
        });
        
        doc.moveDown(0.5);
        doc.strokeColor("#E5E7EB").lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        // Draw Rows
        doc.font("Helvetica").fontSize(9).fillColor("#374151");
        submissions.forEach(s => {
          const rowY = doc.y;
          // Guard against too many rows on one page
          if (rowY > 700) {
            doc.addPage();
            // Re-draw headers would be nice but let's keep it simple for now
          }
          
          const problemId = (s.problemId || "N/A").substring(0, 8);
          const status = (s.status || "N/A").toUpperCase();
          const language = s.language || "N/A";
          const time = s.timeSpentMs ? `${(s.timeSpentMs / 1000 / 60).toFixed(1)}m` : "N/A";
          const aiScore = s.aiDependencyScore !== undefined ? `${s.aiDependencyScore}%` : "N/A";

          doc.text(problemId, xPos[0], rowY, { width: 90 });
          doc.text(status, xPos[1], rowY, { width: 90 });
          doc.text(language, xPos[2], rowY, { width: 90 });
          doc.text(time, xPos[3], rowY, { width: 90 });
          doc.text(aiScore, xPos[4], rowY, { width: 90 });
          
          doc.moveDown();
        });
      } else {
        doc.fontSize(12).fillColor("#9CA3AF").text("No submissions found.");
      }

      // Footer
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor("#9CA3AF").text(
          `Report Generated on ${new Date().toLocaleString()} | CodeMentorAI Performance Lab | Page ${i + 1} of ${pages.count}`,
          50,
          750,
          { align: "center", width: 500 }
        );
      }

      doc.end();

    } catch (error: any) {
      console.error("PDF Generation Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  async function runTestCases(code: string, language: string, testCases: any[]) {
    const results = [];
    const runId = uuidv4();
    const tempDir = path.join(os.tmpdir(), `code-${runId}`);
    
    try {
      await fs.mkdir(tempDir, { recursive: true });
      
      for (const testCase of testCases) {
        const { input, expectedOutput, hidden } = testCase;
        try {
          const output = await executeCode(code, language, input, tempDir);
          const passed = output.trim() === expectedOutput.trim();
          results.push({
            input: hidden ? "[Hidden]" : input,
            expectedOutput,
            actualOutput: output,
            passed,
            hidden
          });
        } catch (error: any) {
          results.push({
            input: hidden ? "[Hidden]" : input,
            expectedOutput,
            actualOutput: error.message,
            passed: false,
            error: true,
            hidden
          });
        }
      }
    } finally {
      // Cleanup temp directory
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
    return results;
  }

  async function getGitHubToken(userId: string) {
    const tokenDoc = await db.collection("github_tokens").doc(userId).get();
    return tokenDoc.exists ? tokenDoc.data()?.accessToken : null;
  }

  function getFileExtension(lang: string) {
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
  }

  async function pushToGitHub(userId: string, problemTitle: string, language: string, code: string, stats: any) {
    const token = await getGitHubToken(userId);
    if (!token) return;

    const repoName = "codementorai-solutions";
    const filename = `${problemTitle.toLowerCase().replace(/\s+/g, '-')}.${getFileExtension(language)}`;
    const branch = stats.branch || "main";
    
    const headers = { Authorization: `token ${token}` };

    try {
      const userRes = await axios.get("https://api.github.com/user", { headers });
      const username = userRes.data.login;

      try {
        await axios.get(`https://api.github.com/repos/${username}/${repoName}`, { headers });
      } catch (e: any) {
        if (e.response?.status === 404) {
          await axios.post("https://api.github.com/user/repos", {
            name: repoName,
            description: "Solutions to problems solved on CodeMentorAI",
            private: false,
            auto_init: true
          }, { headers });
          await new Promise(r => setTimeout(r, 2000));
        } else {
          throw e;
        }
      }

      let sha;
      try {
        const file = await axios.get(`https://api.github.com/repos/${username}/${repoName}/contents/${filename}`, { 
          headers,
          params: { ref: branch } 
        });
        sha = file.data.sha;
      } catch (e) {}

      const commitMessage = `✅ Solved: ${problemTitle} (${language}) | 🤖 AI Usage: ${stats.aiUsage}% | ⏱️ Time: ${stats.timeSpent}`;
      
      await axios.put(`https://api.github.com/repos/${username}/${repoName}/contents/${filename}`, {
        message: commitMessage,
        content: Buffer.from(code).toString('base64'),
        sha,
        branch
      }, { headers });

      await db.collection("users").doc(userId).update({
        "github.totalCommits": admin.firestore.FieldValue.increment(1),
        "github.lastCommitAt": new Date().toISOString(),
        "github.lastSyncStatus": "success",
        "github.lastError": null
      });
    } catch (error: any) {
      console.error("GitHub Push Error:", error.response?.data || error.message);
      
      let errorMsg = "An unknown error occurred during GitHub sync.";
      if (error.response) {
        switch (error.response.status) {
          case 401: errorMsg = "GitHub authentication failed. Please reconnect your account."; break;
          case 403: errorMsg = "GitHub rate limit exceeded or access denied."; break;
          case 422: errorMsg = "GitHub validation failed (this can happen if the file is too large or already exists with same content)."; break;
          default: errorMsg = `GitHub API Error: ${error.response.data?.message || error.response.statusText}`;
        }
      } else if (error.request) {
        errorMsg = "Could not reach GitHub. Network error.";
      } else {
        errorMsg = error.message;
      }

      await db.collection("users").doc(userId).update({
        "github.lastSyncStatus": "failed",
        "github.lastError": errorMsg,
        "github.lastSyncAt": new Date().toISOString()
      }).catch(e => console.error("Failed to update user sync status in Firestore:", e));
    }
  }

  async function executeCode(code: string, language: string, input: string, tempDir: string): Promise<string> {
    const timeout = 5000;
    
    switch (language) {
      case "python":
        return runCommand("python3", ["-c", code], input, timeout);
      case "javascript":
        return runCommand("node", ["-e", code], input, timeout);
      case "ruby":
        return runCommand("ruby", ["-e", code], input, timeout);
      case "java": {
        const filePath = path.join(tempDir, "Main.java");
        await fs.writeFile(filePath, code);
        try {
          return await runCommand("java", [filePath], input, timeout);
        } catch (err: any) {
          if (err.message.includes("ENOENT")) {
            throw new Error("Java runtime (java) was not found in the preview environment. Java is only supported when running the app locally with a JDK installed.");
          }
          throw err;
        }
      }
      case "c": {
        const filePath = path.join(tempDir, "prog.c");
        const binPath = path.join(tempDir, "prog.out");
        await fs.writeFile(filePath, code);
        await runCommand("gcc", [filePath, "-o", binPath], "", 5000);
        return runCommand(binPath, [], input, timeout);
      }
      case "cpp": {
        const filePath = path.join(tempDir, "prog.cpp");
        const binPath = path.join(tempDir, "prog.out");
        await fs.writeFile(filePath, code);
        await runCommand("g++", [filePath, "-o", binPath], "", 5000);
        return runCommand(binPath, [], input, timeout);
      }
      default:
        throw new Error(`Language ${language} is not supported yet.`);
    }
  }

  function runCommand(command: string, args: string[], input: string, timeout: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args);
      let output = "";
      let errorOutput = "";

      if (input) {
        process.stdin.write(input);
        process.stdin.end();
      }

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      process.on("close", (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(errorOutput || `Process exited with code ${code}`));
        }
      });

      const timer = setTimeout(() => {
        process.kill();
        reject(new Error("Execution timed out (5s)"));
      }, timeout);

      process.on("error", (err: any) => {
        clearTimeout(timer);
        if (err.code === "ENOENT") {
          reject(new Error(`The '${command}' environment is not installed or not in the PATH in this environment. Please ensure you have the necessary compilers/runtimes installed, or try another language.`));
        } else {
          reject(err);
        }
      });
    });
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
