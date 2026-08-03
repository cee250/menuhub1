'use client';

import { useState, useEffect } from 'react';
import { Phone, UserCheck, UserX, Plus, Loader2 } from 'lucide-react';

export default function StaffManager({ businessSlug }: { businessSlug: string }) {
  const [waiters, setWaiters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchWaiters = async () => {
    try {
      const res = await fetch(`/api/${businessSlug}/staff`);
      if (res.ok) {
        const data = await res.json();
        setWaiters(data);
      }
    } catch (error) {
      console.error('Failed to fetch waiters:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaiters();
  }, [businessSlug]);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/${businessSlug}/staff`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      if (res.ok) {
        setWaiters(prev => prev.map(w => w.id === id ? { ...w, isActive: !currentStatus } : w));
      }
    } catch (error) {
      console.error('Failed to toggle waiter:', error);
    } finally {
      setTogglingId(null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    
    // Global validation
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    if (!phoneRegex.test(newPhone)) {
      alert('Please enter a valid international number (e.g., +250.......). Must start with + and have 7-15 digits.');
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch(`/api/${businessSlug}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim() }),
      });
      if (res.ok) {
        setNewName('');
        setNewPhone('');
        fetchWaiters(); 
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add waiter.');
      }
    } catch (error) {
      console.error('Failed to add waiter:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mt-8">
      <h2 className="text-xl font-semibold mb-4 pb-2 border-b flex items-center gap-2">
        🧑‍🍳 Waiter & Staff Management
      </h2>
      
      {/* Add Form */}
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-6">
        <input 
          type="text" 
          placeholder="Waiter Name (e.g., Jean)" 
          value={newName} 
          onChange={e => setNewName(e.target.value)} 
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
          required
        />
        <input 
          type="tel" 
          placeholder="+250......." 
          value={newPhone} 
          onChange={(e) => {
            const val = e.target.value.replace(/[^\d+]/g, '');
            setNewPhone(val);
          }} 
          className="w-full sm:w-48 border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
          required
        />
        <button 
          type="submit" 
          disabled={isAdding}
          className="bg-[#2563eb] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isAdding ? <Loader2 className="animate-spin w-5 h-5" /> : <Plus size={20} />}
          Add
        </button>
      </form>

      {/* Waiter List */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div>
      ) : waiters.length === 0 ? (
        <p className="text-center text-gray-500 py-4">No waiters added yet. Add your first waiter above.</p>
      ) : (
        <div className="space-y-3">
          {waiters.map((waiter) => (
            <div key={waiter.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${waiter.isActive ? 'bg-green-50/50 border-green-200' : 'bg-gray-50 border-gray-200 opacity-75'}`}>
              <div className="flex items-center gap-4 mb-3 sm:mb-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${waiter.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                  {waiter.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{waiter.name}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-1.5">
                    <Phone size={14} /> {waiter.phone}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => handleToggle(waiter.id, waiter.isActive)}
                disabled={togglingId === waiter.id}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                  waiter.isActive 
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {togglingId === waiter.id ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : waiter.isActive ? (
                  <><UserX size={18} /> Set on Break</>
                ) : (
                  <><UserCheck size={18} /> Activate</>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}