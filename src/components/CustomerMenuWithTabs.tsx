'use client';

import { useState } from 'react';
import Image from 'next/image';
import MenuItemOrderButton from '@/components/MenuItemOrderButton';
import OrderTray from '@/components/OrderTray';
import { Languages, Info, Image as LucideImage, UtensilsCrossed, GlassWater, Star, ShoppingBag } from 'lucide-react';

type Language = 'en' | 'fr' | 'rw';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
};

const translations = {
  en: {
    menu: 'Menu',
    gallery: 'Gallery',
    specials: "Today's Special",
    empty: 'This menu is currently empty.',
    noGallery: 'No gallery images yet.',
    all: 'All',
    food: 'Food',
    drinks: 'Drinks',
    ambiance: 'Ambiance',
    other: 'Other',
    specialTag: 'SPECIAL',
    callWaiter: 'Order / Call Waiter',
    addToCart: 'Add to Tray'
  },
  fr: {
    menu: 'Menu',
    gallery: 'Galerie',
    specials: "Spécial du jour",
    empty: 'Ce menu est actuellement vide.',
    noGallery: 'Pas encore d\'images dans la galerie.',
    all: 'Tout',
    food: 'Nourriture',
    drinks: 'Boissons',
    ambiance: 'Ambiance',
    other: 'Autre',
    specialTag: 'SPÉCIAL',
    callWaiter: 'Commander / Appeler Serveur',
    addToCart: 'Ajouter au Plateau'
  },
  rw: {
    menu: 'Urutonde',
    gallery: 'Amafoto',
    specials: 'Ibidasanzwe uyu munsi',
    empty: 'Nta biribwa birashyirwaho.',
    noGallery: 'Nta mafoto arashyirwaho.',
    all: 'Byose',
    food: 'Ibiribwa',
    drinks: 'Ibinyobwa',
    ambiance: 'Ahantu',
    other: 'Ibindi',
    specialTag: 'IBIDASANZWE',
    callWaiter: 'Gutumiza / Hamagara Seriveri',
    addToCart: 'Ongeraho ku Plateau'
  }
};

