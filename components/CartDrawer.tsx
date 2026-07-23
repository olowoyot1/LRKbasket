'use client';

import Link from 'next/link';
import { useCart } from './CartProvider';
import { formatNaira } from '@/types';

export default function CartDrawer() {
  const { lines, drawerOpen, closeDrawer, incItem, decItem, subtotal, deliveryFee, total } = useCart();

  return (
    <>
      <div
        onClick={closeDrawer}
        className={`fixed inset-0 bg-bgDark/45 z-[90] transition-opacity ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      <div
        className={`fixed top-0 right-0 h-full w-[390px] max-w-[92vw] bg-bgDark text-cream z-[95] flex flex-col transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="px-[22px] pt-[22px] pb-4 border-b border-dashed border-cream/15 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold m-0">Your basket</h3>
          <button onClick={closeDrawer} className="text-cream/70 text-xl" aria-label="Close cart">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-[22px] py-[18px] font-mono text-[13px]">
          {lines.length === 0 ? (
            <div className="opacity-55 text-center py-16 font-sans text-[13px]">
              Your basket is empty.
              <br />
              Add something fresh from the aisles.
            </div>
          ) : (
            lines.map((l) => (
              <div key={l.id} className="flex justify-between gap-2.5 py-2.5 border-b border-dashed border-cream/15">
                <div>
                  <div className="font-sans text-[13px] font-medium">{l.name}</div>
                  <div className="opacity-60 text-[11px] mt-0.5">
                    {formatNaira(l.price)} × {l.qty}
                  </div>
                </div>
                <div className="text-right flex-none">
                  <div>{formatNaira(l.price * l.qty)}</div>
                  <div className="flex items-center gap-2 mt-1.5 justify-end">
                    <button
                      onClick={() => decItem(l.id)}
                      className="border border-cream/15 text-cream w-5 h-5 rounded text-xs"
                      aria-label={`Decrease ${l.name} quantity`}
                    >
                      −
                    </button>
                    <span>{l.qty}</span>
                    <button
                      onClick={() => incItem(l.id)}
                      className="border border-cream/15 text-cream w-5 h-5 rounded text-xs"
                      aria-label={`Increase ${l.name} quantity`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-[22px] pt-5 pb-6 border-t border-dashed border-cream/15">
          <div className="flex justify-between text-[13px] mb-2 opacity-85 font-mono">
            <span>Subtotal</span>
            <span>{formatNaira(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[13px] mb-2 opacity-85 font-mono">
            <span>Delivery</span>
            <span>{subtotal === 0 ? formatNaira(0) : deliveryFee === 0 ? 'Free' : formatNaira(deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold border-t border-cream/15 pt-3 mt-2.5 font-mono">
            <span>Total</span>
            <span>{formatNaira(total)}</span>
          </div>
          <Link
            href="/checkout"
            onClick={closeDrawer}
            className={`block text-center w-full bg-yellow text-purpleDark rounded-xl py-3.5 text-sm font-semibold mt-4 ${
              lines.length === 0 ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            Checkout
          </Link>
        </div>
      </div>
    </>
  );
}
