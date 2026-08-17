'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, FileSpreadsheet, Plus, RefreshCw, Save, Search } from 'lucide-react';

type RegisterItem = {
  id: string;
  name: string;
  unit: string;
  inventoryCategory: string;
  quantityOnHand: number;
  unitCost: number;
  packSize: number;
};

type Draft = {
  received: string;
  eventSales: string;
  damage: string;
  officeWater: string;
  transferIn: string;
  transferOut: string;
  usage: string;
  misExt: string;
  comment: string;
};

type MovementSummary = {
  opening: number;
  draft?: Partial<Draft>;
};

type Props = {
  items: RegisterItem[];
  themeColor: string;
  date: string;
  onDateChange: (date: string) => void;
  onRefresh: () => Promise<void>;
  onAddItem: () => void;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
};

const HEADINGS = [
  'ITEMS', 'UOM', 'UNIT COST', 'UNIT QTY', 'OPENING', 'RECEIVED',
  'EVENT & COCKTAILS SALES', 'VALUE', 'DAMAGE', 'VALUE', 'OFFICE WATER',
  'TRANS/IN', 'TRANS/OUT', 'USAGE', 'USAGE VALUE', 'TOTAL STOCK', 'CLOSING',
  'MIS/EXT', 'COMMENT', 'TOTAL STOCK VALUE',
];

const blankDraft = (): Draft => ({ received: '', eventSales: '', damage: '', officeWater: '', transferIn: '', transferOut: '', usage: '', misExt: '', comment: '' });

function numberValue(value: string | number | undefined) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatMoney(value: number) {
  return `${Math.round(value || 0).toLocaleString()} RWF`;
}

function dateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function categoryLabel(value: string) {
  const labels: Record<string, string> = { DRINK: 'DRINKS ITEMS', FOOD: 'FOOD ITEMS', INGREDIENT: 'INGREDIENTS', PACKAGING: 'PACKAGING ITEMS', OTHER: 'OTHER ITEMS' };
  return labels[value] || value.replace(/_/g, ' ').toUpperCase();
}

function movementDraft(summary?: MovementSummary): Draft {
  return { ...blankDraft(), ...(summary?.draft || {}) };
}

