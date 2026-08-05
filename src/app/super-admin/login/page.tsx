'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, ShieldCheck, ArrowRight } from 'lucide-react';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/super-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      router.push('/super-admin');
      router.refresh();
    } catch (err) {
      setError('A connection error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4 selection:bg-blue-500/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      </div>

      <form 
        onSubmit={handleSubmit} 
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-8 sm:p-10 shadow-2xl animate-in fade-in zoom-in duration-500"
      >
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 mb-6 border border-blue-500/20 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-2">Control Center</p>
          <h1 className="text-3xl font-black text-white tracking-tight">Super Admin</h1>
          <p className="mt-3 text-sm text-slate-400 font-medium">Secure access to MenuHub infrastructure</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Username</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                <User size={18} />
              </div>
              <input
                name="username"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                placeholder="Enter admin username"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Password</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-in slide-in-from-top-2 duration-300">
            {error}
          </div>
        )}

        <button 
          disabled={loading} 
          className="mt-8 w-full group relative flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 font-black text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 hover:shadow-blue-600/40 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              Sign In to Dashboard
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
      
      <div className="fixed bottom-8 text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
        © 2026 MenuHub Systems • Secure Node
      </div>
    </div>
  );
}
