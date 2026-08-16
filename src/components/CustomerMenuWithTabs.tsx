'use client';

import { useState } from 'react';
import Image from 'next/image';
import OrderCart from '@/components/OrderCart';
import CustomerReviews from '@/components/CustomerReviews';
import {
  Languages, Info, Image as LucideImage,
  UtensilsCrossed, GlassWater, Star,
  ShoppingBag, Check, X, Maximize2,
  ChevronDown, ChevronUp, MessageSquare
} from 'lucide-react';

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
    reviews: 'Reviews',
    specials: "Today's Special",
    empty: 'This menu is currently empty.',
    noGallery: 'No gallery images yet.',
    all: 'All',
    food: 'Food',
    drinks: 'Drinks',
    ambiance: 'Ambiance',
    other: 'Events',
    specialTag: 'SPECIAL',
    callWaiter: 'Order / Call Waiter',
    addToCart: 'Add to Order',
    added: 'Added',
    viewItems: 'View Items',
    hideItems: 'Hide Items'
  },
  fr: {
    menu: 'Menu',
    gallery: 'Galerie',
    reviews: 'Avis',
    specials: "Spécial du jour",
    empty: 'Ce menu est actuellement vide.',
    noGallery: 'Pas encore d\'images dans la galerie.',
    all: 'Tout',
    food: 'Nourriture',
    drinks: 'Boissons',
    ambiance: 'Ambiance',
    other: 'Événements',
    specialTag: 'SPÉCIAL',
    callWaiter: 'Commander / Appeler Serveur',
    addToCart: 'Ajouter à la Commande',
    added: 'Ajouté',
    viewItems: 'Voir les articles',
    hideItems: 'Masquer les articles'
  },
  rw: {
    menu: 'Urutonde',
    gallery: 'Amafoto',
    reviews: 'Ibitekerezo',
    specials: 'Ibidasanzwe uyu munsi',
    empty: 'Nta biribwa birashyirwaho.',
    noGallery: 'Nta mafoto arashyirwaho.',
    all: 'Byose',
    food: 'Ibiribwa',
    drinks: 'Ibinyobwa',
    ambiance: 'Ahantu',
    other: 'Ibirori',
    specialTag: 'IBIDASANZWE',
    callWaiter: 'Gutumiza / Hamagara Seriveri',
    addToCart: 'Ongeraho kuri Order',
    added: 'Byongeweho',
    viewItems: 'Reba ibiriho',
    hideItems: 'Hisha ibiriho'
  }
};