export default function StockManagementRegister({ items, themeColor, date, onDateChange, onRefresh, onAddItem, onNotice, onError }: Props) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [summaries, setSummaries] = useState<Record<string, MovementSummary>>({});
  const [search, setSearch] = useState('');
  const [loadingDay, setLoadingDay] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadDay() {
      setLoadingDay(true);
      try {
        const response = await fetch(`/api/business/inventory/operations?date=${encodeURIComponent(date)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'The selected stock register could not be loaded.');
        if (cancelled) return;
        const nextSummaries: Record<string, MovementSummary> = {};
        (data.rows || []).forEach((row: { itemId: string; opening: number; draft?: Partial<Draft> }) => {
          nextSummaries[row.itemId] = { opening: Number(row.opening || 0), draft: row.draft || {} };
        });
        setSummaries(nextSummaries);
        const nextDrafts: Record<string, Draft> = {};
        Object.entries(nextSummaries).forEach(([itemId, summary]) => { nextDrafts[itemId] = movementDraft(summary); });
        setDrafts(nextDrafts);
      } catch (error) {
        if (!cancelled) onError(error instanceof Error ? error.message : 'The selected stock register could not be loaded.');
      } finally {
        if (!cancelled) setLoadingDay(false);
      }
    }
    loadDay();
    return () => { cancelled = true; };
  }, [date, onError]);

  const filteredItems = useMemo(() => items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())), [items, search]);
  const groupedItems = useMemo(() => {
    const groups = new Map<string, RegisterItem[]>();
    filteredItems.forEach((item) => {
      const key = item.inventoryCategory || 'OTHER';
      groups.set(key, [...(groups.get(key) || []), item]);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredItems]);

  const updateDraft = (itemId: string, key: keyof Draft, value: string) => {
    setDrafts((current) => ({ ...current, [itemId]: { ...movementDraft(summaries[itemId]), ...current[itemId], [key]: value } }));
  };

  const calculated = (item: RegisterItem) => {
    const draft = drafts[item.id] || movementDraft(summaries[item.id]);
    const opening = numberValue(summaries[item.id]?.opening ?? item.quantityOnHand);
    const received = numberValue(draft.received);
    const eventSales = numberValue(draft.eventSales);
    const damage = numberValue(draft.damage);
    const officeWater = numberValue(draft.officeWater);
    const transferIn = numberValue(draft.transferIn);
    const transferOut = numberValue(draft.transferOut);
    const usage = numberValue(draft.usage);
    const misExt = numberValue(draft.misExt);
    const totalStock = opening + received + transferIn;
    const closing = totalStock - eventSales - damage - officeWater - transferOut - usage + misExt;
    return { draft, opening, received, eventSales, damage, officeWater, transferIn, transferOut, usage, misExt, totalStock, closing, eventValue: eventSales * item.unitCost, damageValue: damage * item.unitCost, usageValue: usage * item.unitCost, totalValue: closing * item.unitCost };
  };

  const saveDay = async () => {
    setSaving(true);
    onError('');
    try {
      const operations: Array<Record<string, string | number>> = [];
      items.forEach((item) => {
        const row = calculated(item);
        const base = { itemId: item.id, date };
        if (row.received > 0) operations.push({ ...base, category: 'RECEIVED', quantity: row.received, comment: row.draft.comment });
        if (row.eventSales > 0) operations.push({ ...base, category: 'EVENT_SALE', quantity: row.eventSales, salePrice: 0, comment: row.draft.comment });
        if (row.damage > 0) operations.push({ ...base, category: 'DAMAGE', quantity: row.damage, comment: row.draft.comment });
        if (row.officeWater > 0) operations.push({ ...base, category: 'OFFICE_USE', quantity: row.officeWater, comment: row.draft.comment });
        if (row.transferIn > 0) operations.push({ ...base, category: 'TRANSFER_IN', quantity: row.transferIn, comment: row.draft.comment });
        if (row.transferOut > 0) operations.push({ ...base, category: 'TRANSFER_OUT', quantity: row.transferOut, comment: row.draft.comment });
        if (row.usage > 0) operations.push({ ...base, category: 'USAGE', quantity: row.usage, comment: row.draft.comment });
        if (row.misExt !== 0) operations.push({ ...base, category: 'RECONCILIATION', quantity: Math.abs(row.misExt), comment: row.draft.comment, reason: row.misExt > 0 ? 'Extra stock' : 'Missing stock' });
      });
      if (!operations.length) { onError('Enter at least one daily movement before saving.'); return; }
      for (const operation of operations) {
        const response = await fetch('/api/business/inventory/operations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(operation) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'A stock movement could not be saved.');
      }
      onNotice(`${operations.length} movement${operations.length === 1 ? '' : 's'} saved for ${dateLabel(date)}.`);
      await onRefresh();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'The daily stock register could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const inputCell = (item: RegisterItem, key: keyof Draft) => <input aria-label={`${key} for ${item.name}`} type="number" min="0" step="0.01" value={drafts[item.id]?.[key] || ''} onChange={(event) => updateDraft(item.id, key, event.target.value)} className="w-[92px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-right text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />;
  const cell = (value: number, className = '') => <span className={`font-semibold ${className}`}>{formatNumber(value)}</span>;

  return <div className="space-y-4">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: themeColor }}><FileSpreadsheet size={21} /></div><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Daily stock register</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Stock Management</h2><p className="mt-1 text-sm text-slate-500">Workbook-style daily control for drinks, food, ingredients, and business stock.</p></div></div>
        <div className="flex flex-wrap items-end gap-2"><button onClick={() => onDateChange(shiftDate(date, -1))} className="rounded-xl border border-slate-200 bg-white p-3 text-slate-500 hover:bg-slate-50" title="Previous day"><ChevronLeft size={18} /></button><label className="text-[10px] font-black uppercase tracking-widest text-slate-400"><span className="flex items-center gap-1"><CalendarDays size={13} /> Register date</span><input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700" /></label><button onClick={() => onDateChange(shiftDate(date, 1))} className="rounded-xl border border-slate-200 bg-white p-3 text-slate-500 hover:bg-slate-50" title="Next day"><ChevronRight size={18} /></button><button onClick={onAddItem} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"><Plus size={16} /> Add item</button><button onClick={saveDay} disabled={saving || loadingDay} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60" style={{ backgroundColor: themeColor }}><Save size={16} /> {saving ? 'Saving…' : 'Save day'}</button></div>
      </div>
      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-black text-slate-800">{dateLabel(date)}</p><p className="mt-1 text-xs text-slate-500">Enter only the daily movement columns. Value, total stock, closing, and stock value calculate automatically.</p></div><div className="flex items-center gap-2"><div className="relative"><Search size={15} className="absolute left-3 top-3 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find an item" className="rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></div><button onClick={onRefresh} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50" title="Refresh stock"><RefreshCw size={16} /></button></div></div>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-5 py-4 text-white"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Kimihurura register format</p><p className="mt-1 text-sm font-bold">Daily quantities and calculated stock position</p></div><p className="text-xs font-semibold text-slate-300">{filteredItems.length} item{filteredItems.length === 1 ? '' : 's'}</p></div>
      <div className="overflow-x-auto"><table className="min-w-[2900px] border-collapse text-sm"><thead className="sticky top-0 z-20 bg-slate-100"><tr>{HEADINGS.map((heading, index) => <th key={`${heading}-${index}`} className={`border-b border-r border-slate-200 px-3 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-600 ${index === 0 ? 'sticky left-0 z-30 min-w-[240px] text-left bg-slate-100' : index === 1 ? 'min-w-[74px]' : index === 18 ? 'min-w-[220px]' : 'min-w-[104px]'}`}>{heading}</th>)}</tr></thead><tbody>
        {groupedItems.map(([category, categoryItems]) => <Fragment key={category}><tr key={`category-${category}`}><td colSpan={20} className="border-b border-t border-slate-300 bg-blue-50 px-4 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-blue-800">{categoryLabel(category)} <span className="ml-2 font-semibold text-blue-500">{categoryItems.length} items</span></td></tr>{categoryItems.map((item) => { const row = calculated(item); return <tr key={item.id} className="group hover:bg-blue-50/30"><td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 group-hover:bg-blue-50/30"><span className="block max-w-[220px] truncate" title={item.name}>{item.name}</span></td><td className="border-b border-r border-slate-200 px-3 py-3 text-center font-bold uppercase text-slate-500">{item.unit}</td><td className="border-b border-r border-slate-200 px-3 py-3 text-right text-slate-700">{formatMoney(item.unitCost)}</td><td className="border-b border-r border-slate-200 px-3 py-3 text-right text-slate-700">{cell(item.packSize)}</td><td className="border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-right text-slate-700">{cell(row.opening)}</td><td className="border-b border-r border-slate-200 px-2 py-2 text-right">{inputCell(item, 'received')}</td><td className="border-b border-r border-slate-200 px-2 py-2 text-right">{inputCell(item, 'eventSales')}</td><td className="border-b border-r border-slate-200 bg-emerald-50/50 px-3 py-3 text-right text-emerald-700">{formatMoney(row.eventValue)}</td><td className="border-b border-r border-slate-200 px-2 py-2 text-right">{inputCell(item, 'damage')}</td><td className="border-b border-r border-slate-200 bg-amber-50/60 px-3 py-3 text-right text-amber-700">{formatMoney(row.damageValue)}</td><td className="border-b border-r border-slate-200 px-2 py-2 text-right">{inputCell(item, 'officeWater')}</td><td className="border-b border-r border-slate-200 px-2 py-2 text-right">{inputCell(item, 'transferIn')}</td><td className="border-b border-r border-slate-200 px-2 py-2 text-right">{inputCell(item, 'transferOut')}</td><td className="border-b border-r border-slate-200 px-2 py-2 text-right">{inputCell(item, 'usage')}</td><td className="border-b border-r border-slate-200 bg-violet-50/50 px-3 py-3 text-right text-violet-700">{formatMoney(row.usageValue)}</td><td className="border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-right font-black text-slate-900">{cell(row.totalStock)}</td><td className={`border-b border-r border-slate-200 px-3 py-3 text-right font-black ${row.closing < 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50/40 text-emerald-700'}`}>{cell(row.closing)}</td><td className="border-b border-r border-slate-200 px-2 py-2 text-right">{inputCell(item, 'misExt')}</td><td className="border-b border-r border-slate-200 px-2 py-2"><input aria-label={`comment for ${item.name}`} value={row.draft.comment} onChange={(event) => updateDraft(item.id, 'comment', event.target.value)} className="w-[205px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800 outline-none focus:border-blue-500" placeholder="Note" /></td><td className="border-b border-slate-200 bg-blue-50/50 px-3 py-3 text-right font-black text-blue-800">{formatMoney(row.totalValue)}</td></tr>; })}</Fragment>)}
        {groupedItems.length === 0 && <tr><td colSpan={20} className="px-6 py-20 text-center text-slate-400"><FileSpreadsheet size={38} className="mx-auto text-slate-300" /><p className="mt-3 font-bold">No stock items found.</p><button onClick={onAddItem} className="mt-4 rounded-xl px-4 py-2.5 text-sm font-black text-white" style={{ backgroundColor: themeColor }}>Add the first stock item</button></td></tr>}
      </tbody></table></div>
      <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between"><p><strong className="text-slate-700">Formula:</strong> TOTAL STOCK = OPENING + RECEIVED + TRANS/IN · CLOSING = TOTAL STOCK − SALES − DAMAGE − OFFICE WATER − TRANS/OUT − USAGE ± MIS/EXT</p><p className="font-bold text-slate-600">Amounts shown in RWF</p></div>
    </div>
  </div>;
}
