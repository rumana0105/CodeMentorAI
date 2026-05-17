import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, User, LogOut, Code2, Settings, Users, Sun, Moon, Trophy, Map as MapIcon, Swords, Github, Menu, X } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "./AuthProvider";
import { useTheme } from "./ThemeProvider";
import { AnimatePresence, motion } from "motion/react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: { name: string; path: string; icon: any; external?: boolean }[] = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Curriculum", path: "/curriculum", icon: MapIcon },
    { name: "Problems", path: "/problems", icon: BookOpen },
    { name: "My Submissions", path: "/submissions", icon: Code2 },
    { name: "Battleground", path: "/battleground", icon: Swords },
    { name: "Contests", path: "/contests", icon: Trophy },
    { name: "Community", path: "/forum", icon: Users },
    { name: "Profile", path: "/profile", icon: User },
  ];

  if (profile?.github) {
    navItems.push({ name: "GitHub Portfolio", path: profile.github.profileUrl, icon: Github, external: true });
  }

  if (profile?.role === "admin" || user?.email === "jagirdarrumana22@gmail.com") {
    navItems.push({ name: "Admin", path: "/admin", icon: Settings });
  }

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#bc13fe] to-[#45f3ff] rounded-xl flex items-center justify-center text-[#0b0c10] shadow-[0_0_15px_rgba(188,19,254,0.3)]">
            <Code2 size={24} />
          </div>
          <span className="font-black text-xl tracking-tight text-white">CodeMentor</span>
        </div>
        {/* Mobile Close Button */}
        <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
          <X size={24} />
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const content = (
            <>
              <item.icon
                size={20}
                className={cn(
                  "transition-colors",
                  isActive ? "text-[#45f3ff]" : "text-gray-500 group-hover:text-white"
                )}
              />
              <span className="font-bold tracking-wide">{item.name}</span>
            </>
          );
          const className = cn(
            "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
            isActive
              ? "bg-[#0b0c10] text-[#45f3ff] shadow-[inset_0_0_20px_rgba(69,243,255,0.05)] border border-white/5"
              : "text-gray-400 hover:bg-[#0b0c10]/50 hover:text-white border border-transparent"
          );

          if (item.external) {
            return (
              <a key={item.path} href={item.path} target="_blank" rel="noopener noreferrer" className={className} onClick={() => setIsMobileMenuOpen(false)}>
                {content}
              </a>
            );
          }

          return (
            <Link key={item.path} to={item.path} className={className} onClick={() => setIsMobileMenuOpen(false)}>
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#45f3ff] shadow-[0_0_10px_rgba(69,243,255,0.5)]" />}
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-[#0b0c10]/50 hover:text-white rounded-xl transition-all duration-200 group font-bold"
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-red-500/10 hover:text-[#ff007f] rounded-xl transition-all duration-200 group font-bold"
        >
          <LogOut size={20} className="group-hover:text-[#ff007f]" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0b0c10] flex text-[#1A1A1A] dark:text-white font-sans transition-colors duration-300 selection:bg-[#bc13fe]/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-white dark:bg-[#1f2833] border-r border-[#E5E7EB] dark:border-white/10 flex-col transition-colors duration-300 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-[#1f2833] border-r border-white/10 flex flex-col z-50 md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 bg-white/80 dark:bg-[#0b0c10]/80 backdrop-blur-lg border-b border-[#E5E7EB] dark:border-white/10 flex items-center justify-between px-6 md:px-8 sticky top-0 z-30 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-gray-400 hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={28} />
            </button>
            <h1 className="text-xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              {navItems.find((n) => n.path === location.pathname)?.name || "Problem Solving"}
            </h1>
          </div>
          
          <Link to="/profile" className="flex items-center gap-4 hover:opacity-80 transition-opacity group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold group-hover:text-[#45f3ff] transition-colors">{profile?.displayName || "Learner"}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#bc13fe]">Level {profile?.level || 1} • {profile?.xp || 0} XP</p>
            </div>
            <div className="w-12 h-12 bg-[#1f2833] rounded-2xl border-2 border-transparent group-hover:border-[#45f3ff]/50 shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden transition-all group-hover:scale-110">
              <img
                src={profile?.photoURL || user?.photoURL || "https://picsum.photos/seed/user/100/100"}
                alt="Avatar"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="max-w-7xl mx-auto relative z-10">{children}</div>
        </div>
      </main>
    </div>
  );
}
