import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); 
    const { name, slug, email, password, whatsappNumber, businessType, location } = body;

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

    // 4. Create business
    const business = await prisma.business.create({
      data: {
        name,
        slug: cleanSlug,
        email: email ? String(email).trim().toLowerCase() : null,
        password: hashedPassword,
        whatsappNumber,
        businessType: businessType || 'other',
        location: location || '',
        tier: 'ESSENTIALS',
        status: 'PENDING',
        showOnHomepage: false,
      },
    });

    // 5. Send notification email to admin (non-blocking)
    try {
      const { sendNewRegistrationNotification } = await import('@/lib/email');
      await sendNewRegistrationNotification({
        name: business.name,
        slug: business.slug,
        email: business.email,
        whatsappNumber: business.whatsappNumber,
        businessType: business.businessType,
      });
    } catch (emailErr) {
      console.error('Failed to send notification email (non-blocking):', emailErr);
    }

    return NextResponse.json({ 
      message: 'Your request is submitted successfully. Our admin will review and activate your account shortly.',
      business: { id: business.id, name: business.name, slug: business.slug } 
    }, { status: 201 });

  } catch (error: any) {
    console.error('🔴 REGISTRATION FAILED:', error);
    return NextResponse.json({ error: 'Failed to register business.' }, { status: 500 });
  }
}
