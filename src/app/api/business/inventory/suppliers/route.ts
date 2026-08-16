import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getInventoryActor } from '@/lib/inventory';

export async function GET() {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const suppliers = await prisma.inventorySupplier.findMany({
      where: { businessId: actor.businessId },
      include: { _count: { select: { items: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Inventory suppliers GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const name = String(body?.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Supplier name is required.' }, { status: 400 });

    const supplier = await prisma.inventorySupplier.create({
      data: {
        businessId: actor.businessId,
        name,
        phone: body?.phone ? String(body.phone).trim() : null,
        email: body?.email ? String(body.email).trim() : null,
        notes: body?.notes ? String(body.notes).trim() : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        businessId: actor.businessId,
        actor: `${actor.actorRole}:${actor.actorId}`,
        action: 'INVENTORY_SUPPLIER_CREATED',
        details: JSON.stringify({ supplierId: supplier.id, name: supplier.name }),
      },
    });
    return NextResponse.json(supplier, { status: 201 });
  } catch (error: any) {
    console.error('Inventory suppliers POST error:', error);
    if (error?.code === 'P2002') return NextResponse.json({ error: 'A supplier with this name already exists.' }, { status: 409 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const id = String(body?.id || '');
    const name = String(body?.name || '').trim();
    if (!id || !name) return NextResponse.json({ error: 'Supplier id and name are required.' }, { status: 400 });

    const existing = await prisma.inventorySupplier.findFirst({ where: { id, businessId: actor.businessId } });
    if (!existing) return NextResponse.json({ error: 'Supplier not found.' }, { status: 404 });

    const supplier = await prisma.inventorySupplier.update({
      where: { id },
      data: {
        name,
        phone: body?.phone ? String(body.phone).trim() : null,
        email: body?.email ? String(body.email).trim() : null,
        notes: body?.notes ? String(body.notes).trim() : null,
      },
    });
    return NextResponse.json(supplier);
  } catch (error: any) {
    console.error('Inventory suppliers PATCH error:', error);
    if (error?.code === 'P2002') return NextResponse.json({ error: 'A supplier with this name already exists.' }, { status: 409 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const actor = await getInventoryActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (actor.actorRole !== 'owner') return NextResponse.json({ error: 'Only the owner can remove suppliers.' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Supplier id is required.' }, { status: 400 });

    const existing = await prisma.inventorySupplier.findFirst({ where: { id, businessId: actor.businessId } });
    if (!existing) return NextResponse.json({ error: 'Supplier not found.' }, { status: 404 });

    await prisma.inventorySupplier.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Inventory suppliers DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
