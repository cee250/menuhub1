import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { canAccessBusiness } from '@/lib/business-auth';

export async function PUT(request: NextRequest) {
  try {
    const { slug, currentPassword, newPassword } = await request.json();

    if (!slug || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!(await canAccessBusiness(slug))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business || !business.password) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, business.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.business.update({
      where: { slug },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
