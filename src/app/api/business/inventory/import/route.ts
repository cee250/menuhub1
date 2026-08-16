import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getInventoryActor } from '@/lib/inventory';

function parseCsvLine(line: string) {
  const values: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += char;
    }
  }
  values.push(value.trim());
  return values;
}

function parseNumber(value: unknown, fallback: number) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function POST(req: Request) {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (actor.actorRole !== 'owner') return NextResponse.json({ error: 'Only the owner can import inventory.' }, { status: 403 });

    const contentType = req.headers.get('content-type') || '';
    const bodyText = contentType.includes('application/json') ? String((await req.json())?.csv || '') : await req.text();
    const lines = bodyText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) return NextResponse.json({ error: 'Upload a CSV with a header row and at least one inventory row.' }, { status: 400 });

    const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase().replace(/\s+/g, ''));
    const rows = lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      return headers.reduce<Record<string, string>>((result, header, index) => {
        result[header] = values[index] || '';
        return result;
      }, {});
    });

    const result = await prisma.$transaction(async (tx) => {
      let created = 0;
      let updated = 0;
      const errors: Array<{ row: number; error: string }> = [];

      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const rowNumber = index + 2;
        const name = String(row.name || '').trim();
        if (!name) {
          errors.push({ row: rowNumber, error: 'name is required' });
          continue;
        }

        const menuItemId = row.menuitemid || row.menuitem || null;
        if (menuItemId) {
          const menuItem = await tx.menuItem.findFirst({ where: { id: menuItemId, category: { businessId: actor.businessId } }, select: { id: true } });
          if (!menuItem) {
            errors.push({ row: rowNumber, error: 'menuItemId does not belong to this business' });
            continue;
          }
        }

        const quantity = parseNumber(row.quantityonhand, 0);
        const lowStockThreshold = parseNumber(row.lowstockthreshold, 0);
        const reorderQuantity = parseNumber(row.reorderquantity, 0);
        const unitCost = parseNumber(row.unitcost, 0);
        if ([quantity, lowStockThreshold, reorderQuantity, unitCost].some((value) => value < 0)) {
          errors.push({ row: rowNumber, error: 'quantities and cost cannot be negative' });
          continue;
        }

        const sku = row.sku || null;
        const existing = menuItemId
          ? await tx.inventoryItem.findFirst({ where: { businessId: actor.businessId, menuItemId } })
          : sku
            ? await tx.inventoryItem.findFirst({ where: { businessId: actor.businessId, sku } })
            : await tx.inventoryItem.findFirst({ where: { businessId: actor.businessId, name } });

        let supplierId: string | null = null;
        const supplierName = row.suppliername || null;
        if (supplierName) {
          const supplier = await tx.inventorySupplier.findFirst({ where: { businessId: actor.businessId, name: supplierName } });
          supplierId = supplier?.id || (await tx.inventorySupplier.create({ data: { businessId: actor.businessId, name: supplierName } })).id;
        }

        const trackStock = !['false', '0', 'no'].includes(String(row.trackstock || 'true').toLowerCase());
        const unit = row.unit || 'piece';
        const reservedQuantity = existing?.reservedQuantity || 0;
        if (existing && quantity < reservedQuantity) {
          errors.push({ row: rowNumber, error: `quantity cannot be below reserved quantity (${reservedQuantity})` });
          continue;
        }

        if (existing) {
          const quantityDelta = quantity - existing.quantityOnHand;
          await tx.inventoryItem.update({
            where: { id: existing.id },
            data: {
              name,
              sku,
              unit,
              quantityOnHand: quantity,
              lowStockThreshold,
              reorderQuantity,
              unitCost,
              supplierId,
              supplierName,
              trackStock,
            },
          });
          if (quantityDelta !== 0) {
            await tx.inventoryMovement.create({
              data: {
                businessId: actor.businessId,
                inventoryItemId: existing.id,
                type: 'IMPORT',
                quantity: quantityDelta,
                quantityBefore: existing.quantityOnHand,
                quantityAfter: quantity,
                reservedBefore: existing.reservedQuantity,
                reservedAfter: existing.reservedQuantity,
                reason: 'Inventory CSV import',
                actorId: actor.actorId,
                actorRole: actor.actorRole,
              },
            });
          }
          updated += 1;
        } else {
          const item = await tx.inventoryItem.create({
            data: {
              businessId: actor.businessId,
              menuItemId,
              sku,
              name,
              unit,
              quantityOnHand: quantity,
              lowStockThreshold,
              reorderQuantity,
              unitCost,
              supplierId,
              supplierName,
              trackStock,
            },
          });
          await tx.inventoryMovement.create({
            data: {
              businessId: actor.businessId,
              inventoryItemId: item.id,
              type: 'IMPORT',
              quantity,
              quantityBefore: 0,
              quantityAfter: quantity,
              reason: 'Inventory CSV import',
              actorId: actor.actorId,
              actorRole: actor.actorRole,
            },
          });
          created += 1;
        }
      }
      return { created, updated, errors };
    });

    await prisma.auditLog.create({
      data: {
        businessId: actor.businessId,
        actor: `${actor.actorRole}:${actor.actorId}`,
        action: 'INVENTORY_CSV_IMPORTED',
        details: JSON.stringify({ created: result.created, updated: result.updated, errors: result.errors.length }),
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Inventory import POST error:', error);
    return NextResponse.json({ error: 'Inventory import could not be completed.' }, { status: 500 });
  }
}
