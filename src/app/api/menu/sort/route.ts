import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/route';

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, items, businessSlug } = await request.json();

    // Verify ownership
    if ((session.user as any).slug !== businessSlug) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (type === 'categories') {
      // Update categories sortOrder
      await Promise.all(
        items.map((item: { id: string; sortOrder: number }) =>
          prisma.category.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
          })
        )
      );
    } else if (type === 'items') {
      // Update items sortOrder
      await Promise.all(
        items.map((item: { id: string; sortOrder: number }) =>
          prisma.menuItem.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
          })
        )
      );
    }

    return NextResponse.json({ message: 'Sorting updated' }, { status: 200 });
  } catch (error: any) {
    console.error('Sorting update failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