export default function CustomerMenuWithTabs({
  business,
  featuredItems,
  activeWaiters = [],
  cartItems,
  isCartOpen,
  setIsCartOpen,
  addToCart,
  updateQuantity,
  removeFromCart,
  handleSubmitOrder
}: {
  business: any;
  featuredItems: any[];
  activeWaiters?: { id: string; name: string; phone: string }[];
  cartItems: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (item: any) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  handleSubmitOrder: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'food' | 'drinks' | 'gallery' | 'reviews'>('food');
  const [activeFilter, setActiveFilter] = useState('all');
  const [lang, setLang] = useState<Language>('en');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const t = translations[lang];
  const gallery = business.gallery || [];
  const galleryCategories = ['all', 'food', 'drinks', 'ambiance', 'events'];
  const filteredGallery = activeFilter === 'all' ? gallery : gallery.filter((g: any) => g.category === activeFilter);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

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

  const isInCart = (itemId: string) => cartItems.some(item => item.id === itemId);

  return (
    <div className="max-w-4xl mx-auto">
      <OrderCart
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

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X size={32} />
          </button>
          <div className="relative w-full max-w-5xl aspect-auto max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Full view"
              className="w-full h-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Top Bar with Language Switcher */}
      <div className="flex justify-end items-center mb-4 gap-2">
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
      <div className="flex gap-2 mb-8 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-gray-100 sticky top-4 z-30 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('food')}
          className={`flex-1 min-w-[80px] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
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
          className={`flex-1 min-w-[80px] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
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
          className={`flex-1 min-w-[80px] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'gallery'
              ? "text-white shadow-md scale-[1.02]"
              : "text-gray-500 hover:bg-gray-50"
          }`}
          style={activeTab === 'gallery' ? { backgroundColor: business.themeColor || '#2563eb' } : {}}
        >
          <LucideImage size={18} />
          <span className="whitespace-nowrap">{t.gallery}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`flex-1 min-w-[80px] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'reviews'
              ? "text-white shadow-md scale-[1.02]"
              : "text-gray-500 hover:bg-gray-50"
          }`}
          style={activeTab === 'reviews' ? { backgroundColor: business.themeColor || '#2563eb' } : {}}
        >
          <MessageSquare size={18} />
          <span className="whitespace-nowrap">{t.reviews}</span>
        </button>
      </div>

      {/* FOOD & DRINKS TAB */}
      {(activeTab === 'food' || activeTab === 'drinks') && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Featured Items (Always visible if present) */}
          {currentFeaturedItems.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-black text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-yellow-900 shadow-sm">
                  <Star size={16} fill="currentColor" />
                </span>
                {t.specials}
              </h2>
              <div className="grid gap-5">
                {currentFeaturedItems.map((item: any) => {
                  const added = isInCart(item.id);
                  return (
                    <div key={item.id} className="group bg-gradient-to-br from-white to-orange-50/30 rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 border border-orange-100 overflow-hidden">
                      <div className="flex flex-col sm:flex-row gap-5 p-5">
                        {item.imageUrl && (
                          <div className="relative w-full sm:w-32 h-48 sm:h-32 rounded-2xl overflow-hidden shadow-inner shrink-0">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
                              sizes="(max-width: 640px) 100vw, 128px"
                              onClick={() => setSelectedImage(item.imageUrl)}
                            />
                            {added && (
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
                                <div className="bg-white rounded-full p-2 shadow-lg scale-110">
                                  <Check size={20} className="text-green-600 font-black" />
                                </div>
                              </div>
                            )}
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
                              className={`px-4 py-2 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${
                                added
                                ? 'bg-green-50 text-green-600 border-2 border-green-200'
                                : 'text-white shadow-md hover:scale-105 active:scale-95'
                              }`}
                              style={!added ? { backgroundColor: business.themeColor || '#2563eb' } : {}}
                            >
                              {added ? (
                                <>
                                  <Check size={16} strokeWidth={3} />
                                  {t.added}
                                </>
                              ) : (
                                t.addToCart
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Accordion Categories */}
          {filteredCategories.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">{t.empty}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCategories.map((category: any) => {
                const isExpanded = expandedCategories[category.id];
                return (
                  <div key={category.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-1.5 h-8 rounded-full" style={{ backgroundColor: business.themeColor || '#2563eb' }}></span>
                        <div className="text-left">
                          <h2 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors">{category.name}</h2>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{category.items.length} Items</p>
                        </div>
                      </div>
                      <div className={`p-2 rounded-full bg-gray-100 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={20} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid gap-4 pt-2">
                          {category.items.map((item: any) => {
                            const added = isInCart(item.id);
                            return (
                              <div key={item.id} className="group/item flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-300">
                                <div className="flex-1 min-w-0 pr-4">
                                  <h3 className="font-bold text-gray-900 text-base">{item.name}</h3>
                                  {item.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1 leading-relaxed">{item.description}</p>}
                                  <p className="font-black text-lg mt-2" style={{ color: business.themeColor || '#2563eb' }}>
                                    {item.price.toLocaleString()} <span className="text-[10px] font-bold opacity-60">RWF</span>
                                  </p>
                                </div>
                                <button
                                  onClick={() => addToCart(item)}
                                  className={`px-3 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
                                    added
                                    ? 'bg-green-50 text-green-600 border border-green-100'
                                    : 'text-white shadow-sm hover:scale-105 active:scale-95'
                                  }`}
                                  style={!added ? { backgroundColor: business.themeColor || '#2563eb' } : {}}
                                >
                                  {added ? <Check size={14} strokeWidth={3} /> : <ShoppingBag size={14} />}
                                  {added ? t.added : t.addToCart}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* GALLERY TAB */}
      {activeTab === 'gallery' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Gallery Filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
            {galleryCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeFilter === cat
                    ? "bg-gray-900 text-white shadow-lg"
                    : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
                }`}
              >
                {t[cat as keyof typeof t] || cat}
              </button>
            ))}
          </div>

          {filteredGallery.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <LucideImage className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">{t.noGallery}</p>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 gap-4 space-y-4">
              {filteredGallery.map((img: any) => (
                <div
                  key={img.id}
                  className="relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer break-inside-avoid"
                  onClick={() => setSelectedImage(img.imageUrl)}
                >
                  <img
                    src={img.imageUrl}
                    alt={img.caption || 'Gallery'}
                    className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    {img.caption && <p className="text-white text-xs font-bold">{img.caption}</p>}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="bg-white/20 backdrop-blur-md text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                        {img.category}
                      </span>
                      <Maximize2 size={14} className="text-white ml-auto" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REVIEWS TAB */}
      {activeTab === 'reviews' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CustomerReviews businessId={business.id} themeColor={business.themeColor} />
        </div>
      )}
    </div>
  );
}
