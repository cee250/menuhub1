'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, History, Loader2, Plus, Save, CheckCircle2, XCircle } from 'lucide-react';

type CountLine = {
  id: string;
  inventoryItemId: string;
  expectedQuantity: number;
  countedQuantity: number | null;
  variance: number | null;
  reason?: string | null;
  inventoryItem: { id: string; name: string; unit: string; reservedQuantity: number };
};

type StockCount = {
  id: string;
  status: string;
  note?: string | null;
  createdAt: string;
  completedAt?: string | null;
  lines: CountLine[];
};

export default function InventoryCountsPanel({ themeColor = '#2563eb' }: { themeColor?: string }) {
  const [counts, setCounts] = useState<StockCount[]>([]);
  const [activeCount, setActiveCount] = useState<StockCount | null>(null);
  const [counted, setCounted] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function openCount(count: StockCount) {
    setActiveCount(count);
    setCounted(Object.fromEntries(count.lines.filter((line) => line.countedQuantity !== null).map((line) => [line.inventoryItemId, String(line.countedQuantity)])));
    setReasons(Object.fromEntries(count.lines.filter((line) => line.reason).map((line) => [line.inventoryItemId, line.reason || ''])));
    setMessage('');
    setError('');
  }

  const loadCounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/business/inventory/counts');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load stock counts.');
      const nextCounts = data || [];
      setCounts(nextCounts);
      const draft = nextCounts.find((count: StockCount) => count.status === 'DRAFT');
      if (draft && !activeCount) openCount(draft);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCounts();
  }, []);

  const startCount = async () => {
    setWorking(true);
    setError('');
    try {
      const response = await fetch('/api/business/inventory/counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note || 'Routine physical stock count' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to start stock count.');
      setNote('');
      await loadCounts();
      openCount(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  };

  const saveCount = async (complete = false) => {
    if (!activeCount) return;
    setWorking(true);
    setError('');
    try {
      const lines = activeCount.lines.map((line) => ({
        inventoryItemId: line.inventoryItemId,
        countedQuantity: counted[line.inventoryItemId] ?? '',
        reason: reasons[line.inventoryItemId] || '',
      }));
      const saveResponse = await fetch('/api/business/inventory/counts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countId: activeCount.id, action: 'save', lines }),
      });
      const saved = await saveResponse.json();
      if (!saveResponse.ok) throw new Error(saved.error || 'Unable to save count.');
      if (complete) {
        const completeResponse = await fetch('/api/business/inventory/counts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ countId: activeCount.id, action: 'complete' }),
        });
        const completed = await completeResponse.json();
        if (!completeResponse.ok) throw new Error(completed.error || 'Unable to complete count.');
        setActiveCount(null);
        setMessage('Stock count completed and variances posted to inventory history.');
      } else {
        setActiveCount(saved);
        setMessage('Draft stock count saved.');
      }
      await loadCounts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  };

  const cancelCount = async () => {
    if (!activeCount || !window.confirm('Cancel this stock count? No inventory will be changed.')) return;
    setWorking(true);
    try {
      const response = await fetch('/api/business/inventory/counts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countId: activeCount.id, action: 'cancel' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to cancel count.');
      setActiveCount(null);
      await loadCounts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  };

  const completedCounts = counts.filter((count) => count.status === 'COMPLETED');
  const completedLines = useMemo(() => activeCount?.lines.filter((line) => counted[line.inventoryItemId] !== undefined && counted[line.inventoryItemId] !== '') || [], [activeCount, counted]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div><h3 className="text-lg font-black text-gray-900">Physical stock counts</h3><p className="text-sm text-gray-500 mt-1">Count what is physically present. MenuHub calculates and records the variance for you.</p></div>
        {!activeCount && <div className="flex gap-2"><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Count note (optional)" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /><button disabled={working} onClick={startCount} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: themeColor }}><Plus size={16} /> Start count</button></div>}
      </div>
      {error && <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {message && <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-700 flex items-center gap-2"><CheckCircle2 size={16} /> {message}</div>}
      {loading ? <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-gray-400">Loading stock counts...</div> : activeCount ? (
        <div className="rounded-2xl border border-blue-100 bg-white shadow-sm overflow-hidden">
          <div className="p-5 bg-blue-50/60 border-b border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-widest font-black text-blue-600">Draft count</p><h4 className="text-xl font-black text-gray-900 mt-1">{activeCount.note || 'Routine physical stock count'}</h4><p className="text-xs text-gray-500 mt-1">{completedLines.length} of {activeCount.lines.length} items counted</p></div><div className="flex gap-2"><button disabled={working} onClick={cancelCount} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600"><XCircle size={15} /> Cancel</button><button disabled={working} onClick={() => saveCount(false)} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700"><Save size={15} /> Save draft</button><button disabled={working} onClick={() => saveCount(true)} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white disabled:opacity-60" style={{ backgroundColor: themeColor }}>{working ? <Loader2 className="animate-spin" size={15} /> : <ClipboardCheck size={15} />} Complete count</button></div></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="border-b border-gray-100 bg-gray-50"><tr><th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">Item</th><th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">Expected</th><th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">Physical count</th><th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">Reason for variance</th></tr></thead><tbody className="divide-y divide-gray-50">{activeCount.lines.map((line) => { const value = counted[line.inventoryItemId] ?? ''; const variance = value === '' ? null : Number(value) - line.expectedQuantity; return <tr key={line.id}><td className="px-5 py-4"><p className="font-bold text-gray-900">{line.inventoryItem.name}</p><p className="text-xs text-gray-400">{line.inventoryItem.unit} · {line.inventoryItem.reservedQuantity} reserved</p></td><td className="px-5 py-4 font-bold text-gray-600">{line.expectedQuantity.toLocaleString()}</td><td className="px-5 py-4"><div className="flex items-center gap-2"><input type="number" min={line.inventoryItem.reservedQuantity} step="0.01" value={value} onChange={(event) => setCounted({ ...counted, [line.inventoryItemId]: event.target.value })} placeholder="Enter count" className="w-32 rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-500" />{variance !== null && <span className={`text-xs font-black ${variance < 0 ? 'text-red-600' : variance > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>{variance > 0 ? '+' : ''}{variance}</span>}</div></td><td className="px-5 py-4"><input value={reasons[line.inventoryItemId] || ''} onChange={(event) => setReasons({ ...reasons, [line.inventoryItemId]: event.target.value })} placeholder="Optional" className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-500" /></td></tr>; })}</tbody></table></div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-5"><div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6"><div className="flex items-center gap-3 mb-5"><div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><ClipboardCheck size={19} /></div><div><h4 className="font-black text-gray-900">How stock counts work</h4><p className="text-xs text-gray-500 mt-1">No manual variance calculations required.</p></div></div><div className="space-y-3 text-sm text-gray-600"><p><span className="font-black text-gray-900">1.</span> Start a count before opening or after closing.</p><p><span className="font-black text-gray-900">2.</span> Enter the physical quantity for each item.</p><p><span className="font-black text-gray-900">3.</span> Complete it and MenuHub posts only the differences.</p></div></div><div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6"><div className="flex items-center gap-2 mb-4"><History size={18} className="text-gray-500" /><h4 className="font-black text-gray-900">Recent completed counts</h4></div>{completedCounts.length === 0 ? <p className="text-sm text-gray-400">No completed counts yet.</p> : <div className="space-y-3">{completedCounts.slice(0, 5).map((count) => <button key={count.id} onClick={() => openCount(count)} className="w-full text-left rounded-xl bg-gray-50 border border-gray-100 p-3 hover:bg-blue-50 transition"><div className="flex justify-between gap-3"><span className="text-sm font-bold text-gray-800">{count.note || 'Stock count'}</span><span className="text-[10px] uppercase tracking-widest font-black text-emerald-600">Completed</span></div><p className="text-xs text-gray-400 mt-1">{new Date(count.completedAt || count.createdAt).toLocaleString()} · {count.lines.length} items</p></button>)}</div>}</div></div>
      )}
    </div>
  );
}
