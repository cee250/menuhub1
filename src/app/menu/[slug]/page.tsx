import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import MenuViewTracker from '@/components/MenuViewTracker';
import MenuPageClient from '@/components/MenuPageClient';
import { Instagram, MapPin, Wifi, Facebook } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PublicMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      categories: {
        include: {
          items: {
            where: { isAvailable: true },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: {
          sortOrder: 'asc',
        },
      },
      gallery: {
        orderBy: { createdAt: 'desc' },
      },
      staff: {
        where: { isActive: true },
        select: { id: true, name: true, phone: true },
        orderBy: { name: 'asc' },
      }
    },
  });

  if (!business || business.status !== 'ACTIVE') {
    notFound();
  }

  const featuredItems = business.categories
    .flatMap((c) => c.items)
    .filter((i) => i.isFeatured);

  const businessTypeLabels: Record<string, string> = {
    restaurant: 'Restaurant',
    cafe: 'Cafe',
    bar: 'Bar & Lounge',
    hotel: 'Hotel',
    bakery: 'Bakery',
    fastfood: 'Fast Food',
    other: 'Service Business',
  };

  // Remove sensitive data
  const { password: _password, ...publicBusiness } = business;

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <MenuViewTracker slug={slug} />
      
      {/* Header Banner */}
      <div className="relative h-48 sm:h-64 bg-slate-900 overflow-hidden">
        {business.logoUrl ? (
          <Image 
            src={business.logoUrl} 
            alt={business.name} 
            fill 
            className="object-cover opacity-40 blur-sm scale-110"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900 opacity-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 to-transparent" />
      </div>

      {/* Profile Info Card */}
      <div className="max-w-4xl mx-auto px-4 -mt-24 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-white">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-white -mt-16 sm:-mt-20 shrink-0">
              {business.logoUrl ? (
                <Image
                  src={business.logoUrl}
                  alt={business.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 128px, 160px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300 text-4xl font-black">
                  {business.name.charAt(0)}
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">{business.name}</h1>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm font-bold text-slate-500">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full">
                  {businessTypeLabels[business.businessType || 'other']}
                </span>
                {business.location && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full">
                    <MapPin size={14} className="text-blue-500" />
                    {business.location}
                  </span>
                )}
                {business.hasFreeWifi && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full">
                    <Wifi size={14} />
                    Free WiFi
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {business.instagramUrl && (
                <a
                  href={business.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 text-white shadow-lg hover:scale-110 transition-transform"
                >
                  <Instagram size={22} />
                </a>
              )}
              {business.facebookUrl && (
                <a
                  href={business.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 flex items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg hover:scale-110 transition-transform"
                >
                  <Facebook size={22} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Client Side Content (Menu & Buttons) */}
        <MenuPageClient 
          business={publicBusiness} 
          featuredItems={featuredItems} 
          activeWaiters={business.staff || []}
        />
      </div>

      {/* Footer */}
      <div className="mt-20 text-center px-4">
        <a 
          href="/" 
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-full shadow-md border border-gray-100 hover:shadow-lg transition-all group"
        >
          <span className="text-xs font-bold text-gray-400">Powered by</span>
          <span className="text-sm font-black text-blue-600 group-hover:scale-105 transition-transform">MenuHub</span>
        </a>
        <p className="mt-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60">
          © 2026 MenuHub. All rights reserved.
        </p>
      </div>
    </div>
  );
}
