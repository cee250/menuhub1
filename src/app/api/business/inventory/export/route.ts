import { prisma } from '@/lib/prisma';
import { getInventoryActor } from '@/lib/inventory';

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const actor = await getInventoryActor();
  if (!actor) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  const items = await prisma.inventoryItem.findMany({
    where: { businessId: actor.businessId, isActive: true },
    include: { supplier: { select: { name: true } }, menuItem: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  });

  const headers = ['name', 'sku', 'unit', 'inventoryCategory', 'quantityOnHand', 'reservedQuantity', 'availableQuantity', 'lowStockThreshold', 'reorderQuantity', 'unitCost', 'sellingPrice', 'packSize', 'reorderEnabled', 'isPerishable', 'supplierName', 'menuItemId', 'menuItemName', 'trackStock'];
  const rows = items.map((item) => [
    item.name,
    item.sku,
    item.unit,
    item.inventoryCategory,
    item.quantityOnHand,
    item.reservedQuantity,
    Math.max(0, item.quantityOnHand - item.reservedQuantity),
    item.lowStockThreshold,
    item.reorderQuantity,
    item.unitCost,
    item.sellingPrice,
    item.packSize,
    item.reorderEnabled,
    item.isPerishable,
    item.supplier?.name || item.supplierName,
    item.menuItem?.id,
    item.menuItem?.name,
    item.trackStock,
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');

  return new Response(`${csv}\n`, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="menuhub-inventory-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
