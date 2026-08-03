import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHmac, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';

const RESET_TOKEN_SECRET = process.env.NEXTAUTH_SECRET || 'my-super-secret-menuhub-key-12345';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body || {};

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required.' }, { status: 400 });
    }

    if (String(password).length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    // Decode and verify token
    const [encodedData, signature] = token.split('.');
    if (!encodedData || !signature) {
      return NextResponse.json({ error: 'Invalid token format.' }, { status: 400 });
    }

    const data = Buffer.from(encodedData, 'base64').toString();
    const [slug, expiresAt] = data.split(':');

    if (!slug || !expiresAt || Number(expiresAt) < Date.now()) {
      return NextResponse.json({ error: 'Token has expired.' }, { status: 400 });
    }

    const expectedSig = createHmac('sha256', RESET_TOKEN_SECRET).update(data).digest('hex');
    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSig, 'hex');
    
    if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 400 });
    }

    // Find and update business
    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) {
      return NextResponse.json({ error: 'Business not found.' }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    await prisma.business.update({
      where: { slug },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password.' }, { status: 500 });
  }
}
