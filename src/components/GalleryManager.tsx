'use client';

import { useState } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';

interface GalleryManagerProps {
  businessSlug: string;
  gallery?: any[];
}

export default function GalleryManager({ businessSlug, gallery = [] }: GalleryManagerProps) {
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('food');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('businessSlug', businessSlug);
    formData.append('caption', caption);
    formData.append('category', category);

    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to upload image.');
      } else {
        setSuccess('Image added successfully!');
        form.reset();
        setPreview(null);
        setCaption('');
        setCategory('food');
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      console.error('Gallery upload error:', err);
      setError('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    setDeletingId(id);
    setError('');
    
    try {
      const res = await fetch('/api/gallery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, businessSlug }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to delete image.');
      } else {
        setSuccess('Image deleted successfully!');
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      console.error('Gallery delete error:', err);
      setError('Failed to delete image.');
    } finally {
      setDeletingId(null);
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
    <div className="bg-white rounded-xl shadow-md p-6 mt-8 border border-gray-100">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900">
        <ImageIcon size={20} className="text-blue-600" /> Photo Gallery
      </h2>

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-8 pb-8 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <label className="flex-1 cursor-pointer bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-500/50 transition-colors flex flex-col items-center justify-center text-center">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500 font-bold">Click to upload photo</span>
            <input 
              type="file" 
              name="image" 
              accept="image/*" 
              required
              onChange={handleImageChange}
              className="hidden" 
            />
          </label>
          {preview && (
            <div className="w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-black text-gray-700 mb-1 uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
            >
              <option value="food">Food</option>
              <option value="drinks">Drinks</option>
              <option value="ambiance">Ambiance / Interior</option>
              <option value="events">Events</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-black text-gray-700 mb-1 uppercase tracking-wider">Caption (Optional)</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g., Friday Night Party"
              className="w-full rounded-lg border border-gray-300 p-3 text-sm font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 font-bold animate-in fade-in duration-300">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 text-sm p-3 rounded-lg flex items-center gap-2 font-bold animate-in fade-in duration-300">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-black py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Upload size={20} />}
          {loading ? 'Uploading...' : 'Add to Gallery'}
        </button>
      </form>

      {/* Gallery Grid */}
      {!gallery || gallery.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-400 font-bold">No images yet. Upload your first one above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gallery.map((img) => (
            <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm hover:shadow-md transition-all">
              <img 
                src={img.imageUrl} 
                alt={img.caption || 'Gallery image'} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              />
              <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm">
                {img.category || 'events'}
              </div>
              
              {/* Delete Button Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => handleDelete(img.id)}
                  disabled={deletingId === img.id}
                  className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all shadow-xl transform scale-75 group-hover:scale-100"
                  title="Delete Image"
                >
                  {deletingId === img.id ? <Loader2 className="animate-spin w-5 h-5" /> : <Trash2 size={20} />}
                </button>
              </div>

              {img.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-bold truncate">{img.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
