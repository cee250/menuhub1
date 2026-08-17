'use client';

import { useEffect, useState } from 'react';
import StockManagementRegister from '@/components/StockManagementRegister';

type Item = {
  id: string;
  name: string;
  menuItemId?: string | null;
  supplierName?: string | null;
  unit: string;
  inventoryCategory: string;
  quantityOnHand: number;
  unitCost: number;
  packSize: number;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function UnifiedInventoryManager({ themeColor = '#2563eb' }: { business: any; userRole: 'owner' | 'manager'; themeColor?: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [registerDate, setRegisterDate] = useState(today());

  const refresh = async () => {
    try {
      setError('');
      const response = await fetch('/api/business/inventory');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Stock items could not be loaded.');
      setItems(data.items || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Stock items could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  return <div className="space-y-4">
    {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
    {notice && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}
    {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-sm font-bold text-slate-400">Loading Stock Management…</div> : <StockManagementRegister items={items} themeColor={themeColor} date={registerDate} onDateChange={setRegisterDate} onRefresh={refresh} onNotice={setNotice} onError={setError} />}
  </div>;
}
