import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessBusiness } from '@/lib/business-auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { isAvailable } = await request.json();

    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const ownedItem = await prisma.menuItem.findUnique({ where: { id }, select: { category: { select: { business: { select: { slug: true } } } } } });
    if (!(await canAccessBusiness(ownedItem?.category?.business.slug))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: Boolean(isAvailable) },
    });

    return NextResponse.json({ 
      message: 'Availability updated', 
      item: updatedItem 
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating availability:', error);
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
  }
}
