'use client';

import { useEffect, useState } from 'react';
import AdminNav from './AdminNav';

export default function AdminSettingsManager() {
  const [deliveryFee, setDeliveryFee] = useState('');
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (!res.ok) throw new Error('Failed to load settings');
        const data = await res.json();
        setDeliveryFee(String(data.settings.deliveryFee));
        setFreeDeliveryThreshold(String(data.settings.freeDeliveryThreshold));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryFee: Number(deliveryFee),
          freeDeliveryThreshold: Number(freeDeliveryThreshold),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-7 py-10">
      <div className="mb-2">
        <h1 className="font-display text-2xl font-semibold">Admin</h1>
        <p className="text-ink/55 text-sm mt-1">LRK Basket — store settings</p>
      </div>
      <AdminNav />

      {loading ? (
        <p className="text-ink/50 text-sm">Loading settings…</p>
      ) : (
        <form onSubmit={submit} className="bg-cream rounded-card p-6 max-w-md space-y-4">
          <h2 className="font-display text-lg font-semibold">Delivery pricing</h2>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Delivery fee (₦)</label>
            <input
              required
              type="number"
              min={0}
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-ink/20 text-sm bg-white"
            />
            <p className="text-xs text-ink/50 mt-1">Charged on orders below the free-delivery threshold.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Free delivery threshold (₦)</label>
            <input
              required
              type="number"
              min={0}
              value={freeDeliveryThreshold}
              onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-ink/20 text-sm bg-white"
            />
            <p className="text-xs text-ink/50 mt-1">Orders at or above this subtotal get free delivery.</p>
          </div>

          {error && <p className="text-tomato text-sm">{error}</p>}
          {saved && <p className="text-[#2F7D4F] text-sm">Saved.</p>}

          <button
            type="submit"
            disabled={saving}
            className="bg-purple text-cream rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      )}
    </div>
  );
}
