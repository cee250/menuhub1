'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface BusinessRecord {
  id: string;
  name: string;
  slug: string;
  whatsappNumber: string;
  waiterCallNumber?: string | null;
  businessType?: string | null;
  location?: string | null;
  tier?: string | null;
  status?: string | null;
  themeColor?: string | null;
  hasFreeWifi?: boolean;
  showOnHomepage?: boolean;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  createdAt: string;
  categories?: Array<{ id: string; name: string; items?: Array<any> }>;
  orders?: Array<any>;
  gallery?: Array<any>;
}

export default function SuperAdminPanel() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<BusinessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<BusinessRecord>>({});
  const [createForm, setCreateForm] = useState({ name: '', slug: '', password: '', whatsappNumber: '', businessType: 'other', location: '', tier: 'ESSENTIALS', status: 'PENDING', showOnHomepage: false });
  const [orders, setOrders] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [adminCreds, setAdminCreds] = useState({ email: '', password: '' });
  const [businessPassword, setBusinessPassword] = useState('');
  const [selectedBusinessForPassword, setSelectedBusinessForPassword] = useState<string>('');

  async function loadBusinesses() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/super-admin');
    if (!res.ok) {
      setError('Unable to load businesses.');
      setLoading(false);
      return;
    }
    const data = await res.json();
    setBusinesses(data);
    setLoading(false);
  }

  async function loadOrders() {
    const res = await fetch('/api/super-admin/orders');
    if (res.ok) {
      const data = await res.json();
      setOrders(data);
    }
  }

  async function loadLogs() {
    const res = await fetch('/api/super-admin/audit-logs');
    if (res.ok) {
      const data = await res.json();
      setLogs(data);
    }
  }

  async function loadAdminCreds() {
    const res = await fetch('/api/super-admin/settings');
    if (res.ok) {
      const data = await res.json();
      setAdminCreds({ email: data.email || '', password: '' });
    }
  }

  useEffect(() => {
    loadBusinesses();
    loadOrders();
    loadLogs();
    loadAdminCreds();
  }, []);

  async function createBusiness() {
    const res = await fetch('/api/super-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Could not create business.');
      return;
    }

    setCreateForm({ name: '', slug: '', password: '', whatsappNumber: '', businessType: 'other', location: '', tier: 'ESSENTIALS', status: 'PENDING', showOnHomepage: false });
    await loadBusinesses();
    await loadLogs();
  }

  async function saveBusiness() {
    if (!editingId) return;

    const res = await fetch('/api/super-admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingId, ...form }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Could not save changes.');
      return;
    }

    setEditingId(null);
    setForm({});
    await loadBusinesses();
    await loadLogs();
  }

  async function deleteBusiness(id: string) {
    if (!confirm('Delete this business and all linked data?')) return;

    const res = await fetch('/api/super-admin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Could not delete business.');
      return;
    }

    await loadBusinesses();
  }

  async function deleteCategory(categoryId: string) {
    const res = await fetch(`/api/super-admin/categories/${categoryId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Could not delete category.');
      return;
    }
    await loadBusinesses();
  }

  async function updateSelectedBusinesses(changes: Record<string, any>) {
    if (!selectedIds.length) return;
    const res = await fetch('/api/super-admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds, ...changes }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Bulk update failed.');
      return;
    }

    setSelectedIds([]);
    await loadBusinesses();
    await loadLogs();
  }

  async function updateOrderStatus(orderId: string, status: string) {
    const res = await fetch('/api/super-admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, status }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Could not update order.');
      return;
    }

    await loadOrders();
    await loadLogs();
  }

  async function updateAdminCreds() {
    const res = await fetch('/api/super-admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminCreds.email, password: adminCreds.password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Could not update super-admin credentials.');
      return;
    }

    setAdminCreds((prev) => ({ ...prev, password: '' }));
    setError('');
  }

  async function resetBusinessPassword() {
    if (!selectedBusinessForPassword || !businessPassword) {
      setError('Choose a business and enter a new password.');
      return;
    }

    const res = await fetch('/api/super-admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedBusinessForPassword, password: businessPassword }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Could not reset business password.');
      return;
    }

    setBusinessPassword('');
    setSelectedBusinessForPassword('');
    setError('');
  }

  async function logout() {
    await fetch('/api/super-admin/logout', { method: 'POST' });
    router.push('/super-admin/login');
    router.refresh();
  }

  const summary = useMemo(() => ({
    total: businesses.length,
    active: businesses.filter((b) => b.status === 'ACTIVE').length,
    inactive: businesses.filter((b) => b.status !== 'ACTIVE').length,
    orders: businesses.reduce((sum, b) => sum + (b.orders?.length || 0), 0),
  }), [businesses]);

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">Super Admin</p>
            <h1 className="text-3xl font-bold">Full control over all businesses</h1>
            <p className="mt-2 text-sm text-slate-400">Manage business status, visibility, categories, and account details from one place.</p>
          </div>
          <button onClick={logout} className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-semibold text-slate-200 hover:bg-slate-700">Logout</button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Businesses</p>
            <p className="mt-2 text-2xl font-bold">{summary.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Active</p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">{summary.active}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Inactive</p>
            <p className="mt-2 text-2xl font-bold text-amber-400">{summary.inactive}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Orders</p>
            <p className="mt-2 text-2xl font-bold text-blue-400">{summary.orders}</p>
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-300">{error}</div>}

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-xl font-semibold">Manage credentials</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Super admin login</h3>
                <div className="mt-3 space-y-3">
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500" placeholder="Super admin username" value={adminCreds.email} onChange={(e) => setAdminCreds({ ...adminCreds, email: e.target.value })} />
                  <input type="password" className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500" placeholder="New password" value={adminCreds.password} onChange={(e) => setAdminCreds({ ...adminCreds, password: e.target.value })} />
                <button onClick={updateAdminCreds} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500">Save admin credentials</button>
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Business password reset</h3>
              <div className="mt-3 space-y-3">
                <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" value={selectedBusinessForPassword} onChange={(e) => setSelectedBusinessForPassword(e.target.value)}>
                  <option value="">Select business</option>
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>{business.name}</option>
                  ))}
                </select>
                <input type="password" className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500" placeholder="New business password" value={businessPassword} onChange={(e) => setBusinessPassword(e.target.value)} />
                <button onClick={resetBusinessPassword} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold hover:bg-emerald-500">Reset business password</button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-xl font-semibold">Create a new business</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500" placeholder="Business name" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
            <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500" placeholder="Slug" value={createForm.slug} onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })} />
            <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500" placeholder="Password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
            <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500" placeholder="WhatsApp number" value={createForm.whatsappNumber} onChange={(e) => setCreateForm({ ...createForm, whatsappNumber: e.target.value })} />
            <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500" placeholder="Business type" value={createForm.businessType} onChange={(e) => setCreateForm({ ...createForm, businessType: e.target.value })} />
            <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500" placeholder="Location" value={createForm.location} onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })} />
            <select className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" value={createForm.tier} onChange={(e) => setCreateForm({ ...createForm, tier: e.target.value })}>
              <option value="ESSENTIALS">ESSENTIALS</option>
              <option value="PRO">PRO</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
            </select>
            <select className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}>
              <option value="PENDING">PENDING</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
            <select className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" value={String(createForm.showOnHomepage)} onChange={(e) => setCreateForm({ ...createForm, showOnHomepage: e.target.value === 'true' })}>
              <option value="false">Hide on homepage</option>
              <option value="true">Show on homepage</option>
            </select>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={createBusiness} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold hover:bg-emerald-500">Create business</button>
            <button onClick={() => updateSelectedBusinesses({ status: 'ACTIVE' })} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500">Activate selected</button>
            <button onClick={() => updateSelectedBusinesses({ status: 'INACTIVE' })} className="rounded-lg bg-amber-600 px-4 py-2 font-semibold hover:bg-amber-500">Deactivate selected</button>
            <button onClick={() => updateSelectedBusinesses({ showOnHomepage: true })} className="rounded-lg bg-purple-600 px-4 py-2 font-semibold hover:bg-purple-500">Feature selected</button>
            <button onClick={() => updateSelectedBusinesses({ showOnHomepage: false })} className="rounded-lg bg-slate-700 px-4 py-2 font-semibold hover:bg-slate-600">Unfeature selected</button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">Loading businesses…</div>
        ) : (
          <div className="space-y-4">
            {businesses.map((business) => {
              const isEditing = editingId === business.id;
              return (
                <div key={business.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold">{business.name}</h2>
                        <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-300">{business.slug}</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${business.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-300' : business.status === 'PENDING' ? 'bg-amber-500/15 text-amber-300' : 'bg-slate-800 text-slate-300'}`}>{business.status || 'PENDING'}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">WhatsApp: {business.whatsappNumber || '—'} • Location: {business.location || '—'} • Tier: {business.tier || 'ESSENTIALS'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input type="checkbox" checked={selectedIds.includes(business.id)} onChange={() => setSelectedIds((prev) => prev.includes(business.id) ? prev.filter((id) => id !== business.id) : [...prev, business.id])} />
                      <button onClick={() => { setEditingId(business.id); setForm(business); }} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold hover:bg-blue-500">Edit</button>
                      <button onClick={() => deleteBusiness(business.id)} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-500">Delete</button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-4 grid gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4 md:grid-cols-2">
                      <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Business name" />
                      <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500" value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Slug" />
                      <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500" value={form.whatsappNumber || ''} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} placeholder="WhatsApp number" />
                      <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500" value={form.waiterCallNumber || ''} onChange={(e) => setForm({ ...form, waiterCallNumber: e.target.value })} placeholder="Waiter call number" />
                      <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500" value={form.businessType || ''} onChange={(e) => setForm({ ...form, businessType: e.target.value })} placeholder="Business type" />
                      <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" />
                      <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500" value={form.themeColor || ''} onChange={(e) => setForm({ ...form, themeColor: e.target.value })} placeholder="Theme color" />
                      <select className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" value={form.status || 'PENDING'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                        <option value="PENDING">PENDING</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                      </select>
                      <select className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" value={String(form.hasFreeWifi || false)} onChange={(e) => setForm({ ...form, hasFreeWifi: e.target.value === 'true' })}>
                        <option value="true">Free WiFi On</option>
                        <option value="false">Free WiFi Off</option>
                      </select>
                      <select className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" value={String(form.showOnHomepage || false)} onChange={(e) => setForm({ ...form, showOnHomepage: e.target.value === 'true' })}>
                        <option value="true">Show on Homepage</option>
                        <option value="false">Hide on Homepage</option>
                      </select>
                      <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500" value={form.instagramUrl || ''} onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })} placeholder="Instagram URL" />
                      <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500" value={form.facebookUrl || ''} onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })} placeholder="Facebook URL" />
                      <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500" value={form.tier || ''} onChange={(e) => setForm({ ...form, tier: e.target.value })} placeholder="Tier" />
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <button onClick={saveBusiness} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold hover:bg-emerald-500">Save</button>
                        <button onClick={() => { setEditingId(null); setForm({}); }} className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-600">Cancel</button>
                      </>
                    ) : null}
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Categories</h3>
                      <div className="mt-3 space-y-2">
                        {(business.categories || []).map((category) => (
                          <div key={category.id} className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2">
                            <span>{category.name}</span>
                            <button onClick={() => deleteCategory(category.id)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Orders</h3>
                      <div className="mt-3 space-y-2">
                        {(orders.filter((order) => order.businessId === business.id)).slice(0, 5).map((order) => (
                          <div key={order.id} className="rounded-lg bg-slate-900 px-3 py-2 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span>{order.customerName || 'Guest'}</span>
                              <span className="text-xs text-slate-400">{order.status}</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <span>{order.totalAmount} RWF</span>
                              <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs">
                                <option value="PENDING">PENDING</option>
                                <option value="CONFIRMED">CONFIRMED</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="CANCELLED">CANCELLED</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Gallery</h3>
                      <p className="mt-3 text-sm text-slate-400">{(business.gallery || []).length} images uploaded</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Recent activity</h3>
                    <div className="mt-3 space-y-2">
                      {logs.filter((log) => log.businessId === business.id).slice(0, 5).map((log) => (
                        <div key={log.id} className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-300">
                          <div className="font-medium">{log.action}</div>
                          <div className="text-xs text-slate-400">{log.details || 'No details'} • {new Date(log.createdAt).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
