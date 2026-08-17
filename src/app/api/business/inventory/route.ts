import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getInventoryActor,
  inventoryErrorResponse,
  normalizeQuantity,
  isInventoryManager,
} from '@/lib/inventory';

function forbidden() {
  return NextResponse.json({ error: 'You do not have permission to perform this inventory action.' }, { status: 403 });
}

export async function GET(req: Request) {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const history = searchParams.get('history') === 'true';
    const itemId = searchParams.get('itemId') || undefined;

    if (history) {
      const movements = await prisma.inventoryMovement.findMany({
        where: { businessId: actor.businessId, ...(itemId ? { inventoryItemId: itemId } : {}) },
        include: { inventoryItem: { select: { name: true, unit: true } } },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
      return NextResponse.json(movements);
    }

    const items = await prisma.inventoryItem.findMany({
      where: { businessId: actor.businessId, isActive: true },
      include: { menuItem: { select: { id: true, name: true, price: true, isAvailable: true } } },
      orderBy: { name: 'asc' },
    });

    const totalItems = items.length;
    const lowStockItems = items.filter((item) => item.quantityOnHand - item.reservedQuantity <= item.lowStockThreshold).length;
    const outOfStockItems = items.filter((item) => item.quantityOnHand - item.reservedQuantity <= 0).length;
    const stockValue = items.reduce((total, item) => total + Math.max(0, item.quantityOnHand) * Math.max(0, item.unitCost), 0);
    const reorderSuggestions = items.filter((item) => item.quantityOnHand - item.reservedQuantity <= item.lowStockThreshold && item.reorderQuantity > 0).length;

    return NextResponse.json({
      items,
      stats: { totalItems, lowStockItems, outOfStockItems, reorderSuggestions, stockValue },
    });
  } catch (error) {
    console.error('Inventory GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const name = String(body?.name || '').trim();
    const unit = String(body?.unit || 'piece').trim() || 'piece';
    const quantity = normalizeQuantity(body?.quantityOnHand, 0);
    const lowStockThreshold = normalizeQuantity(body?.lowStockThreshold, 0);
    const unitCost = normalizeQuantity(body?.unitCost, 0);
    const reorderQuantity = normalizeQuantity(body?.reorderQuantity, 0);
    const supplierName = body?.supplierName ? String(body.supplierName).trim() : null;
    const supplierId = body?.supplierId ? String(body.supplierId) : null;
    const sku = body?.sku ? String(body.sku).trim() : null;
    const menuItemId = body?.menuItemId ? String(body.menuItemId) : null;
    const trackStock = body?.trackStock !== false;
    const inventoryCategory = String(body?.inventoryCategory || 'OTHER').trim().toUpperCase();
    const sellingPrice = normalizeQuantity(body?.sellingPrice, 0);
    const packSize = normalizeQuantity(body?.packSize, 1);
    const reorderEnabled = body?.reorderEnabled !== false;
    const isPerishable = body?.isPerishable === true;

    if (!name) return NextResponse.json({ error: 'Stock item name is required.' }, { status: 400 });
    if (quantity < 0 || lowStockThreshold < 0 || unitCost < 0 || reorderQuantity < 0 || sellingPrice < 0 || packSize <= 0) return NextResponse.json({ error: 'Quantities, prices, and pack size must be valid.' }, { status: 400 });

    if (supplierId) {
      const supplier = await prisma.inventorySupplier.findFirst({ where: { id: supplierId, businessId: actor.businessId } });
      if (!supplier) return NextResponse.json({ error: 'Supplier does not belong to this business.' }, { status: 400 });
    }

    if (menuItemId) {
      const menuItem = await prisma.menuItem.findFirst({
        where: { id: menuItemId, category: { businessId: actor.businessId } },
        select: { id: true, name: true },
      });
      if (!menuItem) return NextResponse.json({ error: 'Menu item does not belong to this business.' }, { status: 400 });

      const existingLink = await prisma.inventoryItem.findUnique({ where: { menuItemId } });
      if (existingLink) return NextResponse.json({ error: 'This menu item is already linked to inventory.' }, { status: 409 });
    }

    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.inventoryItem.create({
        data: {
          businessId: actor.businessId,
          menuItemId,
          supplierId,
          sku,
          name,
          unit,
          quantityOnHand: quantity,
          lowStockThreshold,
          reorderQuantity,
          unitCost,
          supplierName,
          inventoryCategory,
          sellingPrice,
          packSize,
          reorderEnabled,
          isPerishable,
          trackStock,
        },
        include: {
          menuItem: { select: { id: true, name: true, price: true, isAvailable: true } },
          supplier: { select: { id: true, name: true, phone: true } },
        },
      });

      if (quantity > 0) {
        await tx.inventoryMovement.create({
          data: {
            businessId: actor.businessId,
            inventoryItemId: created.id,
            type: 'INITIAL_STOCK',
            quantity,
            quantityBefore: 0,
            quantityAfter: quantity,
            reason: 'Initial stock recorded',
            actorId: actor.actorId,
            actorRole: actor.actorRole,
          },
        });
      }
      return created;
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('Inventory POST error:', error);
    if (error?.code === 'P2002') return NextResponse.json({ error: 'This menu item is already linked to inventory.' }, { status: 409 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const itemId = String(body?.itemId || '');
    const action = String(body?.action || '');
    if (!itemId) return NextResponse.json({ error: 'Inventory item id is required.' }, { status: 400 });

    const item = await prisma.inventoryItem.findFirst({ where: { id: itemId, businessId: actor.businessId, isActive: true } });
    if (!item) return NextResponse.json({ error: 'Inventory item not found.' }, { status: 404 });

    const inventorySettings = await prisma.inventorySettings.findUnique({ where: { businessId: actor.businessId } });
    if (actor.actorRole === 'manager' && action === 'restock' && inventorySettings?.managerCanRestock === false) return forbidden();
    if (actor.actorRole === 'manager' && action === 'adjust' && inventorySettings?.managerCanAdjust === false) return forbidden();

    if (action === 'settings' || action === 'register') {
      if (action === 'settings' && isInventoryManager(actor)) return forbidden();
      const name = String(body?.name ?? item.name).trim();
      const unit = String(body?.unit ?? item.unit).trim() || item.unit;
      const lowStockThreshold = normalizeQuantity(body?.lowStockThreshold, item.lowStockThreshold);
      const unitCost = normalizeQuantity(body?.unitCost, item.unitCost);
      const reorderQuantity = normalizeQuantity(body?.reorderQuantity, item.reorderQuantity);
      const supplierName = body?.supplierName === undefined ? item.supplierName : (body.supplierName ? String(body.supplierName).trim() : null);
      const supplierId = body?.supplierId === undefined ? item.supplierId : (body.supplierId ? String(body.supplierId) : null);
      const sku = body?.sku === undefined ? item.sku : (body.sku ? String(body.sku).trim() : null);
      const trackStock = body?.trackStock === undefined ? item.trackStock : Boolean(body.trackStock);
      const inventoryCategory = body?.inventoryCategory === undefined ? item.inventoryCategory : String(body.inventoryCategory).trim().toUpperCase();
      const sellingPrice = normalizeQuantity(body?.sellingPrice, item.sellingPrice);
      const packSize = normalizeQuantity(body?.packSize, item.packSize);
      const reorderEnabled = body?.reorderEnabled === undefined ? item.reorderEnabled : Boolean(body.reorderEnabled);
      const isPerishable = body?.isPerishable === undefined ? item.isPerishable : Boolean(body.isPerishable);
      if (!name || lowStockThreshold < 0 || unitCost < 0 || reorderQuantity < 0 || sellingPrice < 0 || packSize <= 0) return NextResponse.json({ error: 'Invalid inventory settings.' }, { status: 400 });
      if (supplierId) {
        const supplier = await prisma.inventorySupplier.findFirst({ where: { id: supplierId, businessId: actor.businessId } });
        if (!supplier) return NextResponse.json({ error: 'Supplier does not belong to this business.' }, { status: 400 });
      }

      const updated = await prisma.inventoryItem.update({
        where: { id: itemId },
        data: { name, unit, lowStockThreshold, reorderQuantity, unitCost, supplierName, supplierId, sku, inventoryCategory, sellingPrice, packSize, reorderEnabled, isPerishable, trackStock },
      });
      return NextResponse.json(updated);
    }

    const quantity = normalizeQuantity(body?.quantity, 0);
    if (!quantity || quantity < 0) return NextResponse.json({ error: 'A positive quantity is required.' }, { status: 400 });

    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentPeriod = await prisma.inventoryPeriod.findUnique({ where: { businessId_monthKey: { businessId: actor.businessId, monthKey: currentMonth } }, select: { status: true, monthKey: true } });
    if (currentPeriod?.status === 'CLOSED') return NextResponse.json({ error: `The ${currentPeriod.monthKey} inventory period is closed. Reopen it before posting stock movements.` }, { status: 409 });

    if (action === 'restock') {
      return NextResponse.json(await prisma.$transaction(async (tx) => {
        const current = await tx.inventoryItem.findUniqueOrThrow({ where: { id: itemId } });
        const updated = await tx.inventoryItem.update({
          where: { id: itemId },
          data: { quantityOnHand: { increment: quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            businessId: actor.businessId,
            inventoryItemId: itemId,
            type: 'RESTOCK',
            movementCategory: 'RECEIVED',
            quantity,
            quantityBefore: current.quantityOnHand,
            quantityAfter: current.quantityOnHand + quantity,
            reservedBefore: current.reservedQuantity,
            reservedAfter: current.reservedQuantity,
            reason: String(body?.reason || 'New stock received'),
            costValue: quantity * current.unitCost,
            periodKey: new Date().toISOString().slice(0, 7),
            actorId: actor.actorId,
            actorRole: actor.actorRole,
          },
        });
        return updated;
      }));
    }

    if (action === 'adjust') {
      const adjustment = Number(body?.adjustment);
      if (!Number.isFinite(adjustment) || adjustment === 0) return NextResponse.json({ error: 'Enter a non-zero adjustment.' }, { status: 400 });
      const nextQuantity = item.quantityOnHand + adjustment;
      if (nextQuantity < item.reservedQuantity) return NextResponse.json({ error: 'Quantity cannot be lower than currently reserved stock.' }, { status: 409 });

      return NextResponse.json(await prisma.$transaction(async (tx) => {
        const updated = await tx.inventoryItem.update({ where: { id: itemId }, data: { quantityOnHand: nextQuantity } });
        await tx.inventoryMovement.create({
          data: {
            businessId: actor.businessId,
            inventoryItemId: itemId,
            type: 'ADJUSTMENT',
            movementCategory: String(body?.movementCategory || 'RECONCILIATION').toUpperCase(),
            quantity: adjustment,
            quantityBefore: item.quantityOnHand,
            quantityAfter: nextQuantity,
            reservedBefore: item.reservedQuantity,
            reservedAfter: item.reservedQuantity,
            reason: String(body?.reason || 'Manual stock adjustment'),
            costValue: Math.abs(adjustment) * item.unitCost,
            periodKey: new Date().toISOString().slice(0, 7),
            actorId: actor.actorId,
            actorRole: actor.actorRole,
          },
        });
        return updated;
      }));
    }

    return NextResponse.json({ error: 'Unknown inventory action.' }, { status: 400 });
  } catch (error) {
    console.error('Inventory PATCH error:', error);
    const response = inventoryErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function DELETE(req: Request) {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (isInventoryManager(actor)) return forbidden();

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');
    if (!itemId) return NextResponse.json({ error: 'Inventory item id is required.' }, { status: 400 });

    const item = await prisma.inventoryItem.findFirst({ where: { id: itemId, businessId: actor.businessId, isActive: true } });
    if (!item) return NextResponse.json({ error: 'Inventory item not found.' }, { status: 404 });
    if (item.reservedQuantity > 0) return NextResponse.json({ error: 'This item has reserved stock and cannot be archived yet.' }, { status: 409 });

    const updated = await prisma.inventoryItem.update({ where: { id: itemId }, data: { isActive: false } });
    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error('Inventory DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
