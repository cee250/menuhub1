'use client';

import { useState } from 'react';

export default function GalleryDisplay({ gallery, themeColor }: { gallery: any[], themeColor?: string }) {
  const [activeFilter, setActiveFilter] = useState('all');

  if (gallery.length === 0) return null;

  const categories = ['all', 'food', 'drinks', 'ambiance', 'other'];
  const filtered = activeFilter === 'all' ? gallery : gallery.filter((g) => g.category === activeFilter);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-gray-800">📸 Gallery</h2>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={
                "px-3 py-1 rounded-full text-xs font-medium capitalize transition-all " +
                (activeFilter === cat
                  ? "text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200")
              }
              style={activeFilter === cat ? { backgroundColor: themeColor || '#2563eb' } : {}}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map((item) => (
          <div key={item.id} className="relative group overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <div className="text-white text-sm font-medium truncate">{item.title}</div>
              <div className="text-white/70 text-xs capitalize">{item.category}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}