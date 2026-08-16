'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, BarChart3, CalendarDays, Download, PackageCheck, ShoppingBag, Truck } from 'lucide-react';

type InventoryReport = {
  range: { from: string; to: string };
  summary: { stockValue: number; availableValue: number; lowStockItems: number; outOfStockItems: number; reservedUnits: number; completedOrders: number; completedRevenue: number; restockedUnits: number; soldUnits: number; adjustedUnits: number };
  topUsed: Array<{ name: string; unit: string; quantity: number }>;
  daily: Array<{ date: string; restocked: number; sold: number; adjusted: number }>;
  lowStock: Array<{ id: string; name: string; unit: string; available: number; threshold: number; reorderQuantity: number; supplier?: string | null }>;
};

export default function InventoryReportsPanel({ themeColor = '#2563eb', userRole = 'owner' }: { themeColor?: string; userRole?: 'owner' | 'manager' }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState<InventoryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const loadReport = async (rangeFrom = from, rangeTo = to) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/business/inventory/report?from=${encodeURIComponent(rangeFrom)}&to=${encodeURIComponent(rangeTo)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load report.');
      setReport(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endValue = end.toISOString().slice(0, 10);
    const startValue = start.toISOString().slice(0, 10);
    setFrom(startValue);
    setTo(endValue);
    loadReport(startValue, endValue);
  }, []);

  const exportInventory = () => {
    window.location.href = '/api/business/inventory/export';
  };

  const importInventory = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImporting(true);
    setError('');
    setImportMessage('');
    try {
      const response = await fetch('/api/business/inventory/import', { method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: await file.text() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Import failed.');
      setImportMessage(`Imported ${data.created} new item${data.created === 1 ? '' : 's'} and updated ${data.updated}.`);
      await loadReport();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const summaryCards = report ? [
    { label: 'Stock value', value: `${Math.round(report.summary.stockValue).toLocaleString()} RWF`, icon: PackageCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Sold units', value: report.summary.soldUnits.toLocaleString(), icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Restocked units', value: report.summary.restockedUnits.toLocaleString(), icon: Truck, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Completed revenue', value: `${Math.round(report.summary.completedRevenue).toLocaleString()} RWF`, icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
  ] : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4"><div><h3 className="text-lg font-black text-gray-900">Inventory reports</h3><p className="text-sm text-gray-500 mt-1">Understand what is being sold, restocked, reserved, and adjusted.</p></div><div className="flex flex-wrap items-end gap-2"><label className="text-[10px] uppercase tracking-widest font-black text-gray-400">From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 block rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700" /></label><label className="text-[10px] uppercase tracking-widest font-black text-gray-400">To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 block rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700" /></label><button onClick={() => loadReport()} className="rounded-xl px-4 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: themeColor }}>Run report</button>{userRole === 'owner' && <><input ref={fileInput} type="file" accept=".csv,text/csv" onChange={importInventory} className="hidden" /><button onClick={() => fileInput.current?.click()} disabled={importing} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60">{importing ? 'Importing...' : 'Import CSV'}</button></>}<button onClick={exportInventory} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"><Download size={16} /> Export CSV</button></div></div>
      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {importMessage && <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{importMessage}</div>}
      {loading ? <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-gray-400">Preparing report...</div> : report && <>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">{summaryCards.map((card) => <div key={card.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${card.bg} ${card.color}`}><card.icon size={19} /></div><p className="text-[10px] uppercase tracking-widest font-black text-gray-400">{card.label}</p><p className="mt-1 text-xl font-black text-gray-900">{card.value}</p></div>)}</div>
        <div className="grid lg:grid-cols-2 gap-5"><div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6"><div className="flex items-center justify-between mb-5"><div><h4 className="font-black text-gray-900">Top-used stock</h4><p className="text-xs text-gray-500 mt-1">Based on completed order deductions.</p></div><ShoppingBag size={18} className="text-gray-400" /></div>{report.topUsed.length === 0 ? <p className="text-sm text-gray-400">No completed stock usage in this period.</p> : <div className="space-y-3">{report.topUsed.map((item, index) => <div key={item.name} className="flex items-center gap-3"><span className="w-6 text-xs font-black text-gray-400">{index + 1}</span><div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><PackageCheck size={16} /></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><span className="truncate text-sm font-bold text-gray-800">{item.name}</span><span className="text-sm font-black text-gray-900">{item.quantity.toLocaleString()}</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full" style={{ width: `${Math.max(8, (item.quantity / Math.max(1, report.topUsed[0].quantity)) * 100)}%`, backgroundColor: themeColor }} /></div></div><span className="text-xs text-gray-400">{item.unit}</span></div>)}</div>}</div><div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6"><div className="flex items-center justify-between mb-5"><div><h4 className="font-black text-gray-900">Reorder attention</h4><p className="text-xs text-gray-500 mt-1">Items at or below their threshold.</p></div><AlertTriangle size={18} className="text-amber-500" /></div>{report.lowStock.length === 0 ? <p className="text-sm text-emerald-600 font-semibold">No reorder attention required.</p> : <div className="space-y-3">{report.lowStock.slice(0, 8).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3"><div><p className="text-sm font-bold text-gray-800">{item.name}</p><p className="text-xs text-gray-500 mt-1">{item.available} available · threshold {item.threshold}{item.supplier ? ` · ${item.supplier}` : ''}</p></div><span className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-black text-amber-700">Order {item.reorderQuantity || '—'}</span></div>)}</div>}</div></div>
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6"><div className="flex items-center gap-2 mb-4"><CalendarDays size={18} className="text-gray-400" /><h4 className="font-black text-gray-900">Daily movement summary</h4></div>{report.daily.length === 0 ? <p className="text-sm text-gray-400">No movement recorded in this period.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="border-b border-gray-100"><th className="py-3 text-left text-[10px] uppercase tracking-widest text-gray-400">Date</th><th className="py-3 text-left text-[10px] uppercase tracking-widest text-gray-400">Restocked</th><th className="py-3 text-left text-[10px] uppercase tracking-widest text-gray-400">Sold</th><th className="py-3 text-left text-[10px] uppercase tracking-widest text-gray-400">Adjusted</th></tr></thead><tbody className="divide-y divide-gray-50">{report.daily.slice(-14).map((day) => <tr key={day.date}><td className="py-3 font-bold text-gray-800">{day.date}</td><td className="py-3 text-emerald-600 font-bold">+{day.restocked}</td><td className="py-3 text-blue-600 font-bold">{day.sold}</td><td className={`py-3 font-bold ${day.adjusted < 0 ? 'text-red-600' : 'text-gray-600'}`}>{day.adjusted > 0 ? '+' : ''}{day.adjusted}</td></tr>)}</tbody></table></div>}</div>
      </>}
    </div>
  );
}
