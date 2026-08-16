import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InventoryError, releaseExpiredReservations, reserveInventoryForOrder } from '@/lib/inventory';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const businessId = String(body?.businessId || '');
    const businessSlug = String(body?.businessSlug || '').trim().toLowerCase();
    const clientReference = body?.clientReference ? String(body.clientReference) : null;
    const tableNumber = body?.tableNumber ? String(body.tableNumber).trim() : null;
    const customerName = body?.customerName ? String(body.customerName).trim() : null;
    const rawItems = Array.isArray(body?.items) ? body.items : [];

    if ((!businessId && !businessSlug) || rawItems.length === 0) {
      return NextResponse.json({ error: 'Business and at least one order item are required.' }, { status: 400 });
    }

    const business = await prisma.business.findFirst({
      where: businessId ? { id: businessId, status: 'ACTIVE' } : { slug: businessSlug, status: 'ACTIVE' },
      select: { id: true, slug: true },
    });
    if (!business) return NextResponse.json({ error: 'Business not found or inactive.' }, { status: 404 });

    if (clientReference) {
      const existing = await prisma.order.findUnique({ where: { clientReference } });
      if (existing && existing.businessId === business.id) return NextResponse.json({ order: existing, alreadyCreated: true });
    }

    const requested = new Map<string, number>();
    for (const item of rawItems) {
      const id = String(item?.id || '').trim();
      const quantity = Number(item?.quantity);
      if (!id || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return NextResponse.json({ error: 'Each order item must have a valid quantity.' }, { status: 400 });
      }
      requested.set(id, (requested.get(id) || 0) + quantity);
    }

    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: Array.from(requested.keys()) },
        category: { businessId: business.id },
      },
      select: { id: true, name: true, price: true, imageUrl: true, categoryId: true, isAvailable: true },
    });

    if (menuItems.length !== requested.size || menuItems.some((item) => !item.isAvailable)) {
      return NextResponse.json({ error: 'One or more selected menu items are no longer available.' }, { status: 409 });
    }

    const storedItems = menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      categoryId: item.categoryId,
      quantity: requested.get(item.id) || 0,
    }));
    const totalAmount = storedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await prisma.$transaction(async (tx) => {
      await releaseExpiredReservations(tx, business.id);
      const created = await tx.order.create({
        data: {
          businessId: business.id,
          tableNumber,
          customerName,
          items: storedItems,
          totalAmount,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          source: String(body?.source || 'CUSTOMER'),
          clientReference,
        },
      });

      await reserveInventoryForOrder(tx, business.id, created.id, storedItems);
      return created;
    });

    return NextResponse.json({ order, inventoryReserved: true }, { status: 201 });
  } catch (error: any) {
    console.error('Public order creation error:', error);
    if (error instanceof InventoryError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.code === 'OUT_OF_STOCK' ? 409 : 400 });
    }
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'This order was already submitted. Please check the order status.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Unable to submit order right now.' }, { status: 500 });
  }
}
