import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import ProblemView from "./components/ProblemView";
import ChatAssistant from "./components/ChatAssistant";
import Login from "./components/Login";
import ErrorBoundary from "./components/ErrorBoundary";

import Forum from "./components/Forum";

import AdminDashboard from "./components/AdminDashboard";
import ContestList from "./components/ContestList";
import ContestView from "./components/ContestView";
import SubmissionHistory from "./components/SubmissionHistory";
import Profile from "./components/Profile";
import InterviewerDashboard from "./components/InterviewerDashboard";
import CurriculumMap from "./components/CurriculumMap";
import Battleground from "./components/Battleground";
import BattleRoom from "./components/BattleRoom";

import { doc, getDocFromCache, getDocFromServer } from "firebase/firestore";
import { db } from "./services/firebase";

async function testConnection() {
  try {
    // Try to reach the server to confirm connectivity
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firestore connection test: SUCCESS");
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.error("Firestore connection test: FAILED - Client is offline. Please check your Firebase configuration.");
    } else {
      console.error("Firestore connection test: FAILED - ", error);
    }
  }
}

function AppRoutes() {
  const { user, loading } = useAuth();

  React.useEffect(() => {
    testConnection();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-10 h-10 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/problems" element={<Dashboard />} />
        <Route path="/problem/:id" element={<ProblemView />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/contests" element={<ContestList />} />
        <Route path="/contest/:id" element={<ContestView />} />
        <Route path="/battleground" element={<Battleground />} />
        <Route path="/battle/:id" element={<BattleRoom />} />
        <Route path="/submissions" element={<SubmissionHistory />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/curriculum" element={<CurriculumMap />} />
        <Route path="/interviewer" element={<InterviewerDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ChatAssistant />
    </Layout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
