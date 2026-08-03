import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/route';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const session = await auth();
  if (!session || (session.user as any)?.slug !== slug) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const waiters = await prisma.staff.findMany({
    where: { business: { slug: slug } },
    orderBy: { isActive: 'desc' },
  });

  return NextResponse.json(waiters);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const session = await auth();
  if (!session || (session.user as any)?.slug !== slug) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, phone } = await req.json();
  if (!name || !phone) {
    return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
  }

  const phoneRegex = /^\+[1-9]\d{6,14}$/;
  if (!phoneRegex.test(phone)) {
    return NextResponse.json({ error: 'Invalid phone format. Must start with + and contain 7-15 digits.' }, { status: 400 });
  }

  const business = await prisma.business.findUnique({ where: { slug: slug } });
  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  const newWaiter = await prisma.staff.create({
    data: {
      name,
      phone,
      businessId: business.id,
    },
  });

  return NextResponse.json(newWaiter, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const session = await auth();
  if (!session || (session.user as any)?.slug !== slug) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, isActive } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Waiter ID is required' }, { status: 400 });
  }

  const updatedWaiter = await prisma.staff.update({
    where: { id },
    data: { isActive },
  });

  return NextResponse.json(updatedWaiter);
}