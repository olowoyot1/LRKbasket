'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  const tabs = [
    { href: '/admin', label: 'Products' },
    { href: '/admin/bundles', label: 'Bundles' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/settings', label: 'Settings' },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
      <div className="flex items-center gap-1 bg-cream rounded-full p-1 overflow-x-auto max-w-full">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-4 py-2 rounded-full text-sm font-medium flex-none whitespace-nowrap ${
                active ? 'bg-purple text-cream' : 'text-ink/60'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
      <div className="flex gap-3">
        <a href="/" className="text-sm text-ink/55 self-center">
          View store →
        </a>
        <button onClick={logout} className="text-sm border border-ink/20 rounded-full px-4 py-2">
          Sign out
        </button>
      </div>
    </div>
  );
}
