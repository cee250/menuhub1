'use client';

import { useState } from 'react';
import { Upload, Plus, CheckCircle, AlertCircle, Loader2, UtensilsCrossed, GlassWater } from 'lucide-react';

interface AddItemFormProps {
  businessSlug: string;
  onItemAdded?: () => void; // <-- Made optional with '?' so it never crashes
}

export default function AddItemForm({ businessSlug, onItemAdded }: AddItemFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const form = e.currentTarget;
    const formData = new FormData(form);

    // 🚀 CRITICAL: Send the business slug so the API can link the item
    formData.append('businessSlug', businessSlug);

    // Handle Checkboxes
    formData.set('isAvailable', (formData.get('isAvailable') === 'on').toString());
    formData.set('isFeatured', (formData.get('isFeatured') === 'on').toString());

    try {
      const res = await fetch('/api/menu/items', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to add item.');
      } else {
        setSuccess('Menu item added successfully!');
        form.reset();
        setPreview(null);
        
        // 🚀 TRIGGER AUTO-UPDATE (Only if the parent component provided it)
        if (onItemAdded) {
          onItemAdded();
        }
        
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Add item error:', err);
      setError('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
          <Plus size={20} />
        </div>
        <h2 className="text-xl font-bold text-white">Add New Menu Item</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Item Photo (Optional)</label>
          <div className="flex items-center gap-4">
            <label className="flex-1 cursor-pointer bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl p-4 hover:border-blue-500/50 transition-colors flex flex-col items-center justify-center text-center">
              <Upload className="w-8 h-8 text-gray-500 mb-2" />
              <span className="text-sm text-gray-400">Click to upload image</span>
              <input 
                type="file" 
                name="image" 
                accept="image/*" 
                onChange={handleImageChange}
                className="hidden" 
              />
            </label>
            {preview && (
              <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-700">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Name & Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Item Name *</label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g., Margherita Pizza"
              className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Price *</label>
            <input
              type="number"
              name="price"
              required
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* MAIN CATEGORY */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Menu Type *</label>
          <div className="grid grid-cols-2 gap-4">
            <label className="relative cursor-pointer group">
              <input type="radio" name="mainCategory" value="Foods" defaultChecked className="peer sr-only" />
              <div className="flex items-center justify-center gap-2 bg-slate-800/50 border border-slate-700 text-gray-400 group-hover:bg-slate-700/50 rounded-xl px-4 py-3 transition-all peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-500">
                <UtensilsCrossed size={18} />
                <span className="font-bold">Food Menu</span>
              </div>
            </label>
            <label className="relative cursor-pointer group">
              <input type="radio" name="mainCategory" value="Drinks" className="peer sr-only" />
              <div className="flex items-center justify-center gap-2 bg-slate-800/50 border border-slate-700 text-gray-400 group-hover:bg-slate-700/50 rounded-xl px-4 py-3 transition-all peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-500">
                <GlassWater size={18} />
                <span className="font-bold">Drink Menu</span>
              </div>
            </label>
          </div>
        </div>

        {/* SUB-CATEGORY (Manual Text Input ONLY) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Sub-Category (Type manually)</label>
          <input
            type="text"
            name="subCategory"
            placeholder="e.g., Pizza, Soft Drinks, Red Wine, Cocktails, Vintage..."
            className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Brief description of the dish..."
            className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500 resize-none"
          />
        </div>

        {/* Checkboxes */}
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex items-center gap-3 cursor-pointer bg-slate-800/30 p-3 rounded-xl border border-slate-700 flex-1">
            <input type="checkbox" name="isAvailable" defaultChecked className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 bg-slate-900 border-slate-600" />
            <div>
              <div className="font-medium text-white text-sm">Available</div>
              <div className="text-xs text-gray-500">Show on menu</div>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer bg-slate-800/30 p-3 rounded-xl border border-slate-700 flex-1">
            <input type="checkbox" name="isFeatured" className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 bg-slate-900 border-slate-600" />
            <div>
              <div className="font-medium text-white text-sm">Featured</div>
              <div className="text-xs text-gray-500">Highlight item</div>
            </div>
          </label>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm p-3 rounded-xl flex items-center gap-2">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin w-5 h-5" />
              Uploading & Saving...
            </>
          ) : (
            <>
              <Plus size={20} />
              Add Menu Item
            </>
          )}
        </button>
      </form>
    </div>
  );
}