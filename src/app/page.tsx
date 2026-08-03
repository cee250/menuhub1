import { prisma } from '@/lib/prisma';
import AnimatedHomepage from '@/components/AnimatedHomepage';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Fetch featured businesses (shown on homepage)
  const featured = await prisma.business.findMany({
    where: { showOnHomepage: true, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  // Fetch ALL active businesses for the "Explore All Menus" section
  const allActive = await prisma.business.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { name: 'asc' },
  });

  const businessTypeLabels: Record<string, string> = {
    restaurant: 'Restaurant',
    cafe: 'Cafe',
    hotel: 'Hotel',
    bar: 'Bar & Lounge',
    bakery: 'Bakery',
    fastfood: 'Fast Food',
    other: 'Business',
  };

  // Strip passwords from all business objects
  const stripPassword = (b: any) => {
    const { password: _p, ...rest } = b;
    return rest;
  };

  return (
    <AnimatedHomepage 
      featured={featured.map(stripPassword)}
      allBusinesses={allActive.map(stripPassword)}
      businessTypeLabels={businessTypeLabels} 
    />
  );
}
