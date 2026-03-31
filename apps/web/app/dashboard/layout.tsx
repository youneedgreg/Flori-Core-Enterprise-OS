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

  if (!token) {
    redirect('/login');
  }

  return <DashboardShell token={token}>{children}</DashboardShell>;
}
