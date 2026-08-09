'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import AddItemForm from '@/components/AddItemForm';
import QRCodeDownload from '@/components/QRCodeDownload';
import EditItemModal from '@/components/EditItemModal';
import BusinessSettings from '@/components/BusinessSettings';
import ChangePassword from '@/components/ChangePassword';
import GalleryManager from '@/components/GalleryManager';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import StaffManager from '@/components/StaffManager';
import { ChevronUp, ChevronDown, Utensils, GlassWater, Star, Edit2, ToggleLeft, ToggleRight, LogOut, ExternalLink, MapPin, Wifi } from 'lucide-react';

export default function DashboardContent({ business }: { business: any }) {
  const [editingItem, setEditingItem] = useState<any>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isSorting, setIsSorting] = useState(false);

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

  async function handleSort(type: 'categories' | 'items', list: any[], index: number, direction: 'up' | 'down') {
    if (isSorting) return;
    
    const newList = [...list];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newList.length) return;
    
    // Swap items
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    
    // Update sortOrder for all items in the new list
    const updatedItems = newList.map((item, i) => ({
      id: item.id,
      sortOrder: i
    }));

    setIsSorting(true);
    try {
      const res = await fetch('/api/menu/sort', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          items: updatedItems,
          businessSlug: business.slug
        }),
      });
      
      if (res.ok) {
        window.location.reload();
      } else {
        alert('Failed to save order. Please try again.');
      }
    } catch (error) {
      console.error('Sorting failed:', error);
    } finally {
      setIsSorting(false);
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
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center gap-5">
              {business.logoUrl ? (
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white p-2">
                  <img src={business.logoUrl} alt={business.name} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg"
                  style={{ backgroundColor: business.themeColor || '#2563eb' }}
                >
                  {business.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">{business.name}</h1>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-2 flex-wrap font-bold">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs uppercase tracking-wider">
                    {businessTypeLabels[business.businessType] || business.businessType || 'Business'}
                  </span>
                  {business.location && <span className="flex items-center gap-1"><MapPin size={14} /> {business.location}</span>}
                  {business.hasFreeWifi && <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs"><Wifi size={14} /> Free WiFi</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <a 
                href={'/menu/' + business.slug} 
                target="_blank" 
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 text-sm font-black shadow-lg shadow-blue-600/20 transition-all active:scale-95"
              >
                <ExternalLink size={18} />
                Live Menu
              </a>
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-2 bg-white text-gray-700 px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-black transition-all shadow-sm active:scale-95"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Add Item Form */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-white">
              <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-gray-900">
                <span className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                  <Utensils size={20} />
                </span>
                Add New Menu Item
              </h2>
              <AddItemForm businessSlug={business.slug} />
            </div>

            {/* QR Code Section */}
            <QRCodeDownload slug={business.slug} businessName={business.name} logoUrl={business.logoUrl} themeColor={business.themeColor} />
          </div>

          {/* Right Column: Current Menu Overview */}
          <div className="lg:col-span-7">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-white min-h-[600px]">
              <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                <h2 className="text-xl font-black flex items-center gap-3 text-gray-900">
                  <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <Star size={20} />
                  </span>
                  Current Menu
                </h2>
                {isSorting && <span className="text-xs font-black text-blue-600 animate-pulse uppercase tracking-widest">Updating Order...</span>}
              </div>
              
              {(!business.categories || business.categories.length === 0) ? (
                <div className="text-center py-20">
                  <p className="text-gray-400 font-bold">No categories yet. Add your first item to start!</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {business.categories.map((cat: any, catIndex: number) => (
                    <div key={cat.id} className="group/cat bg-slate-50/50 rounded-2xl p-6 border border-gray-100 hover:border-blue-200 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            {cat.name}
                            <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-gray-200 text-gray-400 uppercase tracking-widest">
                              {cat.items?.length || 0} items
                            </span>
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleSort('categories', business.categories, catIndex, 'up')}
                            disabled={catIndex === 0 || isSorting}
                            className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-blue-600 disabled:opacity-20 transition-all"
                          >
                            <ChevronUp size={20} />
                          </button>
                          <button 
                            onClick={() => handleSort('categories', business.categories, catIndex, 'down')}
                            disabled={catIndex === business.categories.length - 1 || isSorting}
                            className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-blue-600 disabled:opacity-20 transition-all"
                          >
                            <ChevronDown size={20} />
                          </button>
                        </div>
                      </div>

                      <ul className="space-y-3">
                        {(!cat.items || cat.items.length === 0) ? (
                          <li className="text-sm text-gray-400 font-bold italic py-2">No items in this category yet.</li>
                        ) : (
                          cat.items.map((item: any, itemIndex: number) => (
                            <li key={item.id} className="group/item flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => handleSort('items', cat.items, itemIndex, 'up')}
                                    disabled={itemIndex === 0 || isSorting}
                                    className="p-0.5 hover:bg-blue-50 rounded text-gray-300 hover:text-blue-600 disabled:opacity-10"
                                  >
                                    <ChevronUp size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleSort('items', cat.items, itemIndex, 'down')}
                                    disabled={itemIndex === cat.items.length - 1 || isSorting}
                                    className="p-0.5 hover:bg-blue-50 rounded text-gray-300 hover:text-blue-600 disabled:opacity-10"
                                  >
                                    <ChevronDown size={14} />
                                  </button>
                                </div>
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.name} className="w-14 h-14 object-cover rounded-lg shadow-inner" />
                                ) : (
                                  <div className="w-14 h-14 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300">
                                    <Utensils size={20} />
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-gray-900">{item.name}</span>
                                    {item.isFeatured && <span className="bg-yellow-400 text-yellow-900 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Special</span>}
                                  </div>
                                  <div className="text-blue-600 font-black text-sm">{item.price.toLocaleString()} RWF</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleAvailability(item)}
                                  disabled={togglingId === item.id}
                                  className={`p-2 rounded-xl transition-all ${item.isAvailable ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-red-600 bg-red-50 hover:bg-red-100'} ${togglingId === item.id ? 'opacity-50' : ''}`}
                                  title={item.isAvailable ? 'Mark as Sold Out' : 'Mark as Available'}
                                >
                                  {item.isAvailable ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                </button>
                                <button 
                                  onClick={() => setEditingItem(item)} 
                                  className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
                                  title="Edit Item"
                                >
                                  <Edit2 size={18} />
                                </button>
                              </div>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Staff Manager Section */}
        <div className="mt-8">
          <StaffManager businessSlug={business.slug} />
        </div>

        {/* Gallery Manager */}
        <div className="mt-8">
          <GalleryManager businessSlug={business.slug} gallery={business.gallery || []} />
        </div>

        {/* Analytics Panel */}
        <div className="mt-8">
          <AnalyticsPanel businessSlug={business.slug} />
        </div>

        {/* Business Settings & Password */}
        <div className="mt-8">
          <BusinessSettings business={business} />
        </div>
        <div className="mt-8">
          <ChangePassword slug={business.slug} />
        </div>

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
