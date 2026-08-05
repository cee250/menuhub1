'use client';

import { useState } from 'react';

interface EditItemModalProps {
  item: any;
  businessSlug: string;
  categories: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditItemModal({ item, businessSlug, categories, onClose, onSuccess }: EditItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/menu/item/' + item.id, {
        method: 'PUT',
        body: formData,
      });

      const payload = await res.json().catch(() => null);

      if (res.ok) {
        setMessage('Item updated successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else {
        setMessage(payload?.error || 'Failed to update item.');
      }
    } catch (error) {
      console.error('Edit item failed:', error);
      setMessage('An error occurred while updating this item.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setDeleting(true);
    setMessage('');

    try {
      const res = await fetch('/api/menu/item/' + item.id, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage('Item deleted!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else {
        setMessage('Failed to delete item.');
      }
    } catch (error) {
      setMessage('An error occurred.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Menu Item</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input
                type="text"
                name="name"
                required
                defaultValue={item.name}
                className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                defaultValue={item.description || ''}
                rows={2}
                className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (RWF)</label>
              <input
                type="number"
                name="price"
                required
                defaultValue={item.price}
                className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50 focus:bg-white"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Menu Type</label>
                <select
                  name="mainCategory"
                  defaultValue={item.mainCategory || 'Foods'}
                  className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50 focus:bg-white"
                >
                  <option value="Foods">Food Menu</option>
                  <option value="Drinks">Drink Menu</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Wine">Wine</option>
                  <option value="Champagne">Champagne</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Category (Optional)</label>
                <input
                  type="text"
                  name="subCategory"
                  defaultValue={item.subCategory || ''}
                  placeholder="e.g. Pizza, Cocktails"
                  className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    defaultChecked={item.isFeatured}
                    className="w-5 h-5 text-yellow-600 rounded focus:ring-2 focus:ring-yellow-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">⭐ Today's Special</div>
                    <div className="text-xs text-gray-500">Highlight this item at the top of your menu</div>
                  </div>
                </label>
              </div>

              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    defaultChecked={item.isAvailable ?? true}
                    className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">✅ Available for ordering</div>
                    <div className="text-xs text-gray-500">Toggle this item on or off for customers</div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Image</label>
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-32 h-32 object-cover rounded-lg mt-2 mb-2"
                />
              )}
              <label className="block text-sm font-medium text-gray-700 mt-2 mb-1">Replace Image (Optional)</label>
              <input
                type="file"
                name="file"
                accept="image/*"
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {message && <p className="text-center text-sm font-medium mt-2">{message}</p>}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all"
              >
                {loading ? 'Updating...' : 'Update Item'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white font-bold p-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-all"
              >
                {deleting ? 'Deleting...' : 'Delete Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}