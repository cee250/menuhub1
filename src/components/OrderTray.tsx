'use client';

import { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, Send } from 'lucide-react';
import Image from 'next/image';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
};

type OrderTrayProps = {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onSubmitOrder: (waiter?: string) => void;
  businessSlug: string;
  businessWhatsapp: string;
  activeWaiters?: { id: string; name: string; phone: string }[];
  themeColor?: string;
};

export default function OrderTray({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onSubmitOrder,
  businessSlug,
  businessWhatsapp,
  activeWaiters = [],
  themeColor = '#2563eb',
}: OrderTrayProps) {
  const [selectedWaiter, setSelectedWaiter] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Track the order
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug,
          eventType: 'order_submitted',
          details: { itemCount: totalItems, totalAmount: totalPrice },
        }),
      });

      // Build order message
      const orderDetails = items
        .map((item) => `${item.name} x${item.quantity} = ${(item.price * item.quantity).toLocaleString()} RWF`)
        .join('\n');

      const message = `New Order from MenuHub:\n\n${orderDetails}\n\nTotal: ${totalPrice.toLocaleString()} RWF${
        selectedWaiter ? `\nAssigned Waiter: ${selectedWaiter}` : ''
      }`;

      // Send via WhatsApp
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${businessWhatsapp}?text=${encodedMessage}`, '_blank');

      onSubmitOrder(selectedWaiter);
      onClose();
    } catch (error) {
      console.error('Error submitting order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Tray Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200" style={{ backgroundColor: themeColor }}>
          <div className="flex items-center gap-3">
            <ShoppingBag size={24} className="text-white" />
            <div>
              <h2 className="text-xl font-black text-white">Order Tray</h2>
              <p className="text-sm text-white/80">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag size={48} className="text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Your tray is empty</p>
              <p className="text-sm text-gray-400">Add items to get started</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all">
                <div className="flex gap-3">
                  {item.imageUrl && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                    <p className="text-sm font-bold mt-1" style={{ color: themeColor }}>
                      {(item.price * item.quantity).toLocaleString()} RWF
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="p-1 hover:bg-gray-200 rounded-lg transition-all"
                      >
                        <Minus size={16} className="text-gray-600" />
                      </button>
                      <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-200 rounded-lg transition-all"
                      >
                        <Plus size={16} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="ml-auto p-1 hover:bg-red-100 rounded-lg transition-all"
                      >
                        <X size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Waiter Selection */}
            {activeWaiters.length > 0 && (
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-600 mb-2">
                  Assign Waiter (Optional)
                </label>
                <select
                  value={selectedWaiter}
                  onChange={(e) => setSelectedWaiter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="">No preference</option>
                  {activeWaiters.map((waiter) => (
                    <option key={waiter.id} value={waiter.name}>
                      {waiter.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Total */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600 font-medium">Subtotal:</span>
                <span className="font-bold text-gray-900">{totalPrice.toLocaleString()} RWF</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-300">
                <span className="text-gray-600 font-medium">Items:</span>
                <span className="font-bold text-gray-900">{totalItems}</span>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-lg font-black text-gray-900">Total:</span>
                <span className="text-2xl font-black" style={{ color: themeColor }}>
                  {totalPrice.toLocaleString()} RWF
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: themeColor }}
            >
              <Send size={18} />
              {isSubmitting ? 'Sending...' : 'Send Order via WhatsApp'}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full py-2 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
