'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownToLine, BarChart3, Boxes, CalendarCheck2, CheckCircle2, ClipboardCheck, CircleDollarSign, FileSpreadsheet, Package, Plus, ReceiptText, RefreshCw, Settings2, ShoppingBag, Truck, Utensils, Wine, X } from 'lucide-react';
import InventoryCountsPanel from '@/components/InventoryCountsPanel';
import InventoryReportsPanel from '@/components/InventoryReportsPanel';
import InventorySettingsPanel from '@/components/InventorySettingsPanel';
import InventorySuppliersPanel from '@/components/InventorySuppliersPanel';
import StockManagementRegister from '@/components/StockManagementRegister';

type Item = {
  id: string;
  name: string;
  unit: string;
  inventoryCategory: string;
  quantityOnHand: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  reorderQuantity: number;
  reorderEnabled: boolean;
  unitCost: number;
  sellingPrice: number;
  packSize: number;
  supplierName?: string | null;
  trackStock: boolean;
  isPerishable: boolean;
};

type Monthly = {
  period: { id: string; monthKey: string; status: string; dailyCloses: Array<{ closeDate: string; status: string; varianceValue: number | null }> };
  summary: { stockValue: number; completedRevenue: number; costOfSales: number; grossMargin: number; wasteCost: number; receivedCost: number; movementCount: number; completedDays: number };
  byCategory: Record<string, { quantity: number; costValue: number; revenue: number }>;
};

type Tab = 'overview' | 'stock' | 'move' | 'close' | 'month' | 'counts' | 'reports' | 'suppliers' | 'settings';

const movementOptions = [
  ['RECEIVED', 'Receive stock'],
  ['CUSTOMER_SALE', 'Customer sale'],
  ['EVENT_SALE', 'Event / function sale'],
  ['COCKTAIL_USAGE', 'Cocktail / bar usage'],
  ['OFFICE_USE', 'Office / internal use'],
  ['COMPLIMENTARY', 'Complimentary'],
  ['DAMAGE', 'Damage / waste'],
  ['TRANSFER_IN', 'Transfer in'],
  ['TRANSFER_OUT', 'Transfer out'],
  ['USAGE', 'Other usage'],
] as const;

function money(value: number) { return `${Math.round(value || 0).toLocaleString()} RWF`; }
function currentMonth() { return new Date().toISOString().slice(0, 7); }
function today() { return new Date().toISOString().slice(0, 10); }

