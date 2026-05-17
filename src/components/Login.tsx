import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import { 
  Code2, 
  LogIn, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Github, 
  Eye, 
  EyeOff, 
  Sparkles, 
  BrainCircuit, 
  Target, 
  Activity 
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

export default function Login() {
  const { login, loginWithEmail, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Mouse tracking for glow effect
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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

  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return 0;
    let strength = 0;
    if (pass.length > 5) strength += 25;
    if (pass.length > 7) strength += 25;
    if (/[A-Z]/.test(pass)) strength += 25;
    if (/[0-9]/.test(pass)) strength += 25;
    return strength;
  };
  const passwordStrength = getPasswordStrength(password);

  const features = [
    { icon: BrainCircuit, title: "Personalized coding guidance", color: "text-[#7C3AED]" },
    { icon: Sparkles, title: "AI-powered interview preparation", color: "text-[#06B6D4]" },
    { icon: Target, title: "Real-time problem solving", color: "text-[#10B981]" },
    { icon: Activity, title: "Progress tracking", color: "text-[#F59E0B]" },
  ];

  return (
    <div className="min-h-screen bg-[#0B1020] flex overflow-hidden text-white font-sans selection:bg-[#7C3AED]/30 relative">
      {/* Global Mouse Glow Effect */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 opacity-30"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(124, 58, 237, 0.15), transparent 80%)`
        }}
      />

      {/* Left Side: Premium Branding (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden border-r border-white/5 z-10">
        {/* Animated Background Layers */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-30" />
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-[#7C3AED] rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-[#06B6D4] rounded-full mix-blend-screen filter blur-[150px] opacity-10 animate-[pulse_10s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 max-w-xl p-16 w-full flex flex-col justify-center h-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center gap-4 mb-16"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center p-[1px] shadow-[0_0_30px_rgba(124,58,237,0.3)]">
              <div className="w-full h-full bg-[#0B1020] rounded-[15px] flex items-center justify-center">
                <Code2 size={28} className="text-[#06B6D4]" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">CodeMentor AI</h1>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="space-y-8"
          >
            <h2 className="text-5xl xl:text-6xl font-bold leading-[1.1] tracking-tight text-white">
              Master Programming with <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] animate-gradient-x">
                AI Mentorship
              </span>
            </h2>
            
            <div className="space-y-5 pt-4">
              {features.map((feature, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + (idx * 0.1) }}
                  className="flex items-center gap-4 group"
                >
                  <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:bg-white/10`}>
                    <feature.icon size={18} className={feature.color} />
                  </div>
                  <span className="text-lg text-gray-300 font-medium group-hover:text-white transition-colors">{feature.title}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Floating Code Snippet */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotate: -5 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            transition={{ duration: 1, delay: 0.8, type: "spring" }}
            whileHover={{ rotate: 0, scale: 1.02 }}
            className="absolute -right-16 bottom-24 w-80 bg-[#0B1020]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl z-20"
          >
            <div className="flex gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            <pre className="text-xs font-mono leading-loose text-gray-300">
              <span className="text-[#7C3AED]">async function</span> <span className="text-[#06B6D4]">solveProblem</span>() {'{\n'}
              {'  '}const ai = <span className="text-[#7C3AED]">await</span> Mentor.connect();{'\n'}
              {'  '}return ai.guide(userProgress);{'\n'}
              {'}'}
            </pre>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Glassmorphism Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[440px]"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center p-[1px] shadow-[0_0_30px_rgba(124,58,237,0.3)]">
              <div className="w-full h-full bg-[#0B1020] rounded-[15px] flex items-center justify-center">
                <Code2 size={32} className="text-[#06B6D4]" />
              </div>
            </div>
          </div>

          {/* Glass Card */}
          <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-2xl border border-[rgba(255,255,255,0.08)] rounded-[24px] p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group/card">
            {/* Subtle card reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="mb-8 space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {isRegistering ? "Create your account" : "Welcome back"}
              </h2>
              <p className="text-gray-400 text-sm">
                {isRegistering ? "Enter your details to initialize your workspace." : "Enter your credentials to access your workspace."}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 mb-8 relative z-10">
              <button
                onClick={() => { setIsRegistering(false); setError(""); }}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all relative z-10 outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]",
                  !isRegistering ? "text-white" : "text-gray-500 hover:text-gray-300"
                )}
              >
                {!isRegistering && (
                  <motion.div layoutId="auth-tab" className="absolute inset-0 bg-white/10 rounded-lg -z-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/10" />
                )}
                Sign In
              </button>
              <button
                onClick={() => { setIsRegistering(true); setError(""); }}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all relative z-10 outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]",
                  isRegistering ? "text-white" : "text-gray-500 hover:text-gray-300"
                )}
              >
                {isRegistering && (
                  <motion.div layoutId="auth-tab" className="absolute inset-0 bg-white/10 rounded-lg -z-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/10" />
                )}
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <AnimatePresence mode="popLayout">
                {isRegistering && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, filter: "blur(10px)" }}
                    animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
                    exit={{ opacity: 0, height: 0, filter: "blur(10px)" }}
                    transition={{ duration: 0.3 }}
                    className="relative group"
                  >
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#06B6D4] transition-colors" size={18} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="peer w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4] transition-all outline-none text-white placeholder-transparent"
                      placeholder="Full Name"
                    />
                    <label className="absolute left-11 -top-2.5 bg-[#0B1020] px-1 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#06B6D4]">
                      Full Name
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#06B6D4] transition-colors" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="peer w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4] transition-all outline-none text-white placeholder-transparent"
                  placeholder="Email Address"
                />
                <label className="absolute left-11 -top-2.5 bg-[#0B1020] px-1 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#06B6D4]">
                  Email Address
                </label>
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#06B6D4] transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer w-full pl-11 pr-12 py-3.5 bg-black/20 border border-white/10 rounded-xl focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4] transition-all outline-none text-white placeholder-transparent"
                  placeholder="Password"
                />
                <label className="absolute left-11 -top-2.5 bg-[#0B1020] px-1 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#06B6D4]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <AnimatePresence>
                {isRegistering && password.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5"
                  >
                    <div className="flex gap-1 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={cn("h-full transition-all duration-500", passwordStrength > 0 ? "w-1/4 bg-red-500" : "w-0")} />
                      <div className={cn("h-full transition-all duration-500", passwordStrength > 25 ? "w-1/4 bg-yellow-500" : "w-0")} />
                      <div className={cn("h-full transition-all duration-500", passwordStrength > 50 ? "w-1/4 bg-blue-500" : "w-0")} />
                      <div className={cn("h-full transition-all duration-500", passwordStrength > 75 ? "w-1/4 bg-green-500" : "w-0")} />
                    </div>
                    <p className="text-[10px] text-gray-500 text-right">
                      {passwordStrength < 50 ? "Weak" : passwordStrength < 100 ? "Good" : "Strong"}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isRegistering && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-4 h-4 border border-white/20 rounded bg-black/20 group-hover:border-[#06B6D4] transition-colors">
                      <input type="checkbox" className="peer sr-only" />
                      <div className="absolute inset-0 bg-[#06B6D4] scale-0 peer-checked:scale-100 transition-transform rounded-[3px]" />
                    </div>
                    <span className="text-gray-400 group-hover:text-gray-300 transition-colors">Remember me</span>
                  </label>
                  <a href="#" className="text-[#06B6D4] hover:text-[#7C3AED] transition-colors font-medium">Forgot password?</a>
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-red-400 font-medium bg-red-400/10 p-3 rounded-lg border border-red-400/20"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full py-3.5 rounded-xl font-medium text-white overflow-hidden disabled:opacity-70 transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1020] focus-visible:ring-[#7C3AED]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] group-hover:opacity-90 transition-opacity" />
                
                {/* Button Glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_60%)] mix-blend-overlay" />
                
                <div className="relative z-10 flex items-center justify-center gap-2 shadow-sm">
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isRegistering ? "Create Account" : "Sign In"}</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest font-medium">
                <span className="bg-[#0B1020] px-4 text-gray-500 rounded-full border border-white/5">Continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={login}
                className="flex items-center justify-center gap-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] px-4 py-3 rounded-xl font-medium hover:bg-[rgba(255,255,255,0.08)] transition-all text-sm text-gray-300 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => {
                  setError("GitHub authentication requires connecting from the Dashboard in this version.");
                }}
                className="flex items-center justify-center gap-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] px-4 py-3 rounded-xl font-medium hover:bg-[rgba(255,255,255,0.08)] transition-all text-sm text-gray-300 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-white/20 group"
              >
                <Github size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                GitHub
              </button>
            </div>

            <p className="mt-8 text-[11px] text-gray-500 text-center leading-relaxed">
              By continuing, you agree to our <a href="#" className="text-gray-400 hover:text-white transition-colors underline decoration-white/20 underline-offset-2">Terms of Service</a> and <a href="#" className="text-gray-400 hover:text-white transition-colors underline decoration-white/20 underline-offset-2">Privacy Policy</a>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

