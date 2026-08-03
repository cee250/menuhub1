import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { canAccessBusiness } from '@/lib/business-auth';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const priceStr = formData.get('price') as string;
    const mainCategory = (formData.get('mainCategory') as string) || 'Foods';
    const subCategory = formData.get('subCategory') as string;
    const businessSlug = formData.get('businessSlug') as string; // <-- ADDED THIS
    const isAvailable = formData.get('isAvailable') === 'true';
    const isFeatured = formData.get('isFeatured') === 'true';
    const imageFile = formData.get('image') as File | null;

    if (!name || !priceStr || !businessSlug) {
      return NextResponse.json({ error: 'Name, price, and business are required.' }, { status: 400 });
    }

    if (!(await canAccessBusiness(businessSlug))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const price = parseFloat(priceStr);
    if (isNaN(price)) {
      return NextResponse.json({ error: 'Invalid price format.' }, { status: 400 });
    }

    // 1. Find the business
    const business = await prisma.business.findUnique({
      where: { slug: businessSlug },
      select: { id: true }
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found.' }, { status: 404 });
    }

    // 2. Find or Create the Category (Use subCategory if available, else mainCategory)
    const categoryName = subCategory?.trim() || mainCategory;
    
    let category = await prisma.category.findFirst({
      where: { 
        businessId: business.id, 
        name: categoryName 
      }
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: categoryName,
          businessId: business.id,
          sortOrder: 0,
        }
      });
    }

    // 3. Upload Image (if any)
    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      try {
        const result = await uploadToCloudinary(imageFile, 'menu-items');
        imageUrl = (result as any).secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
      }
    }

    // 4. Create the Menu Item AND LINK IT TO THE CATEGORY!
    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description: description || '',
        price,
        imageUrl: imageUrl || null,
        isAvailable,
        isFeatured,
        mainCategory,       // Keep string for dashboard filtering
        subCategory: subCategory || null, // Keep string for dashboard filtering
        categoryId: category.id, // <-- THIS IS THE MAGIC FIX!
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
