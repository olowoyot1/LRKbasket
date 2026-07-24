'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { CATEGORIES } from '@/types';

export default function Header({
  search,
  onSearch,
}: {
  search?: string;
  onSearch?: (v: string) => void;
}) {
  const { itemCount, openDrawer } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-bgDark text-cream border-b border-cream/10">
      <div className="max-w-6xl mx-auto px-7 py-4 flex items-center justify-between gap-5">
        <Link href="/" className="flex items-center gap-2.5 font-display text-[22px] font-semibold tracking-tight">
          <span className="w-8 h-8 rounded-full bg-yellow text-purpleDark flex items-center justify-center font-display font-bold text-base border border-dashed border-cream">
            L
          </span>
          LRK Basket
        </Link>
        <nav className="hidden md:flex gap-6 text-sm">
          <a href="/#bundles" className="opacity-80 hover:opacity-100 transition-opacity">
            Bundles
          </a>
          {CATEGORIES.map((c) => (
            <a key={c.id} href={`/#${c.id}`} className="opacity-80 hover:opacity-100 transition-opacity">
              {c.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3.5">
          {onSearch && (
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search the basket…"
              className="hidden md:block bg-bgDark2 border border-cream/15 text-cream placeholder:text-cream/40 rounded-full px-4 py-2 text-sm w-48 focus:outline-none focus:border-cream/40"
            />
          )}
          <button
            onClick={openDrawer}
            className="relative bg-yellow text-purpleDark rounded-full px-4 py-2 text-sm font-semibold flex items-center gap-2"
          >
            Basket
            <span className="bg-purpleDark text-cream rounded-full w-[19px] h-[19px] text-[11px] font-mono flex items-center justify-center">
              {itemCount}
            </span>
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden flex flex-col gap-[5px] p-1.5"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className={`block w-5 h-[1.5px] bg-cream transition-transform ${menuOpen ? 'translate-y-[6.5px] rotate-45' : ''}`} />
            <span className={`block w-5 h-[1.5px] bg-cream transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-[1.5px] bg-cream transition-transform ${menuOpen ? '-translate-y-[6.5px] -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-cream/10 px-7 py-4 space-y-4">
          {onSearch && (
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search the basket…"
              className="w-full bg-bgDark2 border border-cream/15 text-cream placeholder:text-cream/40 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-cream/40"
            />
          )}
          <nav className="flex flex-col gap-3 text-sm">
            <a href="/#bundles" onClick={() => setMenuOpen(false)} className="opacity-80 hover:opacity-100 transition-opacity">
              Bundles
            </a>
            {CATEGORIES.map((c) => (
              <a
                key={c.id}
                href={`/#${c.id}`}
                onClick={() => setMenuOpen(false)}
                className="opacity-80 hover:opacity-100 transition-opacity"
              >
                {c.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
