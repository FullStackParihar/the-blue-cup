import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LeafDecoration } from "../components/decorations/LeafDecoration";
import { authApi } from "../lib/api";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      if (response.success && response.data?.token) {
        localStorage.setItem("admin-token", response.data.token);
        navigate("/admin");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-antique-cream relative flex items-center justify-center p-4 overflow-hidden">
      {/* Botanical Background Elements */}
      <LeafDecoration className="absolute top-0 left-0 w-96 h-96 opacity-30 -translate-x-12 -translate-y-12" />
      <LeafDecoration className="absolute top-0 right-0 w-96 h-96 opacity-30 translate-x-12 -translate-y-12" flip />
      <LeafDecoration className="absolute bottom-0 right-0 w-96 h-96 opacity-30 translate-x-12 translate-y-12 rotate-180" />
      <LeafDecoration className="absolute bottom-0 left-0 w-96 h-96 opacity-30 -translate-x-12 translate-y-12" flip />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[380px] bg-primary-navy rounded-3xl p-10 relative z-10 shadow-2xl border border-white/10"
      >
        <div className="text-center mb-10">
          <div className="w-12 h-12 mx-auto mb-3">
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-accent-gold" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 8H4M4 8c0 4.418 3.582 8 8 8s8-3.582 8-8M4 8l1.5-4h13L20 8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v5M8 21h8M19 12h1a2 2 0 002-2v-1a2 2 0 00-2-2h-1" />
              <path d="M10.5 4.5c.5-1 1.5-1.5 2-1s.5 1 0 1.5M13.5 4.5c.5-1 1.5-1.5 2-1s.5 1 0 1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-heading text-2xl text-accent-gold mb-1">The Blue Cup Cafe</h1>
          <p className="font-body text-xs text-white/70 tracking-widest uppercase">Admin Login</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block font-body text-xs text-white/80 mb-1.5 ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@thebluecup.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white font-body placeholder:text-white/30 focus:outline-none focus:border-accent-gold/50 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-body text-xs text-white/80 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-body placeholder:text-white/30 focus:outline-none focus:border-accent-gold/50 transition-colors tracking-widest"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="w-3.5 h-3.5 rounded-sm border border-white/30 flex items-center justify-center group-hover:border-accent-gold transition-colors">
                <svg className="w-2.5 h-2.5 text-accent-gold opacity-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-[10px] text-white/70 font-body">Remember me</span>
            </label>
            <a href="#" className="text-[10px] text-accent-gold font-body hover:underline">Forgot Password?</a>
          </div>

          {error && <div className="text-red-400 text-xs font-body text-center">{error}</div>}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-accent-gold hover:bg-gold-light text-primary-navy font-body font-bold text-sm py-3 rounded-lg transition-colors shadow-[0_4px_14px_rgba(201,168,76,0.3)] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[9px] text-white/40 font-body">© 2024 The Blue Cup Cafe</p>
        </div>
      </motion.div>
    </div>
  );
}
