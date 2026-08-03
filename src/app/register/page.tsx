'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import TermsModal from '@/components/TermsModal';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  
  // Ref to store form data temporarily
  const formRef = useRef<HTMLFormElement>(null);

  function handleRegisterClick(e: React.FormEvent) {
    e.preventDefault();
    setShowTerms(true);
  }

  async function processRegistration() {
    setShowTerms(false);
    if (!formRef.current) return;

    setLoading(true);
    setError('');
    setSuccess('');

    const form = formRef.current;
    
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const slug = (form.elements.namedItem('slug') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const whatsappNumber = (form.elements.namedItem('whatsappNumber') as HTMLInputElement).value;
    const businessType = (form.elements.namedItem('businessType') as HTMLSelectElement).value;
    const location = (form.elements.namedItem('location') as HTMLInputElement).value;

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          slug,
          email,
          password,
          whatsappNumber,
          businessType,
          location,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to register business.');
      } else {
        setSuccess('Your request is submitted successfully. Our admin will review and activate your account shortly.');
        form.reset();
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <TermsModal 
        isOpen={showTerms} 
        onClose={() => setShowTerms(false)} 
        onAgree={processRegistration} 
      />

      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Image 
              src="/logo.png" 
              alt="MenuHub" 
              width={64} 
              height={64} 
              className="mx-auto object-contain"
            />
          </Link>
          <h1 className="text-3xl font-black text-white mb-2">Create Your Account</h1>
          <p className="text-gray-400">Start your digital menu journey in seconds.</p>
        </div>

        {/* Glassmorphism Form Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <form ref={formRef} onSubmit={handleRegisterClick} className="space-y-5">
            
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Business Name</label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g., Joe's Coffee"
                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500"
              />
            </div>

            {/* Business URL (Slug) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Your Menu URL</label>
              <div className="flex items-center bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                <span className="pl-4 text-gray-500 text-sm">menuhub.app/</span>
                <input
                  type="text"
                  name="slug"
                  required
                  placeholder="joes-coffee"
                  className="flex-1 bg-transparent text-white px-2 py-3 focus:outline-none placeholder:text-gray-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">This will be your unique link.</p>
            </div>

            {/* WhatsApp Number */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">WhatsApp Number</label>
              <input
                type="tel"
                name="whatsappNumber"
                required
                placeholder="e.g., 250788123456"
                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500"
              />
            </div>

            {/* Email (for password reset) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
              <input
                type="email"
                name="email"
                required
                placeholder="your@email.com"
                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Used for password recovery.</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500"
              />
            </div>

            {/* Business Type & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Business Type</label>
                <select
                  name="businessType"
                  className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="restaurant">Restaurant</option>
                  <option value="cafe">Cafe</option>
                  <option value="bar">Bar & Lounge</option>
                  <option value="hotel">Hotel</option>
                  <option value="bakery">Bakery</option>
                  <option value="fastfood">Fast Food</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Location (Optional)</label>
                <input
                  type="text"
                  name="location"
                  placeholder="City, Country"
                  className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Error / Success Messages */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm p-3 rounded-xl text-center">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Create Business Account'
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                Log in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
