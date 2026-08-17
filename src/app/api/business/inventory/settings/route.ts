import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getInventoryActor } from '@/lib/inventory';

const allowedModes = new Set(['SIMPLE', 'PACKAGED', 'MANUAL']);
const allowedReservationModes = new Set(['ON_ORDER', 'ON_CONFIRMATION', 'DISABLED']);

export async function GET() {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const settings = await prisma.inventorySettings.upsert({
      where: { businessId: actor.businessId },
      create: { businessId: actor.businessId },
      update: {},
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Inventory settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (actor.actorRole !== 'owner') {
      return NextResponse.json({ error: 'Only the business owner can change inventory settings.' }, { status: 403 });
    }

    const body = await req.json();
    const inventoryMode = String(body?.inventoryMode || 'SIMPLE').toUpperCase();
    const reservationMode = String(body?.reservationMode || 'ON_ORDER').toUpperCase();
    const reservationExpiryMinutes = Number(body?.reservationExpiryMinutes || 30);
    const defaultUnit = String(body?.defaultUnit || 'piece').trim() || 'piece';

    if (!allowedModes.has(inventoryMode)) return NextResponse.json({ error: 'Invalid inventory mode.' }, { status: 400 });
    if (!allowedReservationModes.has(reservationMode)) return NextResponse.json({ error: 'Invalid reservation mode.' }, { status: 400 });
    if (!Number.isFinite(reservationExpiryMinutes) || reservationExpiryMinutes < 5 || reservationExpiryMinutes > 1440) return NextResponse.json({ error: 'Reservation expiry must be between 5 and 1440 minutes.' }, { status: 400 });

    const settings = await prisma.inventorySettings.upsert({
      where: { businessId: actor.businessId },
      create: {
        businessId: actor.businessId,
        inventoryMode,
        reservationMode,
        reservationExpiryMinutes,
        defaultUnit,
        autoHideOutOfStock: body?.autoHideOutOfStock === true,
        lowStockNotifications: body?.lowStockNotifications !== false,
        managerCanRestock: body?.managerCanRestock !== false,
        managerCanAdjust: body?.managerCanAdjust !== false,
      },
      update: {
        inventoryMode,
        reservationMode,
        reservationExpiryMinutes,
        defaultUnit,
        autoHideOutOfStock: body?.autoHideOutOfStock === true,
        lowStockNotifications: body?.lowStockNotifications !== false,
        managerCanRestock: body?.managerCanRestock !== false,
        managerCanAdjust: body?.managerCanAdjust !== false,
      },
    });

    await prisma.auditLog.create({
      data: {
        businessId: actor.businessId,
        actor: `${actor.actorRole}:${actor.actorId}`,
        action: 'INVENTORY_SETTINGS_UPDATED',
        details: JSON.stringify({ inventoryMode, reservationMode, reservationExpiryMinutes, defaultUnit }),
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Inventory settings PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
