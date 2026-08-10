import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/route';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId || businessId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const managers = await prisma.manager.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      }
    });

    return NextResponse.json(managers);
  } catch (error) {
    console.error('Error fetching managers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, slug, password, businessId } = await req.json();

    if (!name || !slug || !password || !businessId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (businessId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cleanSlug = String(slug).toLowerCase().replace(/\s+/g, '-');
    
    // Check if slug is taken in Business or Manager table
    const existingBusiness = await prisma.business.findUnique({ where: { slug: cleanSlug } });
    const existingManager = await prisma.manager.findUnique({ where: { slug: cleanSlug } });
    
    if (existingBusiness || existingManager) {
      return NextResponse.json({ error: 'This slug is already taken' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const manager = await prisma.manager.create({
      data: {
        name,
        slug: cleanSlug,
        password: hashedPassword,
        businessId,
      },
    });

    return NextResponse.json({ success: true, manager: { id: manager.id, name: manager.name, slug: manager.slug } });
  } catch (error) {
    console.error('Error creating manager:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { managerId, businessId } = await req.json();

    if (!managerId || !businessId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (businessId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.manager.delete({
      where: { 
        id: managerId,
        businessId: businessId // Ensure it belongs to the owner
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting manager:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
