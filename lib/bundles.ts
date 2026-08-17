import { prisma } from './prisma';
import { getBundleProgress, effectiveBundlePrice } from './groupBuy';
import type { Bundle } from '@/types';

/** Bundles for the public storefront - active only, with computed pricing/progress. */
export async function getActiveBundles(): Promise<Bundle[]> {
  const rows = await prisma.bundle.findMany({
    where: { active: true },
    orderBy: { createdAt: 'asc' },
    include: { items: { include: { product: true } } },
  });

  return Promise.all(
    rows.map(async (b) => {
      const compareAtPrice = b.items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
      const progress = b.groupBuyEnabled
        ? await getBundleProgress(b.id, b.groupBuyTarget)
        : undefined;
      const effectivePrice = b.groupBuyEnabled
        ? effectiveBundlePrice(b.price, b.groupBuyDiscountPercent, progress?.unlocked ?? false)
        : b.price;

      return {
        id: b.id,
        name: b.name,
        description: b.description,
        price: b.price,
        imageUrl: b.imageUrl,
        tag: b.tag,
        color: b.color,
        active: b.active,
        groupBuyEnabled: b.groupBuyEnabled,
        groupBuyTarget: b.groupBuyTarget,
        groupBuyDiscountPercent: b.groupBuyDiscountPercent,
        items: b.items.map((i) => ({ productId: i.productId, name: i.product.name, qty: i.qty })),
        effectivePrice,
        compareAtPrice,
        groupBuy: progress,
      };
    })
  );
}