export default function UnifiedInventoryManager({ userRole, themeColor = '#2563eb' }: { business: any; userRole: 'owner' | 'manager'; themeColor?: string }) {
  const isOwner = userRole === 'owner';
  const [tab, setTab] = useState<Tab>('stock');
  const [month, setMonth] = useState(currentMonth());
  const [items, setItems] = useState<Item[]>([]);
  const [monthly, setMonthly] = useState<Monthly | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, string>>({});
  const [closeDate, setCloseDate] = useState(today());
  const [registerDate, setRegisterDate] = useState(today());
  const [closeNotes, setCloseNotes] = useState('');
  const [operation, setOperation] = useState({ itemId: '', category: 'RECEIVED', quantity: '', salePrice: '', eventName: '', reason: '', comment: '' });
  const [newItem, setNewItem] = useState({ name: '', inventoryCategory: 'FOOD', unit: 'piece', quantityOnHand: '0', lowStockThreshold: '0', reorderQuantity: '0', unitCost: '0', sellingPrice: '0', packSize: '1', sku: '', supplierName: '', isPerishable: false, trackStock: true });

  const load = async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const [inventoryResponse, monthResponse] = await Promise.all([fetch('/api/business/inventory'), fetch(`/api/business/inventory/monthly?month=${encodeURIComponent(month)}`)]);
      const inventoryData = await inventoryResponse.json();
      const monthlyData = await monthResponse.json();
      if (!inventoryResponse.ok) throw new Error(inventoryData.error || 'Unable to load inventory.');
      if (!monthResponse.ok) throw new Error(monthlyData.error || 'Unable to load monthly operations.');
      setItems(inventoryData.items || []);
      setMonthly(monthlyData);
      if (inventoryData.items?.length && !inventoryData.items.some((item: Item) => item.id === operation.itemId)) setOperation((value) => ({ ...value, itemId: inventoryData.items[0].id }));
    } catch (err: any) {
      setError(err.message || 'Unable to load inventory operations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [month]);

  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.inventoryCategory || 'OTHER'))).sort(), [items]);
  const visibleItems = items.filter((item) => (categoryFilter === 'ALL' || item.inventoryCategory === categoryFilter) && item.name.toLowerCase().includes(search.toLowerCase()));
  const lowStock = items.filter((item) => item.reorderEnabled !== false && item.quantityOnHand - item.reservedQuantity <= item.lowStockThreshold);
  const statCards = monthly ? [
    { label: 'Stock value', value: money(monthly.summary.stockValue), icon: CircleDollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Monthly revenue', value: money(monthly.summary.completedRevenue), icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Gross margin', value: money(monthly.summary.grossMargin), icon: BarChart3, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Waste cost', value: money(monthly.summary.wasteCost), icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Low stock', value: lowStock.length, icon: Boxes, color: 'text-red-600', bg: 'bg-red-50' },
  ] : [];

  const resetMessages = () => { setError(''); setNotice(''); };

  const createItem = async (event: FormEvent) => {
    event.preventDefault();
    resetMessages();
    try {
      const response = await fetch('/api/business/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newItem, quantityOnHand: Number(newItem.quantityOnHand), lowStockThreshold: Number(newItem.lowStockThreshold), reorderQuantity: Number(newItem.reorderQuantity), unitCost: Number(newItem.unitCost), sellingPrice: Number(newItem.sellingPrice), packSize: Number(newItem.packSize), menuItemId: null }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Stock item could not be created.');
      setShowCreate(false);
      setNewItem({ name: '', inventoryCategory: 'FOOD', unit: 'piece', quantityOnHand: '0', lowStockThreshold: '0', reorderQuantity: '0', unitCost: '0', sellingPrice: '0', packSize: '1', sku: '', supplierName: '', isPerishable: false, trackStock: true });
      setNotice(`${data.name} was added to standalone inventory.`);
      await load(true);
    } catch (err: any) { setError(err.message); }
  };

  const recordOperation = async (event: FormEvent) => {
    event.preventDefault();
    resetMessages();
    try {
      const response = await fetch('/api/business/inventory/operations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...operation, quantity: Number(operation.quantity), salePrice: Number(operation.salePrice || 0), date: closeDate }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Operation could not be recorded.');
      setOperation({ itemId: operation.itemId, category: 'RECEIVED', quantity: '', salePrice: '', eventName: '', reason: '', comment: '' });
      setNotice('Inventory movement recorded in the monthly ledger.');
      await load(true);
    } catch (err: any) { setError(err.message); }
  };

  const saveDailyClose = async (complete: boolean) => {
    resetMessages();
    const lines = items.map((item) => ({ itemId: item.id, physicalQuantity: physicalCounts[item.id] ?? '', notes: '' })).filter((line) => line.physicalQuantity !== '');
    if (!lines.length) { setError('Enter physical quantities for at least one item.'); return; }
    try {
      const response = await fetch('/api/business/inventory/monthly', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ closeDate, status: complete ? 'COMPLETED' : 'DRAFT', notes: closeNotes, lines }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Daily close could not be saved.');
      setNotice(complete ? 'Daily close completed and variances posted.' : 'Daily close draft saved.');
      await load(true);
    } catch (err: any) { setError(err.message); }
  };

  const closeMonth = async () => {
    if (!isOwner || !window.confirm(`Close the ${month} inventory period?`)) return;
    resetMessages();
    try {
      const response = await fetch('/api/business/inventory/monthly', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ month, status: 'CLOSED' }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Month could not be closed.');
      setNotice(`${month} inventory period is now closed.`);
      await load(true);
    } catch (err: any) { setError(err.message); }
  };

  const tabItems: Array<{ id: Tab; label: string; icon: any; ownerOnly?: boolean }> = [
    { id: 'overview', label: 'Overview', icon: Boxes },
    { id: 'stock', label: 'Stock Management', icon: Package },
    { id: 'move', label: 'Daily movements', icon: ArrowDownToLine },
    { id: 'close', label: 'Daily close', icon: CalendarCheck2 },
    { id: 'month', label: 'Month review', icon: FileSpreadsheet },
    { id: 'counts', label: 'Stock counts', icon: ClipboardCheck },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'settings', label: 'Controls', icon: Settings2, ownerOnly: true },
  ];

  const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500';
  const labelClass = 'mb-1.5 block text-[10px] uppercase tracking-widest font-black text-gray-400';

  return <div className="space-y-6">
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4"><div><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: themeColor }}><Utensils size={22} /></div><div><h2 className="text-2xl font-black text-gray-900 tracking-tight">Standalone Food & Drinks Inventory</h2><p className="text-sm text-gray-500 mt-1">Create stock items directly, then manage the full daily and monthly ledger.</p></div></div></div><div className="flex flex-wrap items-end gap-2"><label className="text-[10px] uppercase tracking-widest font-black text-gray-400">Operating month<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="mt-1 block rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold text-gray-700" /></label><button onClick={() => load(true)} className="rounded-xl border border-gray-200 bg-white p-3 text-gray-500 hover:bg-gray-50" title="Refresh"><RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} /></button><button onClick={() => { resetMessages(); setShowCreate(true); }} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-50"><Plus size={17} /> New stock item</button><button onClick={() => { resetMessages(); setTab('move'); }} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white" style={{ backgroundColor: themeColor }}><Plus size={17} /> Record movement</button></div></div>
    {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
    {notice && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 flex items-center gap-2"><CheckCircle2 size={17} /> {notice}</div>}
    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-800"><strong>Standalone register:</strong> create items here even when they are not on the customer menu. Menu linking remains optional and does not control this stock ledger.</div>
    <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">{statCards.map((card) => <div key={card.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${card.bg} ${card.color}`}><card.icon size={19} /></div><p className="text-[10px] uppercase tracking-widest font-black text-gray-400">{card.label}</p><p className="mt-1 text-xl font-black text-gray-900">{card.value}</p></div>)}</div>
    <div className="rounded-2xl border border-gray-100 bg-white p-2 shadow-sm flex gap-1 overflow-x-auto">{tabItems.filter((item) => !item.ownerOnly || isOwner).map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold transition-all ${tab === item.id ? 'text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`} style={tab === item.id ? { backgroundColor: themeColor } : {}}><item.icon size={16} /> {item.label}</button>)}</div>
    {loading ? <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center text-gray-400">Loading standalone inventory...</div> : tab === 'overview' ? <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-5"><div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><div className="flex items-center justify-between mb-5"><div><h3 className="text-lg font-black text-gray-900">Low-stock attention</h3><p className="mt-1 text-sm text-gray-500">Products that may affect service or purchasing.</p></div><AlertTriangle size={18} className="text-amber-500" /></div>{lowStock.length === 0 ? <div className="rounded-xl bg-emerald-50 p-8 text-center text-sm font-bold text-emerald-700">Stock levels look healthy.</div> : <div className="space-y-3">{lowStock.slice(0, 8).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">{item.inventoryCategory === 'DRINK' ? <Wine size={17} /> : <Package size={17} />}</div><div><p className="font-bold text-gray-900">{item.name}</p><p className="text-xs text-gray-500 mt-1">{Math.max(0, item.quantityOnHand - item.reservedQuantity)} {item.unit} available · reorder {item.reorderQuantity || '—'}</p></div></div><button onClick={() => { setOperation({ ...operation, itemId: item.id, category: 'RECEIVED' }); setTab('move'); }} className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">Receive</button></div>)}</div>}</div><div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm"><div className="flex items-center gap-3 mb-5"><div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center"><ReceiptText size={19} /></div><div><h3 className="text-lg font-black">Month at a glance</h3><p className="mt-1 text-sm text-slate-400">{month} operations summary.</p></div></div><div className="space-y-4 text-sm"><div className="flex justify-between"><span className="text-slate-400">Stock received</span><strong>{money(monthly?.summary.receivedCost || 0)}</strong></div><div className="flex justify-between"><span className="text-slate-400">Cost of sales</span><strong>{money(monthly?.summary.costOfSales || 0)}</strong></div><div className="flex justify-between"><span className="text-slate-400">Completed days</span><strong>{monthly?.summary.completedDays || 0}</strong></div><div className="border-t border-white/10 pt-4 flex justify-between"><span className="text-slate-300">Gross margin</span><strong className="text-emerald-300">{money(monthly?.summary.grossMargin || 0)}</strong></div></div><button onClick={() => setTab('month')} className="mt-6 w-full rounded-xl bg-white py-3 text-sm font-black text-slate-900 hover:bg-slate-100">Review month</button></div></div> : tab === 'stock' ? <StockManagementRegister items={items} themeColor={themeColor} date={registerDate} onDateChange={setRegisterDate} onRefresh={() => load(true)} onAddItem={() => { resetMessages(); setShowCreate(true); }} onNotice={setNotice} onError={setError} /> : tab === 'move' ? <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 mb-6"><div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><ArrowDownToLine size={20} /></div><div><h3 className="text-lg font-black text-gray-900">Daily movement ledger</h3><p className="mt-1 text-sm text-gray-500">Record receiving, sales, usage, waste, transfers, and internal consumption.</p></div></div><form onSubmit={recordOperation} className="grid lg:grid-cols-2 gap-4"><label><span className={labelClass}>Movement type</span><select value={operation.category} onChange={(event) => setOperation({ ...operation, category: event.target.value })} className={inputClass}>{movementOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label><span className={labelClass}>Stock item</span><select required value={operation.itemId} onChange={(event) => setOperation({ ...operation, itemId: event.target.value })} className={inputClass}><option value="">Choose stock item</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}</select></label><label><span className={labelClass}>Quantity</span><input required type="number" min="0.01" step="0.01" value={operation.quantity} onChange={(event) => setOperation({ ...operation, quantity: event.target.value })} className={inputClass} placeholder="e.g. 24" /></label><label><span className={labelClass}>Operation date</span><input required type="date" value={closeDate} onChange={(event) => setCloseDate(event.target.value)} className={inputClass} /></label>{['CUSTOMER_SALE', 'EVENT_SALE'].includes(operation.category) && <label><span className={labelClass}>Selling price per unit</span><input type="number" min="0" step="0.01" value={operation.salePrice} onChange={(event) => setOperation({ ...operation, salePrice: event.target.value })} className={inputClass} placeholder="RWF" /></label>}{operation.category === 'EVENT_SALE' && <label><span className={labelClass}>Event name</span><input value={operation.eventName} onChange={(event) => setOperation({ ...operation, eventName: event.target.value })} className={inputClass} placeholder="e.g. Wedding reception" /></label>}<label><span className={labelClass}>Reason</span><input value={operation.reason} onChange={(event) => setOperation({ ...operation, reason: event.target.value })} className={inputClass} placeholder="Optional explanation" /></label><label><span className={labelClass}>Comment</span><input value={operation.comment} onChange={(event) => setOperation({ ...operation, comment: event.target.value })} className={inputClass} placeholder="Reference or note" /></label><div className="lg:col-span-2 flex justify-end"><button type="submit" className="rounded-xl px-5 py-3 text-sm font-black text-white" style={{ backgroundColor: themeColor }}>Save movement</button></div></form></div> : tab === 'close' ? <div className="space-y-5"><div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><div className="flex flex-col md:flex-row md:items-end justify-between gap-4"><div><h3 className="text-lg font-black text-gray-900">Daily close</h3><p className="mt-1 text-sm text-gray-500">Enter physical quantities; MenuHub calculates differences and cost impact.</p></div><div className="flex gap-2"><label className={labelClass}>Close date<input type="date" value={closeDate} onChange={(event) => setCloseDate(event.target.value)} className="mt-1 block rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-700" /></label><input value={closeNotes} onChange={(event) => setCloseNotes(event.target.value)} placeholder="Notes" className="mt-4 rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /></div></div></div><div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="bg-gray-50 border-b border-gray-100"><tr><th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">Item</th><th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">System quantity</th><th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">Physical quantity</th><th className="px-5 py-3 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">Variance</th></tr></thead><tbody className="divide-y divide-gray-50">{items.map((item) => { const value = physicalCounts[item.id] ?? ''; const variance = value === '' ? null : Number(value) - item.quantityOnHand; return <tr key={item.id}><td className="px-5 py-3 font-bold">{item.name}<span className="block text-xs font-normal text-gray-400">{item.unit}</span></td><td className="px-5 py-3">{item.quantityOnHand.toLocaleString()}</td><td className="px-5 py-3"><input type="number" min={item.reservedQuantity} step="0.01" value={value} onChange={(event) => setPhysicalCounts({ ...physicalCounts, [item.id]: event.target.value })} className="w-36 rounded-lg border border-gray-200 px-3 py-2" /></td><td className={`px-5 py-3 font-black ${variance === null ? 'text-gray-300' : variance < 0 ? 'text-red-600' : variance > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>{variance === null ? '—' : `${variance > 0 ? '+' : ''}${variance}`}</td></tr>; })}</tbody></table></div><div className="flex justify-end gap-2 border-t border-gray-100 p-5"><button onClick={() => saveDailyClose(false)} className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700">Save draft</button><button onClick={() => saveDailyClose(true)} className="rounded-xl px-5 py-3 text-sm font-black text-white" style={{ backgroundColor: themeColor }}>Complete daily close</button></div></div></div> : tab === 'month' ? <div className="space-y-5"><div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="text-lg font-black text-gray-900">Monthly review · {month}</h3><p className="mt-1 text-sm text-gray-500">Revenue, cost, margin, waste, and movement categories for the full operating month.</p></div><div className="flex gap-2">{isOwner && monthly?.period.status !== 'CLOSED' && <button onClick={closeMonth} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white">Close month</button>}{monthly?.period.status === 'CLOSED' && <span className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">Month closed</span>}</div></div></div><div className="grid lg:grid-cols-2 gap-5"><div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><h4 className="font-black text-gray-900 mb-4">Movement categories</h4><div className="space-y-3">{Object.entries(monthly?.byCategory || {}).map(([key, value]) => <div key={key} className="flex items-center justify-between border-b border-gray-50 pb-3"><div><p className="text-sm font-bold text-gray-800">{key.replace(/_/g, ' ')}</p><p className="text-xs text-gray-400">{value.quantity.toLocaleString()} units</p></div><div className="text-right"><p className="text-sm font-black text-gray-900">{money(value.costValue)}</p>{value.revenue > 0 && <p className="text-xs font-bold text-emerald-600">Revenue {money(value.revenue)}</p>}</div></div>)}</div></div><div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><h4 className="font-black text-gray-900 mb-4">Daily close history</h4>{monthly?.period.dailyCloses?.length ? <div className="space-y-3">{monthly.period.dailyCloses.map((close) => <div key={close.closeDate} className="flex items-center justify-between rounded-xl bg-gray-50 p-3"><div><p className="text-sm font-bold text-gray-800">{new Date(close.closeDate).toLocaleDateString()}</p><p className="text-xs text-gray-400">Variance {money(close.varianceValue || 0)}</p></div><span className="text-[10px] uppercase tracking-widest font-black text-emerald-600">{close.status}</span></div>)}</div> : <p className="text-sm text-gray-400">No daily closes yet.</p>}</div></div></div> : tab === 'counts' ? <InventoryCountsPanel themeColor={themeColor} /> : tab === 'reports' ? <InventoryReportsPanel themeColor={themeColor} userRole={userRole} /> : tab === 'suppliers' ? <InventorySuppliersPanel userRole={userRole} themeColor={themeColor} /> : <InventorySettingsPanel userRole={userRole} themeColor={themeColor} />}
    {showCreate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setShowCreate(false)}><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between mb-6"><div><p className="text-[10px] uppercase tracking-widest font-black text-blue-600">Standalone stock register</p><h3 className="mt-1 text-xl font-black text-gray-900">Create a food or drink stock item</h3><p className="mt-1 text-sm text-gray-500">This item does not need to exist on the customer menu.</p></div><button onClick={() => setShowCreate(false)} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100"><X size={20} /></button></div><form onSubmit={createItem} className="grid gap-4 md:grid-cols-2"><label><span className={labelClass}>Item name</span><input required value={newItem.name} onChange={(event) => setNewItem({ ...newItem, name: event.target.value })} className={inputClass} placeholder="e.g. Inyange Water 500ml" /></label><label><span className={labelClass}>Category</span><select value={newItem.inventoryCategory} onChange={(event) => setNewItem({ ...newItem, inventoryCategory: event.target.value })} className={inputClass}><option value="FOOD">Food</option><option value="DRINK">Drink</option><option value="INGREDIENT">Ingredient</option><option value="PACKAGING">Packaging</option><option value="OTHER">Other</option></select></label><label><span className={labelClass}>Unit of measure</span><select value={newItem.unit} onChange={(event) => setNewItem({ ...newItem, unit: event.target.value })} className={inputClass}><option value="piece">Piece / portion</option><option value="bottle">Bottle</option><option value="can">Can</option><option value="pack">Pack</option><option value="crate">Crate</option><option value="kg">Kilogram</option><option value="g">Gram</option><option value="litre">Litre</option><option value="ml">Millilitre</option></select></label><label><span className={labelClass}>Opening quantity</span><input type="number" min="0" step="0.01" value={newItem.quantityOnHand} onChange={(event) => setNewItem({ ...newItem, quantityOnHand: event.target.value })} className={inputClass} /></label><label><span className={labelClass}>Unit cost</span><input type="number" min="0" step="0.01" value={newItem.unitCost} onChange={(event) => setNewItem({ ...newItem, unitCost: event.target.value })} className={inputClass} placeholder="RWF" /></label><label><span className={labelClass}>Selling price</span><input type="number" min="0" step="0.01" value={newItem.sellingPrice} onChange={(event) => setNewItem({ ...newItem, sellingPrice: event.target.value })} className={inputClass} placeholder="RWF" /></label><label><span className={labelClass}>Low-stock threshold</span><input type="number" min="0" step="0.01" value={newItem.lowStockThreshold} onChange={(event) => setNewItem({ ...newItem, lowStockThreshold: event.target.value })} className={inputClass} /></label><label><span className={labelClass}>Reorder quantity</span><input type="number" min="0" step="0.01" value={newItem.reorderQuantity} onChange={(event) => setNewItem({ ...newItem, reorderQuantity: event.target.value })} className={inputClass} /></label><label><span className={labelClass}>Pack size</span><input type="number" min="0.01" step="0.01" value={newItem.packSize} onChange={(event) => setNewItem({ ...newItem, packSize: event.target.value })} className={inputClass} /></label><label><span className={labelClass}>SKU / code</span><input value={newItem.sku} onChange={(event) => setNewItem({ ...newItem, sku: event.target.value })} className={inputClass} placeholder="Optional" /></label><label><span className={labelClass}>Supplier name</span><input value={newItem.supplierName} onChange={(event) => setNewItem({ ...newItem, supplierName: event.target.value })} className={inputClass} placeholder="Optional" /></label><div className="flex items-center gap-5 md:col-span-2"><label className="flex items-center gap-2 text-sm font-bold text-gray-700"><input type="checkbox" checked={newItem.isPerishable} onChange={(event) => setNewItem({ ...newItem, isPerishable: event.target.checked })} /> Perishable item</label><label className="flex items-center gap-2 text-sm font-bold text-gray-700"><input type="checkbox" checked={newItem.trackStock} onChange={(event) => setNewItem({ ...newItem, trackStock: event.target.checked })} /> Track automatically</label></div><div className="flex justify-end gap-2 md:col-span-2"><button type="button" onClick={() => setShowCreate(false)} className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-600">Cancel</button><button type="submit" className="rounded-xl px-5 py-3 text-sm font-black text-white" style={{ backgroundColor: themeColor }}>Create stock item</button></div></form></div></div>}
  </div>;
}
