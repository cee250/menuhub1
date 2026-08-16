'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Plus, Trash2, Edit3, CheckCircle, XCircle, 
  Clock, Calendar, Users, ShoppingBag, Activity, 
  LogOut, Shield, RefreshCcw, MoreVertical, ExternalLink,
  Smartphone, MapPin, Globe, CreditCard, ChevronRight, AlertCircle,
  UtensilsCrossed, GlassWater
} from 'lucide-react';

interface BusinessRecord {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
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
  activatedAt?: string | null;
  categories?: Array<{ id: string; name: string; items?: Array<any> }>;
  orders?: Array<any>;
  gallery?: Array<any>;
}

export default function SuperAdminPanel() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<BusinessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<BusinessRecord>>({});
  const [createForm, setCreateForm] = useState({ 
    name: '', slug: '', password: '', whatsappNumber: '', 
    businessType: 'restaurant', location: '', tier: 'ESSENTIALS', 
    status: 'PENDING', showOnHomepage: false 
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [adminCreds, setAdminCreds] = useState({ email: '', password: '' });
  const [businessPassword, setBusinessPassword] = useState('');
  const [selectedBusinessForPassword, setSelectedBusinessForPassword] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'businesses' | 'analytics' | 'settings'>('businesses');

  async function loadBusinesses() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/super-admin');
      if (!res.ok) throw new Error('Unable to load businesses.');
      const data = await res.json();
      setBusinesses(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
    if (!createForm.name || !createForm.slug || !createForm.password) {
      setError('Name, Slug, and Password are required.');
      return;
    }
    
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

    setCreateForm({ name: '', slug: '', password: '', whatsappNumber: '', businessType: 'restaurant', location: '', tier: 'ESSENTIALS', status: 'PENDING', showOnHomepage: false });
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
    if (!confirm('Delete this business and all linked data? This cannot be undone.')) return;

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

  async function logout() {
    await fetch('/api/super-admin/logout', { method: 'POST' });
    router.push('/super-admin/login');
    router.refresh();
  }

  async function updateAdminCreds() {
    setError('');
    const res = await fetch('/api/super-admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminCreds),
    });
    if (res.ok) {
      alert('Admin credentials updated!');
      setAdminCreds({ ...adminCreds, password: '' });
    } else {
      const data = await res.json();
      setError(data.error || 'Update failed');
    }
  }

  async function resetBusinessPassword() {
    if (!selectedBusinessForPassword || !businessPassword) {
      setError('Select a business and enter a new password.');
      return;
    }
    setError('');
    const res = await fetch('/api/business/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: selectedBusinessForPassword, newPassword: businessPassword }),
    });
    if (res.ok) {
      alert('Password reset successful!');
      setBusinessPassword('');
      setSelectedBusinessForPassword('');
    } else {
      const data = await res.json();
      setError(data.error || 'Reset failed');
    }
  }

  // --- Utility: Calculate Days Remaining ---
  function getRenewalInfo(activatedAt: string | null | undefined, createdAt: string) {
    if (!activatedAt) return { days: null, text: 'Not Activated', color: 'text-slate-500' };
    
    const start = new Date(activatedAt);
    const now = new Date();
    
    // Calculate the next renewal date (same day next month)
    const nextRenewal = new Date(start);
    nextRenewal.setMonth(nextRenewal.getMonth() + 1);
    
    // If nextRenewal is already passed, increment month until it's in the future
    while (nextRenewal < now) {
      nextRenewal.setMonth(nextRenewal.getMonth() + 1);
    }
    
    const diffTime = nextRenewal.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let color = 'text-emerald-400';
    if (diffDays <= 3) color = 'text-red-400 animate-pulse';
    else if (diffDays <= 7) color = 'text-amber-400';
    
    return { 
      days: diffDays, 
      text: `${diffDays} days left`, 
      color,
      nextDate: nextRenewal.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    };
  }

  const filteredBusinesses = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return businesses.filter(b => 
      (b.name?.toLowerCase() || '').includes(query) || 
      (b.slug?.toLowerCase() || '').includes(query) ||
      (b.email?.toLowerCase() || '').includes(query)
    );
  }, [businesses, searchQuery]);

  const summary = useMemo(() => ({
    total: businesses.length,
    active: businesses.filter((b) => b.status === 'ACTIVE').length,
    pending: businesses.filter((b) => b.status === 'PENDING').length,
    revenue: businesses.filter((b) => b.status === 'ACTIVE').length * 15000,
  }), [businesses]);

  const inputClass = "w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm";
  const labelClass = "mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1";

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-blue-500/30">
      {/* Sidebar / Navigation */}
      <div className="fixed top-0 bottom-0 left-0 w-20 hidden lg:flex flex-col items-center py-8 bg-slate-900 border-r border-white/5 z-50">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-12 shadow-lg shadow-blue-600/20">
          <Shield className="text-white" size={24} />
        </div>
        <div className="flex flex-col gap-6">
          <button onClick={() => setActiveTab('businesses')} className={`p-3 rounded-xl transition-all ${activeTab === 'businesses' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>
            <Users size={24} />
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`p-3 rounded-xl transition-all ${activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>
            <Activity size={24} />
          </button>
          <button onClick={() => setActiveTab('settings')} className={`p-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>
            <Shield size={24} />
          </button>
        </div>
        <button onClick={logout} className="mt-auto p-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut size={24} />
        </button>
      </div>

      <main className="lg:ml-20 p-4 sm:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4 border border-blue-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                System Administrator
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight">Dashboard</h1>
              <p className="mt-2 text-slate-400 font-medium">Monitoring {summary.total} business entities across the platform.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={loadBusinesses}
                className="p-3 rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white transition-all active:scale-95"
              >
                <RefreshCcw size={20} />
              </button>
              <button 
                onClick={logout}
                className="lg:hidden p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'Total Entities', value: summary.total, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Active Menus', value: summary.active, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Pending Review', value: summary.pending, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Est. Monthly Revenue', value: `${summary.revenue.toLocaleString()} RWF`, icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
                <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                  <stat.icon size={20} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
                <p className="text-2xl font-black text-white mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          {activeTab === 'businesses' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Controls */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                  <input 
                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-600 outline-none focus:border-blue-500/30 transition-all"
                    placeholder="Search by business name, slug or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateSelectedBusinesses({ status: 'ACTIVE' })}
                    disabled={selectedIds.length === 0}
                    className="px-6 py-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 disabled:opacity-30 transition-all active:scale-95"
                  >
                    Activate Selected ({selectedIds.length})
                  </button>
                  <button 
                    onClick={() => updateSelectedBusinesses({ status: 'INACTIVE' })}
                    disabled={selectedIds.length === 0}
                    className="px-6 py-4 rounded-2xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 disabled:opacity-30 transition-all active:scale-95"
                  >
                    Deactivate
                  </button>
                </div>
              </div>

              {/* Business List */}
              <div className="grid gap-4">
                {filteredBusinesses.map((business) => {
                  const renewal = getRenewalInfo(business.activatedAt, business.createdAt);
                  const isSelected = selectedIds.includes(business.id);
                  
                  return (
                    <div 
                      key={business.id} 
                      className={`group relative bg-slate-900/40 border transition-all duration-300 rounded-3xl p-6 ${isSelected ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/5 hover:border-white/10 hover:bg-slate-900/60'}`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                        {/* Selection Checkbox */}
                        <button 
                          onClick={() => setSelectedIds(prev => isSelected ? prev.filter(id => id !== business.id) : [...prev, business.id])}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/10 text-transparent hover:border-blue-500/50'}`}
                        >
                          <CheckCircle size={14} />
                        </button>

                        {/* Basic Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-black text-white truncate">{business.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                              business.status === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                              business.status === 'PENDING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                              'bg-slate-500/10 border-slate-500/20 text-slate-400'
                            }`}>
                              {business.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                            <span className="flex items-center gap-1.5"><Globe size={12} /> {business.slug}</span>
                            <span className="flex items-center gap-1.5"><Smartphone size={12} /> {business.whatsappNumber}</span>
                            
                            {/* Menu Summary */}
                            <div className="flex items-center gap-3 ml-2 pl-4 border-l border-white/5">
                              {(() => {
                                const allItems = business.categories?.flatMap(c => c.items || []) || [];
                                const foodCount = allItems.filter(i => i.mainCategory === 'Foods').length;
                                const drinkCount = allItems.filter(i => ['Beverages', 'Wine', 'Champagne', 'Drinks'].includes(i.mainCategory)).length;
                                return (
                                  <>
                                    <span className="flex items-center gap-1 text-blue-400">
                                      <UtensilsCrossed size={10} /> {foodCount} Food
                                    </span>
                                    <span className="flex items-center gap-1 text-purple-400">
                                      <GlassWater size={10} /> {drinkCount} Drinks
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Renewal Counter */}
                        {business.status === 'ACTIVE' && (
                          <div className="lg:text-right shrink-0 px-6 lg:border-l lg:border-white/5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Renewal Cycle</p>
                            <div className={`flex items-center lg:justify-end gap-2 text-sm font-black ${renewal.color}`}>
                              <Calendar size={14} />
                              {renewal.text}
                            </div>
                            <p className="text-[10px] text-slate-600 font-bold mt-0.5">Next: {renewal.nextDate}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <a 
                            href={`/menu/${business.slug}`} 
                            target="_blank" 
                            className="p-3 rounded-xl bg-slate-950 border border-white/5 text-slate-400 hover:text-white transition-all"
                            title="View Menu"
                          >
                            <ExternalLink size={18} />
                          </a>
                          <button 
                            onClick={() => { setEditingId(business.id); setForm(business); }}
                            className="p-3 rounded-xl bg-slate-950 border border-white/5 text-slate-400 hover:text-blue-400 transition-all"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={() => deleteBusiness(business.id)}
                            className="p-3 rounded-xl bg-slate-950 border border-white/5 text-slate-400 hover:text-red-400 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Edit Form */}
                      {editingId === business.id && (
                        <div className="mt-8 pt-8 border-t border-white/5 grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300">
                          <div>
                            <label className={labelClass}>Business Name</label>
                            <input className={inputClass} value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                          </div>
                          <div>
                            <label className={labelClass}>Slug (URL)</label>
                            <input className={inputClass} value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                          </div>
                          <div>
                            <label className={labelClass}>WhatsApp Number</label>
                            <input className={inputClass} value={form.whatsappNumber || ''} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} />
                          </div>
                          <div>
                            <label className={labelClass}>Tier</label>
                            <select className={inputClass} value={form.tier || ''} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
                              <option value="ESSENTIALS">ESSENTIALS</option>
                              <option value="PRO">PRO</option>
                              <option value="ENTERPRISE">ENTERPRISE</option>
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Status</label>
                            <select className={inputClass} value={form.status || ''} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                              <option value="PENDING">PENDING</option>
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="INACTIVE">INACTIVE</option>
                              <option value="SUSPENDED">SUSPENDED</option>
                            </select>
                          </div>
                          <div className="flex items-end gap-2">
                            <button onClick={saveBusiness} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all">Save Changes</button>
                            <button onClick={() => setEditingId(null)} className="px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Create Business Section */}
              <div className="mt-12 p-8 bg-slate-900/80 border border-white/5 rounded-[2rem] shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-emerald-600/20 text-emerald-400 rounded-xl flex items-center justify-center">
                    <Plus size={20} />
                  </div>
                  <h2 className="text-xl font-black text-white">Register New Business</h2>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className={labelClass}>Business Name</label>
                    <input className={inputClass} placeholder="e.g. Tasty Grill" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Slug</label>
                    <input className={inputClass} placeholder="tasty-grill" value={createForm.slug} onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>WhatsApp</label>
                    <input className={inputClass} placeholder="+250..." value={createForm.whatsappNumber} onChange={(e) => setCreateForm({ ...createForm, whatsappNumber: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Password</label>
                    <input type="password" className={inputClass} placeholder="••••••••" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
                  </div>
                </div>
                
                <button onClick={createBusiness} className="mt-8 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-2">
                  <Plus size={20} /> Register & Activate
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="grid gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 bg-slate-900/50 border border-white/5 rounded-[2rem]">
                <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                  <Shield size={20} className="text-blue-400" />
                  Admin Security
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Admin Email</label>
                    <input className={inputClass} value={adminCreds.email} onChange={(e) => setAdminCreds({ ...adminCreds, email: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>New Password</label>
                    <input type="password" className={inputClass} placeholder="Leave blank to keep current" value={adminCreds.password} onChange={(e) => setAdminCreds({ ...adminCreds, password: e.target.value })} />
                  </div>
                </div>
                <button onClick={updateAdminCreds} className="mt-8 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all">Update Admin Access</button>
              </div>

              <div className="p-8 bg-slate-900/50 border border-white/5 rounded-[2rem]">
                <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                  <RefreshCcw size={20} className="text-amber-400" />
                  Reset Business Password
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Select Business</label>
                    <select className={inputClass} value={selectedBusinessForPassword} onChange={(e) => setSelectedBusinessForPassword(e.target.value)}>
                      <option value="">Choose an account...</option>
                      {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>New Password</label>
                    <input type="password" className={inputClass} placeholder="Enter new password" value={businessPassword} onChange={(e) => setBusinessPassword(e.target.value)} />
                  </div>
                </div>
                <button onClick={resetBusinessPassword} className="mt-8 px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl transition-all">Reset Password</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
