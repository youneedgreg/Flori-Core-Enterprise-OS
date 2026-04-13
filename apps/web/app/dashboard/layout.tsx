import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardShell from '../../components/dashboard/DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (!token && !refreshToken) {
    redirect('/login');
  }

  return <DashboardShell token={token || ''}>{children}</DashboardShell>;
}
