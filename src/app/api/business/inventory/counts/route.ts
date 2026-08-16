import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getInventoryActor } from '@/lib/inventory';

export async function GET() {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const counts = await prisma.inventoryCount.findMany({
      where: { businessId: actor.businessId },
      include: {
        lines: {
          include: { inventoryItem: { select: { id: true, name: true, unit: true, reservedQuantity: true } } },
          orderBy: { inventoryItem: { name: 'asc' } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json(counts);
  } catch (error) {
    console.error('Inventory counts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const requestedIds = Array.isArray(body?.inventoryItemIds) ? body.inventoryItemIds.map(String) : [];
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        businessId: actor.businessId,
        isActive: true,
        ...(requestedIds.length ? { id: { in: requestedIds } } : {}),
      },
      orderBy: { name: 'asc' },
    });

    if (!inventoryItems.length) return NextResponse.json({ error: 'Add stock items before starting a stock count.' }, { status: 400 });

    const count = await prisma.inventoryCount.create({
      data: {
        businessId: actor.businessId,
        note: body?.note ? String(body.note).trim() : null,
        createdById: actor.actorId,
        lines: {
          create: inventoryItems.map((item) => ({
            inventoryItemId: item.id,
            expectedQuantity: item.quantityOnHand,
          })),
        },
      },
      include: {
        lines: { include: { inventoryItem: { select: { id: true, name: true, unit: true, reservedQuantity: true } } } },
      },
    });

    return NextResponse.json(count, { status: 201 });
  } catch (error) {
    console.error('Inventory counts POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const countId = String(body?.countId || '');
    const action = String(body?.action || '').toLowerCase();
    if (!countId || !['save', 'complete', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'A valid count id and action are required.' }, { status: 400 });
    }

    const count = await prisma.inventoryCount.findFirst({
      where: { id: countId, businessId: actor.businessId },
      include: { lines: { include: { inventoryItem: true } } },
    });
    if (!count) return NextResponse.json({ error: 'Stock count not found.' }, { status: 404 });
    if (count.status !== 'DRAFT') return NextResponse.json({ error: 'This stock count is already closed.' }, { status: 409 });

    if (action === 'cancel') {
      const cancelled = await prisma.inventoryCount.update({ where: { id: countId }, data: { status: 'CANCELLED' } });
      return NextResponse.json(cancelled);
    }

    if (action === 'save') {
      const inputLines = Array.isArray(body?.lines) ? body.lines : [body];
      const lineMap = new Map<string, { countedQuantity?: unknown; reason?: unknown }>(inputLines.map((line: any) => [String(line?.inventoryItemId || ''), line] as [string, { countedQuantity?: unknown; reason?: unknown }]));
      const updates = [];
      for (const line of count.lines) {
        const input = lineMap.get(line.inventoryItemId);
        if (!input || input.countedQuantity === undefined || input.countedQuantity === '') continue;
        const countedQuantity = Number(input.countedQuantity);
        if (!Number.isFinite(countedQuantity) || countedQuantity < 0) {
          return NextResponse.json({ error: `Invalid count for ${line.inventoryItem.name}.` }, { status: 400 });
        }
        updates.push(prisma.inventoryCountLine.update({
          where: { id: line.id },
          data: {
            countedQuantity,
            variance: countedQuantity - line.expectedQuantity,
            reason: input.reason ? String(input.reason).trim() : null,
          },
        }));
      }
      await prisma.$transaction(updates);
      const refreshed = await prisma.inventoryCount.findUnique({ where: { id: countId }, include: { lines: { include: { inventoryItem: true } } } });
      return NextResponse.json(refreshed);
    }

    const incomplete = count.lines.find((line) => line.countedQuantity === null);
    if (incomplete) return NextResponse.json({ error: `Enter a physical count for ${incomplete.inventoryItem.name} before completing.` }, { status: 400 });

    const completed = await prisma.$transaction(async (tx) => {
      for (const line of count.lines) {
        const countedQuantity = Number(line.countedQuantity);
        const item = await tx.inventoryItem.findUniqueOrThrow({ where: { id: line.inventoryItemId } });
        if (countedQuantity < item.reservedQuantity) {
          throw new Error(`${item.name} cannot be counted below its reserved quantity of ${item.reservedQuantity}.`);
        }
        const variance = countedQuantity - item.quantityOnHand;
        if (variance !== 0) {
          await tx.inventoryItem.update({
            where: { id: item.id },
            data: { quantityOnHand: countedQuantity, lastCountedAt: new Date() },
          });
          await tx.inventoryMovement.create({
            data: {
              businessId: actor.businessId,
              inventoryItemId: item.id,
              type: 'STOCK_COUNT',
              quantity: variance,
              quantityBefore: item.quantityOnHand,
              quantityAfter: countedQuantity,
              reservedBefore: item.reservedQuantity,
              reservedAfter: item.reservedQuantity,
              reason: line.reason || 'Physical stock count',
              referenceId: countId,
              actorId: actor.actorId,
              actorRole: actor.actorRole,
            },
          });
        } else {
          await tx.inventoryItem.update({ where: { id: item.id }, data: { lastCountedAt: new Date() } });
        }
      }
      return tx.inventoryCount.update({
        where: { id: countId },
        data: { status: 'COMPLETED', completedAt: new Date(), completedById: actor.actorId },
        include: { lines: { include: { inventoryItem: true } } },
      });
    });

    await prisma.auditLog.create({
      data: {
        businessId: actor.businessId,
        actor: `${actor.actorRole}:${actor.actorId}`,
        action: 'INVENTORY_COUNT_COMPLETED',
        details: JSON.stringify({ countId }),
      },
    });
    return NextResponse.json(completed);
  } catch (error: any) {
    console.error('Inventory counts PATCH error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
