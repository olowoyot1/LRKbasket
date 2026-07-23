'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/types';
import { CATEGORIES } from '@/types';
import Header from './Header';
import ProductCard from './ProductCard';

export default function StoreClient({ products }: { products: Product[] }) {
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = activeCat === 'all' || p.category === activeCat;
      const matchQ = !q || p.name.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [products, activeCat, search]);

  const sectionTitle = CATEGORIES.find((c) => c.id === activeCat)?.label ?? 'All aisles';

  return (
    <>
      <Header search={search} onSearch={setSearch} />

      <div className="sticky top-[69px] z-40 bg-bg border-b border-ink/10">
        <div className="max-w-6xl mx-auto px-7 py-4 flex gap-2.5 overflow-x-auto">
          <button
            onClick={() => setActiveCat('all')}
            className={`flex-none rounded-full border px-4 py-2 text-[13px] font-medium flex items-center gap-1.5 whitespace-nowrap ${
              activeCat === 'all' ? 'bg-purple text-cream border-purple' : 'border-ink/15'
            }`}
          >
            All aisles
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              id={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`flex-none rounded-full border px-4 py-2 text-[13px] font-medium whitespace-nowrap ${
                activeCat === c.id ? 'bg-purple text-cream border-purple' : 'border-ink/15'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-7 py-9 pb-20">
        <div className="flex items-baseline justify-between mb-[22px]">
          <h2 className="font-display text-[26px] font-semibold m-0">{sectionTitle}</h2>
          <span className="text-[13px] font-mono text-ink/55">
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-ink/50 text-sm">
            No items match that search. Try another aisle or term.
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-[18px]">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
