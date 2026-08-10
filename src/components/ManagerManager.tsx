'use client';

import React, { useState, useEffect } from 'react';
import { Users2, Plus, Trash2, Shield, Lock, User, CheckCircle, XCircle } from 'lucide-react';

interface Manager {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export default function ManagerManager({ businessId, themeColor = '#2563eb' }: { businessId: string; themeColor?: string }) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    password: ''
  });

  const fetchManagers = async () => {
    try {
      const res = await fetch(`/api/business/managers?businessId=${businessId}`);
      if (res.ok) {
        const data = await res.json();
        setManagers(data);
      }
    } catch (err) {
      console.error('Failed to fetch managers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchManagers();
    }
  }, [businessId]);

  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/business/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          businessId
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Manager created successfully!');
        setFormData({ name: '', slug: '', password: '' });
        setIsAdding(false);
        fetchManagers();
      } else {
        setError(data.error || 'Failed to create manager');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  const handleDeleteManager = async (managerId: string) => {
    if (!confirm('Are you sure you want to delete this manager? They will lose all access immediately.')) return;
    
    try {
      const res = await fetch('/api/business/managers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId, businessId }),
      });

      if (res.ok) {
        setManagers(managers.filter(m => m.id !== managerId));
      } else {
        alert('Failed to delete manager');
      }
    } catch (err) {
      console.error('Failed to delete manager', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users2 className="w-6 h-6" style={{ color: themeColor }} />
            Business Managers
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Create sub-accounts for your staff to manage the menu without accessing sensitive settings.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          style={{ backgroundColor: isAdding ? '#ef4444' : themeColor }}
          className="text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
        >
          {isAdding ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'Cancel' : 'Add New Manager'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddManager} className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-200 animate-in fade-in slide-in-from-top-4 duration-200">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Create Manager Account</h3>
          
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">{error}</div>}
          
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Manager Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Login Slug (Username)</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. john-manager"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              style={{ backgroundColor: themeColor }}
              className="text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-all"
            >
              Create Account
            </button>
          </div>
        </form>
      )}

      {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-2xl border border-emerald-100 flex items-center gap-2">
        <CheckCircle size={18} /> {success}
      </div>}

      <div className="overflow-hidden rounded-2xl border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-widest text-[10px]">Manager</th>
              <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-widest text-[10px]">Login Slug</th>
              <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-widest text-[10px]">Created</th>
              <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-widest text-[10px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-400">Loading managers...</td>
              </tr>
            ) : managers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">No managers created yet.</td>
              </tr>
            ) : (
              managers.map((manager) => (
                <tr key={manager.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {manager.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-900">{manager.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600 font-mono">{manager.slug}</code>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(manager.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteManager(manager.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Delete Manager"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
        <div className="flex gap-3">
          <Shield className="text-blue-600 shrink-0" size={20} />
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Manager Permissions:</strong> Managers can add/edit menu items, manage reviews, staff, and gallery. They <strong>cannot</strong> access Business Settings or Security (Change Password) sections.
          </p>
        </div>
      </div>
    </div>
  );
}
