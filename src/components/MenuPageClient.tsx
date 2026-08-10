'use client';

import { useState } from 'react';
import CustomerMenuWithTabs from '@/components/CustomerMenuWithTabs';
import WhatsAppOrderButton from '@/components/WhatsAppOrderButton';
import CustomerReviews from '@/components/CustomerReviews';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
};

export default function MenuPageClient({
  business,
  featuredItems,
  activeWaiters
}: {
  business: any;
  featuredItems: any[];
  activeWaiters: any[];
}) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (item: any) => {
    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.id === item.id);
      if (existing) {
        return prev.map((ci) => ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, imageUrl: item.imageUrl }];
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCartItems((prev) => prev.map((item) => item.id === itemId ? { ...item, quantity } : item));
    }
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleSubmitOrder = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <div className="mt-8">
        <CustomerMenuWithTabs 
          business={business} 
          featuredItems={featuredItems} 
          activeWaiters={activeWaiters}
          cartItems={cartItems}
          isCartOpen={isCartOpen}
          setIsCartOpen={setIsCartOpen}
          addToCart={addToCart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          handleSubmitOrder={handleSubmitOrder}
        />
      </div>

      <WhatsAppOrderButton 
        whatsappNumber={business.whatsappNumber} 
        waiterCallNumber={business.waiterCallNumber}
        businessName={business.name}
        themeColor={business.themeColor}
        onCartOpen={() => setIsCartOpen(true)}
        cartCount={cartCount}
      />
    </>
  );
}
