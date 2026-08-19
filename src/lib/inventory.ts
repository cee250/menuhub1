import { Prisma, PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth/route';

export type InventoryActor = {
  businessId: string;
  actorId: string;
  actorRole: 'owner' | 'manager' | 'stock_manager';
};

type DbClient = PrismaClient | Prisma.TransactionClient;

export class InventoryError extends Error {
  code: 'UNAUTHORIZED' | 'VALIDATION' | 'OUT_OF_STOCK' | 'NOT_FOUND';

  constructor(message: string, code: InventoryError['code']) {
    super(message);
    this.code = code;
  }
}

export async function getInventoryActor(): Promise<InventoryActor | null> {
  const session = await auth();
  const user = session?.user as any;
  if (!user || !['owner', 'manager', 'stock_manager'].includes(user.role)) return null;

  const businessId = user.role === 'owner' ? user.businessId || user.id : user.businessId;
  if (!businessId) return null;

  return {
    businessId,
    actorId: user.id,
    actorRole: user.role,
  };
}

export function availableQuantity(item: { quantityOnHand: number; reservedQuantity: number }) {
  return Math.max(0, item.quantityOnHand - item.reservedQuantity);
}

export function normalizeQuantity(value: unknown, fallback = 0) {
  const quantity = Number(value);
  return Number.isFinite(quantity) ? quantity : fallback;
}

export async function releaseExpiredReservations(tx: DbClient, businessId: string) {
  const settings = await tx.inventorySettings.findUnique({ where: { businessId } });
  const expiryMinutes = settings?.reservationExpiryMinutes ?? 30;
  const cutoff = new Date(Date.now() - expiryMinutes * 60 * 1000);
  const expiredOrders = await tx.order.findMany({
    where: {
      businessId,
      status: 'PENDING',
      createdAt: { lt: cutoff },
      inventoryReservations: { some: { status: 'RESERVED' } },
    },
    select: { id: true },
    take: 100,
  });

  for (const order of expiredOrders) {
    await releaseInventoryForOrder(tx, order.id, 'Reservation expired');
    await tx.order.update({ where: { id: order.id }, data: { status: 'EXPIRED' } });
  }
}

export async function reserveInventoryForOrder(
  tx: DbClient,
  businessId: string,
  orderId: string,
  rawItems: unknown,
  force = false,
) {
  if (!Array.isArray(rawItems)) return;

  const settings = await tx.inventorySettings.findUnique({ where: { businessId } });
  if (settings?.reservationMode === 'DISABLED') return;
  if (!force && settings?.reservationMode === 'ON_CONFIRMATION') return;

  const existingReservation = await tx.inventoryReservation.findFirst({ where: { orderId, status: 'RESERVED' } });
  if (existingReservation) return;

  const requested = new Map<string, number>();
  for (const rawItem of rawItems as any[]) {
    const menuItemId = String(rawItem?.id || rawItem?.menuItemId || '').trim();
    const quantity = normalizeQuantity(rawItem?.quantity, 0);
    if (menuItemId && quantity > 0) {
      requested.set(menuItemId, (requested.get(menuItemId) || 0) + quantity);
    }
  }

  if (requested.size === 0) return;

  const inventoryItems = await tx.inventoryItem.findMany({
    where: {
      businessId,
      menuItemId: { in: Array.from(requested.keys()) },
      isActive: true,
      trackStock: true,
    },
  });

  for (const inventoryItem of inventoryItems) {
    const quantity = requested.get(inventoryItem.menuItemId || '');
    if (!quantity) continue;

    const available = availableQuantity(inventoryItem);
    if (available < quantity) {
      throw new InventoryError(
        `${inventoryItem.name} has only ${available} ${inventoryItem.unit} available.`,
        'OUT_OF_STOCK',
      );
    }
  }

  for (const inventoryItem of inventoryItems) {
    const quantity = requested.get(inventoryItem.menuItemId || '');
    if (!quantity) continue;

    const reserved = await tx.inventoryItem.updateMany({
      where: {
        id: inventoryItem.id,
        businessId,
        quantityOnHand: inventoryItem.quantityOnHand,
        reservedQuantity: inventoryItem.reservedQuantity,
      },
      data: { reservedQuantity: { increment: quantity } },
    });
    if (reserved.count !== 1) {
      throw new InventoryError(`${inventoryItem.name} changed while this order was being placed. Please try again.`, 'OUT_OF_STOCK');
    }

    await tx.inventoryReservation.create({
      data: {
        businessId,
        inventoryItemId: inventoryItem.id,
        orderId,
        quantity,
        status: 'RESERVED',
      },
    });

    await tx.inventoryMovement.create({
      data: {
        businessId,
        inventoryItemId: inventoryItem.id,
        type: 'RESERVE',
        quantity,
        quantityBefore: inventoryItem.quantityOnHand,
        quantityAfter: inventoryItem.quantityOnHand,
        reservedBefore: inventoryItem.reservedQuantity,
        reservedAfter: inventoryItem.reservedQuantity + quantity,
        reason: 'Reserved for customer order',
        referenceId: orderId,
        actorRole: 'system',
      },
    });
  }
}

export async function releaseInventoryForOrder(tx: DbClient, orderId: string, reason = 'Order cancelled') {
  const reservations = await tx.inventoryReservation.findMany({
    where: { orderId, status: 'RESERVED' },
  });

  for (const reservation of reservations) {
    const inventoryItem = await tx.inventoryItem.findUnique({ where: { id: reservation.inventoryItemId } });
    if (!inventoryItem) continue;

    const nextReserved = Math.max(0, inventoryItem.reservedQuantity - reservation.quantity);
    const released = await tx.inventoryItem.updateMany({
      where: { id: inventoryItem.id, quantityOnHand: inventoryItem.quantityOnHand, reservedQuantity: inventoryItem.reservedQuantity },
      data: { reservedQuantity: nextReserved },
    });
    if (released.count !== 1) continue;

    const reservationReleased = await tx.inventoryReservation.updateMany({
      where: { id: reservation.id, status: 'RESERVED' },
      data: { status: 'RELEASED', releasedAt: new Date() },
    });
    if (reservationReleased.count !== 1) {
      throw new InventoryError('This reservation was already changed. Please refresh the order.', 'VALIDATION');
    }

    await tx.inventoryMovement.create({
      data: {
        businessId: reservation.businessId,
        inventoryItemId: inventoryItem.id,
        type: 'RELEASE',
        quantity: reservation.quantity,
        quantityBefore: inventoryItem.quantityOnHand,
        quantityAfter: inventoryItem.quantityOnHand,
        reservedBefore: inventoryItem.reservedQuantity,
        reservedAfter: nextReserved,
        reason,
        referenceId: orderId,
        actorRole: 'system',
      },
    });
  }
}

export async function completeInventoryForOrder(tx: DbClient, orderId: string) {
  const reservations = await tx.inventoryReservation.findMany({
    where: { orderId, status: 'RESERVED' },
  });

  for (const reservation of reservations) {
    const inventoryItem = await tx.inventoryItem.findUnique({ where: { id: reservation.inventoryItemId } });
    if (!inventoryItem) continue;

    const nextQuantity = inventoryItem.quantityOnHand - reservation.quantity;
    const nextReserved = Math.max(0, inventoryItem.reservedQuantity - reservation.quantity);
    if (nextQuantity < 0) {
      throw new InventoryError(`${inventoryItem.name} no longer has enough stock to complete this order.`, 'OUT_OF_STOCK');
    }

    const deducted = await tx.inventoryItem.updateMany({
      where: { id: inventoryItem.id, quantityOnHand: inventoryItem.quantityOnHand, reservedQuantity: inventoryItem.reservedQuantity },
      data: {
        quantityOnHand: nextQuantity,
        reservedQuantity: nextReserved,
      },
    });
    if (deducted.count !== 1) {
      throw new InventoryError(`${inventoryItem.name} changed while completing this order. Please refresh and try again.`, 'OUT_OF_STOCK');
    }

    const reservationCompleted = await tx.inventoryReservation.updateMany({
      where: { id: reservation.id, status: 'RESERVED' },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    if (reservationCompleted.count !== 1) {
      throw new InventoryError('This reservation was already completed or released.', 'VALIDATION');
    }

    await tx.inventoryMovement.create({
      data: {
        businessId: reservation.businessId,
        inventoryItemId: inventoryItem.id,
        type: 'SALE',
        quantity: -reservation.quantity,
        quantityBefore: inventoryItem.quantityOnHand,
        quantityAfter: nextQuantity,
        reservedBefore: inventoryItem.reservedQuantity,
        reservedAfter: nextReserved,
        reason: 'Completed order consumption',
        referenceId: orderId,
        actorRole: 'system',
      },
    });
  }
}

export function inventoryErrorResponse(error: unknown) {
  if (error instanceof InventoryError) {
    const status = error.code === 'UNAUTHORIZED' ? 401 : error.code === 'NOT_FOUND' ? 404 : error.code === 'OUT_OF_STOCK' ? 409 : 400;
    return { status, body: { error: error.message, code: error.code } };
  }
  return { status: 500, body: { error: 'Internal server error' } };
}

export function isInventoryManager(actor: InventoryActor) {
  return actor.actorRole !== 'owner';
}
