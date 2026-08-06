'use client';

import { useState } from 'react';

export default function BusinessSettings({ business }: { business: any }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    const formData = new FormData(e.currentTarget);
    formData.append('slug', business.slug);

    try {
      const res = await fetch('/api/business/settings', {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Settings updated successfully! Refreshing...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setIsError(true);
        setMessage('Error: ' + (data.error || 'Failed to update settings.'));
      }
    } catch (error: any) {
      setIsError(true);
      setMessage('Network Error: ' + (error.message || 'An error occurred.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mt-8 border border-gray-100">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2 flex items-center gap-2">
        <span className="text-2xl">⚙️</span> Business Settings & Branding
      </h2>
      <p className="text-sm text-gray-600 mb-4">Customize how your digital menu looks to your customers.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input
              type="text"
              name="name"
              defaultValue={business.name}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number (for orders)</label>
            <input
              type="text"
              name="whatsappNumber"
              defaultValue={business.whatsappNumber}
              placeholder="+250......."
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Waiter Call Number (optional)</label>
          <input
            type="text"
            name="waiterCallNumber"
            defaultValue={business.waiterCallNumber || ''}
            placeholder="+250......."
            className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">Customers can call this number to call a waiter directly</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            name="location"
            defaultValue={business.location || ''}
            placeholder="e.g., KG 7 Ave, Kigali"
            className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Theme Color</label>
          <div className="flex items-center gap-3 mt-1">
            <input
              type="color"
              name="themeColor"
              defaultValue={business.themeColor || '#2563eb'}
              className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
            />
            <span className="text-sm text-gray-500">Used for buttons and accents on your menu.</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL (Optional)</label>
            <input
              type="url"
              name="instagramUrl"
              defaultValue={business.instagramUrl || ''}
              placeholder="https://instagram.com/yourbusiness"
              className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL (Optional)</label>
            <input
              type="url"
              name="facebookUrl"
              defaultValue={business.facebookUrl || ''}
              placeholder="https://facebook.com/yourbusiness"
              className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TikTok URL (Optional)</label>
            <input
              type="url"
              name="tiktokUrl"
              defaultValue={business.tiktokUrl || ''}
              placeholder="https://tiktok.com/@yourbusiness"
              className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="hasFreeWifi"
              defaultChecked={business.hasFreeWifi}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900"> We Offer Free WiFi</div>
              <div className="text-xs text-gray-500">Show this badge on your customer menu</div>
            </div>
          </label>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="showOnHomepage"
              defaultChecked={business.showOnHomepage}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900"> Show My Business on MenuHub Homepage</div>
              <div className="text-xs text-gray-500">Allow potential customers to discover your business on our main page</div>
            </div>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Logo</label>
          {business.logoUrl && (
            <img src={business.logoUrl} alt="Current Logo" className="w-24 h-24 object-contain border rounded-lg p-2 mt-2 mb-2 bg-gray-50" />
          )}
          <input
            type="file"
            name="logo"
            accept="image/*"
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-400 mt-1">Recommended: Square image, PNG or JPG (Max 5MB).</p>
        </div>

        {message && (
          <p className={`text-center text-sm font-medium mt-2 p-3 rounded-lg ${isError ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white font-bold p-3 rounded-lg hover:from-gray-900 hover:to-black disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-md"
        >
          {loading ? 'Saving...' : 'Save Business Settings'}
        </button>
      </form>
    </div>
  );
}