'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Users2, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [slug, setSlug] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<'owner' | 'manager'>('owner');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanSlug = slug.trim().toLowerCase();

    const result = await signIn('credentials', {
      slug: cleanSlug,
      password: password,
      role: loginType,
      redirect: false,
    });

    if (result?.error) {
      setError(`Invalid ${loginType} ${loginType === 'owner' ? 'slug/email' : 'slug'} or password.`);
      setLoading(false);
    } else {
      // The dashboard page will handle the correct redirection based on the session role
      router.push('/dashboard/' + cleanSlug);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-600/20 mx-auto mb-4">
              M
            </div>
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">MenuHub Dashboard</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Manage your digital menu and business</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-white relative overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex p-1.5 bg-gray-100 rounded-2xl mb-8">
            <button
              onClick={() => setLoginType('owner')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                loginType === 'owner' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield size={16} />
              Owner
            </button>
            <button
              onClick={() => setLoginType('manager')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                loginType === 'manager' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users2 size={16} />
              Manager
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">
                {loginType === 'owner' ? 'Business Slug or Email' : 'Manager Login Slug'}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {loginType === 'owner' ? <Shield size={18} /> : <Users2 size={18} />}
                </div>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder={loginType === 'owner' ? "e.g. cafe-kigali" : "e.g. john-manager"}
                  required
                  className="block w-full rounded-2xl border border-gray-200 pl-12 pr-4 py-3.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full rounded-2xl border border-gray-200 pl-12 pr-4 py-3.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all font-medium"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold p-4 rounded-2xl animate-in fade-in zoom-in duration-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : `Login as ${loginType === 'owner' ? 'Owner' : 'Manager'}`}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          {loginType === 'owner' && (
            <div className="text-center mt-6">
              <Link href="/forgot-password" className="text-xs text-blue-600 font-black uppercase tracking-widest hover:text-blue-700 transition-colors">
                Forgot password?
              </Link>
            </div>
          )}
        </div>

        {loginType === 'owner' && (
          <p className="text-center text-sm text-gray-500 mt-8 font-medium">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 font-black hover:underline">
              Register Business
            </Link>
          </p>
        )}

        <div className="mt-12 text-center">
          <Link href="/" className="text-xs text-gray-400 font-bold uppercase tracking-widest hover:text-gray-600 transition-colors">
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
