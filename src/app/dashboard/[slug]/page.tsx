import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth/route';
import DashboardContent from '@/components/DashboardContent';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // 1. Session Check
  const session = await auth();
  
  if (!session) {
    console.log('No session found, redirecting to login');
    redirect('/login');
  }

  const userSlug = (session.user as { slug?: string }).slug;

  // 2. Case-insensitive slug verification to prevent redirect loops
  if (!userSlug || userSlug.toLowerCase() !== slug.toLowerCase()) {
    console.log(`Slug mismatch: session=${userSlug}, url=${slug}`);
    // If they are logged in but on the wrong slug, send them to THEIR dashboard
    if (userSlug) {
      redirect(`/dashboard/${userSlug.toLowerCase()}`);
    }
    redirect('/login');
  }

  // 3. Fetch business data
  try {
    const business = await prisma.business.findUnique({
      where: { slug: slug.toLowerCase() },
      include: {
        categories: {
          include: { 
            items: { orderBy: { name: 'asc' } } 
          },
          orderBy: { sortOrder: 'asc' },
        },
        gallery: { 
          orderBy: { createdAt: 'desc' } 
        },
      },
    });

    if (!business) {
      notFound();
    }

    const { password: _password, ...dashboardBusiness } = business;
    return <DashboardContent business={dashboardBusiness} />;
  } catch (error) {
    console.error('Dashboard Data Fetch Error:', error);
    // Return a basic error UI instead of crashing the whole function
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">⚠️</div>
          <h1 className="text-xl font-black text-gray-900 mb-2">Dashboard Error</h1>
          <p className="text-gray-500 text-sm mb-6">We couldn't load your dashboard data. This might be a temporary connection issue.</p>
          <a 
            href=""
            className="block w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all text-center"
          >
            Try Again
          </a>
        </div>
      </div>
    );
  }
}
