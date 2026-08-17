import { redirect } from 'next/navigation';
import { isAdminSession } from '@/lib/adminAuth';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isAdminSession()) {
    redirect('/admin/login');
  }
  return <div className="min-h-screen bg-bg">{children}</div>;
}
