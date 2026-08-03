import { redirect } from 'next/navigation';
import { isSuperAdminSessionActive } from '@/lib/super-admin';
import SuperAdminPanel from '@/components/SuperAdminPanel';

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
  const isAuthenticated = await isSuperAdminSessionActive();

  if (!isAuthenticated) {
    redirect('/super-admin/login');
  }

  return <SuperAdminPanel />;
}
