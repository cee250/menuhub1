import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getInventoryActor } from '@/lib/inventory';

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export async function GET(req: Request) {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const end = searchParams.get('to') ? new Date(`${searchParams.get('to')}T23:59:59.999Z`) : new Date();
    const start = searchParams.get('from') ? new Date(`${searchParams.get('from')}T00:00:00.000Z`) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return NextResponse.json({ error: 'Invalid report date range.' }, { status: 400 });

    const [items, movements, completedOrders] = await Promise.all([
      prisma.inventoryItem.findMany({
        where: { businessId: actor.businessId, isActive: true },
        include: { supplier: { select: { name: true } }, menuItem: { select: { name: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.inventoryMovement.findMany({
        where: { businessId: actor.businessId, createdAt: { gte: start, lte: end } },
        include: { inventoryItem: { select: { id: true, name: true, unit: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.order.findMany({
        where: { businessId: actor.businessId, status: 'COMPLETED', createdAt: { gte: start, lte: end } },
        select: { id: true, totalAmount: true, createdAt: true },
      }),
    ]);

    const available = (item: { quantityOnHand: number; reservedQuantity: number }) => Math.max(0, item.quantityOnHand - item.reservedQuantity);
    const summary = {
      stockValue: items.reduce((total, item) => total + Math.max(0, item.quantityOnHand) * Math.max(0, item.unitCost), 0),
      availableValue: items.reduce((total, item) => total + available(item) * Math.max(0, item.unitCost), 0),
      lowStockItems: items.filter((item) => available(item) <= item.lowStockThreshold).length,
      outOfStockItems: items.filter((item) => available(item) <= 0).length,
      reservedUnits: items.reduce((total, item) => total + item.reservedQuantity, 0),
      completedOrders: completedOrders.length,
      completedRevenue: completedOrders.reduce((total, order) => total + order.totalAmount, 0),
      restockedUnits: movements.filter((movement) => ['RESTOCK', 'INITIAL_STOCK'].includes(movement.type)).reduce((total, movement) => total + Math.max(0, movement.quantity), 0),
      soldUnits: movements.filter((movement) => movement.type === 'SALE').reduce((total, movement) => total + Math.abs(Math.min(0, movement.quantity)), 0),
      adjustedUnits: movements.filter((movement) => ['ADJUSTMENT', 'STOCK_COUNT'].includes(movement.type)).reduce((total, movement) => total + movement.quantity, 0),
    };

    const byType = movements.reduce<Record<string, number>>((result, movement) => {
      result[movement.type] = (result[movement.type] || 0) + movement.quantity;
      return result;
    }, {});

    const topUsed = Object.values(movements.filter((movement) => movement.type === 'SALE').reduce<Record<string, { name: string; unit: string; quantity: number }>>((result, movement) => {
      const key = movement.inventoryItem.id;
      result[key] = result[key] || { name: movement.inventoryItem.name, unit: movement.inventoryItem.unit, quantity: 0 };
      result[key].quantity += Math.abs(movement.quantity);
      return result;
    }, {})).sort((a, b) => b.quantity - a.quantity).slice(0, 10);

    const daily = movements.reduce<Record<string, { restocked: number; sold: number; adjusted: number }>>((result, movement) => {
      const day = startOfDay(movement.createdAt).toISOString().slice(0, 10);
      result[day] = result[day] || { restocked: 0, sold: 0, adjusted: 0 };
      if (['RESTOCK', 'INITIAL_STOCK'].includes(movement.type)) result[day].restocked += Math.max(0, movement.quantity);
      if (movement.type === 'SALE') result[day].sold += Math.abs(Math.min(0, movement.quantity));
      if (['ADJUSTMENT', 'STOCK_COUNT'].includes(movement.type)) result[day].adjusted += movement.quantity;
      return result;
    }, {});

    return NextResponse.json({
      range: { from: start.toISOString(), to: end.toISOString() },
      summary,
      byType,
      topUsed,
      daily: Object.entries(daily).map(([date, values]) => ({ date, ...values })),
      lowStock: items.filter((item) => available(item) <= item.lowStockThreshold).map((item) => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        available: available(item),
        threshold: item.lowStockThreshold,
        reorderQuantity: item.reorderQuantity,
        supplier: item.supplier?.name || item.supplierName || null,
      })),
    });
  } catch (error) {
    console.error('Inventory report GET error:', error);
    return NextResponse.json({ error: 'Unable to generate inventory report.' }, { status: 500 });
  }
}
