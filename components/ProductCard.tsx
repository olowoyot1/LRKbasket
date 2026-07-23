'use client';

import type { Product } from '@/types';
import { formatNaira } from '@/types';
import Icon from './Icon';
import { useCart } from './CartProvider';

const COLOR_CLASSES: Record<string, { bg: string; text: string; tag: string; tagText: string }> = {
  yellow: { bg: 'bg-yellow/20', text: 'text-yellowDark', tag: 'bg-yellow', tagText: 'text-purpleDark' },
  purple: { bg: 'bg-purple/15', text: 'text-purple', tag: 'bg-purple', tagText: 'text-cream' },
};

export default function ProductCard({ product }: { product: Product }) {
  const { qtyFor, addItem, incItem, decItem } = useCart();
  const qty = qtyFor(product.id);
  const colors = COLOR_CLASSES[product.color] ?? COLOR_CLASSES.yellow;
  const outOfStock = product.stock <= 0;
  const atStockLimit = qty >= product.stock;
  const lowStock = !outOfStock && product.stock <= 5;

  return (
    <div className={`relative bg-cream rounded-card border border-ink/10 p-[18px] flex flex-col gap-3 ${outOfStock ? 'opacity-60' : ''}`}>
      <span className={`absolute top-3.5 right-3.5 text-[10px] uppercase tracking-wide font-semibold px-2.5 py-1 rounded-full ${colors.tag} ${colors.tagText}`}>
        {product.tag}
      </span>
      <div className={`w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden ${product.imageUrl ? '' : colors.bg}`}>
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Icon name={product.icon} className={`w-8 h-8 ${colors.text}`} />
        )}
      </div>
      <div>
        <h3 className="font-semibold text-[17px] leading-tight">{product.name}</h3>
        <div className="text-xs text-ink/55 mt-0.5">{product.unit}</div>
        {outOfStock ? (
          <div className="text-xs text-tomato font-medium mt-1">Out of stock</div>
        ) : lowStock ? (
          <div className="text-xs text-carrot font-medium mt-1">Only {product.stock} left</div>
        ) : null}
      </div>
      <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-dashed border-ink/20">
        <span className="font-mono font-semibold text-base">{formatNaira(product.price)}</span>
        {outOfStock ? (
          <button disabled className="bg-ink/15 text-ink/40 rounded-lg px-3.5 py-2 text-xs font-semibold cursor-not-allowed">
            Unavailable
          </button>
        ) : qty === 0 ? (
          <button
            onClick={() => addItem(product)}
            className="bg-ink text-bg rounded-lg px-3.5 py-2 text-xs font-semibold"
          >
            Add
          </button>
        ) : (
          <div className="flex items-center gap-2.5 bg-ink rounded-lg px-2 py-1.5">
            <button onClick={() => decItem(product.id)} className="text-bg text-base w-4 leading-none" aria-label="Decrease quantity">
              −
            </button>
            <span className="text-bg font-mono text-sm min-w-[14px] text-center">{qty}</span>
            <button
              onClick={() => !atStockLimit && incItem(product.id)}
              disabled={atStockLimit}
              className={`text-base w-4 leading-none ${atStockLimit ? 'text-bg/30 cursor-not-allowed' : 'text-bg'}`}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
