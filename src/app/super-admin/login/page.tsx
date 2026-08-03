'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

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

    const res = await fetch('/api/super-admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Login failed.');
      return;
    }

    router.push('/super-admin');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">Super Admin</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Access the control center</h1>
          <p className="mt-2 text-sm text-slate-400">Use your secure credentials to manage all registered businesses.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Username</label>
            <input
              name="username"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 autofill:bg-slate-900 autofill:text-white"
              placeholder="menuhub"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Password</label>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 autofill:bg-slate-900 autofill:text-white"
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <button disabled={loading} className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60">
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </form>
    </div>
  );
}
