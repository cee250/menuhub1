'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import AddItemForm from '@/components/AddItemForm';
import QRCodeDownload from '@/components/QRCodeDownload';
import EditItemModal from '@/components/EditItemModal';
import BusinessSettings from '@/components/BusinessSettings';
import ChangePassword from '@/components/ChangePassword';
import GalleryManager from '@/components/GalleryManager';
import StaffManager from '@/components/StaffManager';

export default function DashboardContent({ business }: { business: any }) {
  const [editingItem, setEditingItem] = useState<any>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggleAvailability(item: any) {
    setTogglingId(item.id);
    try {
      const res = await fetch('/api/menu/item/' + item.id + '/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      if (res.ok) window.location.reload();
    } catch (error) {
      console.error('Error toggling availability:', error);
    } finally {
      setTogglingId(null);
    }
  }

  function handleLogout() {
    signOut({ callbackUrl: '/login' });
  }

  const businessTypeLabels: Record<string, string> = {
    restaurant: 'Restaurant',
    cafe: 'Cafe / Coffee Shop',
    hotel: 'Hotel',
    bar: 'Bar / Lounge',
    bakery: 'Bakery',
    fastfood: 'Fast Food',
    other: 'Other',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              {business.logoUrl ? (
                <img src={business.logoUrl} alt={business.name} className="w-16 h-16 object-contain rounded-lg border border-gray-200" />
              ) : (
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-md"
                  style={{ backgroundColor: business.themeColor || '#2563eb' }}
                >
                  {business.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {businessTypeLabels[business.businessType] || business.businessType || 'Business'}
                  </span>
                  {business.location && <span>📍 {business.location}</span>}
                  {business.hasFreeWifi && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">📶 Free WiFi</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={'/menu/' + business.slug} target="_blank" className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 text-sm font-medium shadow-md transition-all">View Live Menu</a>
              <button onClick={handleLogout} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium transition-all">Logout</button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column: Add Item Form */}
          <div className="bg-white p-6 rounded-xl shadow-md h-fit border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b flex items-center gap-2">🍽️ Add New Menu Item</h2>
            <AddItemForm businessSlug={business.slug} />
          </div>

          {/* Right Column: Current Menu Overview */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b flex items-center gap-2">📋 Current Menu</h2>
            
            {(!business.categories || business.categories.length === 0) ? (
              <p className="text-gray-500 text-sm">No categories yet. Add your first item on the left!</p>
            ) : (
              business.categories.map((cat: any) => (
                <div key={cat.id} className="mb-6 last:mb-0">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">📁 {cat.name}</h3>
                  <ul className="space-y-2">
                    {(!cat.items || cat.items.length === 0) ? (
                      <li className="text-sm text-gray-400 italic">No items in this category yet.</li>
                    ) : (
                      cat.items.map((item: any) => (
                        <li key={item.id} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-md" />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-xs">No img</div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{item.name}</span>
                                {item.isFeatured && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium">⭐ Special</span>}
                              </div>
                              <div className="text-gray-500 text-sm">{item.price.toLocaleString()} RWF</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleAvailability(item)}
                              disabled={togglingId === item.id}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${item.isAvailable ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'} ${togglingId === item.id ? 'opacity-50' : ''}`}
                            >
                              {togglingId === item.id ? '...' : item.isAvailable ? 'Available' : 'Sold Out'}
                            </button>
                            <button onClick={() => setEditingItem(item)} className="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50">Edit</button>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 🚀 NEW: Staff Manager Section */}
        <StaffManager businessSlug={business.slug} />

        {/* Gallery Manager */}
        <GalleryManager businessSlug={business.slug} gallery={business.gallery || []} />

        {/* QR Code Section */}
        <QRCodeDownload slug={business.slug} businessName={business.name} logoUrl={business.logoUrl} themeColor={business.themeColor} />

        {/* Business Settings & Password */}
        <BusinessSettings business={business} />
        <ChangePassword slug={business.slug} />

        {/* Edit Modal */}
        {editingItem && (
          <EditItemModal
            item={editingItem}
            businessSlug={business.slug}
            categories={business.categories}
            onClose={() => setEditingItem(null)}
            onSuccess={() => window.location.reload()}
          />
        )}
      </div>
    </div>
  );
}