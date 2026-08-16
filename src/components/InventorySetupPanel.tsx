'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Boxes, CheckCircle2, Loader2, Wand2 } from 'lucide-react';

export default function InventorySetupPanel({
  userRole,
  themeColor = '#2563eb',
  onComplete,
}: {
  userRole: 'owner' | 'manager';
  themeColor?: string;
  onComplete?: () => void;
}) {
  const [status, setStatus] = useState<{ menuItems: number; inventoryItems: number; unlinkedMenuItems: number; isComplete: boolean } | null>(null);
  const [mode, setMode] = useState('SIMPLE');
  const [defaultUnit, setDefaultUnit] = useState('piece');
  const [autoHide, setAutoHide] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/business/inventory/setup').then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      setStatus(data);
      if (data.settings) {
        setMode(data.settings.inventoryMode || 'SIMPLE');
        setDefaultUnit(data.settings.defaultUnit || 'piece');
        setAutoHide(data.settings.autoHideOutOfStock !== false);
      }
    }).catch(() => undefined);
  }, []);

  if (!status || status.isComplete || status.unlinkedMenuItems === 0) return null;

  const canConfigure = userRole === 'owner';
  const setup = async () => {
    if (!canConfigure) return;
    setWorking(true);
    setMessage('');
    try {
      const response = await fetch('/api/business/inventory/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryMode: mode, defaultUnit, autoHideOutOfStock: autoHide }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Setup could not be completed.');
      setMessage(`${data.created} menu items are now ready for inventory tracking.`);
      setStatus({ ...status, inventoryItems: status.inventoryItems + data.created, unlinkedMenuItems: Math.max(0, status.unlinkedMenuItems - data.created), isComplete: status.unlinkedMenuItems - data.created <= 0 });
      onComplete?.();
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5"><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg"><Wand2 size={20} /></div><div><p className="text-[10px] uppercase tracking-widest font-black text-blue-600">Recommended first step</p><h3 className="mt-1 text-lg font-black text-gray-900">Set up inventory from your existing menu</h3><p className="mt-1 max-w-2xl text-sm text-gray-600">You have {status.unlinkedMenuItems} menu item{status.unlinkedMenuItems === 1 ? '' : 's'} not linked to stock. We will create safe zero-quantity stock records without changing prices, categories, or menu design.</p></div></div>{canConfigure ? <div className="flex flex-col gap-2 sm:flex-row sm:items-end"><label className="text-[10px] uppercase tracking-widest font-black text-gray-500">Mode<select value={mode} onChange={(event) => setMode(event.target.value)} className="mt-1 block rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700"><option value="SIMPLE">Menu portions</option><option value="PACKAGED">Packaged products</option><option value="MANUAL">Manual only</option></select></label><label className="text-[10px] uppercase tracking-widest font-black text-gray-500">Default unit<select value={defaultUnit} onChange={(event) => setDefaultUnit(event.target.value)} className="mt-1 block rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700"><option value="piece">Piece / portion</option><option value="bottle">Bottle</option><option value="pack">Pack</option><option value="crate">Crate</option></select></label><button disabled={working} onClick={setup} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-white disabled:opacity-60" style={{ backgroundColor: themeColor }}>{working ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />} Set up now</button></div> : <div className="flex items-center gap-2 text-sm font-bold text-gray-600"><Boxes size={18} /> Ask the owner to initialize inventory.</div>}</div>{canConfigure && <label className="mt-4 flex items-center gap-2 text-xs font-semibold text-gray-600"><input type="checkbox" checked={autoHide} onChange={(event) => setAutoHide(event.target.checked)} className="h-4 w-4 rounded" /> Hide linked menu items when available stock reaches zero</label>}{message && <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-sm font-bold text-emerald-700"><CheckCircle2 size={16} /> {message}</div>}</div>
  );
}
