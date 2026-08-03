import { NextRequest, NextResponse } from 'next/server';
import { createSuperAdminSessionToken, isValidSuperAdminCredentials, SUPER_ADMIN_COOKIE } from '@/lib/super-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body || {};

    if (!(await isValidSuperAdminCredentials(email, password))) {
      return NextResponse.json({ error: 'Invalid super admin credentials.' }, { status: 401 });
    }

    const sessionToken = createSuperAdminSessionToken();
    if (!sessionToken) {
      return NextResponse.json({ error: 'Super admin session is not configured.' }, { status: 503 });
    }

    const response = NextResponse.json({ ok: true, message: 'Authenticated successfully.' });
    response.cookies.set(SUPER_ADMIN_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error('Super admin login failed:', error);
    return NextResponse.json({ error: 'Unable to authenticate super admin.' }, { status: 500 });
  }
}
