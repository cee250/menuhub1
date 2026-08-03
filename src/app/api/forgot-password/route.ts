import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHmac } from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

const RESET_TOKEN_SECRET = process.env.NEXTAUTH_SECRET || 'my-super-secret-menuhub-key-12345';

function createResetToken(slug: string) {
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
  const data = `${slug}:${expiresAt}`;
  const signature = createHmac('sha256', RESET_TOKEN_SECRET).update(data).digest('hex');
  return `${Buffer.from(data).toString('base64')}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body || {};

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    // Find business by email
    const business = await prisma.business.findFirst({
      where: { email: String(email).trim().toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!business) {
      return NextResponse.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    const resetToken = createResetToken(business.slug);
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    await sendPasswordResetEmail(business.email!, resetLink);

    return NextResponse.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  
  if (!token) {
    return NextResponse.json({ valid: false, error: 'No token provided.' });
  }

  try {
    const [encodedData, signature] = token.split('.');
    if (!encodedData || !signature) {
      return NextResponse.json({ valid: false, error: 'Invalid token format.' });
    }

    const data = Buffer.from(encodedData, 'base64').toString();
    const [slug, expiresAt] = data.split(':');
    
    if (!slug || !expiresAt || Number(expiresAt) < Date.now()) {
      return NextResponse.json({ valid: false, error: 'Token expired.' });
    }

    const expectedSig = createHmac('sha256', RESET_TOKEN_SECRET).update(data).digest('hex');
    if (signature !== expectedSig) {
      return NextResponse.json({ valid: false, error: 'Invalid token.' });
    }

    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) {
      return NextResponse.json({ valid: false, error: 'Business not found.' });
    }

    return NextResponse.json({ valid: true, slug: business.slug, name: business.name });
  } catch (error) {
    return NextResponse.json({ valid: false, error: 'Invalid token.' });
  }
}
