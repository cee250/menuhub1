import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@/lib/auth/route'; // 🚀 Use the same proven auth check

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const slug = formData.get('slug') as string;
    
    // 1. CHECK AUTH FIRST (Proven method)
    const session = await auth();
    if (!session || (session.user as any)?.slug !== slug) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this business.' }, { status: 403 });
    }

    const name = formData.get('name') as string;
    const whatsappNumber = formData.get('whatsappNumber') as string;
    const waiterCallNumber = formData.get('waiterCallNumber') as string;
    const themeColor = formData.get('themeColor') as string;
    const location = formData.get('location') as string;
    const instagramUrl = formData.get('instagramUrl') as string;
    const facebookUrl = formData.get('facebookUrl') as string;
    const tiktokUrl = formData.get('tiktokUrl') as string;
    const hasFreeWifi = formData.get('hasFreeWifi') === 'on';
    const showOnHomepage = formData.get('showOnHomepage') === 'on';
    const file = formData.get('logo') as File | null;

    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    let logoUrl = business.logoUrl;

    if (file && file.size > 0) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Invalid file type. Please upload an image (JPG/PNG).' }, { status: 400 });
      }

      // Delete old logo from Cloudinary if it exists
      if (business.logoUrl && business.logoUrl.includes('cloudinary.com')) {
        try {
          const urlParts = business.logoUrl.split('/');
          const filename = urlParts[urlParts.length - 1];
          const publicId = `menuhub/logos/${filename.split('.')[0]}`;
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          // 🚀 CRITICAL FIX: Don't fail the whole request if deletion fails
          console.warn('Failed to delete old logo from Cloudinary, continuing anyway:', err);
        }
      }

      // Upload new logo to Cloudinary
      try {
        const result = await uploadToCloudinary(file, 'logos') as any;
        logoUrl = result.secure_url;
      } catch (uploadError: any) {
        console.error('Cloudinary upload failed:', uploadError);
        return NextResponse.json({ error: `Image upload failed: ${uploadError.message}` }, { status: 500 });
      }
    }

    const updatedBusiness = await prisma.business.update({
      where: { slug },
      data: {
        name,
        whatsappNumber,
        waiterCallNumber: waiterCallNumber || null,
        themeColor,
        location: location || null,
        instagramUrl: instagramUrl || null,
        facebookUrl: facebookUrl || null,
        tiktokUrl: tiktokUrl || null,
        hasFreeWifi,
        showOnHomepage,
        logoUrl,
      },
    });

    const { password: _password, ...safeBusiness } = updatedBusiness;
    return NextResponse.json({ message: 'Settings updated', business: safeBusiness }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error updating settings:', error);
    // 🚀 Return the exact error message to the frontend
    return NextResponse.json({ error: `Failed to update settings: ${error.message}` }, { status: 500 });
  }
}