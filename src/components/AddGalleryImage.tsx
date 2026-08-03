'use client';

import { useState } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// THIS INTERFACE FIXES THE TYPESCRIPT ERROR
interface AddGalleryImageProps {
  businessSlug: string;
  onItemAdded: () => void;
}

export default function AddGalleryImage({ businessSlug, onItemAdded }: AddGalleryImageProps) {
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
    formData.append('businessSlug', businessSlug);

    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to upload image.');
      } else {
        setSuccess('Image added to gallery successfully!');
        form.reset();
        setPreview(null);
        
        // TRIGGER THE REFRESH
        onItemAdded();
        
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Gallery upload error:', err);
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
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
          <ImageIcon size={20} />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Add to Photo Gallery</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Photo *</label>
          <div className="flex items-center gap-4">
            <label className="flex-1 cursor-pointer bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-500/50 hover:bg-blue-50/30 transition-colors flex flex-col items-center justify-center text-center">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Click to upload photo</span>
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
              <div className="w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Optional Caption */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Caption (Optional)</label>
          <input
            type="text"
            name="caption"
            placeholder="e.g., Our cozy dining area..."
            className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 text-sm p-3 rounded-xl flex items-center gap-2">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin w-5 h-5" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={20} />
              Add to Gallery
            </>
          )}
        </button>
      </form>
    </div>
  );
}