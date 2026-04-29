import React, { useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { Code2, LogIn, UserPlus, Mail, Lock, User as UserIcon, ArrowRight } from "lucide-react";
import { cn } from "../lib/utils";

export default function Login() {
  const { login, loginWithEmail, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isRegistering) {
        if (!name.trim()) throw new Error("Name is required");
        await register(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#E5E7EB] p-10 shadow-xl space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-[#4F46E5] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Code2 size={36} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">CodeMentor AI</h1>
          <p className="text-[#6B7280]">
            {isRegistering 
              ? "Join our community of developers and start your journey." 
              : "Master programming through guided problem-solving and AI-powered mentorship."}
          </p>
        </div>

        <div className="flex p-1 bg-[#F3F4F6] rounded-2xl">
          <button
            onClick={() => { setIsRegistering(false); setError(""); }}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
              !isRegistering ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#6B7280] hover:text-[#1A1A1A]"
            )}
          >
            Login
          </button>
          <button
            onClick={() => { setIsRegistering(true); setError(""); }}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
              isRegistering ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#6B7280] hover:text-[#1A1A1A]"
            )}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={18} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-12 pr-4 py-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 font-medium ml-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#4F46E5] text-white py-4 rounded-2xl font-bold hover:bg-[#4338CA] transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isRegistering ? "Create Account" : "Sign In"}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E5E7EB]"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-[#9CA3AF] font-bold">Or continue with</span>
          </div>
        </div>

        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-3 bg-white border border-[#E5E7EB] px-6 py-4 rounded-2xl font-bold hover:bg-[#F9FAFB] transition-all shadow-sm group"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Google
          <LogIn size={18} className="text-[#6B7280] group-hover:text-[#1A1A1A] transition-colors" />
        </button>

        <p className="text-xs text-[#9CA3AF] text-center">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
