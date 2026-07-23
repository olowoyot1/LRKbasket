import { prisma } from '@/lib/prisma';
import StoreClient from '@/components/StoreClient';
import { getSettings } from '@/lib/settings';
import { formatNaira } from '@/types';

export const revalidate = 0;

export default async function HomePage() {
  const [products, settings] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: 'asc' } }),
    getSettings(),
  ]);

  return (
    <>
      <section className="bg-bgDark text-cream px-7 pt-16 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-yellow border border-yellow/50 px-3 py-1.5 rounded-full mb-[22px]">
            Delivering across Lagos, today
          </div>
          <h1 className="font-display text-[38px] sm:text-[52px] lg:text-[62px] font-semibold leading-[1.02] max-w-3xl mb-[22px] tracking-tight">
            Straight from the farm gate to <span className="text-yellow">your kitchen.</span>
          </h1>
          <p className="text-[17px] leading-relaxed max-w-md opacity-80 mb-8">
            Unrefined palm oil, sun-warm tomatoes, raw honey, and grains still dusty from the mill,
            sourced from growers across the Southwest and packed the morning your order goes out.
          </p>
          <div className="flex gap-3.5 flex-wrap">
            <a href="#produce" className="bg-yellow text-purpleDark rounded-full px-[26px] py-3.5 text-sm font-semibold">
              Start shopping
            </a>
            <a href="#raw" className="border border-cream/15 text-cream rounded-full px-[26px] py-3.5 text-sm font-semibold">
              See raw &amp; sprouted picks
            </a>
          </div>
          <div className="flex gap-10 mt-14 pt-[26px] border-t border-cream/15 flex-wrap">
            <div className="text-[13px] opacity-75 flex items-center gap-2">
              <strong className="font-display text-[15px] opacity-100 text-cream">{formatNaira(settings.freeDeliveryThreshold)}</strong> minimum for free delivery
            </div>
            <div className="text-[13px] opacity-75 flex items-center gap-2">
              <strong className="font-display text-[15px] opacity-100 text-cream">Same-day</strong> for orders before 2pm
            </div>
            <div className="text-[13px] opacity-75 flex items-center gap-2">
              <strong className="font-display text-[15px] opacity-100 text-cream">120+</strong> partner farms and mills
            </div>
          </div>
        </div>
      </section>

      <StoreClient products={products} />

      <footer className="bg-ink text-cream px-7 pt-12 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-5 text-[13px] opacity-70 mb-5 flex-wrap">
            <a href="/privacy" className="hover:opacity-100">
              Privacy
            </a>
            <a href="/terms" className="hover:opacity-100">
              Terms
            </a>
            <a href="/refund-policy" className="hover:opacity-100">
              Refunds
            </a>
          </div>
          <div className="text-[13px] opacity-60 flex justify-between flex-wrap gap-2.5 pt-5 border-t border-cream/10">
            <span>© {new Date().getFullYear()} LRK Basket.</span>
            <span>Made for Lagos, Nigeria</span>
          </div>
        </div>
      </footer>
    </>
  );
}
