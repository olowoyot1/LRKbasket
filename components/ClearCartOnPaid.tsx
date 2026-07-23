'use client';

import { useEffect } from 'react';
import { useCart } from './CartProvider';

export default function ClearCartOnPaid({ paid }: { paid: boolean }) {
  const { clearCart } = useCart();

  useEffect(() => {
    if (paid) clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid]);

  return null;
}
