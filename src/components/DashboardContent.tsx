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
import ReviewsManagement from '@/components/ReviewsManagement';
import ManagerManager from '@/components/ManagerManager';
import UnifiedInventoryManager from '@/components/UnifiedInventoryManager';
import {
  ChevronUp, ChevronDown, Utensils, Star, Edit2,
  ToggleLeft, ToggleRight, LogOut, ExternalLink,
  MapPin, Wifi, LayoutDashboard, Users2,
  MessageSquare, Image as ImageIcon, BarChart3,
  Settings, Lock, PlusCircle, QrCode, ShieldAlert, Package
} from 'lucide-react';

export default function DashboardContent({ business, user }: { business: any, user: any }) {
  const [editingItem, setEditingItem] = useState<any>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isSorting, setIsSorting] = useState(false);
  const [activeTab, setActiveTab] = useState('menu');

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

    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];

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

  const isOwner = user?.role === 'owner';

  const navItems = [
    { id: 'menu', label: 'Menu Items', icon: LayoutDashboard },
    { id: 'add', label: 'Add New', icon: PlusCircle },
    { id: 'qr', label: 'QR Code', icon: QrCode },
    { id: 'staff', label: 'Staff', icon: Users2 },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory', icon: Package },
    ...(isOwner ? [
      { id: 'managers', label: 'Managers', icon: ShieldAlert },
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'password', label: 'Security', icon: Lock }
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="lg:w-64 bg-white border-r border-gray-200 flex flex-col lg:sticky lg:top-0 lg:h-screen z-30">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          {business.logoUrl ? (
            <img src={business.logoUrl} alt={business.name} className="w-8 h-8 object-contain rounded-lg" />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm"
              style={{ backgroundColor: business.themeColor || '#2563eb' }}
            >
              {business.name.charAt(0)}
            </div>
          )}
          <span className="font-black text-gray-900 truncate">{business.name}</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-2">
          <a
            href={'/menu/' + business.slug}
            target="_blank"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all"
          >
            <ExternalLink size={18} />
            Live Menu
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">

          {/* Mobile Header (Only visible on small screens) */}
          <div className="lg:hidden flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <h1 className="text-xl font-black text-gray-900">{business.name}</h1>
            <div className="flex gap-2">
              <a href={'/menu/' + business.slug} target="_blank" className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ExternalLink size={18} /></a>
              <button onClick={handleLogout} className="p-2 bg-red-50 text-red-600 rounded-lg"><LogOut size={18} /></button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'menu' && (
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-white min-h-[600px]">
                <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                  <h2 className="text-xl font-black flex items-center gap-3 text-gray-900">
                    <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                      <Star size={20} />
                    </span>
                    Current Menu Overview
                  </h2>
                  {isSorting && <span className="text-xs font-black text-blue-600 animate-pulse uppercase tracking-widest">Updating Order...</span>}
                </div>

                {(!business.categories || business.categories.length === 0) ? (
                  <div className="text-center py-20">
                    <p className="text-gray-400 font-bold">No categories yet. Add your first item to start!</p>
                    <button onClick={() => setActiveTab('add')} className="mt-4 text-blue-600 font-bold hover:underline">Add New Item</button>
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
            )}

            {activeTab === 'add' && (
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-white">
                <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-gray-900">
                  <span className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                    <Utensils size={20} />
                  </span>
                  Add New Menu Item
                </h2>
                <AddItemForm businessSlug={business.slug} />
              </div>
            )}

            {activeTab === 'qr' && (
              <QRCodeDownload slug={business.slug} businessName={business.name} logoUrl={business.logoUrl} themeColor={business.themeColor} />
            )}

            {activeTab === 'staff' && (
              <StaffManager businessSlug={business.slug} />
            )}

            {activeTab === 'reviews' && (
              <ReviewsManagement businessId={business.id} themeColor={business.themeColor || '#2563eb'} />
            )}

            {activeTab === 'gallery' && (
              <GalleryManager businessSlug={business.slug} gallery={business.gallery || []} />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsPanel businessSlug={business.slug} />
            )}

            {activeTab === 'inventory' && (
              <UnifiedInventoryManager business={business} userRole={user?.role === 'manager' ? 'manager' : 'owner'} themeColor={business.themeColor || '#2563eb'} />
            )}

            {activeTab === 'managers' && isOwner && (
              <ManagerManager businessId={business.id} themeColor={business.themeColor || '#2563eb'} />
            )}

            {activeTab === 'settings' && isOwner && (
              <BusinessSettings business={business} />
            )}

            {activeTab === 'password' && isOwner && (
              <ChangePassword slug={business.slug} />
            )}
          </div>
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
      </main>
    </div>
  );
}
