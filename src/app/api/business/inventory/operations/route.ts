import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getInventoryActor, inventoryErrorResponse, normalizeQuantity } from '@/lib/inventory';

const categories = new Set([
  'RECEIVED',
  'CUSTOMER_SALE',
  'EVENT_SALE',
  'COCKTAIL_USAGE',
  'OFFICE_USE',
  'DAMAGE',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'USAGE',
  'COMPLIMENTARY',
  'RECONCILIATION',
]);
const incoming = new Set(['RECEIVED', 'TRANSFER_IN']);
const saleCategories = new Set(['CUSTOMER_SALE', 'EVENT_SALE']);

function operationDate(value: unknown) {
  if (typeof value === 'string' && value) {
    const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
    if (!Number.isNaN(date.getTime())) return date;
  }
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

async function getPeriod(tx: any, businessId: string, key: string, actorId: string, actorRole: string) {
  return tx.inventoryPeriod.upsert({
    where: { businessId_monthKey: { businessId, monthKey: key } },
    create: { businessId, monthKey: key, openedById: `${actorRole}:${actorId}` },
    update: {},
  });
}

export async function POST(req: Request) {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const itemId = String(body?.itemId || '').trim();
    const category = String(body?.category || '').trim().toUpperCase();
    const quantity = normalizeQuantity(body?.quantity, 0);
    const date = operationDate(body?.date);
    const reason = String(body?.reason || '').trim() || category.replace(/_/g, ' ').toLowerCase();
    const comment = body?.comment ? String(body.comment).trim() : null;
    const eventName = body?.eventName ? String(body.eventName).trim() : null;
    const salePrice = normalizeQuantity(body?.salePrice, 0);

    if (!itemId) return NextResponse.json({ error: 'Inventory item is required.' }, { status: 400 });
    if (!categories.has(category)) return NextResponse.json({ error: 'Choose a valid stock movement type.' }, { status: 400 });
    if (!quantity || quantity < 0) return NextResponse.json({ error: 'Enter a positive quantity.' }, { status: 400 });
    if (saleCategories.has(category) && salePrice < 0) return NextResponse.json({ error: 'Selling price cannot be negative.' }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({ where: { id: itemId, businessId: actor.businessId, isActive: true } });
      if (!item) throw new Error('Inventory item not found.');

      const settings = await tx.inventorySettings.findUnique({ where: { businessId: actor.businessId } });
      if (actor.actorRole === 'manager' && category === 'RECEIVED' && settings?.managerCanRestock === false) throw new Error('Managers are not allowed to receive stock.');
      if (actor.actorRole === 'manager' && !incoming.has(category) && category !== 'CUSTOMER_SALE' && settings?.managerCanAdjust === false) throw new Error('Managers are not allowed to record this adjustment.');

      const signedQuantity = incoming.has(category) ? quantity : -quantity;
      const nextQuantity = item.quantityOnHand + signedQuantity;
      if (nextQuantity < item.reservedQuantity) throw new Error('Stock cannot fall below the quantity already reserved for open orders.');

      const period = await getPeriod(tx, actor.businessId, monthKey(date), actor.actorId, actor.actorRole);
      if (period.status === 'CLOSED') throw new Error(`The ${period.monthKey} inventory period is closed. Reopen it before recording new movements.`);
      const updated = await tx.inventoryItem.update({ where: { id: item.id }, data: { quantityOnHand: nextQuantity } });
      const movement = await tx.inventoryMovement.create({
        data: {
          businessId: actor.businessId,
          inventoryItemId: item.id,
          inventoryPeriodId: period.id,
          periodKey: monthKey(date),
          type: saleCategories.has(category) ? 'SALE' : incoming.has(category) ? 'RESTOCK' : 'ADJUSTMENT',
          movementCategory: category,
          quantity: signedQuantity,
          quantityBefore: item.quantityOnHand,
          quantityAfter: nextQuantity,
          reservedBefore: item.reservedQuantity,
          reservedAfter: item.reservedQuantity,
          reason,
          comment,
          eventName,
          costValue: quantity * item.unitCost,
          revenue: saleCategories.has(category) ? quantity * salePrice : 0,
          actorId: actor.actorId,
          actorRole: actor.actorRole,
          createdAt: date,
        },
      });
      return { item: updated, movement };
    }, { maxWait: 10000, timeout: 30000 });

    await prisma.auditLog.create({
      data: {
        businessId: actor.businessId,
        actor: `${actor.actorRole}:${actor.actorId}`,
        action: 'INVENTORY_OPERATION_RECORDED',
        details: JSON.stringify({ category, itemId, quantity, date: date.toISOString(), eventName }),
      },
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Inventory operation POST error:', error);
    const response = inventoryErrorResponse(error);
    if (response.status !== 500) return NextResponse.json(response.body, { status: response.status });
    return NextResponse.json({ error: error?.message || 'The inventory operation could not be recorded.' }, { status: 400 });
  }
}
