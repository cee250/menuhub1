import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessBusiness } from '@/lib/business-auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Slug required' }, { status: 400 });
  }

  if (!(await canAccessBusiness(slug))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(todayStart);
  monthStart.setDate(monthStart.getDate() - 30);

  const [totalViews, todayViews, weekViews, monthViews, whatsappClicks, recentEvents] = await Promise.all([
    prisma.analytics.count({ where: { businessId: business.id, eventType: 'menu_view' } }),
    prisma.analytics.count({ where: { businessId: business.id, eventType: 'menu_view', createdAt: { gte: todayStart } } }),
    prisma.analytics.count({ where: { businessId: business.id, eventType: 'menu_view', createdAt: { gte: weekStart } } }),
    prisma.analytics.count({ where: { businessId: business.id, eventType: 'menu_view', createdAt: { gte: monthStart } } }),
    prisma.analytics.count({ where: { businessId: business.id, eventType: 'whatsapp_order_click' } }),
    prisma.analytics.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return NextResponse.json({
    totalViews,
    todayViews,
    weekViews,
    monthViews,
    whatsappClicks,
    recentEvents,
  }, { status: 200 });
}
