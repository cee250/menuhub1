'use client';

import { useEffect, useState } from 'react';
import { Mail, Phone, Plus, Save, Trash2, Truck, X } from 'lucide-react';

type Supplier = { id: string; name: string; phone?: string | null; email?: string | null; notes?: string | null; _count?: { items: number } };

export default function InventorySuppliersPanel({ userRole, themeColor = '#2563eb' }: { userRole: 'owner' | 'manager'; themeColor?: string }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/business/inventory/suppliers');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load suppliers.');
      setSuppliers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/business/inventory/suppliers', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, ...(editingId ? { id: editingId } : {}) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save supplier.');
      setForm({ name: '', phone: '', email: '', notes: '' });
      setEditingId(null);
      setMessage(editingId ? 'Supplier updated.' : 'Supplier added.');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (userRole !== 'owner' || !window.confirm('Remove this supplier? Linked items will remain, but their supplier link will be cleared.')) return;
    const response = await fetch(`/api/business/inventory/suppliers?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) setError(data.error || 'Unable to remove supplier.');
    else await load();
  };

  return <div className="space-y-5"><div><h3 className="text-lg font-black text-gray-900">Suppliers</h3><p className="text-sm text-gray-500 mt-1">Keep purchasing contacts close to the stock items they supply.</p></div>{error && <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}{message && <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div>}<div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-5"><form onSubmit={save} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6"><div className="flex items-center justify-between mb-5"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center"><Truck size={19} /></div><div><h4 className="font-black text-gray-900">{editingId ? 'Edit supplier' : 'Add supplier'}</h4><p className="text-xs text-gray-500 mt-1">Use this contact on reorder suggestions.</p></div></div>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ name: '', phone: '', email: '', notes: '' }); }} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><X size={17} /></button>}</div><div className="space-y-3"><label><span className="label">Supplier name</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="field" placeholder="e.g. Kigali Fresh Foods" /></label><label><span className="label">Phone</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="field" /></label><label><span className="label">Email</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="field" /></label><label><span className="label">Notes</span><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="field min-h-24" /></label></div><button disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white disabled:opacity-60" style={{ backgroundColor: themeColor }}>{editingId ? <Save size={16} /> : <Plus size={16} />}{saving ? 'Saving...' : editingId ? 'Save supplier' : 'Add supplier'}</button></form><div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6"><div className="flex items-center justify-between mb-5"><h4 className="font-black text-gray-900">Supplier directory</h4><span className="text-xs font-bold text-gray-400">{suppliers.length} supplier{suppliers.length === 1 ? '' : 's'}</span></div>{loading ? <p className="text-sm text-gray-400">Loading suppliers...</p> : suppliers.length === 0 ? <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400">No suppliers added yet.</div> : <div className="space-y-3">{suppliers.map((supplier) => <div key={supplier.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-4"><div><p className="font-bold text-gray-900">{supplier.name}</p><div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">{supplier.phone && <span className="inline-flex items-center gap-1"><Phone size={12} />{supplier.phone}</span>}{supplier.email && <span className="inline-flex items-center gap-1"><Mail size={12} />{supplier.email}</span>}<span>{supplier._count?.items || 0} linked items</span></div></div><div className="flex gap-1.5"><button onClick={() => { setEditingId(supplier.id); setForm({ name: supplier.name, phone: supplier.phone || '', email: supplier.email || '', notes: supplier.notes || '' }); }} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">Edit</button>{userRole === 'owner' && <button onClick={() => remove(supplier.id)} className="rounded-lg bg-red-50 p-2 text-red-600"><Trash2 size={15} /></button>}</div></div>)}</div>}</div></div><style jsx>{`.label { display:block; margin-bottom:.375rem; font-size:.65rem; font-weight:800; text-transform:uppercase; letter-spacing:.12em; color:#64748b; } .field { width:100%; border:1px solid #e2e8f0; border-radius:.75rem; padding:.75rem .875rem; font-size:.875rem; color:#0f172a; outline:none; background:#fff; } .field:focus { border-color:${themeColor}; box-shadow:0 0 0 3px ${themeColor}20; }`}</style></div>;
}
