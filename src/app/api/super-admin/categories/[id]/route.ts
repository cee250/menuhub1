import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidSuperAdminSessionToken } from '@/lib/super-admin';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isValidSuperAdminSessionToken(request.cookies.get('menuhub_super_admin')?.value)) return unauthorized();

  try {
    const { id } = await params;
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true, message: 'Category removed.' });
  } catch (error) {
    console.error('Super admin category delete failed:', error);
    return NextResponse.json({ error: 'Could not delete category.' }, { status: 500 });
  }
}
