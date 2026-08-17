import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getInventoryActor } from '@/lib/inventory';

function validMonth(value: string | null) {
  if (value && /^\d{4}-\d{2}$/.test(value)) return value;
  return new Date().toISOString().slice(0, 7);
}

function day(value: string | null) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00.000Z`);
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function GET(req: Request) {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const params = new URL(req.url).searchParams;
    const monthKey = validMonth(params.get('month'));
    const period = await prisma.inventoryPeriod.upsert({
      where: { businessId_monthKey: { businessId: actor.businessId, monthKey } },
      create: { businessId: actor.businessId, monthKey, openedById: `${actor.actorRole}:${actor.actorId}` },
      update: {},
      include: { dailyCloses: { orderBy: { closeDate: 'desc' }, take: 31 } },
    });
    const movements = await prisma.inventoryMovement.findMany({
      where: { businessId: actor.businessId, periodKey: monthKey },
      include: { inventoryItem: { select: { id: true, name: true, unit: true, unitCost: true, sellingPrice: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const items = await prisma.inventoryItem.findMany({ where: { businessId: actor.businessId, isActive: true }, orderBy: { name: 'asc' } });
    const byCategory = movements.reduce<Record<string, { quantity: number; costValue: number; revenue: number }>>((result, movement) => {
      const key = movement.movementCategory || movement.type;
      result[key] = result[key] || { quantity: 0, costValue: 0, revenue: 0 };
      result[key].quantity += Math.abs(movement.quantity);
      result[key].costValue += movement.costValue;
      result[key].revenue += movement.revenue;
      return result;
    }, {});
    const sales = movements.filter((movement) => ['CUSTOMER_SALE', 'EVENT_SALE'].includes(movement.movementCategory));
    const waste = movements.filter((movement) => ['DAMAGE', 'OFFICE_USE', 'USAGE'].includes(movement.movementCategory));
    const summary = {
      monthKey,
      stockValue: items.reduce((total, item) => total + Math.max(0, item.quantityOnHand) * Math.max(0, item.unitCost), 0),
      completedRevenue: sales.reduce((total, movement) => total + movement.revenue, 0),
      costOfSales: sales.reduce((total, movement) => total + movement.costValue, 0),
      grossMargin: sales.reduce((total, movement) => total + movement.revenue - movement.costValue, 0),
      wasteCost: waste.reduce((total, movement) => total + movement.costValue, 0),
      receivedCost: movements.filter((movement) => movement.movementCategory === 'RECEIVED').reduce((total, movement) => total + movement.costValue, 0),
      movementCount: movements.length,
      completedDays: period.dailyCloses.filter((close) => close.status === 'COMPLETED').length,
    };
    return NextResponse.json({ period, summary, byCategory, movements, items });
  } catch (error) {
    console.error('Inventory monthly GET error:', error);
    return NextResponse.json({ error: 'Unable to load monthly inventory operations.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (actor.actorRole !== 'owner') return NextResponse.json({ error: 'Only the owner can close a month.' }, { status: 403 });
    const body = await req.json();
    const monthKey = validMonth(body?.month);
    const status = String(body?.status || '').toUpperCase();
    if (!['OPEN', 'CLOSED'].includes(status)) return NextResponse.json({ error: 'Invalid monthly period status.' }, { status: 400 });
    const period = await prisma.inventoryPeriod.upsert({
      where: { businessId_monthKey: { businessId: actor.businessId, monthKey } },
      create: { businessId: actor.businessId, monthKey, status, openedById: `${actor.actorRole}:${actor.actorId}`, closedAt: status === 'CLOSED' ? new Date() : null, closedById: status === 'CLOSED' ? `${actor.actorRole}:${actor.actorId}` : null },
      update: { status, closedAt: status === 'CLOSED' ? new Date() : null, closedById: status === 'CLOSED' ? `${actor.actorRole}:${actor.actorId}` : null, notes: body?.notes ? String(body.notes) : undefined },
    });
    await prisma.auditLog.create({ data: { businessId: actor.businessId, actor: `${actor.actorRole}:${actor.actorId}`, action: status === 'CLOSED' ? 'INVENTORY_MONTH_CLOSED' : 'INVENTORY_MONTH_REOPENED', details: JSON.stringify({ monthKey, notes: body?.notes || null }) } });
    return NextResponse.json(period);
  } catch (error) {
    console.error('Inventory monthly PATCH error:', error);
    return NextResponse.json({ error: 'Unable to update the monthly inventory period.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const closeDate = day(body?.closeDate);
    const monthKey = closeDate.toISOString().slice(0, 7);
    const lines = Array.isArray(body?.lines) ? body.lines : [];
    if (!lines.length) return NextResponse.json({ error: 'Add physical quantities before saving the daily close.' }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const period = await tx.inventoryPeriod.upsert({ where: { businessId_monthKey: { businessId: actor.businessId, monthKey } }, create: { businessId: actor.businessId, monthKey, openedById: `${actor.actorRole}:${actor.actorId}` }, update: {} });
      const items = await tx.inventoryItem.findMany({ where: { businessId: actor.businessId, isActive: true } });
      const byId = new Map(items.map((item) => [item.id, item]));
      const normalized = lines.map((line: any) => ({ item: byId.get(String(line?.itemId || line?.inventoryItemId)), physical: Number(line?.physicalQuantity), notes: line?.notes ? String(line.notes) : null })).filter((line: any) => line.item && Number.isFinite(line.physical));
      if (!normalized.length) throw new Error('No valid stock-count lines were provided.');
      if (normalized.some((line: any) => line.physical < line.item.reservedQuantity)) throw new Error('A physical count cannot be lower than stock reserved for open orders.');
      const systemValue = normalized.reduce((total: number, line: any) => total + line.item.quantityOnHand * line.item.unitCost, 0);
      const physicalValue = normalized.reduce((total: number, line: any) => total + line.physical * line.item.unitCost, 0);
      const complete = body?.status === 'COMPLETED';
      const close = await tx.inventoryDailyClose.upsert({ where: { businessId_closeDate: { businessId: actor.businessId, closeDate } }, create: { businessId: actor.businessId, periodId: period.id, closeDate, status: complete ? 'COMPLETED' : 'DRAFT', systemValue, physicalValue, varianceValue: physicalValue - systemValue, notes: body?.notes ? String(body.notes) : null, createdById: `${actor.actorRole}:${actor.actorId}`, approvedById: complete && actor.actorRole === 'owner' ? `${actor.actorRole}:${actor.actorId}` : null, closedAt: complete ? new Date() : null }, update: { status: complete ? 'COMPLETED' : 'DRAFT', systemValue, physicalValue, varianceValue: physicalValue - systemValue, notes: body?.notes ? String(body.notes) : undefined, approvedById: complete && actor.actorRole === 'owner' ? `${actor.actorRole}:${actor.actorId}` : undefined, closedAt: complete ? new Date() : undefined } });
      for (const line of normalized) {
        const variance = line.physical - line.item.quantityOnHand;
        await tx.inventoryDailyCloseLine.upsert({ where: { dailyCloseId_inventoryItemId: { dailyCloseId: close.id, inventoryItemId: line.item.id } }, create: { dailyCloseId: close.id, inventoryItemId: line.item.id, systemQuantity: line.item.quantityOnHand, physicalQuantity: line.physical, variance, notes: line.notes }, update: { physicalQuantity: line.physical, variance, notes: line.notes } });
        if (complete && variance !== 0) {
          await tx.inventoryItem.update({ where: { id: line.item.id }, data: { quantityOnHand: line.physical, lastCountedAt: new Date() } });
          await tx.inventoryMovement.create({ data: { businessId: actor.businessId, inventoryItemId: line.item.id, inventoryPeriodId: period.id, periodKey: monthKey, type: 'ADJUSTMENT', movementCategory: 'RECONCILIATION', quantity: variance, quantityBefore: line.item.quantityOnHand, quantityAfter: line.physical, reservedBefore: line.item.reservedQuantity, reservedAfter: line.item.reservedQuantity, costValue: Math.abs(variance) * line.item.unitCost, reason: 'Daily physical stock close', comment: line.notes, actorId: actor.actorId, actorRole: actor.actorRole, createdAt: closeDate } });
        }
      }
      return close;
    }, { maxWait: 10000, timeout: 30000 });
    await prisma.auditLog.create({ data: { businessId: actor.businessId, actor: `${actor.actorRole}:${actor.actorId}`, action: 'INVENTORY_DAILY_CLOSE_SAVED', details: JSON.stringify({ closeDate: closeDate.toISOString(), status: result.status }) } });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Inventory daily close POST error:', error);
    return NextResponse.json({ error: error?.message || 'Unable to save daily inventory close.' }, { status: 400 });
  }
}
