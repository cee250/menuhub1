'use client';

import { ShoppingBag } from 'lucide-react';

interface Props {
  whatsappNumber: string;
  waiterCallNumber?: string | null;
  businessName: string;
  themeColor?: string | null;
  onCartOpen: () => void;
  cartCount: number;
}

export default function WhatsAppOrderButton({ 
  whatsappNumber, 
  waiterCallNumber,
  businessName, 
  themeColor,
  onCartOpen,
  cartCount
}: Props) {
  // Clean numbers - remove all non-digits
  const cleanWaiter = waiterCallNumber ? waiterCallNumber.replace(/\D/g, '') : '';
  
  const handleCall = () => {
    if (cleanWaiter) {
      // Use tel: with just the number, no extra + sign
      const url = 'tel:' + cleanWaiter;
      window.location.href = url;
    } else {
      alert('Waiter call number not set. Please contact the restaurant directly.');
    }
  };

  const bgColor = themeColor || '#2563eb';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[9999] px-4 py-3">
      <div className="max-w-4xl mx-auto flex gap-3">
        <button
          type="button"
          onClick={onCartOpen}
          className="flex-[2] text-white font-black py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all text-base relative overflow-hidden group"
          style={{ backgroundColor: bgColor }}
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <div className="relative flex items-center gap-2">
            <ShoppingBag size={20} className="group-hover:rotate-12 transition-transform" />
            <span>Order Now</span>
            {cartCount > 0 && (
              <span className="bg-white text-gray-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-in zoom-in duration-300">
                {cartCount}
              </span>
            )}
          </div>
        </button>

        {cleanWaiter && (
          <button
            type="button"
            onClick={handleCall}
            className="flex-1 bg-slate-100 text-slate-900 font-bold py-4 px-6 rounded-2xl border border-slate-200 flex items-center justify-center gap-2 hover:bg-slate-200 active:scale-[0.98] transition-all text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span className="hidden sm:inline">Call Waiter</span>
            <span className="sm:hidden">Waiter</span>
          </button>
        )}
      </div>
    </div>
  );
}
