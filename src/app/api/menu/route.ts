import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary'; // 🚀 IMPORT THIS INSTEAD OF fs
import { canAccessBusiness } from '@/lib/business-auth';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const businessSlug = formData.get('businessSlug') as string;
    const categoryName = formData.get('categoryName') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = formData.get('price') as string;
    const file = formData.get('file') as File | null;

    if (!(await canAccessBusiness(businessSlug))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify business
    const business = await prisma.business.findUnique({ where: { slug: businessSlug } });
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Find or create the category based on the typed name
    let category = await prisma.category.findFirst({
      where: {
        name: { equals: categoryName, mode: 'insensitive' },
        businessId: business.id,
      },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: categoryName,
          businessId: business.id,
        },
      });
    }

    let imageUrl = null;

    // 🚀 FIX: Upload to Cloudinary instead of local file system
    if (file && file.size > 0) {
      try {
        // Upload to a 'menu-items' folder in your Cloudinary account
        const result = await uploadToCloudinary(file, 'menu-items') as any;
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload failed for menu item:', uploadError);
        return NextResponse.json({ error: 'Failed to upload image. Please try again.' }, { status: 500 });
      }
    }

    // Create the new menu item
    const newItem = await prisma.menuItem.create({
      data: {
        name,
        description: description || '',
        price: parseFloat(price),
        categoryId: category.id,
        imageUrl,
      },
    });

    return NextResponse.json({ message: 'Item added successfully', item: newItem }, { status: 201 });
  } catch (error) {
    console.error('Error adding item:', error);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}