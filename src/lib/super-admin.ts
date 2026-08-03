import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createHmac, timingSafeEqual } from 'crypto';

export const SUPER_ADMIN_COOKIE = 'menuhub_super_admin';

function sessionSecret() {
  return process.env.SUPER_ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET || null;
}

export function createSuperAdminSessionToken() {
  const secret = sessionSecret();
  if (!secret) return null;

  const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
  const signature = createHmac('sha256', secret).update(String(expiresAt)).digest('hex');
  return `${expiresAt}.${signature}`;
}

export function isValidSuperAdminSessionToken(value?: string) {
  const secret = sessionSecret();
  if (!secret || !value) return false;

  const [expiresAt, signature] = value.split('.');
  if (!expiresAt || !signature || !/^\d+$/.test(expiresAt) || Number(expiresAt) < Date.now()) return false;

  const expected = createHmac('sha256', secret).update(expiresAt).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

export async function getSuperAdminConfig() {
  const saved = await prisma.superAdminSettings.findFirst();
  const email = saved?.email || process.env.SUPER_ADMIN_EMAIL;
  const password = saved?.password || process.env.SUPER_ADMIN_PASSWORD_HASH;
  return { email, password };
}

export async function isValidSuperAdminCredentials(email?: string | null, password?: string | null) {
  const config = await getSuperAdminConfig();
  if (!config.email || !config.password || !password) return false;
  const matchesPassword = await bcrypt.compare(String(password), config.password).catch(() => false);
  return (
    email?.trim().toLowerCase() === config.email.trim().toLowerCase() &&
    matchesPassword
  );
}

export async function isSuperAdminSessionActive() {
  const cookieStore = await cookies();
  return isValidSuperAdminSessionToken(cookieStore.get(SUPER_ADMIN_COOKIE)?.value);
}
