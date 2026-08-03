import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary'; // 🚀 REPLACED fs/promises with Cloudinary
import { canAccessBusiness } from '@/lib/business-auth';

async function canAccessItem(id: string) {
  const item = await prisma.menuItem.findUnique({ 
    where: { id }, 
    select: { category: { select: { business: { select: { slug: true } } } } } 
  });
  return canAccessBusiness(item?.category?.business.slug);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = formData.get('price') as string;
    const isFeatured = formData.get('isFeatured') === 'on' || formData.get('isFeatured') === 'true';
    const isAvailable = formData.get('isAvailable') === 'on' || formData.get('isAvailable') === 'true';
    const file = formData.get('file') as File | null;

    if (!name || !price) {
      return NextResponse.json({ error: 'Name and price are required.' }, { status: 400 });
    }

    const existingItem = await prisma.menuItem.findUnique({ where: { id } });
    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (!(await canAccessItem(id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 🚀 FIX: Keep the old image URL by default
    let imageUrl = existingItem.imageUrl;

    // 🚀 FIX: If a NEW file is provided, upload it to Cloudinary
    if (file && file.size > 0) {
      try {
        const result = await uploadToCloudinary(file, 'menu-items') as any;
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        return NextResponse.json({ error: 'Failed to upload new image.' }, { status: 500 });
      }
    }

    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: {
        name,
        description: description || '',
        price: Number.parseFloat(price),
        imageUrl, // Uses new Cloudinary URL, or keeps the old one if no file was uploaded
        isFeatured,
        isAvailable,
      },
    });

    return NextResponse.json({ message: 'Item updated', item: updatedItem }, { status: 200 });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (!(await canAccessItem(id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 🚀 FIX: Removed local file deletion (unlink). 
    // Cloudinary manages its own storage, and deleting the database record is all you need to do.

    await prisma.menuItem.delete({ where: { id } });

    return NextResponse.json({ message: 'Item deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}