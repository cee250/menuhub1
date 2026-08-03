import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidSuperAdminSessionToken } from '@/lib/super-admin';
import bcrypt from 'bcryptjs';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
}

function initialSettings() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD_HASH;
  return email && password ? { email, password } : null;
}

export async function GET(request: NextRequest) {
  if (!isValidSuperAdminSessionToken(request.cookies.get('menuhub_super_admin')?.value)) return unauthorized();

  let settings = await prisma.superAdminSettings.findFirst();
  if (!settings) {
    const initial = initialSettings();
    if (!initial) return NextResponse.json({ error: 'Super admin credentials are not configured.' }, { status: 503 });
    settings = await prisma.superAdminSettings.create({ data: initial });
  }

  return NextResponse.json({
    email: settings.email,
  });
}

export async function PATCH(request: NextRequest) {
  if (!isValidSuperAdminSessionToken(request.cookies.get('menuhub_super_admin')?.value)) return unauthorized();

  try {
    const body = await request.json();
    const { email, password } = body || {};

    let settings = await prisma.superAdminSettings.findFirst();
    if (!settings) {
      const initial = initialSettings();
      if (!initial) return NextResponse.json({ error: 'Super admin credentials are not configured.' }, { status: 503 });
      settings = await prisma.superAdminSettings.create({ data: initial });
    }

    const updateData: Record<string, string> = {};
    if (email) updateData.email = String(email).trim().toLowerCase();
    if (password) updateData.password = await bcrypt.hash(String(password), 10);

    const updated = await prisma.superAdminSettings.update({
      where: { id: settings.id },
      data: updateData,
    });

    return NextResponse.json({ email: updated.email });
  } catch (error) {
    console.error('Super admin settings update failed:', error);
    return NextResponse.json({ error: 'Could not update super admin credentials.' }, { status: 500 });
  }
}
