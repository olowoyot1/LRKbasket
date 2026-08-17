'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { formatNaira } from '@/types';
import { buildWhatsAppOrderLink } from '@/lib/whatsapp';

type LoadingState = 'idle' | 'paystack' | 'whatsapp';

export default function CheckoutPage() {
  const { lines, subtotal, deliveryFee, total, clearCart } = useCart();
  const [form, setForm] = useState({ customerName: '', email: '', phone: '', address: '' });
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function validate(): boolean {
    if (!form.customerName || !form.email || !form.phone || !form.address) {
      setError('Fill in every field before continuing.');
      return false;
    }
    return true;
  }

  async function payWithPaystack() {
    if (!validate()) return;
    setError(null);
    setLoading('paystack');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          channel: 'paystack',
          items: lines.map((l) => ({ id: l.id, qty: l.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      window.location.href = data.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading('idle');
    }
  }

  async function sendToWhatsApp() {
    if (!validate()) return;
    setError(null);
    setLoading('whatsapp');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          channel: 'whatsapp',
          items: lines.map((l) => ({ id: l.id, qty: l.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      const link = buildWhatsAppOrderLink({
        reference: data.reference,
        customerName: form.customerName,
        phone: form.phone,
        address: form.address,
        lines,
        subtotal: data.subtotal,
        deliveryFee: data.deliveryFee,
        total: data.total,
      });
      window.open(link, '_blank');
      clearCart();
      window.location.href = `/order/${data.reference}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading('idle');
    }
  }

  if (lines.length === 0) {
    return (
      <main className="max-w-lg mx-auto px-7 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold mb-3">Your basket is empty</h1>
        <p className="text-ink/60 text-sm mb-6">Add something from the aisles before checking out.</p>
        <Link href="/" className="bg-purple text-cream rounded-full px-6 py-3 text-sm font-semibold">
          Back to shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-7 py-14">
      <Link href="/" className="text-sm text-ink/50 mb-6 inline-block">
        ← Back to shopping
      </Link>
      <h1 className="font-display text-3xl font-semibold mb-2">Delivery details</h1>
      <p className="text-ink/60 text-sm mb-8">
        Pay securely online, or send your order straight to our WhatsApp to arrange payment there.
      </p>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-4 mb-8">
        <div>
          <label className="block text-xs font-semibold mb-1.5">Full name</label>
          <input
            required
            value={form.customerName}
            onChange={update('customerName')}
            placeholder="Ada Okafor"
            className="w-full px-3 py-2.5 rounded-lg border border-ink/20 text-sm bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={update('email')}
            placeholder="ada@example.com"
            className="w-full px-3 py-2.5 rounded-lg border border-ink/20 text-sm bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5">Phone number</label>
          <input
            required
            value={form.phone}
            onChange={update('phone')}
            placeholder="080X XXX XXXX"
            className="w-full px-3 py-2.5 rounded-lg border border-ink/20 text-sm bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5">Delivery address</label>
          <input
            required
            value={form.address}
            onChange={update('address')}
            placeholder="12 Admiralty Way, Lekki Phase 1"
            className="w-full px-3 py-2.5 rounded-lg border border-ink/20 text-sm bg-white"
          />
        </div>

        <div className="pt-3 border-t border-dashed border-ink/20 space-y-1.5 font-mono text-sm">
          <div className="flex justify-between text-ink/70">
            <span>Subtotal</span>
            <span>{formatNaira(subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink/70">
            <span>Delivery</span>
            <span>{deliveryFee === 0 ? 'Free' : formatNaira(deliveryFee)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base pt-1.5">
            <span>Total</span>
            <span>{formatNaira(total)}</span>
          </div>
        </div>

        {error && <p className="text-tomato text-sm">{error}</p>}

        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={payWithPaystack}
            disabled={loading !== 'idle'}
            className="w-full bg-purple text-cream rounded-xl py-3.5 text-sm font-semibold disabled:opacity-50"
          >
            {loading === 'paystack' ? 'Redirecting to Paystack…' : `Pay now — ${formatNaira(total)}`}
          </button>
          <button
            type="button"
            onClick={sendToWhatsApp}
            disabled={loading !== 'idle'}
            className="w-full bg-[#25D366] text-[#06210F] rounded-xl py-3.5 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading === 'whatsapp' ? 'Opening WhatsApp…' : 'Send order to WhatsApp'}
          </button>
        </div>
      </form>
    </main>
  );
}
