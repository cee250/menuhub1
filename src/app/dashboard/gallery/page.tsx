'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AddGalleryImage from '@/components/AddGalleryImage';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

// 🚀 MAGIC FIX 1: Tell Next.js NOT to statically prerender this page at build time.
export const dynamic = 'force-dynamic';

export default function GalleryManagementPage() {
  // 🚀 MAGIC FIX 2: Safe assignment. NEVER destructure useSession directly.
  // If it's undefined during build, this safely becomes undefined instead of crashing.
  const sessionData = useSession();
  const session = sessionData?.data;
  const status = sessionData?.status || 'loading';
  
  const router = useRouter();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Safely extract the slug
  const user = session?.user as any;
  const businessSlug = user?.slug || '';

  // ONLY redirect if we are 100% sure the user is NOT logged in.
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  // Function to fetch current gallery
  const fetchGallery = async () => {
    if (!businessSlug) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/gallery?slug=${businessSlug}`);
      if (res.ok) {
        const data = await res.json();
        setImages(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on initial load when slug is ready
  useEffect(() => {
    if (status === 'authenticated' && businessSlug) {
      fetchGallery();
    }
  }, [status, businessSlug]);

  // Show a clean loading state while NextAuth figures out the session.
  // This prevents the page from crashing or rendering empty.
  if (status === 'loading' || !businessSlug) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <Loader2 className="animate-spin w-10 h-10 text-blue-600 mb-4" />
        <p className="text-sm text-gray-500 font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Photo Gallery</h1>
        <p className="text-sm text-gray-500">Upload photos of your food, drinks, and restaurant ambiance.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Upload Form */}
        <div className="lg:col-span-1">
          <AddGalleryImage 
            businessSlug={businessSlug} 
            onItemAdded={fetchGallery} 
          />
        </div>

        {/* Right Column: Current Gallery Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon size={20} className="text-blue-600" />
              Current Gallery ({images.length})
            </h2>

            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No photos yet.</p>
                <p className="text-xs mt-1">Upload your first image on the left!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {images.map((img) => (
                  <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <img 
                      src={img.imageUrl} 
                      alt={img.caption || 'Gallery image'} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                    />
                    {img.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-3">
                        <p className="text-white text-xs font-medium truncate">{img.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}