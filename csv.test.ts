'use client';

import { useEffect, useState } from 'react';
import Icon from './Icon';
import AdminNav from './AdminNav';
import { formatNaira, type Product } from '@/types';

type BundleItemRow = { productId: string; qty: string };

type BundleFromApi = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  tag: string;
  color: string;
  active: boolean;
  groupBuyEnabled: boolean;
  groupBuyTarget: number;
  groupBuyDiscountPercent: number;
  items: { productId: string; qty: number; product: Product }[];
  progress: { committed: number; target: number; unlocked: boolean } | null;
};

type FormState = {
  id: string | null;
  name: string;
  description: string;
  price: string;
  imageUrl: string | null;
  tag: string;
  color: 'yellow' | 'purple';
  active: boolean;
  groupBuyEnabled: boolean;
  groupBuyTarget: string;
  groupBuyDiscountPercent: string;
  items: BundleItemRow[];
};

const EMPTY_FORM: FormState = {
  id: null,
  name: '',
  description: '',
  price: '',
  imageUrl: null,
  tag: 'Bundle',
  color: 'purple',
  active: true,
  groupBuyEnabled: false,
  groupBuyTarget: '10',
  groupBuyDiscountPercent: '10',
  items: [{ productId: '', qty: '1' }],
};

export default function AdminBundleManager() {
  const [bundles, setBundles] = useState<BundleFromApi[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [bundlesRes, productsRes] = await Promise.all([
        fetch('/api/admin/bundles'),
        fetch('/api/admin/products'),
      ]);
      if (!bundlesRes.ok || !productsRes.ok) throw new Error('Failed to load data');
      const bundlesData = await bundlesRes.json();
      const productsData = await productsRes.json();
      setBundles(bundlesData.bundles);
      setProducts(productsData.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function startEdit(b: BundleFromApi) {
    setForm({
      id: b.id,
      name: b.name,
      description: b.description,
      price: String(b.price),
      imageUrl: b.imageUrl,
      tag: b.tag,
      color: b.color === 'yellow' ? 'yellow' : 'purple',
      active: b.active,
      groupBuyEnabled: b.groupBuyEnabled,
      groupBuyTarget: String(b.groupBuyTarget),
      groupBuyDiscountPercent: String(b.groupBuyDiscountPercent),
      items: b.items.map((i) => ({ productId: i.productId, qty: String(i.qty) })),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  function updateItemRow(index: number, patch: Partial<BundleItemRow>) {
    setForm((f) => ({
      ...f,
      items: f.items.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  }

  function addItemRow() {
    setForm((f) => ({ ...f, items: [...f.items, { productId: '', qty: '1' }] }));
  }

  function removeItemRow(index: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm((f) => ({ ...f, imageUrl: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const items = form.items
      .filter((row) => row.productId)
      .map((row) => ({ productId: row.productId, qty: Number(row.qty) || 1 }));

    if (items.length === 0) {
      setError('Add at least one product to the bundle.');
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      imageUrl: form.imageUrl,
      tag: form.tag,
      color: form.color,
      active: form.active,
      groupBuyEnabled: form.groupBuyEnabled,
      groupBuyTarget: Number(form.groupBuyTarget) || 0,
      groupBuyDiscountPercent: Number(form.groupBuyDiscountPercent) || 0,
      items,
    };

    try {
      const res = await fetch(form.id ? `/api/admin/bundles/${form.id}` : '/api/admin/bundles', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save bundle');
      resetForm();
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this bundle? This cannot be undone.')) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/bundles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete bundle');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  const componentsSum = form.items.reduce((sum, row) => {
    const product = products.find((p) => p.id === row.productId);
    return sum + (product ? product.price * (Number(row.qty) || 0) : 0);
  }, 0);

  return (
    <div className="max-w-4xl mx-auto px-7 py-10">
      <div className="mb-2">
        <h1 className="font-display text-2xl font-semibold">Admin</h1>
        <p className="text-ink/55 text-sm mt-1">LRK Basket — {bundles.length} bundles</p>
      </div>
      <AdminNav />

      <form onSubmit={submit} className="bg-cream rounded-card p-6 mb-10 space-y-4">
        <h2 className="font-display text-lg font-semibold">{form.id ? 'Edit bundle' : 'Add a bundle'}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold mb-1.5">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Soup Starter Pack"
              className="w-full px-3 py-2.5 rounded-lg border border-ink/20 text-sm bg-white"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold mb-1.5">Description</label>
            <input
              required
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Everything for a pot of soup base."
              className="w-full px-3 py-2.5 rounded-lg border border-ink/20 text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Bundle price (₦)</label>
            <input
              required
              type="number"
              min={1}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-ink/20 text-sm bg-white"
            />
            {componentsSum > 0 && (
              <p className="text-xs text-ink/50 mt-1">
                Components cost {formatNaira(componentsSum)} bought separately.
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Tag</label>
            <input
              required
              value={form.tag}
              onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-ink/20 text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Accent color</label>
            <div className="flex gap-3">
              {(['yellow', 'purple'] as const).map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`flex-1 rounded-lg border py-2.5 text-sm font-medium capitalize ${
                    form.color === c ? 'border-ink' : 'border-ink/20'
                  } ${c === 'yellow' ? 'bg-yellow/25' : 'bg-purple/15'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="active"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="w-4 h-4"
            />
            <label htmlFor="active" className="text-sm">
              Visible on storefront
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">Photo (optional)</label>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-ink/5 overflow-hidden flex-none">
              {form.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Icon name="jar" className="w-7 h-7 text-ink/50" />
              )}
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadPhoto(file);
              }}
              className="text-xs"
            />
            {uploading && <p className="text-xs text-ink/50">Uploading…</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-2">What's inside</label>
          <div className="space-y-2">
            {form.items.map((row, i) => (
              <div key={i} className="flex gap-2">
                <select
                  value={row.productId}
                  onChange={(e) => updateItemRow(i, { productId: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg border border-ink/20 text-sm bg-white"
                >
                  <option value="">Select a product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatNaira(p.price)})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={row.qty}
                  onChange={(e) => updateItemRow(i, { qty: e.target.value })}
                  className="w-20 px-3 py-2 rounded-lg border border-ink/20 text-sm bg-white"
                />
                <button
                  type="button"
                  onClick={() => removeItemRow(i)}
                  className="text-xs text-tomato px-2"
                  aria-label="Remove item"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addItemRow} className="text-xs text-purple font-medium mt-2">
            + Add another product
          </button>
        </div>

        <div className="border-t border-dashed border-ink/20 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="groupBuy"
              checked={form.groupBuyEnabled}
              onChange={(e) => setForm((f) => ({ ...f, groupBuyEnabled: e.target.checked }))}
              className="w-4 h-4"
            />
            <label htmlFor="groupBuy" className="text-sm font-semibold">
              Enable group-buy pricing
            </label>
          </div>
          {form.groupBuyEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Units needed to unlock</label>
                <input
                  type="number"
                  min={1}
                  value={form.groupBuyTarget}
                  onChange={(e) => setForm((f) => ({ ...f, groupBuyTarget: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-ink/20 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Discount once unlocked (%)</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={form.groupBuyDiscountPercent}
                  onChange={(e) => setForm((f) => ({ ...f, groupBuyDiscountPercent: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-ink/20 text-sm bg-white"
                />
              </div>
              <p className="col-span-2 text-xs text-ink/50">
                Applies to orders placed after the target is hit — not retroactively to earlier orders.
              </p>
            </div>
          )}
        </div>

        {error && <p className="text-tomato text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || uploading}
            className="bg-purple text-cream rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving…' : form.id ? 'Save changes' : 'Add bundle'}
          </button>
          {form.id && (
            <button type="button" onClick={resetForm} className="text-sm text-ink/55 px-2">
              Cancel edit
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="text-ink/50 text-sm">Loading bundles…</p>
      ) : (
        <div className="space-y-2">
          {bundles.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-ink/10 px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-none overflow-hidden ${
                    b.imageUrl ? '' : b.color === 'purple' ? 'bg-purple/15' : 'bg-yellow/20'
                  }`}
                >
                  {b.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="jar" className={`w-5 h-5 ${b.color === 'purple' ? 'text-purple' : 'text-yellowDark'}`} />
                  )}
                </div>
                <div className="flex-1 min-w-[160px]">
                  <div className="text-sm font-medium truncate flex items-center gap-2">
                    {b.name}
                    {!b.active && <span className="text-[10px] uppercase text-ink/40 border border-ink/20 rounded-full px-1.5 py-0.5">Hidden</span>}
                  </div>
                  <div className="text-xs text-ink/50 truncate">
                    {b.items.map((i) => `${i.product.name} ×${i.qty}`).join(', ')}
                  </div>
                </div>
                <div className="font-mono text-sm flex-none">{formatNaira(b.price)}</div>
                <div className="flex gap-2 flex-none ml-auto sm:ml-0">
                  <button onClick={() => startEdit(b)} className="text-xs border border-ink/20 rounded-lg px-3 py-1.5">
                    Edit
                  </button>
                  <button onClick={() => remove(b.id)} className="text-xs border border-tomato/30 text-tomato rounded-lg px-3 py-1.5">
                    Delete
                  </button>
                </div>
              </div>
              {b.groupBuyEnabled && b.progress && (
                <div className="mt-2 text-xs text-ink/50">
                  {b.progress.unlocked
                    ? `🎉 Unlocked — ${b.groupBuyDiscountPercent}% off is active`
                    : `${b.progress.committed} of ${b.progress.target} committed toward ${b.groupBuyDiscountPercent}% off`}
                </div>
              )}
            </div>
          ))}
          {bundles.length === 0 && (
            <p className="text-ink/50 text-sm py-10 text-center">No bundles yet — add one above.</p>
          )}
        </div>
      )}
    </div>
  );
}
