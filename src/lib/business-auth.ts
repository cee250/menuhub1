import { auth } from '@/lib/auth/route';

/** Returns whether the signed-in business owns the supplied slug. */
export async function canAccessBusiness(slug: string | null | undefined) {
  if (!slug) return false;

  const session = await auth();
  return Boolean(session?.user && (session.user as { slug?: string }).slug === slug);
}
