'use client';

import type { Bundle } from '@/types';
import { formatNaira } from '@/types';
import { useCart } from './CartProvider';
import { buildGroupBuyShareLink } from '@/lib/whatsapp';

const COLOR_CLASSES: Record<string, { bg: string; text: string; tag: string; tagText: string; bar: string }> = {
  yellow: { bg: 'bg-yellow/20', text: 'text-yellowDark', tag: 'bg-yellow', tagText: 'text-purpleDark', bar: 'bg-yellow' },
  purple: { bg: 'bg-purple/15', text: 'text-purple', tag: 'bg-purple', tagText: 'text-cream', bar: 'bg-purple' },
};

export default function BundleCard({ bundle }: { bundle: Bundle }) {
  const { qtyFor, addItem, incItem, decItem } = useCart();
  const qty = qtyFor(bundle.id);
  const colors = COLOR_CLASSES[bundle.color] ?? COLOR_CLASSES.purple;
  const savings = bundle.compareAtPrice - bundle.effectivePrice;
  const progress = bundle.groupBuy;
  const progressPct = progress && progress.target > 0 ? Math.min(100, Math.round((progress.committed / progress.target) * 100)) : 0;

  return (
    <div className="relative bg-cream rounded-card border border-ink/10 p-[18px] flex flex-col gap-3">
      <span className={`absolute top-3.5 right-3.5 text-[10px] uppercase tracking-wide font-semibold px-2.5 py-1 rounded-full ${colors.tag} ${colors.tagText}`}>
        {bundle.tag}
      </span>

      <div>
        <h3 className="font-semibold text-[17px] leading-tight pr-16">{bundle.name}</h3>
        <p className="text-xs text-ink/55 mt-1 leading-relaxed">{bundle.description}</p>
      </div>

      <div className="text-xs text-ink/60 leading-relaxed">
        <span className="font-medium text-ink/70">Includes: </span>
        {bundle.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}
      </div>

      {progress && bundle.groupBuyEnabled && (
        <div>
          {progress.unlocked ? (
            <div className={`text-xs font-semibold ${colors.text}`}>
              🎉 Group-buy unlocked — {bundle.groupBuyDiscountPercent}% off active
            </div>
          ) : (
            <>
              <div className="flex justify-between text-xs text-ink/55 mb-1">
                <span>
                  {progress.committed} of {progress.target} joined
                </span>
                <span>{bundle.groupBuyDiscountPercent}% off once unlocked</span>
              </div>
              <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
                <div className={`h-full ${colors.bar}`} style={{ width: `${progressPct}%` }} />
              </div>
              <button
                onClick={() =>
                  window.open(
                    buildGroupBuyShareLink({
                      bundleName: bundle.name,
                      storeUrl: typeof window !== 'undefined' ? window.location.origin : '',
                      committed: progress.committed,
                      target: progress.target,
                      discountPercent: bundle.groupBuyDiscountPercent,
                    }),
                    '_blank'
                  )
                }
                className="text-xs text-purple font-medium mt-2 underline underline-offset-2"
              >
                Share on WhatsApp to help unlock it
              </button>
            </>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-dashed border-ink/20">
        <div>
          <span className="font-mono font-semibold text-base">{formatNaira(bundle.effectivePrice)}</span>
          {savings > 0 && (
            <span className="font-mono text-xs text-ink/40 line-through ml-1.5">{formatNaira(bundle.compareAtPrice)}</span>
          )}
        </div>
        {qty === 0 ? (
          <button
            onClick={() => addItem(bundle, 'bundle')}
            className="bg-ink text-bg rounded-lg px-3.5 py-2 text-xs font-semibold"
          >
            Add bundle
          </button>
        ) : (
          <div className="flex items-center gap-2.5 bg-ink rounded-lg px-2 py-1.5">
            <button onClick={() => decItem(bundle.id)} className="text-bg text-base w-4 leading-none" aria-label="Decrease quantity">
              −
            </button>
            <span className="text-bg font-mono text-sm min-w-[14px] text-center">{qty}</span>
            <button onClick={() => incItem(bundle.id)} className="text-bg text-base w-4 leading-none" aria-label="Increase quantity">
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
