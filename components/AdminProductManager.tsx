'use client';

import { useEffect, useState } from 'react';
import Icon, { ICON_NAMES } from './Icon';
import AdminNav from './AdminNav';
import { CATEGORIES, formatNaira, type Product } from '@/types';

type FormState = {
  id: string | null;
  name: string;
  category: string;
  price: string;
  unit: string;
  tag: string;
  icon: string;
  color: 'yellow' | 'purple';
  imageUrl: string | null;
  stock: string;
};

const EMPTY_FORM: FormState = {
  id: null,
  name: '',
  category: CATEGORIES[0].id,
  price: '',
  unit: '',
  tag: '',
  icon: ICON_NAMES[0],
  color: 'yellow',
  imageUrl: null,
  stock: '0',
};

export default function AdminProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  async function loadProducts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/products');
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function seedCatalog() {
    setSeeding(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load starter catalog');
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSeeding(false);
    }
  }

  function startEdit(p: Product) {
    setForm({
      id: p.id,
      name: p.name,
      category: p.category,
      price: String(p.price),
      unit: p.unit,
      tag: p.tag,
      icon: p.icon,
      color: p.color === 'purple' ? 'purple' : 'yellow',
      imageUrl: p.imageUrl ?? null,
      stock: String(p.stock),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload = {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      unit: form.unit,
      tag: form.tag,
      icon: form.icon,
      color: form.color,
      imageUrl: form.imageUrl,
      stock: Number(form.stock),
    };
    try {
      const res = await fetch(form.id ? `/api/admin/products/${form.id}` : '/api/admin/products', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');
      resetForm();
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
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

  async function remove(id: string) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete product');
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-7 py-10">
      <div className="mb-2">
        <h1 className="font-display text-2xl font-semibold">Admin</h1>
        <p className="text-ink/55 text-sm mt-1">LRK Basket — {products.length} products live</p>
      </div>
      <AdminNav />

      <form onSubmit={submit} className="bg-cream rounded-card p-6 mb-10 space-y-4">
        <h2 className="font-display text-lg font-semibold">{form.id ? 'Edit product' : 'Add a product'}</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Vine tomatoes"
              className="w-full px-3 py-2.5 rounded-lg border border-ink/20 text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-ink/20 text-sm bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Price (₦)</label>
            <input
              required
              type="number"
              min={1}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="1500"
              className="w-full px-3 py-2.5 rounded-lg border border-ink/20 text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Unit</label>
            <input
              required
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              placeholder="1kg basket"
              className="w-full px-3 py-2.5 rounded-lg border border-ink/20 text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Stock on hand</label>
            <input
              required
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              placeholder="30"
              className="w-full px-3 py-2.5 rounded-lg border border-ink/20 text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Tag</label>
            <input
              required
              value={form.tag}
              onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
              placeholder="Farm fresh"
              className="w-full px-3 py-2.5 rounded-lg border border-ink/20 text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Icon</label>
            <select
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-ink/20 text-sm bg-white"
            >
              {ICON_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
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
          <div className="col-span-2">
            <label className="block text-xs font-semibold mb-1.5">Photo (optional — falls back to the icon below)</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-ink/5 overflow-hidden flex-none">
                {form.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Icon name={form.icon} className="w-8 h-8 text-ink/60" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPhoto(file);
                  }}
                  className="text-xs"
                />
                {uploading && <p className="text-xs text-ink/50 mt-1">Uploading…</p>}
                {form.imageUrl && !uploading && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: null }))}
                    className="text-xs text-tomato mt-1 block"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-tomato text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || uploading}
            className="bg-purple text-cream rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving…' : form.id ? 'Save changes' : 'Add product'}
          </button>
          {form.id && (
            <button type="button" onClick={resetForm} className="text-sm text-ink/55 px-2">
              Cancel edit
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="text-ink/50 text-sm">Loading products…</p>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 bg-white rounded-xl border border-ink/10 px-4 py-3"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-none overflow-hidden ${
                  p.imageUrl ? '' : p.color === 'purple' ? 'bg-purple/15' : 'bg-yellow/20'
                }`}
              >
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Icon name={p.icon} className={`w-5 h-5 ${p.color === 'purple' ? 'text-purple' : 'text-yellowDark'}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.name}</div>
                <div className="text-xs text-ink/50">
                  {CATEGORIES.find((c) => c.id === p.category)?.label ?? p.category} · {p.unit}
                </div>
              </div>
              <div
                className={`text-xs font-medium w-20 text-right flex-none ${
                  p.stock <= 0 ? 'text-tomato' : p.stock <= 5 ? 'text-carrot' : 'text-ink/50'
                }`}
              >
                {p.stock <= 0 ? 'Out of stock' : `${p.stock} in stock`}
              </div>
              <div className="font-mono text-sm w-24 text-right flex-none">{formatNaira(p.price)}</div>
              <div className="flex gap-2 flex-none">
                <button onClick={() => startEdit(p)} className="text-xs border border-ink/20 rounded-lg px-3 py-1.5">
                  Edit
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="text-xs border border-tomato/30 text-tomato rounded-lg px-3 py-1.5"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="text-center py-10">
              <p className="text-ink/50 text-sm mb-4">No products yet.</p>
              <button
                onClick={seedCatalog}
                disabled={seeding}
                className="bg-purple text-cream rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {seeding ? 'Loading starter catalog…' : 'Load starter catalog (19 products + 3 bundles)'}
              </button>
              <p className="text-ink/40 text-xs mt-2">Or add your first product manually using the form above.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
