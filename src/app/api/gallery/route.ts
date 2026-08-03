import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { auth } from '@/lib/auth/route';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.slug) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;
    const caption = formData.get('caption') as string;
    const category = (formData.get('category') as string) || 'other'; // 🚀 GET CATEGORY
    const businessSlug = formData.get('businessSlug') as string;

    if (!file || !businessSlug) {
      return NextResponse.json({ error: 'Image and business slug are required' }, { status: 400 });
    }

    // Verify business ownership
    const business = await prisma.business.findUnique({ where: { slug: businessSlug } });
    if (!business || (session.user as any).slug !== businessSlug) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(file, 'gallery') as any;

    // Save to Database with Category
    await prisma.gallery.create({
      data: {
        imageUrl: result.secure_url,
        caption: caption || null,
        category: category, // 🚀 SAVE CATEGORY
        businessId: business.id,
      },
    });

    return NextResponse.json({ message: 'Image uploaded successfully' }, { status: 201 });

  } catch (error: any) {
    console.error('Gallery upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload image' }, { status: 500 });
  }
}