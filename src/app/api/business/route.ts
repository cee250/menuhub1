import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // We use JSON now because we aren't uploading files anymore
    const body = await request.json(); 
    const { name, slug, password, whatsappNumber, businessType, location } = body;

    // 1. Validate required fields
    if (!name || !slug || !password || !whatsappNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().replace(/\s+/g, '-');

    // 2. Check if slug exists
    const existingBusiness = await prisma.business.findUnique({
      where: { slug: cleanSlug },
    });

    if (existingBusiness) {
      return NextResponse.json({ error: 'Business URL is already taken.' }, { status: 400 });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create business (NO LOGO UPLOAD HERE)
    const business = await prisma.business.create({
      data: {
        name,
        slug: cleanSlug,
        password: hashedPassword,
        whatsappNumber,
        businessType: businessType || 'other',
        location: location || '',
        tier: 'ESSENTIALS',
        status: 'PENDING',
        showOnHomepage: false,
        // logoUrl is intentionally left out, it will be null
      },
    });

    return NextResponse.json({ 
      message: 'Business registered successfully!', 
      business: { id: business.id, name: business.name, slug: business.slug } 
    }, { status: 201 });

  } catch (error: any) {
    console.error('🔴 REGISTRATION FAILED:', error);
    return NextResponse.json({ error: 'Failed to register business.' }, { status: 500 });
  }
}