import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidSuperAdminSessionToken } from '@/lib/super-admin';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!isValidSuperAdminSessionToken(request.cookies.get('menuhub_super_admin')?.value)) return unauthorized();

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { business: { select: { id: true, name: true, slug: true } } },
  });

  return NextResponse.json(logs);
}
