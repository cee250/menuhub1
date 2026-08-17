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

export async function GET(req: Request) {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const requested = new URL(req.url).searchParams.get('date');
    const start = operationDate(requested);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    const [items, dayMovements, previousMovements] = await prisma.$transaction([
      prisma.inventoryItem.findMany({ where: { businessId: actor.businessId, isActive: true }, select: { id: true, quantityOnHand: true }, orderBy: { name: 'asc' } }),
      prisma.inventoryMovement.findMany({ where: { businessId: actor.businessId, createdAt: { gte: start, lt: end } }, orderBy: { createdAt: 'asc' } }),
      prisma.inventoryMovement.findMany({ where: { businessId: actor.businessId, createdAt: { lt: start } }, orderBy: [{ inventoryItemId: 'asc' }, { createdAt: 'desc' }] }),
    ]);
    const openingByItem = new Map<string, number>();
    previousMovements.forEach((movement) => { if (!openingByItem.has(movement.inventoryItemId)) openingByItem.set(movement.inventoryItemId, movement.quantityAfter); });
    const rows = items.map((item) => {
      const movements = dayMovements.filter((movement) => movement.inventoryItemId === item.id);
      const draft: Record<string, string | number> = {};
      movements.forEach((movement) => {
        const quantity = Math.abs(movement.quantity);
        if (movement.movementCategory === 'RECEIVED') draft.received = Number(draft.received || 0) + quantity;
        if (movement.movementCategory === 'EVENT_SALE' || movement.movementCategory === 'CUSTOMER_SALE') draft.eventSales = Number(draft.eventSales || 0) + quantity;
        if (movement.movementCategory === 'DAMAGE') draft.damage = Number(draft.damage || 0) + quantity;
        if (movement.movementCategory === 'OFFICE_USE') draft.officeWater = Number(draft.officeWater || 0) + quantity;
        if (movement.movementCategory === 'TRANSFER_IN') draft.transferIn = Number(draft.transferIn || 0) + quantity;
        if (movement.movementCategory === 'TRANSFER_OUT') draft.transferOut = Number(draft.transferOut || 0) + quantity;
        if (movement.movementCategory === 'USAGE' || movement.movementCategory === 'COCKTAIL_USAGE') draft.usage = Number(draft.usage || 0) + quantity;
        if (movement.movementCategory === 'RECONCILIATION') draft.misExt = Number(draft.misExt || 0) + (movement.quantity >= 0 ? quantity : -quantity);
        if (movement.comment) draft.comment = movement.comment;
      });
      return { itemId: item.id, opening: openingByItem.get(item.id) ?? item.quantityOnHand, draft };
    });
    return NextResponse.json({ rows });
  } catch (error: any) {
    console.error('Inventory operation GET error:', error);
    return NextResponse.json({ error: error?.message || 'The daily stock register could not be loaded.' }, { status: 500 });
  }
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

      const isExtraReconciliation = category === 'RECONCILIATION' && String(body?.reason || '').toLowerCase().includes('extra');
      const signedQuantity = incoming.has(category) || isExtraReconciliation ? quantity : -quantity;
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
