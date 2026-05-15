import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { INITIAL_PROBLEMS } from './src/constants.js';

import admin from "firebase-admin";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import os from "os";
import axios from "axios";
import puppeteer from "puppeteer";
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
    const { results, meta } = await runTestCases(code, language, testCases);
    res.json({ results, meta });
  });

  // AI Endpoints
  app.post("/api/debug", async (req, res) => {
    try {
      const { code, language, input, beginnerMode } = req.body;
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const isBeginner = !!beginnerMode;

      const prompt = `
        You are a code debugger for an educational coding platform.
        
        Mode: ${isBeginner ? "BEGINNER" : "ADVANCED"}
        Language: ${language}
        
        Code:
        ${code}
        
        Input:
        ${input}
        
        For each step, provide:
        - line: current line number (number)
        - locals: current value of all active variables (JSON-like object)
        - output: any output produced up to this point (string; may be empty)
        ${isBeginner ? "- explanation: 1-2 sentence beginner explanation of what just happened" : ""}
        
        Output format:
        Return ONLY a JSON object with:
        - "steps": an array of step objects
        Max 20 steps.
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

    if (!code || !language || !problemId) {
      return res.status(400).json({ success: false, message: "Invalid code input. Please provide code, language, and problem ID." });
    }

    try {
      let problemData: any = null;
      let hiddenTestCases: any[] = [];
      let publicTestCases: any[] = [];

      try {
        const problemDoc = await db.collection("problems").doc(problemId).get();
        if (problemDoc.exists) {
          problemData = problemDoc.data();
          publicTestCases = problemData?.testCases || [];
          const hiddenDoc = await db.collection("problems").doc(problemId).collection("private").doc("test_cases").get();
          hiddenTestCases = hiddenDoc.exists ? (hiddenDoc.data()?.cases || []) : [];
        }
      } catch (dbError) {
        console.warn("Firestore error while fetching problem, falling back to local constants.");
      }

      // Fallback to local INITIAL_PROBLEMS
      if (!problemData) {
        const localProblem = INITIAL_PROBLEMS.find(p => p.id === problemId);
        if (!localProblem) {
          return res.status(404).json({ success: false, message: "Problem not found." });
        }
        problemData = localProblem;
        publicTestCases = localProblem.testCases || [];
        hiddenTestCases = []; // No hidden cases locally
      }

      const allTestCases = [...publicTestCases, ...hiddenTestCases];
      
      if (allTestCases.length === 0) {
        return res.status(400).json({ success: false, message: "No test cases configured for this problem." });
      }

      let results;
      try {
        const testResult = await runTestCases(code, language, allTestCases);
        results = testResult.results;
      } catch (execError: any) {
        return res.status(500).json({ success: false, message: `Code execution failed: ${execError.message || "Unknown execution error"}` });
      }

      const allPassed = results.every((r: any) => r.passed);

      if (allPassed && req.body.userId && !req.body.interviewMode) {
        // Trigger GitHub Sync in background
        const problemTitle = problemData?.title || "Solution";
        pushToGitHub(req.body.userId, problemTitle, language, code, {
          aiUsage: req.body.aiUsage || 0,
          timeSpent: req.body.timeSpent || "N/A",
          branch: req.body.branch || "main"
        }).catch(err => console.error("GitHub Sync Error:", err));
      }

      res.json({
        success: true,
        results: results.map((r: any) => ({
          ...r,
          expectedOutput: r.hidden ? "[Hidden]" : r.expectedOutput,
          actualOutput: r.hidden
            ? (r.environmentError ? r.actualOutput : "[Hidden]")
            : r.actualOutput,
          errorLogs: r.hidden
            ? (r.environmentError ? r.errorLogs : "[Hidden]")
            : r.errorLogs,
        })),
        allPassed
      });
    } catch (error: any) {
      console.error("Server error during submission:", error);
      res.status(500).json({ success: false, message: "Server error, please try again." });
    }
  });

  // Logging Endpoint
  app.post("/api/log", (req, res) => {
    const { error, context } = req.body;
    console.error(`[Frontend Log - ${context}]:`, error);
    res.json({ success: true });
  });

  // API Route for Fetching Submissions
  app.get("/api/submissions/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID required" });
      }

      const submissionsSnap = await db.collection("submissions")
        .where("userId", "==", userId)
        .get();

      const submissions = submissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      submissions.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      res.json({ success: true, submissions });
    } catch (error: any) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ success: false, error: error.message });
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

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&prompt=consent`;
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
        .get();

      let submissions = submissionsSnap.docs.map(doc => doc.data());
      submissions.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      submissions = submissions.slice(0, 10);
      const userData = userDoc.data();

      // Start PDF Generation using Puppeteer
      const authScore = progress?.authenticityScore || 0;
      const aiDependencyScore = 100 - authScore;
      const topics = progress?.topicStats || {};
      const sortedTopics = Object.entries(topics).sort((a, b) => (b[1] as number) - (a[1] as number));
      const topicLabels = sortedTopics.map(t => t[0]);
      const topicData = sortedTopics.map(t => t[1]);

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body { font-family: 'Inter', sans-serif; color: #111827; margin: 0; padding: 40px; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #E5E7EB; padding-bottom: 20px; margin-bottom: 30px; }
            .header-left h1 { color: #4F46E5; margin: 0; font-size: 32px; font-weight: 800; }
            .header-left p { margin: 5px 0 0; color: #6B7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
            .header-right { text-align: right; color: #4B5563; font-size: 14px; line-height: 1.5; }
            .section-title { font-size: 20px; font-weight: 800; color: #111827; margin-top: 40px; margin-bottom: 20px; border-bottom: 1px solid #E5E7EB; padding-bottom: 10px; }
            .grid-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
            .card { background: #F9FAFB; border: 1px solid #E5E7EB; padding: 20px; border-radius: 12px; text-align: center; }
            .card .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6B7280; margin-bottom: 8px; font-weight: 600; }
            .card .value { font-size: 28px; font-weight: 800; color: #4F46E5; margin: 0; }
            .charts-wrapper { display: flex; gap: 30px; margin-bottom: 40px; }
            .chart-box { flex: 1; padding: 20px; background: #F9FAFB; border-radius: 12px; border: 1px solid #E5E7EB; text-align: center; }
            .chart-box h3 { margin: 0 0 15px; font-size: 14px; color: #374151; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
            .chart-container { position: relative; height: 250px; width: 100%; display: flex; justify-content: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; margin-bottom: 40px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; }
            th { background: #F3F4F6; font-weight: 600; color: #374151; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; }
            tr:nth-child(even) { background: #F9FAFB; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
            .badge-success { background: #D1FAE5; color: #065F46; }
            .badge-error { background: #FEE2E2; color: #991B1B; }
            .weak-areas { background: #FEF2F2; border: 1px solid #FCA5A5; padding: 20px; border-radius: 12px; margin-bottom: 40px; }
            .weak-areas h3 { color: #991B1B; margin: 0 0 10px; font-size: 16px; }
            .weak-areas p { color: #7F1D1D; margin: 0; font-size: 14px; }
            .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 20px; }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              <h1>CodeMentorAI</h1>
              <p>Performance Analytics Report</p>
            </div>
            <div class="header-right">
              <strong>${userData?.displayName || "Developer"}</strong><br>
              ${userData?.email || "No Email"}<br>
              Generated: ${new Date().toLocaleDateString()}
            </div>
          </div>

          <div class="grid-cards">
            <div class="card">
              <div class="label">Total Solved</div>
              <div class="value">${progress?.solvedProblems?.length || 0}</div>
            </div>
            <div class="card">
              <div class="label">Accuracy</div>
              <div class="value">${progress?.accuracy || 0}%</div>
            </div>
            <div class="card">
              <div class="label">AI Dependency</div>
              <div class="value">${aiDependencyScore}%</div>
            </div>
            <div class="card">
              <div class="label">Original Thinking</div>
              <div class="value">${authScore}%</div>
            </div>
          </div>

          <div class="section-title">Visual Analytics</div>
          <div class="charts-wrapper">
            <div class="chart-box">
              <h3>AI vs Manual Usage</h3>
              <div class="chart-container">
                <canvas id="aiChart"></canvas>
              </div>
            </div>
            <div class="chart-box">
              <h3>Topic-wise Mastery</h3>
              <div class="chart-container">
                <canvas id="topicChart"></canvas>
              </div>
            </div>
          </div>

          <div class="section-title">Topic-wise Performance</div>
          <table>
            <tr><th>Topic</th><th>Problems Mastered</th></tr>
            ${sortedTopics.map(([t, c]) => `<tr><td><span style="font-weight: 600; text-transform: capitalize; color: #4F46E5;">${t}</span></td><td>${c}</td></tr>`).join('')}
            ${sortedTopics.length === 0 ? '<tr><td colspan="2">No topic data available</td></tr>' : ''}
          </table>

          ${sortedTopics.length > 0 ? `
            <div class="weak-areas">
              <h3>Recommendations for Improvement</h3>
              <p>Based on your analytics, you should focus more on practicing <strong>${sortedTopics[sortedTopics.length - 1][0]}</strong> and <strong>${sortedTopics.length > 1 ? sortedTopics[sortedTopics.length - 2][0] : 'related topics'}</strong> to balance your mastery distribution.</p>
            </div>
          ` : ''}

          <div style="page-break-before: always;"></div>
          <div class="section-title">Recent Submissions</div>
          <table>
            <tr><th>Problem ID</th><th>Language</th><th>Status</th><th>AI Hint Score</th><th>Date</th></tr>
            ${submissions.map((s: any) => `
              <tr>
                <td style="font-family: monospace;">${(s.problemId || "N/A").substring(0, 12)}</td>
                <td style="text-transform: capitalize;">${s.language || "N/A"}</td>
                <td><span class="badge ${s.status === 'accepted' ? 'badge-success' : 'badge-error'}">${(s.status || "N/A").replace('_', ' ').toUpperCase()}</span></td>
                <td>${s.aiDependencyScore !== undefined ? s.aiDependencyScore + '%' : 'N/A'}</td>
                <td>${new Date(s.timestamp || Date.now()).toLocaleDateString()}</td>
              </tr>
            `).join('')}
            ${submissions.length === 0 ? '<tr><td colspan="5">No recent submissions</td></tr>' : ''}
          </table>

          <div class="footer">
            Generated by CodeMentorAI Engine &copy; ${new Date().getFullYear()} | This document contains automated behavioral analytics.
          </div>

          <script>
            // Ensure Chart.js renders immediately without animations so Puppeteer captures it perfectly
            Chart.defaults.animation = false;
            
            new Chart(document.getElementById('aiChart'), {
              type: 'doughnut',
              data: {
                labels: ['Original Thinking', 'AI Dependent'],
                datasets: [{
                  data: [${authScore}, ${aiDependencyScore}],
                  backgroundColor: ['#4F46E5', '#EF4444'],
                  borderWidth: 0
                }]
              },
              options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
            });

            new Chart(document.getElementById('topicChart'), {
              type: 'bar',
              data: {
                labels: ${JSON.stringify(topicLabels)},
                datasets: [{
                  label: 'Problems Solved',
                  data: ${JSON.stringify(topicData)},
                  backgroundColor: '#4F46E5',
                  borderRadius: 4
                }]
              },
              options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
              }
            });
          </script>
        </body>
        </html>
      `;

      try {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({ 
          format: 'A4', 
          printBackground: true, 
          margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' } 
        });
        
        await browser.close();

        const filename = `Report_${userId}_${Date.now()}.pdf`;
        const nodeBuffer = Buffer.from(pdfBuffer);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", nodeBuffer.length.toString());
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
        res.send(nodeBuffer);
      } catch (pdfErr: any) {
        console.error("Puppeteer PDF Error:", pdfErr);
        res.status(500).json({ error: "Failed to generate PDF report" });
      }

    } catch (error: any) {
      console.error("PDF Generation Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  class ExecutionEnvironmentError extends Error {
    public environmentError = true;
    constructor(message: string) {
      super(message);
      this.name = "ExecutionEnvironmentError";
    }
  }

  class ExecutionTimeoutError extends Error {
    public timedOut = true;
    constructor(message: string) {
      super(message);
      this.name = "ExecutionTimeoutError";
    }
  }

  async function runTestCases(code: string, language: string, testCases: any[]) {
    const results: any[] = [];
    const startedAt = Date.now();
    const runId = uuidv4();
    const tempDir = path.join(os.tmpdir(), `code-${runId}`);

    try {
      await fs.mkdir(tempDir, { recursive: true });

      let environmentFailed: ExecutionEnvironmentError | null = null;
      for (const testCase of testCases) {
        const { input, expectedOutput, hidden } = testCase;
        try {
          if (environmentFailed) {
            results.push({
              input: hidden ? "[Hidden]" : input,
              expectedOutput,
              actualOutput: "",
              errorLogs: environmentFailed.message,
              passed: false,
              hidden,
              environmentError: true,
              timedOut: false,
            });
            continue;
          }

          const { stdout, stderr, durationMs, exitCode } = await executeCode(code, language, input, tempDir);
          const passed = exitCode === 0 && stdout.trim() === expectedOutput.trim();
          results.push({
            input: hidden ? "[Hidden]" : input,
            expectedOutput,
            actualOutput: stdout,
            errorLogs: stderr || "",
            passed,
            error: exitCode !== 0,
            hidden,
            durationMs,
            environmentError: false,
            timedOut: false
          });

        } catch (error: any) {
          if (error instanceof ExecutionEnvironmentError) {
            environmentFailed = error;
          }
          const isEnv = error?.environmentError === true;
          const isTimeout = error?.timedOut === true;

          results.push({
            input: hidden ? "[Hidden]" : input,
            expectedOutput,
            actualOutput: "",
            errorLogs: error?.message || String(error),
            passed: false,
            error: true,
            hidden,
            environmentError: isEnv,
            timedOut: isTimeout,
            durationMs: 0
          });

          if (isEnv) {
            // Avoid spamming attempts for missing runtimes/compilers.
            continue;
          }
        }
      }
    } finally {
      // Cleanup temp directory
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => { });
    }

    return {
      results,
      meta: { totalMs: Date.now() - startedAt, runId }
    };
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
    const filename = `problems/${problemTitle.toLowerCase().replace(/\s+/g, '-')}.${getFileExtension(language)}`;
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
      } catch (e) { }

      const commitMessage = `Solved ${problemTitle} | AI Usage: ${stats.aiUsage}% | Time: ${stats.timeSpent}`;

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

  async function executeCode(
    code: string,
    language: string,
    input: string,
    tempDir: string
  ): Promise<{ stdout: string; stderr: string; exitCode: number | null; durationMs: number }> {
    const timeout = 5000;

    switch (language) {
      case "python":
        return (await runFirstAvailable(
          [
            { command: "python3", args: ["-c", code] },
            { command: "python", args: ["-c", code] },
            { command: "py", args: ["-3", "-c", code] },
            { command: "py", args: ["-c", code] },
          ],
          input,
          timeout
        ));
      case "javascript":
        return runCommand("node", ["-e", code], input, timeout);
      case "ruby":
        return runCommand("ruby", ["-e", code], input, timeout);
      case "java": {
        const filePath = path.join(tempDir, "Main.java");
        await fs.writeFile(filePath, code);
        // Compile then run the class.
        // Note: `javac` may be missing even if `java` exists, depending on the environment.
        const compile = await runCommand("javac", ["Main.java"], "", timeout, { cwd: tempDir });
        if (compile.exitCode !== 0) {
          const msg = compile.stderr || compile.stdout || "Java compilation failed.";
          throw new Error(msg);
        }
        return runCommand("java", ["-cp", tempDir, "Main"], input, timeout);
      }
      case "c": {
        const filePath = path.join(tempDir, "prog.c");
        const binPath = path.join(
          tempDir,
          `prog.out${process.platform === "win32" ? ".exe" : ""}`
        );
        await fs.writeFile(filePath, code);
        const compile = await runCommand("gcc", [filePath, "-o", binPath], "", 5000);
        if (compile.exitCode !== 0) throw new Error(compile.stderr || "C compilation failed.");
        return runCommand(binPath, [], input, timeout);
      }
      case "cpp": {
        const filePath = path.join(tempDir, "prog.cpp");
        const binPath = path.join(
          tempDir,
          `prog.out${process.platform === "win32" ? ".exe" : ""}`
        );
        await fs.writeFile(filePath, code);
        const compile = await runCommand("g++", [filePath, "-o", binPath], "", 5000);
        if (compile.exitCode !== 0) throw new Error(compile.stderr || "C++ compilation failed.");
        return runCommand(binPath, [], input, timeout);
      }
      default:
        throw new Error(`Language ${language} is not supported yet.`);
    }
  }

  async function runFirstAvailable(
    candidates: { command: string; args: string[] }[],
    input: string,
    timeout: number
  ) {
    let lastErr: any = null;
    const tried: string[] = [];

    for (const c of candidates) {
      tried.push(c.command);
      try {
        const res = await runCommand(c.command, c.args, input, timeout);
        // Handle Windows Store app execution alias intercepting python commands
        if (res.exitCode === 9009 && res.stderr.includes("Microsoft Store")) {
          throw new ExecutionEnvironmentError("Windows Store alias intercepted python");
        }
        return res;
      } catch (err: any) {
        lastErr = err;
        // Environment missing: try next candidate.
        if (err instanceof ExecutionEnvironmentError) continue;
        // Runtime error: do not try other executables (it would still be the same code).
        throw err;
      }
    }

    const base = lastErr?.message || "Requested runtime not available.";
    throw new ExecutionEnvironmentError(
      `Execution Environment Error – Retry: Python runtime not found (tried: ${tried.join(", ") || "unknown"}). ${base}`
    );
  }

  function runCommand(
    command: string,
    args: string[],
    input: string,
    timeout: number,
    opts?: { cwd?: string }
  ): Promise<{ stdout: string; stderr: string; exitCode: number | null; durationMs: number }> {
    return new Promise((resolve, reject) => {
      const startedAt = Date.now();
      const child = spawn(command, args, { cwd: opts?.cwd });
      let stdout = "";
      let stderr = "";

      if (input) {
        child.stdin.write(input);
      }
      child.stdin.end();

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      let timer: NodeJS.Timeout | null = null;
      const clearTimer = () => {
        if (timer) clearTimeout(timer);
        timer = null;
      };

      const finish = (exitCode: number | null) => {
        clearTimer();
        resolve({
          stdout,
          stderr,
          exitCode,
          durationMs: Date.now() - startedAt
        });
      };

      child.on("close", (code) => finish(code ?? null));

      timer = setTimeout(() => {
        try {
          child.kill();
        } catch { }
        reject(new ExecutionTimeoutError("Execution timed out (5s)"));
      }, timeout);

      child.on("error", (err: any) => {
        clearTimer();
        if (err.code === "ENOENT") {
          reject(
            new ExecutionEnvironmentError(
              `The '${command}' environment is not installed or not in the PATH in this environment. Please ensure you have the necessary compilers/runtimes installed, or try another language.`
            )
          );
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
