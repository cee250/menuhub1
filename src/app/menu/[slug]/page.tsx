import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
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
            include: {
              inventoryItem: {
                select: { quantityOnHand: true, reservedQuantity: true, trackStock: true },
              },
            },
            orderBy: [
              { sortOrder: 'asc' },
              { name: 'asc' }
            ],
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
      },
      inventorySettings: true,
    },
  });

  if (!business || business.status !== 'ACTIVE') {
    notFound();
  }

  const visibleCategories = business.categories.map((category) => ({
    ...category,
    items: category.items
      .filter((item) => {
        const stock = item.inventoryItem;
        if (!business.inventorySettings?.autoHideOutOfStock || !stock || !stock.trackStock) return true;
        return stock.quantityOnHand - stock.reservedQuantity > 0;
      })
      .map(({ inventoryItem: _inventoryItem, ...item }) => item),
  })).filter((category) => category.items.length > 0);

  const featuredItems = visibleCategories
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
  const { password: _password, ...publicBusinessData } = business;
  const publicBusiness = { ...publicBusinessData, categories: visibleCategories };

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
              {business.tiktokUrl && (
                <a
                  href={business.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 flex items-center justify-center rounded-2xl bg-black text-white shadow-lg hover:scale-110 transition-transform"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="currentColor"
                  >
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
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
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-full shadow-md border border-gray-100 hover:shadow-lg transition-shadow group"
        >
          <span className="text-xs font-bold text-gray-400">Powered by</span>
          <span className="text-sm font-black text-blue-600 group-hover:scale-105 transition-transform">MenuHub</span>
        </Link>
        <p className="mt-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60">
          © 2026 MenuHub. All rights reserved.
        </p>
      </div>
    </div>
  );
}
