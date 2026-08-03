'use client';

import { useState } from 'react';
import { MessageCircle, Phone, ChevronDown } from 'lucide-react';

interface Props {
  itemName: string;
  itemPrice: number;
  businessSlug: string;
  businessWhatsapp?: string;
  activeWaiters: { id: string; name: string; phone: string }[];
}

export default function MenuItemOrderButton({ 
  itemName, 
  itemPrice, 
  businessSlug, 
  businessWhatsapp,
  activeWaiters 
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const createWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace('+', '').replace(/\s/g, '');
    const msg = encodeURIComponent(
      `Hi, I'd like to order:\n\n🍽️ *${itemName}*\n💰 ${itemPrice.toLocaleString()} RWF\n\n📍 Table: [Please specify]\n🏪 ${businessSlug}`
    );
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  };

  const handleOrderClick = (phone: string) => {
    window.open(createWhatsAppLink(phone), '_blank');
    setIsOpen(false);
  };

  if (activeWaiters.length === 0 && businessWhatsapp) {
    return (
      <button 
        onClick={() => handleOrderClick(businessWhatsapp)}
        className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
      >
        <MessageCircle size={20} /> Order on WhatsApp
      </button>
    );
  }

  if (activeWaiters.length === 0 && !businessWhatsapp) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
      >
        <MessageCircle size={20} /> Order / Call Waiter
        <ChevronDown size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-3 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Select Available Waiter</p>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {activeWaiters.map((w) => (
              <button 
                key={w.id} 
                onClick={() => handleOrderClick(w.phone)}
                className="w-full flex items-center gap-4 p-3 hover:bg-green-50 rounded-xl transition-all group border border-transparent hover:border-green-100 text-left"
              >
                <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                  {w.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-gray-900 truncate">{w.name}</div>
                  <div className="text-[10px] text-gray-500 font-medium">{w.phone}</div>
                </div>
                <Phone size={16} className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
