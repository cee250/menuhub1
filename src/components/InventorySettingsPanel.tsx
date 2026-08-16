'use client';

import { useEffect, useState } from 'react';
import { Bell, LockKeyhole, Save, ShieldCheck } from 'lucide-react';

export default function InventorySettingsPanel({ userRole, themeColor = '#2563eb' }: { userRole: 'owner' | 'manager'; themeColor?: string }) {
  const [settings, setSettings] = useState({ inventoryMode: 'SIMPLE', reservationMode: 'ON_ORDER', reservationExpiryMinutes: 30, defaultUnit: 'piece', autoHideOutOfStock: true, lowStockNotifications: true, managerCanRestock: true, managerCanAdjust: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/business/inventory/settings').then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load settings.');
      setSettings({ ...settings, ...data, reservationExpiryMinutes: data.reservationExpiryMinutes || 30 });
    }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/business/inventory/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save settings.');
      setSettings({ ...settings, ...data, reservationExpiryMinutes: data.reservationExpiryMinutes || 30 });
      setMessage('Inventory settings saved.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-gray-400">Loading inventory settings...</div>;

  return (
    <div className="space-y-5"><div><h3 className="text-lg font-black text-gray-900">Inventory controls</h3><p className="text-sm text-gray-500 mt-1">Choose how this business uses stock tracking and what managers can do.</p></div>{error && <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}{message && <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div>}<div className="grid lg:grid-cols-2 gap-5"><div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6"><div className="flex items-center gap-3 mb-5"><div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><ShieldCheck size={19} /></div><div><h4 className="font-black text-gray-900">Stock behavior</h4><p className="text-xs text-gray-500 mt-1">Keep the workflow simple for your team.</p></div></div><div className="space-y-4"><label><span className="label">Inventory mode</span><select disabled={userRole !== 'owner'} value={settings.inventoryMode} onChange={(event) => setSettings({ ...settings, inventoryMode: event.target.value })} className="field"><option value="SIMPLE">Menu portions</option><option value="PACKAGED">Packaged products</option><option value="MANUAL">Manual updates only</option></select></label><label><span className="label">When should stock be reserved?</span><select disabled={userRole !== 'owner'} value={settings.reservationMode} onChange={(event) => setSettings({ ...settings, reservationMode: event.target.value })} className="field"><option value="ON_ORDER">When customer places order</option><option value="ON_CONFIRMATION">When business accepts order</option><option value="DISABLED">Never automatically reserve</option></select></label><label><span className="label">Reservation expiry (minutes)</span><input disabled={userRole !== 'owner'} type="number" min="5" max="1440" value={settings.reservationExpiryMinutes} onChange={(event) => setSettings({ ...settings, reservationExpiryMinutes: Number(event.target.value) })} className="field" /></label><label><span className="label">Default unit</span><select disabled={userRole !== 'owner'} value={settings.defaultUnit} onChange={(event) => setSettings({ ...settings, defaultUnit: event.target.value })} className="field"><option value="piece">Piece / portion</option><option value="bottle">Bottle</option><option value="pack">Pack</option><option value="crate">Crate</option><option value="kg">Kilogram</option><option value="litre">Litre</option></select></label></div></div><div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6"><div className="flex items-center gap-3 mb-5"><div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Bell size={19} /></div><div><h4 className="font-black text-gray-900">Visibility and permissions</h4><p className="text-xs text-gray-500 mt-1">Protect sensitive settings while enabling daily work.</p></div></div><div className="space-y-3"><label className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"><input disabled={userRole !== 'owner'} type="checkbox" checked={settings.autoHideOutOfStock} onChange={(event) => setSettings({ ...settings, autoHideOutOfStock: event.target.checked })} className="mt-0.5 h-4 w-4" /><span><span className="block text-sm font-bold text-gray-900">Hide out-of-stock menu items</span><span className="block text-xs text-gray-500 mt-1">Customers only see items with available stock.</span></span></label><label className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"><input disabled={userRole !== 'owner'} type="checkbox" checked={settings.lowStockNotifications} onChange={(event) => setSettings({ ...settings, lowStockNotifications: event.target.checked })} className="mt-0.5 h-4 w-4" /><span><span className="block text-sm font-bold text-gray-900">Enable low-stock alerts</span><span className="block text-xs text-gray-500 mt-1">Show attention cards and reorder suggestions.</span></span></label><label className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"><input disabled={userRole !== 'owner'} type="checkbox" checked={settings.managerCanRestock} onChange={(event) => setSettings({ ...settings, managerCanRestock: event.target.checked })} className="mt-0.5 h-4 w-4" /><span><span className="block text-sm font-bold text-gray-900">Managers can restock</span><span className="block text-xs text-gray-500 mt-1">Recommended for daily receiving.</span></span></label><label className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"><input disabled={userRole !== 'owner'} type="checkbox" checked={settings.managerCanAdjust} onChange={(event) => setSettings({ ...settings, managerCanAdjust: event.target.checked })} className="mt-0.5 h-4 w-4" /><span><span className="block text-sm font-bold text-gray-900">Managers can adjust stock</span><span className="block text-xs text-gray-500 mt-1">Every adjustment still requires a reason and appears in history.</span></span></label></div></div></div>{userRole === 'owner' ? <div className="flex justify-end"><button disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-white disabled:opacity-60" style={{ backgroundColor: themeColor }}><Save size={17} /> {saving ? 'Saving...' : 'Save inventory controls'}</button></div> : <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600 flex items-center gap-2"><LockKeyhole size={17} /> Only the owner can change inventory controls.</div>}<style jsx>{`.label { display:block; margin-bottom:.375rem; font-size:.65rem; font-weight:800; text-transform:uppercase; letter-spacing:.12em; color:#64748b; } .field { width:100%; border:1px solid #e2e8f0; border-radius:.75rem; padding:.75rem .875rem; font-size:.875rem; color:#0f172a; outline:none; background:#fff; } .field:focus { border-color:${themeColor}; box-shadow:0 0 0 3px ${themeColor}20; }`}</style></div>
  );
}
