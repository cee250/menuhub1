'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { CheckCircle, Lock, Plus, Shield, Trash2, User, Users2, XCircle } from 'lucide-react';

type ManagedAccount = {
  id: string;
  name: string;
  slug: string;
  role: 'MANAGER' | 'STOCK_MANAGER';
  createdAt: string;
};

export default function ManagerManager({ businessId, themeColor = '#2563eb' }: { businessId: string; themeColor?: string }) {
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ name: '', slug: '', password: '', role: 'MANAGER' as ManagedAccount['role'] });

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`/api/business/managers?businessId=${encodeURIComponent(businessId)}`);
      if (!response.ok) throw new Error('Accounts could not be loaded.');
      setAccounts(await response.json());
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Accounts could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (businessId) void fetchAccounts(); }, [businessId]);

  const createAccount = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/business/managers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, businessId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The account could not be created.');
      setSuccess(`${formData.role === 'STOCK_MANAGER' ? 'Stock Manager' : 'Manager'} account created. Give the login slug and password to the staff member.`);
      setFormData({ name: '', slug: '', password: '', role: 'MANAGER' });
      setIsAdding(false);
      await fetchAccounts();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'The account could not be created.');
    }
  };

  const deleteAccount = async (account: ManagedAccount) => {
    if (!window.confirm(`Delete ${account.name}'s ${account.role === 'STOCK_MANAGER' ? 'Stock Manager' : 'Manager'} access?`)) return;
    try {
      const response = await fetch('/api/business/managers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ managerId: account.id, businessId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The account could not be deleted.');
      setAccounts((current) => current.filter((item) => item.id !== account.id));
      setSuccess(`${account.name}'s access was deleted.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'The account could not be deleted.');
    }
  };

  return <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md sm:p-8">
    <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center"><div><h2 className="flex items-center gap-2 text-xl font-bold text-gray-900"><Users2 className="h-6 w-6" style={{ color: themeColor }} /> Staff access</h2><p className="mt-1 text-sm text-gray-500">Create normal Manager accounts or Stock Manager accounts with stock-only access.</p></div><button onClick={() => { setIsAdding((current) => !current); setError(''); }} style={{ backgroundColor: isAdding ? '#ef4444' : themeColor }} className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90">{isAdding ? <XCircle size={16} /> : <Plus size={16} />}{isAdding ? 'Cancel' : 'Add staff account'}</button></div>

    {isAdding && <form onSubmit={createAccount} className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 p-6"><h3 className="mb-4 text-sm font-black uppercase tracking-widest text-gray-900">Create staff credentials</h3>{error && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-600">{error}</div>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><label><span className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-500">Name</span><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500" placeholder="e.g. Alex" /></div></label><label><span className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-500">Login slug</span><div className="relative"><Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input required value={formData.slug} onChange={(event) => setFormData({ ...formData, slug: event.target.value.toLowerCase().replace(/\s+/g, '-') })} className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500" placeholder="alex-stock" /></div></label><label><span className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-500">Password</span><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input required type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500" placeholder="Password" /></div></label><label><span className="mb-1.5 ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-500">Account type</span><select value={formData.role} onChange={(event) => setFormData({ ...formData, role: event.target.value as ManagedAccount['role'] })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-blue-500"><option value="MANAGER">Manager · business workspace</option><option value="STOCK_MANAGER">Stock Manager · stock only</option></select></label></div><div className="mt-4 flex justify-end"><button type="submit" style={{ backgroundColor: themeColor }} className="rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90">Create account</button></div></form>}

    {error && !isAdding && <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">{error}</div>}
    {success && <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-600"><CheckCircle size={18} /> {success}</div>}

    <div className="overflow-hidden rounded-2xl border border-gray-100"><table className="w-full text-left text-sm"><thead className="border-b border-gray-100 bg-gray-50"><tr><th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Name</th><th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Account type</th><th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Login slug</th><th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Created</th><th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Actions</th></tr></thead><tbody className="divide-y divide-gray-50">{loading ? <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">Loading staff accounts…</td></tr> : accounts.length === 0 ? <tr><td colSpan={5} className="px-5 py-10 text-center italic text-gray-400">No staff accounts created yet.</td></tr> : accounts.map((account) => <tr key={account.id} className="transition-colors hover:bg-gray-50/50"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs ${account.role === 'STOCK_MANAGER' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-600'}`}>{account.name.charAt(0).toUpperCase()}</div><span className="font-bold text-gray-900">{account.name}</span></div></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${account.role === 'STOCK_MANAGER' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{account.role === 'STOCK_MANAGER' ? 'Stock Manager' : 'Manager'}</span></td><td className="px-5 py-4"><code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600">{account.slug}</code></td><td className="px-5 py-4 text-xs text-gray-500">{new Date(account.createdAt).toLocaleDateString()}</td><td className="px-5 py-4 text-right"><button onClick={() => void deleteAccount(account)} className="rounded-xl p-2 text-red-400 transition-all hover:bg-red-50 hover:text-red-600" title="Delete access"><Trash2 size={18} /></button></td></tr>)}</tbody></table></div>
    <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs leading-relaxed text-emerald-800"><strong>Stock Manager access:</strong> use the Manager login tab with the created slug and password. The Stock Manager will see only Stock Management and will not see the menu, reviews, analytics, settings, security, managers, or other dashboard areas.</div>
  </div>;
}
