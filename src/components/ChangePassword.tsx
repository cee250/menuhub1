'use client';

import { useState } from 'react';

export default function ChangePassword({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      setMessage('❌ New passwords do not match');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/business/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('✅ Password changed successfully!');
        setMessageType('success');
        (e.target as HTMLFormElement).reset();
      } else {
        setMessage('❌ ' + (data.error || 'Failed to change password'));
        setMessageType('error');
      }
    } catch (error) {
      setMessage('❌ An error occurred.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">🔐 Change Password</h2>
      <p className="text-sm text-gray-600 mb-4">Update your dashboard login password.</p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
          <input
            type="password"
            name="currentPassword"
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input
            type="password"
            name="newPassword"
            required
            minLength={6}
            placeholder="At least 6 characters"
            className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input
            type="password"
            name="confirmPassword"
            required
            minLength={6}
            className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {message && (
          <p className={`text-center text-sm font-medium mt-2 ${messageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white font-bold p-3 rounded-lg hover:from-gray-900 hover:to-black disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-md"
        >
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}