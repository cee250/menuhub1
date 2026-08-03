'use client';

import { useState } from 'react';
import Image from 'next/image';
import MenuItemOrderButton from '@/components/MenuItemOrderButton';
import { Languages, Info, Image as ImageIcon, UtensilsCrossed } from 'lucide-react';

type Language = 'en' | 'fr' | 'rw';

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
    callWaiter: 'Order / Call Waiter'
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
    callWaiter: 'Commander / Appeler Serveur'
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
    callWaiter: 'Gutumiza / Hamagara Seriveri'
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
  const [activeTab, setActiveTab] = useState('menu');
  const [activeFilter, setActiveFilter] = useState('all');
  const [lang, setLang] = useState<Language>('en');

  const t = translations[lang];
  const gallery = business.gallery || [];
  const galleryCategories = ['all', 'food', 'drinks', 'ambiance', 'other'];
  const filteredGallery = activeFilter === 'all' ? gallery : gallery.filter((g: any) => g.category === activeFilter);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Language Switcher */}
      <div className="flex justify-end mb-4 gap-2">
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
      <div className="flex gap-2 mb-8 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-gray-100">
        <button
          type="button"
          onClick={() => setActiveTab('menu')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-base transition-all ${
            activeTab === 'menu'
              ? "text-white shadow-md scale-[1.02]"
              : "text-gray-500 hover:bg-gray-50"
          }`}
          style={activeTab === 'menu' ? { backgroundColor: business.themeColor || '#2563eb' } : {}}
        >
          <UtensilsCrossed size={20} />
          {t.menu}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gallery')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-base transition-all ${
            activeTab === 'gallery'
              ? "text-white shadow-md scale-[1.02]"
              : "text-gray-500 hover:bg-gray-50"
          }`}
          style={activeTab === 'gallery' ? { backgroundColor: business.themeColor || '#2563eb' } : {}}
        >
          <ImageIcon size={20} />
          {t.gallery} {gallery.length > 0 && <span className="opacity-70 text-sm ml-1">({gallery.length})</span>}
        </button>
      </div>

      {/* MENU TAB */}
      {activeTab === 'menu' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Featured Items */}
          {featuredItems.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-black text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-yellow-900 shadow-sm">⭐</span>
                {t.specials}
              </h2>
              <div className="grid gap-5">
                {featuredItems.map((item: any) => (
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
                        <div className="flex items-center justify-between mt-auto">
                          <p className="font-black text-2xl" style={{ color: business.themeColor || '#2563eb' }}>
                            {item.price.toLocaleString()} <span className="text-sm font-bold opacity-70">RWF</span>
                          </p>
                        </div>
                        <div className="mt-4">
                          <MenuItemOrderButton 
                            itemName={item.name}
                            itemPrice={item.price}
                            businessSlug={business.slug}
                            businessWhatsapp={business.whatsappNumber}
                            activeWaiters={activeWaiters}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Regular Categories */}
          {business.categories.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">{t.empty}</p>
            </div>
          ) : (
            business.categories.map((category: any) => (
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
                          <p className="font-black text-xl mt-3" style={{ color: business.themeColor || '#2563eb' }}>
                            {item.price.toLocaleString()} <span className="text-xs font-bold opacity-60">RWF</span>
                          </p>
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
                      <div className="mt-4">
                        <MenuItemOrderButton 
                          itemName={item.name}
                          itemPrice={item.price}
                          businessSlug={business.slug}
                          businessWhatsapp={business.whatsappNumber}
                          activeWaiters={activeWaiters}
                        />
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
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
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
