'use client';

import { useEffect, useMemo, useState } from 'react';
import InventoryCountsPanel from '@/components/InventoryCountsPanel';
import InventoryReportsPanel from '@/components/InventoryReportsPanel';
import InventorySetupPanel from '@/components/InventorySetupPanel';
import InventorySettingsPanel from '@/components/InventorySettingsPanel';
import InventorySuppliersPanel from '@/components/InventorySuppliersPanel';
import {
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
  Ban,
  Boxes,
  CheckCircle2,
  ChefHat,
  CircleDollarSign,
  Clock3,
  History,
  Package,
  Plus,
  ReceiptText,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  quantityOnHand: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  unitCost: number;
  reorderQuantity: number;
  sku?: string | null;
  supplierName?: string | null;
  trackStock: boolean;
  menuItem?: { id: string; name: string; price: number; isAvailable: boolean } | null;
}

interface InventoryOrder {
  id: string;
  tableNumber?: string | null;
  customerName?: string | null;
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface Movement {
  id: string;
  type: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  reservedBefore: number;
  reservedAfter: number;
  reason?: string | null;
  createdAt: string;
  inventoryItem: { name: string; unit: string };
}

type ActionType = 'restock' | 'adjust' | 'settings' | null;

export default function InventoryManager({
  business,
  userRole,
  themeColor = '#2563eb',
}: {
  business: any;
  userRole: 'owner' | 'manager';
  themeColor?: string;
}) {
  const isOwner = userRole === 'owner';
  const [tab, setTab] = useState<'overview' | 'items' | 'counts' | 'orders' | 'reports' | 'suppliers' | 'settings' | 'history'>('overview');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<InventoryOrder[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [stats, setStats] = useState({ totalItems: 0, lowStockItems: 0, outOfStockItems: 0, reorderSuggestions: 0, stockValue: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [action, setAction] = useState<ActionType>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({
    name: '',
    unit: 'piece',
    quantityOnHand: '0',
    lowStockThreshold: '0',
    unitCost: '0',
    reorderQuantity: '0',
    sku: '',
    supplierName: '',
    menuItemId: '',
    trackStock: true,
  });
  const [actionForm, setActionForm] = useState({ quantity: '', adjustment: '', reason: '' });

  const menuItems = useMemo(() => {
    return (business.categories || []).flatMap((category: any) =>
      (category.items || []).map((item: any) => ({ id: item.id, name: item.name, price: item.price })),
    );
  }, [business.categories]);

  const loadInventory = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [inventoryResponse, movementsResponse, ordersResponse] = await Promise.all([
        fetch('/api/business/inventory'),
        fetch('/api/business/inventory?history=true'),
        fetch('/api/business/orders?take=50'),
      ]);
      const inventoryData = inventoryResponse.ok ? await inventoryResponse.json() : { items: [], stats: {} };
      const movementData = movementsResponse.ok ? await movementsResponse.json() : [];
      const orderData = ordersResponse.ok ? await ordersResponse.json() : [];
      setItems(inventoryData.items || []);
      setStats({
        totalItems: inventoryData.stats?.totalItems || 0,
        lowStockItems: inventoryData.stats?.lowStockItems || 0,
        outOfStockItems: inventoryData.stats?.outOfStockItems || 0,
        reorderSuggestions: inventoryData.stats?.reorderSuggestions || 0,
        stockValue: inventoryData.stats?.stockValue || 0,
      });
      setMovements(movementData || []);
      setOrders(orderData || []);
    } catch (err) {
      console.error('Inventory loading error:', err);
      setError('Unable to load inventory data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [business.id]);

  const visibleItems = items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
  const lowStockItems = items.filter((item) => item.quantityOnHand - item.reservedQuantity <= item.lowStockThreshold);
  const activeOrders = orders.filter((order) => !['COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'].includes(order.status));

  const resetMessages = () => {
    setError('');
    setNotice('');
  };

  const submitMutation = async (url: string, options: RequestInit) => {
    resetMessages();
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'The operation could not be completed.');
    return data;
  };

  const handleAddItem = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await submitMutation('/api/business/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          unit: form.unit,
          quantityOnHand: Number(form.quantityOnHand),
          lowStockThreshold: Number(form.lowStockThreshold),
          unitCost: Number(form.unitCost),
          reorderQuantity: Number(form.reorderQuantity),
          sku: form.sku,
          supplierName: form.supplierName,
          menuItemId: form.menuItemId || null,
          trackStock: form.trackStock,
        }),
      });
      setShowAdd(false);
      setForm({ name: '', unit: 'piece', quantityOnHand: '0', lowStockThreshold: '0', unitCost: '0', reorderQuantity: '0', sku: '', supplierName: '', menuItemId: '', trackStock: true });
      setNotice('Inventory item added successfully.');
      await loadInventory(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openAction = (type: ActionType, item: InventoryItem) => {
    resetMessages();
    setSelectedItem(item);
    setAction(type);
    setActionForm({ quantity: '', adjustment: '', reason: '' });
  };

  const handleItemAction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedItem || !action) return;
    try {
      const body: Record<string, any> = { itemId: selectedItem.id, action, reason: actionForm.reason };
      if (action === 'restock') body.quantity = Number(actionForm.quantity);
      if (action === 'adjust') body.adjustment = Number(actionForm.adjustment);
      if (action === 'settings') {
        body.name = form.name;
        body.unit = form.unit;
        body.lowStockThreshold = Number(form.lowStockThreshold);
        body.unitCost = Number(form.unitCost);
        body.reorderQuantity = Number(form.reorderQuantity);
        body.sku = form.sku;
        body.supplierName = form.supplierName;
        body.trackStock = form.trackStock;
      }
      await submitMutation('/api/business/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setAction(null);
      setSelectedItem(null);
      setNotice(action === 'restock' ? 'Stock restocked successfully.' : action === 'adjust' ? 'Stock adjustment saved.' : 'Inventory settings updated.');
      await loadInventory(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openSettings = (item: InventoryItem) => {
    setForm({
      name: item.name,
      unit: item.unit,
      quantityOnHand: String(item.quantityOnHand),
      lowStockThreshold: String(item.lowStockThreshold),
      unitCost: String(item.unitCost),
      reorderQuantity: String(item.reorderQuantity || 0),
      sku: item.sku || '',
      supplierName: item.supplierName || '',
      menuItemId: item.menuItem?.id || '',
      trackStock: item.trackStock,
    });
    openAction('settings', item);
  };

  const archiveItem = async (item: InventoryItem) => {
    if (!isOwner || !window.confirm(`Archive ${item.name} from inventory?`)) return;
    try {
      await submitMutation(`/api/business/inventory?itemId=${encodeURIComponent(item.id)}`, { method: 'DELETE' });
      setNotice('Inventory item archived.');
      await loadInventory(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await submitMutation('/api/business/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      setNotice(status === 'COMPLETED' ? 'Order completed and stock deducted.' : `Order marked ${status.toLowerCase()}.`);
      await loadInventory(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const statusClass = (status: string) => {
    if (status === 'COMPLETED') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'CANCELLED' || status === 'REJECTED') return 'bg-red-50 text-red-700 border-red-100';
    if (status === 'READY') return 'bg-blue-50 text-blue-700 border-blue-100';
    return 'bg-amber-50 text-amber-700 border-amber-100';
  };

  const movementLabel: Record<string, string> = {
    INITIAL_STOCK: 'Initial stock',
    RESTOCK: 'Restocked',
    ADJUSTMENT: 'Manual adjustment',
    RESERVE: 'Order reserved',
    RELEASE: 'Reservation released',
    SALE: 'Sale deducted',
  };

  const statCards = [
    { label: 'Tracked items', value: stats.totalItems, icon: Boxes, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Low stock', value: stats.lowStockItems, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Out of stock', value: stats.outOfStockItems, icon: Ban, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Reorder suggestions', value: stats.reorderSuggestions, icon: Truck, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Stock value', value: `${Math.round(stats.stockValue).toLocaleString()} RWF`, icon: CircleDollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: themeColor }}>
              <Package size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Inventory Operations</h2>
              <p className="text-sm text-gray-500 mt-1">Track availability, reservations, restocking, and stock movement in one place.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadInventory(true)} className="p-3 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all" title="Refresh">
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => { resetMessages(); setShowAdd(true); }} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-white font-bold text-sm shadow-md hover:opacity-90 transition-all" style={{ backgroundColor: themeColor }}>
            <Plus size={18} /> Add stock item
          </button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {notice && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 flex items-center gap-2"><CheckCircle2 size={17} /> {notice}</div>}
      <InventorySetupPanel userRole={userRole} themeColor={themeColor} onComplete={() => loadInventory(true)} />

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-4`}><card.icon size={20} /></div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{card.label}</p>
            <p className="mt-1 text-2xl font-black text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 flex gap-1 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Boxes },
          { id: 'items', label: 'Stock items', icon: Package },
          { id: 'counts', label: 'Stock counts', icon: ClipboardCheck },
          { id: 'orders', label: `Orders${activeOrders.length ? ` (${activeOrders.length})` : ''}`, icon: ReceiptText },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
          { id: 'suppliers', label: 'Suppliers', icon: Truck },
          ...(isOwner ? [{ id: 'settings', label: 'Controls', icon: Settings2 }] : []),
          { id: 'history', label: 'Movement history', icon: History },
        ].map((item) => (
          <button key={item.id} onClick={() => setTab(item.id as typeof tab)} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${tab === item.id ? 'text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`} style={tab === item.id ? { backgroundColor: themeColor } : {}}>
            <item.icon size={17} /> {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400">Loading inventory operations...</div>
      ) : tab === 'overview' ? (
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div><h3 className="text-lg font-black text-gray-900">Attention required</h3><p className="text-sm text-gray-500 mt-1">Items that need restocking or a quick review.</p></div>
              <button onClick={() => setTab('items')} className="text-xs font-black uppercase tracking-widest" style={{ color: themeColor }}>View all</button>
            </div>
            {lowStockItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-10 text-center"><CheckCircle2 className="mx-auto text-emerald-500" size={30} /><p className="mt-3 font-bold text-emerald-700">Stock levels look healthy</p><p className="mt-1 text-xs text-emerald-600">No low-stock items require attention.</p></div>
            ) : (
              <div className="space-y-3">{lowStockItems.slice(0, 6).map((item) => { const available = item.quantityOnHand - item.reservedQuantity; return <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-4"><div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-xl flex items-center justify-center ${available <= 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}><Package size={17} /></div><div><p className="font-bold text-gray-900">{item.name}</p><p className="text-xs text-gray-500">{available.toLocaleString()} {item.unit} available · threshold {item.lowStockThreshold}</p></div></div><button onClick={() => openAction('restock', item)} className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100">Restock</button></div>; })}</div>
            )}
          </div>
          <div className="bg-slate-900 rounded-2xl shadow-sm p-6 text-white">
            <div className="flex items-center gap-3 mb-5"><div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><ShoppingBag size={19} /></div><div><h3 className="text-lg font-black">Order pipeline</h3><p className="text-sm text-slate-400 mt-1">Orders waiting for action.</p></div></div>
            <div className="grid grid-cols-2 gap-3 mb-5">{['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].map((status) => <div key={status} className="rounded-xl bg-white/5 border border-white/10 p-3"><p className="text-[10px] uppercase tracking-widest font-black text-slate-400">{status}</p><p className="mt-1 text-xl font-black">{orders.filter((order) => order.status === status).length}</p></div>)}</div>
            <button onClick={() => setTab('orders')} className="w-full rounded-xl bg-white text-slate-900 py-3 text-sm font-black hover:bg-slate-100 transition-all">Open order queue</button>
          </div>
        </div>
      ) : tab === 'items' ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3"><div><h3 className="text-lg font-black text-gray-900">Stock items</h3><p className="text-sm text-gray-500 mt-1">Simple menu-level stock tracking. Recipe measurements are not required.</p></div><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search stock" className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500" /></div></div>
          {visibleItems.length === 0 ? <div className="p-16 text-center text-gray-400"><Package size={35} className="mx-auto text-gray-300" /><p className="mt-3 font-bold">No inventory items yet</p><p className="text-sm mt-1">Add a stock item to begin tracking availability.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-gray-50 border-b border-gray-100"><tr><th className="px-5 py-4 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">Item</th><th className="px-5 py-4 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">On hand</th><th className="px-5 py-4 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">Reserved</th><th className="px-5 py-4 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">Available</th><th className="px-5 py-4 text-left text-[10px] uppercase tracking-widest font-black text-gray-400">Status</th><th className="px-5 py-4 text-right text-[10px] uppercase tracking-widest font-black text-gray-400">Actions</th></tr></thead><tbody className="divide-y divide-gray-50">{visibleItems.map((item) => { const available = item.quantityOnHand - item.reservedQuantity; const low = available <= item.lowStockThreshold; return <tr key={item.id} className="hover:bg-gray-50/70"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center"><Package size={17} /></div><div><p className="font-bold text-gray-900">{item.name}</p><p className="text-xs text-gray-400">{item.menuItem ? `Linked to ${item.menuItem.name}` : `Per ${item.unit}`}{item.supplierName ? ` · ${item.supplierName}` : ''}</p></div></div></td><td className="px-5 py-4 font-bold text-gray-900">{item.quantityOnHand.toLocaleString()} <span className="text-xs text-gray-400">{item.unit}</span></td><td className="px-5 py-4 text-amber-600 font-bold">{item.reservedQuantity.toLocaleString()}</td><td className="px-5 py-4 font-black text-gray-900">{available.toLocaleString()}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] uppercase tracking-widest font-black ${available <= 0 ? 'bg-red-50 text-red-700 border-red-100' : low ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>{available <= 0 ? 'Out of stock' : low ? 'Low stock' : 'Healthy'}</span></td><td className="px-5 py-4"><div className="flex items-center justify-end gap-1.5"><button onClick={() => openAction('restock', item)} className="p-2 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100" title="Restock"><ArrowDownToLine size={16} /></button><button onClick={() => openAction('adjust', item)} className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100" title="Adjust stock"><ArrowUpFromLine size={16} /></button>{isOwner && <><button onClick={() => openSettings(item)} className="p-2 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200" title="Settings"><Settings2 size={16} /></button><button onClick={() => archiveItem(item)} className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100" title="Archive"><X size={16} /></button></>}</div></td></tr>; })}</tbody></table></div>}
        </div>
      ) : tab === 'counts' ? (
        <InventoryCountsPanel themeColor={themeColor} />
      ) : tab === 'reports' ? (
        <InventoryReportsPanel themeColor={themeColor} userRole={userRole} />
      ) : tab === 'suppliers' ? (
        <InventorySuppliersPanel userRole={userRole} themeColor={themeColor} />
      ) : tab === 'settings' ? (
        <InventorySettingsPanel userRole={userRole} themeColor={themeColor} />
      ) : tab === 'orders' ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><h3 className="text-lg font-black text-gray-900">Order operations</h3><p className="text-sm text-gray-500 mt-1">Complete an order only when it is actually sold. That is when stock is permanently deducted.</p></div>
          {orders.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400"><ReceiptText size={35} className="mx-auto text-gray-300" /><p className="mt-3 font-bold">No customer orders yet</p></div> : orders.map((order) => <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><ReceiptText size={18} /></div><div><div className="flex items-center gap-2 flex-wrap"><p className="font-black text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</p><span className={`px-2.5 py-1 rounded-full border text-[10px] uppercase tracking-widest font-black ${statusClass(order.status)}`}>{order.status}</span></div><p className="text-xs text-gray-500 mt-1">{order.tableNumber || 'No table specified'} · {new Date(order.createdAt).toLocaleString()}</p></div></div><div className="flex items-center gap-4"><div className="text-right"><p className="text-xs text-gray-400 uppercase tracking-widest font-black">Total</p><p className="font-black text-gray-900">{order.totalAmount.toLocaleString()} RWF</p></div><div className="flex gap-1.5">{order.status === 'PENDING' && <button onClick={() => updateOrderStatus(order.id, 'CONFIRMED')} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold">Accept</button>}{['CONFIRMED', 'PREPARING'].includes(order.status) && <button onClick={() => updateOrderStatus(order.id, order.status === 'CONFIRMED' ? 'PREPARING' : 'READY')} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold">{order.status === 'CONFIRMED' ? 'Start' : 'Ready'}</button>}{order.status === 'READY' && <button onClick={() => updateOrderStatus(order.id, 'COMPLETED')} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold">Complete sale</button>}{!['COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'].includes(order.status) && <button onClick={() => updateOrderStatus(order.id, 'CANCELLED')} className="p-2 rounded-lg bg-red-50 text-red-600" title="Cancel"><Ban size={16} /></button>}</div></div></div><div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">{order.items.map((item) => <span key={item.id} className="px-3 py-1.5 rounded-lg bg-gray-50 text-xs font-semibold text-gray-600">{item.name} × {item.quantity}</span>)}</div></div>)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"><div className="p-5 border-b border-gray-100"><h3 className="text-lg font-black text-gray-900">Movement history</h3><p className="text-sm text-gray-500 mt-1">A permanent audit trail of restocks, reservations, releases, adjustments, and sales.</p></div>{movements.length === 0 ? <div className="p-16 text-center text-gray-400"><History size={35} className="mx-auto text-gray-300" /><p className="mt-3 font-bold">No movement history yet</p></div> : <div className="divide-y divide-gray-50">{movements.map((movement) => <div key={movement.id} className="p-5 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-xl flex items-center justify-center ${movement.type === 'SALE' ? 'bg-blue-50 text-blue-600' : movement.type === 'RESTOCK' || movement.type === 'INITIAL_STOCK' ? 'bg-emerald-50 text-emerald-600' : movement.type === 'RESERVE' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>{movement.type === 'SALE' ? <ShoppingBag size={16} /> : movement.type === 'RESTOCK' ? <Truck size={16} /> : <History size={16} />}</div><div><p className="font-bold text-gray-900">{movementLabel[movement.type] || movement.type} · {movement.inventoryItem.name}</p><p className="text-xs text-gray-500 mt-1">{movement.reason || 'No reason recorded'} · {new Date(movement.createdAt).toLocaleString()}</p></div></div><div className="text-right"><p className={`font-black ${movement.quantity < 0 ? 'text-blue-600' : movement.type === 'RESERVE' ? 'text-amber-600' : 'text-emerald-600'}`}>{movement.quantity > 0 && movement.type !== 'RESERVE' ? '+' : ''}{movement.quantity.toLocaleString()} {movement.inventoryItem.unit}</p><p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Available after: {(movement.quantityAfter - movement.reservedAfter).toLocaleString()}</p></div></div>)}</div>}</div>
      )}

      {showAdd && <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"><form onSubmit={handleAddItem} className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8"><div className="flex items-center justify-between mb-6"><div><h3 className="text-xl font-black text-gray-900">Add stock item</h3><p className="text-sm text-gray-500 mt-1">Set up simple menu-level stock tracking.</p></div><button type="button" onClick={() => setShowAdd(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100"><X size={20} /></button></div><div className="grid sm:grid-cols-2 gap-4"><label className="sm:col-span-2"><span className="label">Stock item name</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chicken Plate or Coca-Cola" className="field" /></label><label><span className="label">Link menu item (optional)</span><select value={form.menuItemId} onChange={(e) => { const selected = menuItems.find((item: any) => item.id === e.target.value); setForm({ ...form, menuItemId: e.target.value, name: selected?.name || form.name }); }} className="field"><option value="">Standalone stock item</option>{menuItems.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span className="label">Unit</span><select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="field"><option value="piece">Piece / portion</option><option value="bottle">Bottle</option><option value="crate">Crate</option><option value="kg">Kilogram</option><option value="litre">Litre</option><option value="pack">Pack</option></select></label><label><span className="label">Opening quantity</span><input type="number" min="0" step="0.01" value={form.quantityOnHand} onChange={(e) => setForm({ ...form, quantityOnHand: e.target.value })} className="field" /></label><label><span className="label">Low-stock threshold</span><input type="number" min="0" step="0.01" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} className="field" /></label><label><span className="label">Unit cost (RWF)</span><input type="number" min="0" step="0.01" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} className="field" /></label><label><span className="label">Reorder quantity</span><input type="number" min="0" step="0.01" value={form.reorderQuantity} onChange={(e) => setForm({ ...form, reorderQuantity: e.target.value })} className="field" /></label><label><span className="label">SKU (optional)</span><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Internal code" className="field" /></label><label><span className="label">Supplier (optional)</span><input value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} placeholder="Supplier name" className="field" /></label></div><label className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 border border-gray-100 p-3"><input type="checkbox" checked={form.trackStock} onChange={(e) => setForm({ ...form, trackStock: e.target.checked })} className="w-4 h-4" /><span><span className="block text-sm font-bold text-gray-900">Track this item automatically</span><span className="block text-xs text-gray-500 mt-0.5">Orders reserve and deduct this stock when completed.</span></span></label><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setShowAdd(false)} className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm">Cancel</button><button type="submit" className="px-5 py-3 rounded-xl text-white font-bold text-sm inline-flex items-center gap-2" style={{ backgroundColor: themeColor }}><Save size={17} /> Save stock item</button></div></form></div>}

      {action && selectedItem && <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"><form onSubmit={handleItemAction} className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8"><div className="flex items-center justify-between mb-6"><div><p className="text-xs uppercase tracking-widest font-black text-gray-400">{action === 'settings' ? 'Inventory settings' : action === 'restock' ? 'Restock item' : 'Adjust quantity'}</p><h3 className="text-xl font-black text-gray-900 mt-1">{selectedItem.name}</h3><p className="text-sm text-gray-500 mt-1">Available now: {(selectedItem.quantityOnHand - selectedItem.reservedQuantity).toLocaleString()} {selectedItem.unit}</p></div><button type="button" onClick={() => setAction(null)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100"><X size={20} /></button></div>{action === 'settings' ? <div className="space-y-4"><label><span className="label">Name</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" /></label><div className="grid grid-cols-2 gap-3"><label><span className="label">Unit</span><input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="field" /></label><label><span className="label">Low-stock threshold</span><input type="number" min="0" step="0.01" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} className="field" /></label></div><div className="grid grid-cols-2 gap-3"><label><span className="label">Unit cost</span><input type="number" min="0" step="0.01" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} className="field" /></label><label><span className="label">Reorder quantity</span><input type="number" min="0" step="0.01" value={form.reorderQuantity} onChange={(e) => setForm({ ...form, reorderQuantity: e.target.value })} className="field" /></label><label><span className="label">SKU</span><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="field" /></label><label><span className="label">Supplier</span><input value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} className="field" /></label></div><label className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><input type="checkbox" checked={form.trackStock} onChange={(e) => setForm({ ...form, trackStock: e.target.checked })} className="w-4 h-4" /><span className="text-sm font-bold text-gray-900">Track orders against this item</span></label></div> : <div className="space-y-4"><label><span className="label">{action === 'restock' ? 'Quantity received' : 'Adjustment amount'}</span><input required type="number" step="0.01" value={action === 'restock' ? actionForm.quantity : actionForm.adjustment} onChange={(e) => setActionForm({ ...actionForm, [action === 'restock' ? 'quantity' : 'adjustment']: e.target.value })} placeholder={action === 'restock' ? 'e.g. 20' : 'e.g. -2 or 5'} className="field" /></label><label><span className="label">Reason</span><input value={actionForm.reason} onChange={(e) => setActionForm({ ...actionForm, reason: e.target.value })} placeholder={action === 'restock' ? 'New delivery' : 'Damaged, counted, or corrected'} className="field" /></label></div>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setAction(null)} className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm">Cancel</button><button type="submit" className="px-5 py-3 rounded-xl text-white font-bold text-sm inline-flex items-center gap-2" style={{ backgroundColor: themeColor }}><Save size={17} /> Save changes</button></div></form></div>}

      <style jsx>{`.label { display: block; margin-bottom: 0.375rem; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b; } .field { width: 100%; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 0.75rem 0.875rem; font-size: 0.875rem; color: #0f172a; outline: none; background: #fff; } .field:focus { border-color: ${themeColor}; box-shadow: 0 0 0 3px ${themeColor}20; }`}</style>
    </div>
  );
}
