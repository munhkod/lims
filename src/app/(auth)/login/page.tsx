"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Hard redirect — forces full page reload so middleware picks up the cookie
      window.location.href = "/dashboard";
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(0,212,170,0.08)_0%,transparent_50%),radial-gradient(ellipse_at_80%_20%,rgba(59,130,246,0.08)_0%,transparent_50%)] pointer-events-none" />
      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-2xl">🔬</div>
            <span className="text-2xl font-black text-foreground tracking-tight">LIMS</span>
          </div>
          <p className="text-muted-foreground text-sm">Laboratory Information Management System</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Digital Medic LLC · Ulaanbaatar, Mongolia</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
          <h1 className="text-lg font-bold text-foreground mb-5">Sign In</h1>

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Email</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Password</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-primary text-primary-foreground font-semibold rounded-lg py-2.5 text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>
          
        </div>
      </div>
    </main>
  );
}