import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  completeInventoryForOrder,
  getInventoryActor,
  reserveInventoryForOrder,
  inventoryErrorResponse,
  releaseExpiredReservations,
  releaseInventoryForOrder,
} from '@/lib/inventory';

const allowedStatuses = new Set(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED']);
const finalStatuses = new Set(['COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED']);

export async function GET(req: Request) {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const take = Math.min(Math.max(Number(searchParams.get('take') || 100), 1), 200);

    await prisma.$transaction((tx) => releaseExpiredReservations(tx, actor.businessId));

    const orders = await prisma.order.findMany({
      where: {
        businessId: actor.businessId,
        ...(status && allowedStatuses.has(status) ? { status } : {}),
      },
      include: {
        inventoryReservations: {
          select: { id: true, inventoryItemId: true, quantity: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Business orders GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const orderId = String(body?.orderId || '');
    const nextStatus = String(body?.status || '').toUpperCase();
    const paymentStatus = body?.paymentStatus ? String(body.paymentStatus).toUpperCase() : undefined;

    if (!orderId || !allowedStatuses.has(nextStatus)) {
      return NextResponse.json({ error: 'A valid order id and status are required.' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({ where: { id: orderId, businessId: actor.businessId } });
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    if (finalStatuses.has(order.status) && order.status !== nextStatus) {
      return NextResponse.json({ error: 'A completed or cancelled order cannot be reopened.' }, { status: 409 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (nextStatus === 'CONFIRMED' || nextStatus === 'PREPARING') {
        await reserveInventoryForOrder(tx, order.businessId, order.id, order.items, true);
      }
      if (nextStatus === 'CANCELLED' || nextStatus === 'REJECTED') {
        await releaseInventoryForOrder(tx, order.id, `Order ${nextStatus.toLowerCase()}`);
      }
      if (nextStatus === 'COMPLETED') {
        await completeInventoryForOrder(tx, order.id);
      }

      return tx.order.update({
        where: { id: order.id },
        data: {
          status: nextStatus,
          ...(paymentStatus ? { paymentStatus } : {}),
        },
        include: { inventoryReservations: true },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Business order PATCH error:', error);
    const response = inventoryErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
