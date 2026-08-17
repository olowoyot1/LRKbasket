import { prisma } from './prisma';

export type BundleProgress = {
  committed: number;
  target: number;
  unlocked: boolean;
};

/**
 * Counts how many units of a bundle have been committed to across all
 * non-failed orders (PENDING or PAID - a WhatsApp order counts as soon as
 * it's placed, since it represents real intent even before payment is
 * confirmed in chat). Once committed >= target, the group-buy discount is
 * "unlocked" for every order placed from that point forward.
 *
 * This is intentionally simple: no time windows, no per-customer identity
 * checks, no retroactive pricing for early joiners. See README for why.
 */
export async function getBundleProgress(bundleId: string, target: number): Promise<BundleProgress> {
  const result = await prisma.orderItem.aggregate({
    where: { bundleId, order: { status: { not: 'FAILED' } } },
    _sum: { qty: true },
  });
  const committed = result._sum.qty ?? 0;
  return { committed, target, unlocked: target > 0 && committed >= target };
}

/** Applies the group-buy discount to a bundle's price if it's unlocked. */
export function effectiveBundlePrice(
  price: number,
  discountPercent: number,
  unlocked: boolean
): number {
  if (!unlocked || discountPercent <= 0) return price;
  return Math.round(price * (1 - discountPercent / 100));
}
