'use client';

import { useEffect, useState } from 'react';
import AdminNav from './AdminNav';
import { formatNaira } from '@/types';

type OrderItem = { id: string; name: string; price: number; qty: number };
type Order = {
  id: string;
  reference: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'PENDING' | 'PAID' | 'FAILED';
  channel: 'PAYSTACK' | 'WHATSAPP';
  createdAt: string;
  items: OrderItem[];
};

const STATUS_STYLES: Record<Order['status'], string> = {
  PAID: 'bg-yellow/25 text-yellowDark',
  PENDING: 'bg-ink/8 text-ink/60',
  FAILED: 'bg-tomato/15 text-tomato',
};

const CHANNEL_LABEL: Record<Order['channel'], string> = {
  PAYSTACK: 'Paystack',
  WHATSAPP: 'WhatsApp',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AdminOrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | Order['status']>('ALL');
  const [updating, setUpdating] = useState<string | null>(null);

  async function loadOrders(targetPage: number, targetFilter: typeof filter) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(targetPage) });
      if (targetFilter !== 'ALL') params.set('status', targetFilter);
      const res = await fetch(`/api/admin/orders?${params}`);
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data.orders);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders(page, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  function changeFilter(f: typeof filter) {
    setFilter(f);
    setPage(1);
  }

  async function updateStatus(id: string, status: Order['status']) {
    setUpdating(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order');
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-7 py-10">
      <div className="mb-2">
        <h1 className="font-display text-2xl font-semibold">Admin</h1>
        <p className="text-ink/55 text-sm mt-1">LRK Basket — {total} orders total</p>
      </div>
      <AdminNav />

      <div className="flex gap-2 mb-6">
        {(['ALL', 'PENDING', 'PAID', 'FAILED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => changeFilter(f)}
            className={`text-xs font-medium px-3.5 py-1.5 rounded-full border ${
              filter === f ? 'bg-ink text-bg border-ink' : 'border-ink/15 text-ink/60'
            }`}
          >
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {error && <p className="text-tomato text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-ink/50 text-sm">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="text-ink/50 text-sm py-10 text-center">No orders here yet.</p>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => {
            const isOpen = expanded === o.id;
            return (
              <div key={o.id} className="bg-white rounded-xl border border-ink/10 overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                  className="w-full flex items-center gap-4 px-4 py-3 text-left"
                >
                  <span className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full flex-none ${STATUS_STYLES[o.status]}`}>
                    {o.status}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{o.customerName}</div>
                    <div className="text-xs text-ink/50 font-mono truncate">{o.reference}</div>
                  </div>
                  <span className="text-xs text-ink/45 flex-none hidden sm:block">{CHANNEL_LABEL[o.channel]}</span>
                  <span className="text-xs text-ink/45 flex-none hidden sm:block">{formatDate(o.createdAt)}</span>
                  <span className="font-mono text-sm w-24 text-right flex-none">{formatNaira(o.total)}</span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-dashed border-ink/15">
                    <div className="grid sm:grid-cols-2 gap-4 text-xs text-ink/60 mb-4 mt-3">
                      <div>
                        <div className="font-semibold text-ink/80 mb-1">Contact</div>
                        <div>{o.email}</div>
                        <div>{o.phone}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-ink/80 mb-1">Delivery address</div>
                        <div>{o.address}</div>
                      </div>
                    </div>

                    <div className="bg-cream rounded-lg p-3.5 mb-4">
                      {o.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm py-1">
                          <span>
                            {item.name} × {item.qty}
                          </span>
                          <span className="font-mono">{formatNaira(item.price * item.qty)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-semibold pt-2 mt-1 border-t border-dashed border-ink/20">
                        <span>Total</span>
                        <span className="font-mono">{formatNaira(o.total)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {o.status !== 'PAID' && (
                        <button
                          onClick={() => updateStatus(o.id, 'PAID')}
                          disabled={updating === o.id}
                          className="text-xs bg-purple text-cream rounded-lg px-3 py-2 font-semibold disabled:opacity-50"
                        >
                          Mark as paid
                        </button>
                      )}
                      {o.status !== 'FAILED' && (
                        <button
                          onClick={() => updateStatus(o.id, 'FAILED')}
                          disabled={updating === o.id}
                          className="text-xs border border-tomato/30 text-tomato rounded-lg px-3 py-2 disabled:opacity-50"
                        >
                          Mark as failed
                        </button>
                      )}
                      {o.status !== 'PENDING' && (
                        <button
                          onClick={() => updateStatus(o.id, 'PENDING')}
                          disabled={updating === o.id}
                          className="text-xs border border-ink/20 text-ink/60 rounded-lg px-3 py-2 disabled:opacity-50"
                        >
                          Reset to pending
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-xs border border-ink/20 rounded-lg px-3 py-1.5 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-xs text-ink/50">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-xs border border-ink/20 rounded-lg px-3 py-1.5 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
