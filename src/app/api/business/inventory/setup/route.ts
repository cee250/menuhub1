import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getInventoryActor } from '@/lib/inventory';

export async function GET() {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [menuItems, inventoryItems, settings] = await Promise.all([
      prisma.menuItem.findMany({ where: { category: { businessId: actor.businessId } }, select: { id: true } }),
      prisma.inventoryItem.findMany({ where: { businessId: actor.businessId, isActive: true }, select: { menuItemId: true } }),
      prisma.inventorySettings.upsert({ where: { businessId: actor.businessId }, create: { businessId: actor.businessId }, update: {} }),
    ]);
    const linkedMenuItemIds = new Set(inventoryItems.map((item) => item.menuItemId).filter(Boolean));
    const unlinkedMenuItems = menuItems.filter((item) => !linkedMenuItemIds.has(item.id)).length;

    return NextResponse.json({
      menuItems: menuItems.length,
      inventoryItems: inventoryItems.length,
      unlinkedMenuItems,
      settings,
      isComplete: unlinkedMenuItems === 0,
    });
  } catch (error) {
    console.error('Inventory setup GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (actor.actorRole !== 'owner') return NextResponse.json({ error: 'Only the owner can run inventory setup.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const inventoryMode = String(body?.inventoryMode || 'SIMPLE').toUpperCase();
    const defaultUnit = String(body?.defaultUnit || 'piece').trim() || 'piece';
    const selectedMenuItemIds = Array.isArray(body?.menuItemIds) ? body.menuItemIds.map(String) : [];

    if (!['SIMPLE', 'PACKAGED', 'MANUAL'].includes(inventoryMode)) {
      return NextResponse.json({ error: 'Invalid inventory mode.' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const menuItems = await tx.menuItem.findMany({
        where: {
          category: { businessId: actor.businessId },
          ...(selectedMenuItemIds.length ? { id: { in: selectedMenuItemIds } } : {}),
        },
        select: { id: true, name: true, mainCategory: true },
        orderBy: { name: 'asc' },
      });
      const existing = await tx.inventoryItem.findMany({
        where: { businessId: actor.businessId, menuItemId: { not: null } },
        select: { menuItemId: true },
      });
      const existingIds = new Set(existing.map((item) => item.menuItemId));
      const toCreate = menuItems.filter((item) => !existingIds.has(item.id));

      let createdCount = 0;
      if (toCreate.length > 0) {
        const created = await tx.inventoryItem.createMany({
          data: toCreate.map((menuItem) => ({
            businessId: actor.businessId,
            menuItemId: menuItem.id,
            name: menuItem.name,
            unit: defaultUnit,
            inventoryCategory: menuItem.mainCategory.toUpperCase().includes('DRINK') ? 'DRINK' : 'FOOD',
            trackStock: inventoryMode !== 'MANUAL',
          })),
          skipDuplicates: true,
        });
        createdCount = created.count;
      }

      const settings = await tx.inventorySettings.upsert({
        where: { businessId: actor.businessId },
        create: {
          businessId: actor.businessId,
          inventoryMode,
          defaultUnit,
          autoHideOutOfStock: body?.autoHideOutOfStock === true,
          lowStockNotifications: body?.lowStockNotifications !== false,
          managerCanRestock: body?.managerCanRestock !== false,
          managerCanAdjust: body?.managerCanAdjust !== false,
        },
        update: {
          inventoryMode,
          defaultUnit,
          autoHideOutOfStock: body?.autoHideOutOfStock === true,
          lowStockNotifications: body?.lowStockNotifications !== false,
          managerCanRestock: body?.managerCanRestock !== false,
          managerCanAdjust: body?.managerCanAdjust !== false,
        },
      });

      return { created: createdCount, existing: existingIds.size, settings };
    }, { maxWait: 10000, timeout: 30000 });

    await prisma.auditLog.create({
      data: {
        businessId: actor.businessId,
        actor: `${actor.actorRole}:${actor.actorId}`,
        action: 'INVENTORY_SETUP_COMPLETED',
        details: JSON.stringify(result),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Inventory setup POST error:', error);
    return NextResponse.json({ error: 'Inventory setup could not be completed.' }, { status: 500 });
  }
}
