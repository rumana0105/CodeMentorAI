import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, User, LogOut, Code2, Settings, Users, Sun, Moon, Trophy, Map as MapIcon, Swords, Github } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "./AuthProvider";
import { useTheme } from "./ThemeProvider";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

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

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0F172A] flex text-[#1A1A1A] dark:text-[#F8F9FA] font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#1E293B] border-r border-[#E5E7EB] dark:border-[#334155] flex flex-col transition-colors duration-300">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4F46E5] rounded-xl flex items-center justify-center text-white">
            <Code2 size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight">CodeMentor</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const content = (
              <>
                <item.icon
                  size={20}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-[#4F46E5] dark:text-[#818CF8]" : "text-[#9CA3AF] dark:text-[#64748B] group-hover:text-[#1A1A1A] dark:group-hover:text-white"
                  )}
                />
                {item.name}
              </>
            );
            const className = cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive
                ? "bg-[#EEF2FF] dark:bg-[#312E81] text-[#4F46E5] dark:text-[#818CF8] font-medium"
                : "text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] hover:text-[#1A1A1A] dark:hover:text-white"
            );

            if (item.external) {
              return (
                <a key={item.path} href={item.path} target="_blank" rel="noopener noreferrer" className={className}>
                  {content}
                </a>
              );
            }

            return (
              <Link key={item.path} to={item.path} className={className}>
                {content}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E5E7EB] dark:border-[#334155] space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] hover:text-[#1A1A1A] dark:hover:text-white rounded-xl transition-all duration-200 group"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#FEF2F2] dark:hover:bg-[#452222] hover:text-[#EF4444] rounded-xl transition-all duration-200 group"
          >
            <LogOut size={20} className="group-hover:text-[#EF4444]" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white dark:bg-[#1E293B] border-b border-[#E5E7EB] dark:border-[#334155] flex items-center justify-between px-8 sticky top-0 z-10 transition-colors duration-300">
          <h1 className="text-lg font-semibold">
            {navItems.find((n) => n.path === location.pathname)?.name || "Problem Solving"}
          </h1>
          <Link to="/profile" className="flex items-center gap-4 hover:opacity-80 transition-opacity group">
            <div className="text-right">
              <p className="text-sm font-bold group-hover:text-[#4F46E5] transition-colors">{profile?.displayName || "Learner"}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#6B7280] dark:text-[#94A3B8]">Level {profile?.level || 1} • {profile?.xp || 0} XP</p>
            </div>
            <div className="w-10 h-10 bg-[#F3F4F6] dark:bg-[#334155] rounded-2xl border-2 border-white dark:border-[#475569] shadow-sm overflow-hidden transition-transform group-hover:scale-110">
              <img
                src={profile?.photoURL || user?.photoURL || "https://picsum.photos/seed/user/100/100"}
                alt="Avatar"
                referrerPolicy="no-referrer"
              />
            </div>
          </Link>
        </header>
        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
