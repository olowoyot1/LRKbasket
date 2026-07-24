import type { Bundle } from '@/types';
import BundleCard from './BundleCard';

export default function BundlesSection({ bundles }: { bundles: Bundle[] }) {
  if (bundles.length === 0) return null;

  return (
    <section id="bundles" className="bg-bgDark2 py-10">
      <div className="max-w-6xl mx-auto px-7">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl font-semibold text-cream">Food bundles</h2>
            <p className="text-cream/60 text-sm mt-1">Pre-packed kits, cheaper than buying each item alone.</p>
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {bundles.map((b) => (
            <BundleCard key={b.id} bundle={b} />
          ))}
        </div>
      </div>
    </section>
  );
}
