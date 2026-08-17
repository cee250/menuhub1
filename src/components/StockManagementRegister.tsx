'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, FileSpreadsheet, Plus, RefreshCw, Save, Search, Trash2 } from 'lucide-react';

type RegisterItem = {
  id: string;
  name: string;
  menuItemId?: string | null;
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

type RegisterRow = {
  rowKey: string;
  itemId?: string;
  isNew: boolean;
  name: string;
  unit: string;
  inventoryCategory: string;
  unitCost: string;
  packSize: string;
  opening: string;
  baselineOpening: number;
  draft: Draft;
  baseline: Draft;
};

type MovementSummary = {
  opening: number;
  draft?: Record<string, string | number>;
};

type Props = {
  items: RegisterItem[];
  themeColor: string;
  date: string;
  onDateChange: (date: string) => void;
  onRefresh: () => Promise<void>;
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
const movementKeys: Array<keyof Omit<Draft, 'comment'>> = ['received', 'eventSales', 'damage', 'officeWater', 'transferIn', 'transferOut', 'usage', 'misExt'];
const incomingKeys = new Set(['received', 'transferIn']);
const deductionKeys = new Set(['eventSales', 'damage', 'officeWater', 'transferOut', 'usage']);

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
  const labels: Record<string, string> = { DRINK: 'DRINKS ITEMS', FOOD: 'FOOD ITEMS' };
  return labels[value] || value.replace(/_/g, ' ').toUpperCase();
}

function draftFromSummary(summary?: MovementSummary): Draft {
  const draft = summary?.draft || {};
  return {
    received: String(draft.received ?? ''),
    eventSales: String(draft.eventSales ?? ''),
    damage: String(draft.damage ?? ''),
    officeWater: String(draft.officeWater ?? ''),
    transferIn: String(draft.transferIn ?? ''),
    transferOut: String(draft.transferOut ?? ''),
    usage: String(draft.usage ?? ''),
    misExt: String(draft.misExt ?? ''),
    comment: String(draft.comment ?? ''),
  };
}

function rowFromItem(item: RegisterItem, summary?: MovementSummary): RegisterRow {
  const draft = draftFromSummary(summary);
  const opening = Number(summary?.opening ?? item.quantityOnHand ?? 0);
  return { rowKey: item.id, itemId: item.id, isNew: false, name: item.name, unit: item.unit, inventoryCategory: item.inventoryCategory || 'OTHER', unitCost: String(item.unitCost || 0), packSize: String(item.packSize || 1), opening: String(opening), baselineOpening: opening, draft, baseline: { ...draft } };
}

function newRow(index: number): RegisterRow {
  const draft = blankDraft();
  return { rowKey: `new-${Date.now()}-${index}`, isNew: true, name: '', unit: 'piece', inventoryCategory: 'FOOD', unitCost: '', packSize: '1', opening: '', baselineOpening: 0, draft, baseline: { ...draft } };
}

export default function StockManagementRegister({ items, themeColor, date, onDateChange, onRefresh, onNotice, onError }: Props) {
  const [rows, setRows] = useState<RegisterRow[]>([]);
  const [search, setSearch] = useState('');
  const [loadingDay, setLoadingDay] = useState(false);
  const [saving, setSaving] = useState(false);
  const independentItems = useMemo(() => items.filter((item) => !item.menuItemId && ['FOOD', 'DRINK'].includes((item.inventoryCategory || '').toUpperCase())), [items]);

  useEffect(() => {
    let cancelled = false;
    async function loadDay() {
      setLoadingDay(true);
      try {
        const response = await fetch(`/api/business/inventory/operations?date=${encodeURIComponent(date)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'The selected stock register could not be loaded.');
        if (cancelled) return;
        const summaries: Record<string, MovementSummary> = {};
        (data.rows || []).forEach((row: { itemId: string; opening: number; draft?: Record<string, string | number> }) => { summaries[row.itemId] = { opening: Number(row.opening || 0), draft: row.draft || {} }; });
        setRows(independentItems.map((item) => rowFromItem(item, summaries[item.id])));
      } catch (error) {
        if (!cancelled) onError(error instanceof Error ? error.message : 'The selected stock register could not be loaded.');
      } finally {
        if (!cancelled) setLoadingDay(false);
      }
    }
    loadDay();
    return () => { cancelled = true; };
  }, [date, independentItems, onError]);

  const filteredRows = useMemo(() => rows.filter((row) => row.name.toLowerCase().includes(search.toLowerCase())), [rows, search]);
  const groupedRows = useMemo(() => {
    const groups = new Map<string, RegisterRow[]>();
    filteredRows.forEach((row) => { const key = row.inventoryCategory || 'OTHER'; groups.set(key, [...(groups.get(key) || []), row]); });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredRows]);

  const updateRow = (rowKey: string, field: keyof RegisterRow, value: string) => {
    setRows((current) => current.map((row) => row.rowKey === rowKey ? { ...row, [field]: value } : row));
  };

  const updateDraft = (rowKey: string, field: keyof Draft, value: string) => {
    setRows((current) => current.map((row) => row.rowKey === rowKey ? { ...row, draft: { ...row.draft, [field]: value } } : row));
  };

  const addRow = () => {
    setRows((current) => [...current, newRow(current.length)]);
    setSearch('');
  };

  const removeNewRow = (rowKey: string) => setRows((current) => current.filter((row) => row.rowKey !== rowKey));

  const calculated = (row: RegisterRow) => {
    const opening = numberValue(row.opening);
    const received = numberValue(row.draft.received);
    const eventSales = numberValue(row.draft.eventSales);
    const damage = numberValue(row.draft.damage);
    const officeWater = numberValue(row.draft.officeWater);
    const transferIn = numberValue(row.draft.transferIn);
    const transferOut = numberValue(row.draft.transferOut);
    const usage = numberValue(row.draft.usage);
    const misExt = numberValue(row.draft.misExt);
    const unitCost = numberValue(row.unitCost);
    const totalStock = opening + received + transferIn;
    const closing = totalStock - eventSales - damage - officeWater - transferOut - usage + misExt;
    return { opening, received, eventSales, damage, officeWater, transferIn, transferOut, usage, misExt, unitCost, totalStock, closing, eventValue: eventSales * unitCost, damageValue: damage * unitCost, usageValue: usage * unitCost, totalValue: closing * unitCost };
  };

  const postMovement = async (itemId: string, category: string, quantity: number, comment: string, reason?: string) => {
    const response = await fetch('/api/business/inventory/operations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId, category, quantity: Math.abs(quantity), date, comment, reason }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'A stock movement could not be saved.');
  };

  const saveDay = async () => {
    setSaving(true);
    onError('');
    try {
      const invalid = rows.find((row) => !row.name.trim());
      if (invalid) throw new Error('Enter an item name for every new stock row or remove the blank row.');
      if (!rows.length) throw new Error('Click Add item to stock to create your first stock row.');
      let itemCount = 0;
      let movementCount = 0;
      for (const row of rows) {
        let itemId = row.itemId;
        if (row.isNew) {
          const createResponse = await fetch('/api/business/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: row.name.trim(), unit: row.unit.trim() || 'piece', inventoryCategory: row.inventoryCategory, quantityOnHand: 0, unitCost: numberValue(row.unitCost), packSize: Math.max(0.01, numberValue(row.packSize) || 1), menuItemId: null, trackStock: true }) });
          const created = await createResponse.json();
          if (!createResponse.ok) throw new Error(created.error || `Could not create ${row.name}.`);
          itemId = created.id;
          itemCount += 1;
        } else if (itemId) {
          const settingsResponse = await fetch('/api/business/inventory', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'register', itemId, name: row.name.trim(), unit: row.unit.trim() || 'piece', inventoryCategory: row.inventoryCategory, unitCost: numberValue(row.unitCost), packSize: Math.max(0.01, numberValue(row.packSize) || 1) }) });
          const settingsData = await settingsResponse.json();
          if (!settingsResponse.ok) throw new Error(settingsData.error || `Could not update ${row.name}.`);
        }
        if (!itemId) continue;
        const openingDelta = numberValue(row.opening) - row.baselineOpening;
        if (row.isNew && numberValue(row.opening) > 0) { await postMovement(itemId, 'OPENING', numberValue(row.opening), row.draft.comment, 'Opening stock'); movementCount += 1; }
        if (!row.isNew && openingDelta !== 0) { await postMovement(itemId, 'RECONCILIATION', Math.abs(openingDelta), row.draft.comment, openingDelta > 0 ? 'Extra stock · opening correction' : 'Missing stock · opening correction'); movementCount += 1; }
        for (const key of movementKeys) {
          const current = numberValue(row.draft[key]);
          const baseline = row.isNew ? 0 : numberValue(row.baseline[key]);
          const delta = current - baseline;
          if (delta === 0) continue;
          if (key === 'misExt') {
            await postMovement(itemId, 'RECONCILIATION', Math.abs(delta), row.draft.comment, delta > 0 ? 'Extra stock' : 'Missing stock');
          } else if (delta > 0) {
            const category: Record<string, string> = { received: 'RECEIVED', eventSales: 'EVENT_SALE', damage: 'DAMAGE', officeWater: 'OFFICE_USE', transferIn: 'TRANSFER_IN', transferOut: 'TRANSFER_OUT', usage: 'USAGE' };
            await postMovement(itemId, category[key], delta, row.draft.comment, 'Daily register entry');
          } else {
            const reason = incomingKeys.has(key) ? 'Missing stock · register correction' : deductionKeys.has(key) ? 'Extra stock · register correction' : 'Register correction';
            await postMovement(itemId, 'RECONCILIATION', Math.abs(delta), row.draft.comment, reason);
          }
          movementCount += 1;
        }
      }
      onNotice(`${itemCount ? `${itemCount} stock item${itemCount === 1 ? '' : 's'} and ` : ''}${movementCount} register movement${movementCount === 1 ? '' : 's'} saved for ${dateLabel(date)}.`);
      await onRefresh();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'The daily stock register could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const numberInput = (row: RegisterRow, field: keyof RegisterRow, disabled = false) => <input aria-label={`${String(field)} for ${row.name || 'new stock item'}`} type="number" min="0" step="0.01" value={String(row[field] ?? '')} disabled={disabled} onChange={(event) => updateRow(row.rowKey, field, event.target.value)} className="w-[96px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-right text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500" />;
  const movementInput = (row: RegisterRow, field: keyof Draft) => <input aria-label={`${field} for ${row.name || 'new stock item'}`} type="number" min="0" step="0.01" value={row.draft[field] || ''} onChange={(event) => updateDraft(row.rowKey, field, event.target.value)} className="w-[94px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-right text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />;
  const cell = (value: number, className = '') => <span className={`font-semibold ${className}`}>{formatNumber(value)}</span>;

  return <div className="space-y-4">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: themeColor }}><FileSpreadsheet size={21} /></div><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Independent stock register</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Stock Management</h2><p className="mt-1 text-sm text-slate-500">Create your food and drinks stock from zero. This register is separate from the customer menu.</p></div></div><div className="flex flex-wrap items-end gap-2"><button onClick={() => onDateChange(shiftDate(date, -1))} className="rounded-xl border border-slate-200 bg-white p-3 text-slate-500 hover:bg-slate-50" title="Previous day"><ChevronLeft size={18} /></button><label className="text-[10px] font-black uppercase tracking-widest text-slate-400"><span className="flex items-center gap-1"><CalendarDays size={13} /> Register date</span><input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700" /></label><button onClick={() => onDateChange(shiftDate(date, 1))} className="rounded-xl border border-slate-200 bg-white p-3 text-slate-500 hover:bg-slate-50" title="Next day"><ChevronRight size={18} /></button><button onClick={onRefresh} className="rounded-xl border border-slate-200 bg-white p-3 text-slate-500 hover:bg-slate-50" title="Refresh"><RefreshCw size={17} /></button><button onClick={saveDay} disabled={saving || loadingDay} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60" style={{ backgroundColor: themeColor }}><Save size={16} /> {saving ? 'Saving…' : 'Save day'}</button></div></div>
      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-black text-slate-800">{dateLabel(date)}</p><p className="mt-1 text-xs text-slate-500">Blue and white fields are editable. Calculated VALUE, TOTAL STOCK, CLOSING, and TOTAL STOCK VALUE fields are protected formulas.</p></div><div className="relative"><Search size={15} className="absolute left-3 top-3 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find an item" className="rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></div></div>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-5 py-4 text-white"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Workbook register format</p><p className="mt-1 text-sm font-bold">Add as many independent stock rows as the business needs</p></div><p className="text-xs font-semibold text-slate-300">{rows.length} stock row{rows.length === 1 ? '' : 's'}</p></div>
      <div className="overflow-x-auto"><table className="min-w-[3200px] border-collapse text-sm"><thead className="sticky top-0 z-20 bg-slate-100"><tr>{HEADINGS.map((heading, index) => <th key={`${heading}-${index}`} className={`border-b border-r border-slate-200 px-3 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-600 ${index === 0 ? 'sticky left-0 z-30 min-w-[240px] text-left bg-slate-100' : index === 1 ? 'min-w-[100px]' : index === 18 ? 'min-w-[220px]' : 'min-w-[112px]'}`}>{heading}</th>)}<th className="min-w-[64px] border-b border-slate-200 bg-slate-100" /></tr></thead><tbody>
        {groupedRows.map(([category, categoryRows]) => <Fragment key={category}><tr><td colSpan={21} className="border-b border-t border-slate-300 bg-blue-50 px-4 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-blue-800">{categoryLabel(category)} <span className="ml-2 font-semibold text-blue-500">{categoryRows.length} rows</span></td></tr>{categoryRows.map((row) => { const calc = calculated(row); const itemDisabled = false; return <tr key={row.rowKey} className="group hover:bg-blue-50/30"><td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white px-3 py-2 group-hover:bg-blue-50/30"><input value={row.name} onChange={(event) => updateRow(row.rowKey, 'name', event.target.value)} disabled={itemDisabled} className="w-[220px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500" placeholder="Food or drink name" /><select value={row.inventoryCategory} onChange={(event) => updateRow(row.rowKey, 'inventoryCategory', event.target.value)} className="mt-1 w-[116px] rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 outline-none focus:border-blue-500"><option value="FOOD">Food</option><option value="DRINK">Drink</option></select></td><td className="border-b border-r border-slate-200 px-2 py-2"><input value={row.unit} onChange={(event) => updateRow(row.rowKey, 'unit', event.target.value)} disabled={itemDisabled} className="w-[84px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm font-semibold uppercase text-slate-700 outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500" placeholder="UOM" /></td><td className="border-b border-r border-slate-200 px-2 py-2 text-right">{numberInput(row, 'unitCost', itemDisabled)}</td><td className="border-b border-r border-slate-200 px-2 py-2 text-right">{numberInput(row, 'packSize', itemDisabled)}</td><td className="border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-right">{numberInput(row, 'opening', !row.isNew && itemDisabled)}</td><td className="border-b border-r border-slate-200 px-2 py-2 text-right">{movementInput(row, 'received')}</td><td className="border-b border-r border-slate-200 px-2 py-2 text-right">{movementInput(row, 'eventSales')}</td><td className="border-b border-r border-slate-200 bg-emerald-50/50 px-3 py-3 text-right text-emerald-700">{formatMoney(calc.eventValue)}</td><td className="border-b border-r border-slate-200 px-2 py-2 text-right">{movementInput(row, 'damage')}</td><td className="border-b border-r border-slate-200 bg-amber-50/60 px-3 py-3 text-right text-amber-700">{formatMoney(calc.damageValue)}</td><td className="border-b border-r border-slate-200 px-2 py-2 text-right">{movementInput(row, 'officeWater')}</td><td className="border-b border-r border-slate-200 px-2 py-2 text-right">{movementInput(row, 'transferIn')}</td><td className="border-b border-r border-slate-200 px-2 py-2 text-right">{movementInput(row, 'transferOut')}</td><td className="border-b border-r border-slate-200 px-2 py-2 text-right">{movementInput(row, 'usage')}</td><td className="border-b border-r border-slate-200 bg-violet-50/50 px-3 py-3 text-right text-violet-700">{formatMoney(calc.usageValue)}</td><td className="border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-right font-black text-slate-900">{cell(calc.totalStock)}</td><td className={`border-b border-r border-slate-200 px-3 py-3 text-right font-black ${calc.closing < 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50/40 text-emerald-700'}`}>{cell(calc.closing)}</td><td className="border-b border-r border-slate-200 px-2 py-2 text-right">{movementInput(row, 'misExt')}</td><td className="border-b border-r border-slate-200 px-2 py-2"><input value={row.draft.comment} onChange={(event) => updateDraft(row.rowKey, 'comment', event.target.value)} className="w-[205px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800 outline-none focus:border-blue-500" placeholder="Comment" /></td><td className="border-b border-slate-200 bg-blue-50/50 px-3 py-3 text-right font-black text-blue-800">{formatMoney(calc.totalValue)}</td><td className="border-b border-slate-200 px-2 py-2 text-center">{row.isNew && <button onClick={() => removeNewRow(row.rowKey)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Remove unsaved row"><Trash2 size={16} /></button>}</td></tr>; })}</Fragment>)}
        {groupedRows.length === 0 && <tr><td colSpan={21} className="px-6 py-20 text-center text-slate-400"><FileSpreadsheet size={38} className="mx-auto text-slate-300" /><p className="mt-3 font-bold">Your independent stock register is empty.</p><p className="mt-1 text-sm">Click the button below to create the first row.</p></td></tr>}
      </tbody></table></div>
      <div className="border-t border-slate-200 bg-slate-50 p-5"><button onClick={addRow} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-white shadow-sm" style={{ backgroundColor: themeColor }}><Plus size={17} /> Add item to stock</button><p className="mt-3 text-xs text-slate-500">Each row is independent from the customer menu. Add as many food and drink stock items as needed, then click Save day.</p></div>
      <div className="flex flex-col gap-2 border-t border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between"><p><strong className="text-slate-700">Formula:</strong> TOTAL STOCK = OPENING + RECEIVED + TRANS/IN · CLOSING = TOTAL STOCK − SALES − DAMAGE − OFFICE WATER − TRANS/OUT − USAGE ± MIS/EXT</p><p className="font-bold text-slate-600">Amounts shown in RWF · Scroll horizontally to access all columns</p></div>
    </div>
  </div>;
}
