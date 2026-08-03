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

  const categories = await prisma.category.findMany({
    where: { businessId: business.id },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ categories }, { status: 200 });
}
