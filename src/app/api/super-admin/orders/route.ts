import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidSuperAdminSessionToken } from '@/lib/super-admin';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!isValidSuperAdminSessionToken(request.cookies.get('menuhub_super_admin')?.value)) return unauthorized();

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { business: { select: { id: true, name: true, slug: true } } },
  });

  return NextResponse.json(orders);
}

export async function PATCH(request: NextRequest) {
  if (!isValidSuperAdminSessionToken(request.cookies.get('menuhub_super_admin')?.value)) return unauthorized();

  try {
    const body = await request.json();
    const { id, status } = body || {};

    if (!id || !status) {
      return NextResponse.json({ error: 'Order id and status are required.' }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Order update failed:', error);
    return NextResponse.json({ error: 'Could not update order.' }, { status: 500 });
  }
}