export default function CustomerMenuWithTabs({ 
  business, 
  featuredItems, 
  activeWaiters = [] 
}: { 
  business: any; 
  featuredItems: any[]; 
  activeWaiters?: { id: string; name: string; phone: string }[];
}) {
  const [activeTab, setActiveTab] = useState<'food' | 'drinks' | 'gallery'>('food');
  const [activeFilter, setActiveFilter] = useState('all');
  const [lang, setLang] = useState<Language>('en');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Cart management functions
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

  const t = translations[lang];
  const gallery = business.gallery || [];
  const galleryCategories = ['all', 'food', 'drinks', 'ambiance', 'other'];
  const filteredGallery = activeFilter === 'all' ? gallery : gallery.filter((g: any) => g.category === activeFilter);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Filter items based on active tab
  const isDrinkCategory = (cat: string) => ['Beverages', 'Wine', 'Champagne', 'Drinks'].includes(cat);
  
  const currentFeaturedItems = featuredItems.filter(item => {
    if (activeTab === 'food') return item.mainCategory === 'Foods';
    if (activeTab === 'drinks') return isDrinkCategory(item.mainCategory);
    return false;
  });

  const filteredCategories = business.categories.map((category: any) => {
    const filteredItems = category.items.filter((item: any) => {
      if (activeTab === 'food') return item.mainCategory === 'Foods';
      if (activeTab === 'drinks') return isDrinkCategory(item.mainCategory);
      return false;
    });
    return { ...category, items: filteredItems };
  }).filter((category: any) => category.items.length > 0);

  return (
    <div className="max-w-4xl mx-auto">
      <OrderTray
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onSubmitOrder={handleSubmitOrder}
        businessSlug={business.slug}
        businessWhatsapp={business.whatsappNumber}
        activeWaiters={activeWaiters}
        themeColor={business.themeColor}
      />

      {/* Top Bar with Language Switcher and Cart Button */}
      <div className="flex justify-between items-center mb-4 gap-2">
        {/* Cart Button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative p-3 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100 hover:shadow-md transition-all"
          style={{ borderColor: business.themeColor }}
        >
          <ShoppingBag size={20} style={{ color: business.themeColor }} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>

        {/* Language Switcher */}
        <div className="bg-white/80 backdrop-blur-sm p-1 rounded-full shadow-sm border border-gray-100 flex gap-1">
          {(['en', 'fr', 'rw'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                lang === l 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 mb-8 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-gray-100 sticky top-4 z-30">
        <button
          type="button"
          onClick={() => setActiveTab('food')}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 px-2 rounded-xl font-bold text-sm sm:text-base transition-all ${
            activeTab === 'food'
              ? "text-white shadow-md scale-[1.02]"
              : "text-gray-500 hover:bg-gray-50"
          }`}
          style={activeTab === 'food' ? { backgroundColor: business.themeColor || '#2563eb' } : {}}
        >
          <UtensilsCrossed size={18} />
          <span className="whitespace-nowrap">{t.food}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('drinks')}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 px-2 rounded-xl font-bold text-sm sm:text-base transition-all ${
            activeTab === 'drinks'
              ? "text-white shadow-md scale-[1.02]"
              : "text-gray-500 hover:bg-gray-50"
          }`}
          style={activeTab === 'drinks' ? { backgroundColor: business.themeColor || '#2563eb' } : {}}
        >
          <GlassWater size={18} />
          <span className="whitespace-nowrap">{t.drinks}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gallery')}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 px-2 rounded-xl font-bold text-sm sm:text-base transition-all ${
            activeTab === 'gallery'
              ? "text-white shadow-md scale-[1.02]"
              : "text-gray-500 hover:bg-gray-50"
          }`}
          style={activeTab === 'gallery' ? { backgroundColor: business.themeColor || '#2563eb' } : {}}
        >
          <LucideImage size={18} />
          <span className="whitespace-nowrap">{t.gallery}</span>
        </button>
      </div>

      {/* FOOD & DRINKS TAB */}
      {(activeTab === 'food' || activeTab === 'drinks') && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Featured Items */}
          {currentFeaturedItems.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-black text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-yellow-900 shadow-sm">
                  <Star size={16} fill="currentColor" />
                </span>
                {t.specials}
              </h2>
              <div className="grid gap-5">
                {currentFeaturedItems.map((item: any) => (
                  <div key={item.id} className="group bg-gradient-to-br from-white to-orange-50/30 rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 border border-orange-100 overflow-hidden">
                    <div className="flex flex-col sm:flex-row gap-5 p-5">
                      {item.imageUrl && (
                        <div className="relative w-full sm:w-32 h-48 sm:h-32 rounded-2xl overflow-hidden shadow-inner shrink-0">
                          <Image 
                            src={item.imageUrl} 
                            alt={item.name} 
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            sizes="(max-width: 640px) 100vw, 128px"
                          />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-black text-gray-900 text-xl">{item.name}</h3>
                            <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black tracking-wider shadow-sm">
                              {t.specialTag}
                            </span>
                          </div>
                          {item.description && <p className="text-sm text-gray-600 leading-relaxed mb-3">{item.description}</p>}
                        </div>
                        <div className="flex items-center justify-between mt-auto gap-3">
                          <p className="font-black text-2xl" style={{ color: business.themeColor || '#2563eb' }}>
                            {item.price.toLocaleString()} <span className="text-sm font-bold opacity-70">RWF</span>
                          </p>
                          <button
                            onClick={() => addToCart(item)}
                            className="px-4 py-2 rounded-lg font-bold text-white text-sm transition-all hover:scale-105"
                            style={{ backgroundColor: business.themeColor || '#2563eb' }}
                          >
                            {t.addToCart}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Regular Categories */}
          {filteredCategories.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">{t.empty}</p>
            </div>
          ) : (
            filteredCategories.map((category: any) => (
              <section key={category.id} className="mb-10">
                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                  <span className="w-2 h-8 rounded-full" style={{ backgroundColor: business.themeColor || '#2563eb' }}></span>
                  {category.name}
                </h2>
                <div className="grid gap-4">
                  {category.items.map((item: any) => (
                    <div key={item.id} className="group bg-white rounded-2xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                      <div className="flex justify-between items-start gap-5">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{item.name}</h3>
                          {item.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>}
                          <div className="flex items-center justify-between mt-3 gap-2">
                            <p className="font-black text-xl" style={{ color: business.themeColor || '#2563eb' }}>
                              {item.price.toLocaleString()} <span className="text-xs font-bold opacity-60">RWF</span>
                            </p>
                            <button
                              onClick={() => addToCart(item)}
                              className="px-3 py-1 rounded-lg font-bold text-white text-xs transition-all hover:scale-105"
                              style={{ backgroundColor: business.themeColor || '#2563eb' }}
                            >
                              {t.addToCart}
                            </button>
                          </div>
                        </div>
                        {item.imageUrl && (
                          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shadow-sm shrink-0">
                            <Image 
                              src={item.imageUrl} 
                              alt={item.name} 
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="112px"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {/* GALLERY TAB */}
      {activeTab === 'gallery' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {gallery.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <LucideImage className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">{t.noGallery}</p>
            </div>
          ) : (
            <>
              <div className="flex gap-2 flex-wrap mb-8 justify-center">
                {galleryCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveFilter(cat)}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold capitalize transition-all border ${
                      activeFilter === cat
                        ? "text-white shadow-md border-transparent"
                        : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50"
                    }`}
                    style={activeFilter === cat ? { backgroundColor: business.themeColor || '#2563eb' } : {}}
                  >
                    {t[cat as keyof typeof t] || cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {filteredGallery.map((item: any) => (
                  <div key={item.id} className="relative group overflow-hidden rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 border border-white">
                    <div className="relative aspect-square">
                      <Image
                        src={item.imageUrl}
                        alt={item.title || 'Gallery image'}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                      <div className="text-white text-sm font-black truncate mb-1">{item.title || item.caption}</div>
                      <div className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{item.category || 'Gallery'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
