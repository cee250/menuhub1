import { NextResponse } from 'next/server';
import { SUPER_ADMIN_COOKIE } from '@/lib/super-admin';

export async function POST() {
  const response = NextResponse.json({ ok: true, message: 'Logged out.' });
  response.cookies.set(SUPER_ADMIN_COOKIE, '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
