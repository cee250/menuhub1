import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';
import { canAccessBusiness } from '@/lib/business-auth';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const item = await prisma.gallery.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const business = await prisma.business.findUnique({ where: { id: item.businessId }, select: { slug: true } });
    if (!(await canAccessBusiness(business?.slug))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (item.imageUrl) {
      const imagePath = path.join(process.cwd(), 'public', item.imageUrl);
      try {
        await unlink(imagePath);
      } catch (e) {
        console.log('Image not found');
      }
    }

    await prisma.gallery.delete({ where: { id } });

    return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
