'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const router = useRouter();

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        router.push('/login?registered=' + formData.get('slug'));
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 py-12">
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold mb-3">
            MENUHUB
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Digital Menu</h1>
          <p className="text-gray-500">Join hundreds of businesses using MenuHub</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g., Cafe Kigali"
                className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Type *</label>
              <select
                name="businessType"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select type...</option>
                <option value="restaurant">Restaurant</option>
                <option value="cafe">Cafe / Coffee Shop</option>
                <option value="hotel">Hotel</option>
                <option value="bar">Bar / Lounge</option>
                <option value="bakery">Bakery</option>
                <option value="fastfood">Fast Food</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business URL (slug) *</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">menuhub.com/menu/</span>
              <input
                type="text"
                name="slug"
                required
                placeholder="cafe-kigali"
                pattern="[a-z0-9-]+"
                title="Only lowercase letters, numbers, and hyphens"
                className="flex-1 mt-1 block w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Lowercase letters, numbers, and hyphens only</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location (Optional)</label>
            <input
              type="text"
              name="location"
              placeholder="e.g., KG 7 Ave, Kigali"
              className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number (with country code) *</label>
            <input
              type="text"
              name="whatsappNumber"
              required
              placeholder="e.g., 250788123456"
              className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={6}
                placeholder="Re-enter password"
                className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Logo (Optional)</label>
            <div className="flex items-center gap-4">
              {logoPreview && (
                <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-contain rounded-lg border border-gray-200" />
              )}
              <input
                type="file"
                name="logo"
                accept="image/*"
                onChange={handleLogoChange}
                className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold p-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-lg hover:shadow-xl"
          >
            {loading ? 'Creating Your Menu...' : 'Create My Digital Menu'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline font-medium">Log in</a>
        </p>
      </div>
    </div>
  );
}