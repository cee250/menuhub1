import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const priceStr = formData.get('price') as string;
    const mainCategory = (formData.get('mainCategory') as string) || 'Foods';
    const subCategory = formData.get('subCategory') as string;
    const isAvailable = formData.get('isAvailable') === 'true';
    const isFeatured = formData.get('isFeatured') === 'true';
    const imageFile = formData.get('image') as File | null;

    if (!name || !priceStr) {
      return NextResponse.json({ error: 'Name and price are required.' }, { status: 400 });
    }

    const price = parseFloat(priceStr);
    if (isNaN(price)) {
      return NextResponse.json({ error: 'Invalid price format.' }, { status: 400 });
    }

    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      try {
        const result = await uploadToCloudinary(imageFile, 'menu-items');
        imageUrl = (result as any).secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
      }
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description: description || '',
        price,
        imageUrl: imageUrl || null,
        isAvailable,
        isFeatured,
        mainCategory,
        subCategory: subCategory || null,
      },
    });

    return NextResponse.json({ 
      message: 'Menu item added successfully!', 
      item: menuItem 
    }, { status: 201 });

  } catch (error: any) {
    console.error('🔴 FAILED TO ADD MENU ITEM:', error);
    return NextResponse.json({ error: 'Failed to add menu item.' }, { status: 500 });
  }
}