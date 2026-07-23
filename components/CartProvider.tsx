'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { CartLine, Product } from '@/types';
import { deliveryFeeFor } from '@/types';

type CartContextValue = {
  lines: CartLine[];
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (product: Product) => void;
  incItem: (id: string) => void;
  decItem: (id: string) => void;
  qtyFor: (id: string) => number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'lrk-basket-cart';

export function CartProvider({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings?: { deliveryFee: number; freeDeliveryThreshold: number };
}) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  function addItem(product: Product) {
    setLines((prev) => {
      const existing = prev.find((l) => l.id === product.id);
      if (existing) {
        return prev.map((l) => (l.id === product.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }];
    });
  }

  function incItem(id: string) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l)));
  }

  function decItem(id: string) {
    setLines((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, qty: l.qty - 1 } : l))
        .filter((l) => l.qty > 0)
    );
  }

  function qtyFor(id: string) {
    return lines.find((l) => l.id === id)?.qty ?? 0;
  }

  function clearCart() {
    setLines([]);
  }

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.price * l.qty, 0), [lines]);
  const deliveryFee = deliveryFeeFor(subtotal, {
    fee: settings?.deliveryFee,
    threshold: settings?.freeDeliveryThreshold,
  });
  const total = subtotal + deliveryFee;
  const itemCount = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);

  return (
    <CartContext.Provider
      value={{
        lines,
        drawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
        addItem,
        incItem,
        decItem,
        qtyFor,
        subtotal,
        deliveryFee,
        total,
        itemCount,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
